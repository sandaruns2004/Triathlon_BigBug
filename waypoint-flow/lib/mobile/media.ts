import { db } from "@/lib/db/firebase";
import type { Principal } from "@/lib/auth/credentials";
import { z } from "zod";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ensure, assertTripOwner, assertOrderOwner, evidencePolicy } from "./domain";
import { ApiError } from "./errors";

export const localMedia = () => process.env.MOBILE_TEST_MODE === "emulator" || !process.env.AWS_S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID;
const root = () => path.join(process.cwd(), ".test-media");
const s3 = () => new S3Client({ region: process.env.AWS_REGION, credentials: {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "" } });
const bucket = () => {
  if (!process.env.AWS_S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) throw new ApiError(503, "media_unavailable", "Evidence upload is unavailable. Keep the saved photo and retry.");
  return process.env.AWS_S3_BUCKET;
};
export async function boundedBody(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > maxBytes) { await reader.cancel(); throw new ApiError(413, "body_too_large", "The request is too large."); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
async function authorizeCapture(principal: Principal, input: { tripId?: string; stopId?: string; orderId?: string; reviewOperationId?: string }) {
  if (principal.role === "driver") {
    const tripDoc = await db.collection("trips").doc(input.tripId ?? "invalid").get();
    ensure(tripDoc.exists, 404, "not_found", "The trip was not found.");
    const trip = tripDoc.data()!;
    const stop = await db.collection("trip_stops").doc(input.stopId ?? "invalid").get();
    ensure(stop.exists && stop.data()!.tripId === tripDoc.id, 403, "forbidden", "The stop is not part of this trip.");
    if (input.reviewOperationId) {
      const { operationKey } = await import("./domain");
      const review = await db.collection("conflict_reviews").doc(operationKey(principal.userId, input.reviewOperationId)).get();
      ensure(review.exists && review.data()!.stopId === stop.id && review.data()!.userId === principal.userId, 403, "forbidden", "Create an authorized review before uploading historical evidence.");
      return { tripId: tripDoc.id, stopId: stop.id, orderId: stop.data()!.orderId ?? null, purpose: "conflict_review" };
    }
    assertTripOwner(principal, trip);
    return { tripId: tripDoc.id, stopId: stop.id, orderId: stop.data()!.orderId ?? null, purpose: "proof" };
  }
  if (principal.role === "store_manager") {
    const order = await db.collection("orders").doc(input.orderId ?? "invalid").get();
    ensure(order.exists, 404, "not_found", "The order was not found.");
    assertOrderOwner(principal, order.data()!);
    return { tripId: order.data()!.tripId ?? null, stopId: null, orderId: order.id, purpose: "store_issue" };
  }
  if (principal.role === "loader" && !input.reviewOperationId) {
    const trip = await db.collection("trips").doc(input.tripId ?? "invalid").get();
    const stop = await db.collection("trip_stops").doc(input.stopId ?? "invalid").get();
    ensure(trip.exists && trip.data()!.depot === principal.depot && stop.exists && stop.data()!.tripId === trip.id &&
      ["planned", "loading", "ready_to_depart"].includes(trip.data()!.status), 403, "forbidden", "Loading evidence must belong to this depot's current loading trip.");
    return { tripId: trip.id, stopId: stop.id, orderId: stop.data()!.orderId ?? null, purpose: "shortfall" };
  }
  throw new ApiError(403, "forbidden", "This account cannot capture evidence here.");
}
export async function uploadSession(principal: Principal, body: unknown) {
  const input = z.object({ evidenceId: z.string().uuid(), mime: z.enum(["image/jpeg", "image/png"]),
    bytes: z.number().int().positive().max(evidencePolicy.maxBytes), sha256: z.string().regex(/^[a-f0-9]{64}$/),
    tripId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/).optional(), stopId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/).optional(),
    orderId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/).optional(), reviewOperationId: z.string().uuid().optional() }).strict().parse(body);
  const scope = await authorizeCapture(principal, input);
  const ref = db.collection("evidence").doc(input.evidenceId);
  const old = await ref.get();
  if (old.exists) {
    const saved = old.data()!;
    ensure(saved.ownerId === principal.userId && saved.sha256 === input.sha256 && saved.bytes === input.bytes &&
      saved.mime === input.mime && saved.stopId === scope.stopId && saved.orderId === scope.orderId &&
      (saved.purpose === scope.purpose || (scope.purpose === "conflict_review" && saved.purpose === "proof")), 409, "evidence_changed", "Keep the original evidence ID and content.");
    if (saved.status === "finalized") return { evidenceId: ref.id, status: "finalized", sha256: saved.sha256 };
  }
  const key = "incoming/" + ref.id;
  let uploadUrl: string | null = null;
  if (!localMedia()) {
    uploadUrl = await getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key,
      ContentType: input.mime, ContentLength: input.bytes }), { expiresIn: 300 });
  }
  await db.runTransaction(async tx => {
    const current = await tx.get(ref);
    if (!current.exists) tx.create(ref, { evidenceId: ref.id, ownerId: principal.userId, ...scope,
      mime: input.mime, bytes: input.bytes, sha256: input.sha256, stagingKey: key, status: "awaiting_upload", createdAt: new Date().toISOString() });
    else ensure(current.data()!.ownerId === principal.userId && current.data()!.sha256 === input.sha256 && current.data()!.bytes === input.bytes &&
      current.data()!.mime === input.mime && current.data()!.tripId === scope.tripId && current.data()!.stopId === scope.stopId &&
      current.data()!.orderId === scope.orderId && (current.data()!.purpose === scope.purpose || (scope.purpose === "conflict_review" && current.data()!.purpose === "proof")), 409, "evidence_changed", "Evidence ID is already reserved.");
  });
  return { evidenceId: ref.id, status: "awaiting_upload", uploadUrl, uploadPath: localMedia() ? "media/" + ref.id + "/content" : null };
}
export async function putLocalMedia(principal: Principal, evidenceId: string, request: Request) {
  ensure(localMedia(), 404, "not_found", "Direct test-media upload is unavailable.");
  const ref = db.collection("evidence").doc(evidenceId);
  const doc = await ref.get();
  ensure(doc.exists && doc.data()!.ownerId === principal.userId && doc.data()!.status !== "finalized", 403, "forbidden", "This upload session is unavailable.");
  const bytes = await boundedBody(request, evidencePolicy.maxBytes);
  ensure(bytes.length === doc.data()!.bytes, 422, "size_mismatch", "The image size changed.");
  await fs.mkdir(root(), { recursive: true });
  await fs.writeFile(path.join(root(), evidenceId + ".pending"), bytes, { flag: "w" });
  return { status: "uploaded" };
}
export async function finalizeMedia(principal: Principal, evidenceId: string) {
  const ref = db.collection("evidence").doc(evidenceId);
  const doc = await ref.get();
  ensure(doc.exists && doc.data()!.ownerId === principal.userId, 403, "forbidden", "This evidence belongs to another account.");
  const saved = doc.data()!;
  if (saved.status === "finalized") return { evidenceId, status: "finalized", sha256: saved.sha256 };
  let bytes: Buffer;
  try {
    if (localMedia()) bytes = await fs.readFile(path.join(root(), evidenceId + ".pending"));
    else {
      const object = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: saved.stagingKey }));
      ensure(object.ContentLength === saved.bytes && object.ContentLength! <= evidencePolicy.maxBytes, 422, "size_mismatch", "Uploaded image size does not match.");
      bytes = Buffer.from(await object.Body!.transformToByteArray());
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "upload_incomplete", "The photo is not available yet. Keep it and retry.");
  }
  const hash = createHash("sha256").update(bytes).digest("hex");
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  ensure(bytes.length === saved.bytes && hash === saved.sha256 &&
    ((saved.mime === "image/png" && png) || (saved.mime === "image/jpeg" && jpeg)), 422, "image_mismatch", "Image type, size or checksum did not match.");
  const finalKey = "evidence/" + evidenceId + "/" + hash;
  // Client upload URLs target staging only, never the canonical immutable object.
  if (localMedia()) await fs.writeFile(path.join(root(), evidenceId + "-" + hash), bytes);
  else await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: finalKey, Body: bytes,
    ContentType: saved.mime, Metadata: { sha256: hash }, IfNoneMatch: "*" })).catch(error => {
      if (error.$metadata?.httpStatusCode !== 412) throw error;
    });
  await ref.update({ status: "finalized", finalKey, finalizedAt: new Date().toISOString() });
  return { evidenceId, status: "finalized", sha256: hash };
}
export async function viewMedia(principal: Principal, evidenceId: string) {
  const doc = await db.collection("evidence").doc(evidenceId).get();
  ensure(doc.exists && doc.data()!.status === "finalized", 404, "not_found", "Evidence is unavailable.");
  const file = doc.data()!;
  let permitted = file.ownerId === principal.userId;
  if (!permitted && principal.role === "store_manager" && file.orderId && ["proof", "conflict_review"].includes(file.purpose)) {
    const order = await db.collection("orders").doc(file.orderId).get();
    if (order.exists && order.data()!.outletId === principal.outletId && order.data()!.proofId) {
      const proof = await db.collection("proofs").doc(order.data()!.proofId).get();
      permitted = proof.exists && (proof.data()!.evidenceIds ?? []).includes(evidenceId);
    }
  }
  if (!permitted && principal.role === "dispatcher" && file.tripId) {
    const trip = await db.collection("trips").doc(file.tripId).get();
    permitted = trip.exists && trip.data()!.depot === principal.depot;
  }
  ensure(permitted, 403, "forbidden", "You cannot view this evidence.");
  if (localMedia()) return { bytes: await fs.readFile(path.join(root(), evidenceId + "-" + file.sha256)), mime: file.mime };
  return { viewUrl: await getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: file.finalKey }), { expiresIn: 300 }) };
}
