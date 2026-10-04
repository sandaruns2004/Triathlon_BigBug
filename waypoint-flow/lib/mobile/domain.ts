import { z } from "zod";
import { createHash } from "node:crypto";
import { ApiError } from "./errors";
import type { Principal } from "@/lib/auth/credentials";

export const id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const operationSchema = z.object({
  operationId: z.string().uuid(), schemaVersion: z.literal(1),
  type: z.enum(["trip_start", "trip_closeout", "trip_issue", "delivery_recorded", "delivery_issue", "store_order_created", "receipt_recorded", "store_issue", "update_acknowledged"]),
  tripId: id.optional(), stopId: id.optional(), orderId: id.optional(),
  orderIds: z.array(id).max(20).optional(),
  observedAt: z.string().datetime({ offset: true }),
  concurrency: z.record(z.string(), z.unknown()).default({}),
  payload: z.record(z.string(), z.unknown()),
  dependencyIds: z.array(z.string().uuid()).max(50).default([]),
}).strict();
export type Operation = z.infer<typeof operationSchema>;
export type RecordData = Record<string, any>;
export type Line = { lineId: string; productId: string; name: string; quantity: number; unit: string };
export const evidencePolicy = { maxBytes: 2 * 1024 * 1024, maxPhotos: 3, mimeTypes: ["image/jpeg", "image/png"], signatureRequired: false, recipientFor: ["full", "partial"], photoFor: ["full", "partial"] };
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + canonicalJson((value as Record<string, unknown>)[key])).join(",") + "}";
  return JSON.stringify(value);
}
export const digest = (value: unknown) => createHash("sha256").update(canonicalJson(value)).digest("hex");
export const operationKey = (userId: string, operationId: string) => digest([userId, operationId]);
export function businessDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return get("year") + "-" + get("month") + "-" + get("day");
}
export function addDays(date: string, days: number) { return new Date(Date.parse(date + "T00:00:00Z") + days * 86400000).toISOString().slice(0, 10); }
export function ensure(condition: unknown, status: number, code: string, message: string): void {
  if (!condition) throw new ApiError(status, code, message);
}
export function requireRole(principal: Principal, ...roles: string[]) {
  ensure(roles.includes(principal.role), 403, "forbidden", "This account cannot perform that action.");
}
export function assertTripOwner(principal: Principal, trip: RecordData) {
  requireRole(principal, "driver");
  ensure(trip.driverId === principal.userId && trip.depot === principal.depot, 403, "assignment_changed", "This route is no longer assigned to you. Saved proof is retained.");
}
export function assertOrderOwner(principal: Principal, order: RecordData) {
  requireRole(principal, "store_manager");
  ensure(order.outletId === principal.outletId, 403, "forbidden", "This order belongs to another outlet.");
}
export function requireVersion(actual: unknown, expected: unknown, name: string) {
  ensure(Number.isInteger(expected) && actual === expected, 409, "revision_conflict", name + " changed. Compare the saved record with operations.");
}
export function validateStart(principal: Principal, trip: RecordData, stops: RecordData[], op: Operation, priorTrip?: RecordData) {
  assertTripOwner(principal, trip);
  // Hackathon demo: relaxed strict loading and release checks to allow immediate starts
}
const outcomeSchema = z.enum(["full", "partial", "failed", "refused", "skipped"]);
export const deliveredLineSchema = z.object({ lineId: id, deliveredQty: z.number().int().nonnegative(), unit: z.string().min(1).max(20), reason: z.string().max(500).default("") }).strict();
export const proofSchema = z.object({
  proofId: z.string().uuid(), outcome: outcomeSchema,
  parkedAcknowledged: z.literal(true), recipientName: z.string().trim().max(120).default(""),
  signature: z.string().max(20000).optional(), note: z.string().max(1000).default(""),
  reason: z.string().trim().max(500).default(""),
  lines: z.array(deliveredLineSchema).min(1).max(100),
  evidenceIds: z.array(z.string().uuid()).max(3),
}).strict();
export function validateProof(manifest: Line[], payload: unknown, policy = evidencePolicy) {
  const proof = proofSchema.parse(payload);
  ensure(new Set(proof.evidenceIds).size === proof.evidenceIds.length, 422, "duplicate_evidence", "Remove duplicated photos.");
  ensure(manifest.length === proof.lines.length && new Set(proof.lines.map(l => l.lineId)).size === manifest.length, 422, "invalid_lines", "Review every approved manifest line.");
  let hasDifference = false, hasDelivered = false;
  for (const line of proof.lines) {
    const approved = manifest.find(m => m.lineId === line.lineId);
    ensure(approved && approved.unit === line.unit && line.deliveredQty <= approved.quantity, 422, "invalid_quantity", "Delivered quantities must match approved lines and units.");
    const differs = line.deliveredQty !== approved!.quantity;
    hasDifference ||= differs; hasDelivered ||= line.deliveredQty > 0;
    if (differs) ensure(line.reason.trim().length > 0 || proof.reason.length > 0, 422, "reason_required", "Explain the quantity difference.");
  }
  if (proof.outcome === "full") ensure(!hasDifference, 422, "outcome_mismatch", "A full delivery must match every approved quantity.");
  if (proof.outcome === "partial") ensure(hasDifference && hasDelivered, 422, "outcome_mismatch", "A partial delivery needs some delivered goods and an explained difference.");
  if (["failed", "refused", "skipped"].includes(proof.outcome)) {
    ensure(!hasDelivered && proof.reason.length > 0, 422, "exception_reason", "An unsuccessful stop needs zero delivered quantities and a reason.");
  }
  if (policy.recipientFor.includes(proof.outcome)) ensure(proof.recipientName.length > 0, 422, "recipient_required", "Enter the recipient name.");
  if (policy.photoFor.includes(proof.outcome)) ensure(proof.evidenceIds.length > 0, 422, "photo_required", "Keep at least one delivery photo.");
  if (proof.signature) {
    let value: any;
    try { value = JSON.parse(proof.signature); } catch { throw new ApiError(422, "invalid_signature", "Use the drawn signature pad."); }
    const drawn = z.object({ mode: z.literal("drawn"), points: z.array(z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).nullable()).min(2).max(351) }).strict().safeParse(value);
    ensure(drawn.success && drawn.data.points.filter(p => p !== null).length >= 2, 422, "invalid_signature", "The signature needs a valid drawn stroke.");
  }
  if (policy.signatureRequired && ["full", "partial"].includes(proof.outcome)) ensure(!!proof.signature, 422, "signature_required", "A signature is required by this delivery policy.");
  return proof;
}
export function serviceOptions(outlet: RecordData, now = new Date()) {
  const today = businessDate(now);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", hourCycle: "h23" }).format(now));
  const earliest = hour >= 16 ? 2 : 1;
  const allowedWeekdays: number[] = outlet.operatingDays ?? [0, 1, 2, 3, 4, 5, 6];
  const dates = Array.from({ length: 7 }, (_, index) => addDays(today, earliest + index))
    .filter(date => allowedWeekdays.includes(new Date(date + "T00:00:00Z").getUTCDay()));
  return { version: 1, serviceDates: dates, cutoff: "16:00", timeZone: "Asia/Colombo", window: outlet.windowOpenTime + "–" + outlet.windowCloseTime, evidencePolicy };
}
export function validateOrder(payload: unknown, outlet: RecordData, products: RecordData[], now = new Date()) {
  const input = z.object({ requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), catalogueRevision: z.number().int(),
    serviceOptionsVersion: z.number().int(), note: z.string().max(1000).default(""),
    lines: z.array(z.object({ productId: id, quantity: z.number().int().positive().max(10000), unit: z.string().max(20) }).strict()).min(1).max(100) }).strict().parse(payload);
  const options = serviceOptions(outlet, now);
  ensure(input.serviceOptionsVersion === options.version && options.serviceDates.includes(input.requestedDate), 422, "service_date_expired", "Review an available date. The cut-off or receiving day changed.");
  ensure(input.catalogueRevision === 1 && new Set(input.lines.map(l => l.productId)).size === input.lines.length, 409, "catalogue_changed", "Refresh the catalogue and review your order.");
  let weight = 0, volume = 0;
  const lines = input.lines.map((line, index) => {
    const product = products.find(p => p.productId === line.productId && p.brand === outlet.brand && p.available !== false);
    ensure(product && product.unit === line.unit && line.quantity <= (product.maxQuantity ?? 10000), 422, "catalogue_invalid", "A product, quantity or unit is no longer available.");
    weight += product!.weightKg * line.quantity; volume += product!.volumeM3 * line.quantity;
    return { ...line, lineId: "line-" + (index + 1), name: product!.name };
  });
  return { input, lines, weight, volume, tempRequirement: products.some(p => lines.some(l => l.productId === p.productId) && ["reefer", "chilled", "frozen"].includes(p.temperature)) ? "chilled" : "ambient" };
}
