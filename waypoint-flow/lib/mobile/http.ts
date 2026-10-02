import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nativeLogin, principalFromBearer } from "@/lib/auth/credentials";
import { ApiError, identifier } from "@/lib/mobile/errors";
import { boundedBody, uploadSession, putLocalMedia, finalizeMedia, viewMedia } from "@/lib/mobile/media";
import { driverTrips, tripSnapshot, storeOrders, orderDetail, storeCatalogue, applyOperation,
  operationResult, deliveryNote, notifications, markRead, reviewConflict, conflictDetail } from "@/lib/mobile/service";
import { requireRole, operationSchema } from "@/lib/mobile/domain";

const response = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
async function body(req: Request) {
  if (!req.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, "json_required", "Use application/json.");
  try { return JSON.parse((await boundedBody(req, 512 * 1024)).toString("utf8")); }
  catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, "invalid_json", "Use a JSON request."); }
}
export function createMobileHandler(resolvePrincipal = principalFromBearer, allowLogin = true) {
return async function handle(req: NextRequest, context: { params: { path: string[] } }) {
  try {
    const path = context.params.path;
    const joined = path.join("/");
    const method = req.method;
    if (allowLogin && joined === "auth/login" && method === "POST") {
      const input = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) }).strict().parse(await body(req));
      return response(await nativeLogin(input.email, input.password));
    }
    const principal = await resolvePrincipal(req);
    if (joined === "me" && method === "GET") {
      requireRole(principal, "driver", "store_manager");
      const issuedAt = new Date();
      return response({ ...principal, offlineAccess: { issuedAt: issuedAt.toISOString(),
        expiresAt: new Date((principal.verifiedAt ?? issuedAt.getTime()) + 12 * 3600000).toISOString(), maxHours: 12 },
        capabilities: { backgroundSync: false, push: false, continuousTracking: false } });
    }
    if (joined === "driver/trips" && method === "GET") return response({ trips: await driverTrips(principal, req.nextUrl.searchParams.get("serviceDate") ?? undefined) });
    if (path[0] === "driver" && path[1] === "trips" && path.length === 3 && method === "GET") return response(await tripSnapshot(principal, identifier(path[2])));
    if (path[0] === "driver" && path[1] === "stops" && path.length === 3 && method === "GET") {
      const { db } = await import("@/lib/db/firebase");
      const stop = await db.collection("trip_stops").doc(identifier(path[2])).get();
      if (!stop.exists) throw new ApiError(404, "not_found", "Stop not found.");
      const trip = await tripSnapshot(principal, stop.data()!.tripId);
      return response(trip.stops.find(s => s.stopId === stop.id));
    }
    if (path[0] === "driver" && path[1] === "trips" && path.length === 4 && method === "POST") {
      const actionTypes: Record<string, string> = { start: "trip_start", closeout: "trip_closeout", issues: "trip_issue", acknowledgments: "update_acknowledged" };
      if (!actionTypes[path[3]]) throw new ApiError(404, "not_found", "Unknown trip action.");
      const input = await body(req);
      return response(await applyOperation(principal, { ...input, type: actionTypes[path[3]], tripId: identifier(path[2]) }));
    }
    if (joined === "store/catalogue" && method === "GET") return response(await storeCatalogue(principal));
    if (joined === "store/service-options" && method === "GET") return response((await storeCatalogue(principal)).serviceOptions);
    if (joined === "store/orders" && method === "GET") return response({ orders: await storeOrders(principal) });
    if (joined === "store/orders" && method === "POST") return response(await applyOperation(principal, { ...await body(req), type: "store_order_created" }));
    if (path[0] === "store" && path[1] === "orders" && path.length === 3 && method === "GET") return response(await orderDetail(principal, identifier(path[2])));
    if (path[0] === "store" && path[1] === "orders" && path[3] === "delivery-note" && method === "GET") return response(await deliveryNote(principal, identifier(path[2])));
    if (path[0] === "store" && path[1] === "orders" && path.length === 4 && method === "POST") {
      const actionTypes: Record<string, string> = { receipt: "receipt_recorded", issues: "store_issue", acknowledgments: "update_acknowledged" };
      if (!actionTypes[path[3]]) throw new ApiError(404, "not_found", "Unknown order action.");
      return response(await applyOperation(principal, { ...await body(req), type: actionTypes[path[3]], orderId: identifier(path[2]) }));
    }
    if (joined === "sync/operations" && method === "POST") {
      const input = z.object({ operations: z.array(operationSchema).min(1).max(20) }).strict().parse(await body(req));
      const results = [];
      for (const operation of input.operations) {
        try { results.push(await applyOperation(principal, operation)); }
        catch (error) {
          if (error instanceof z.ZodError) results.push({ operationId: operation.operationId, status: "rejected", httpStatus: 422, code: "invalid_payload", message: "Review the operation fields." });
          else if (error instanceof ApiError) results.push({ operationId: operation.operationId, status: "rejected", httpStatus: error.status, code: error.code, message: error.message });
          else results.push({ operationId: operation.operationId, status: "retryable", httpStatus: 503, code: "server_unavailable", message: "Server could not accept this operation. Retry with the same ID." });
        }
      }
      return response({ results });
    }
    if (path[0] === "sync" && path[1] === "operations" && path.length === 3 && method === "GET") return response(await operationResult(principal, z.string().uuid().parse(path[2])));
    if (joined === "media/upload-sessions" && method === "POST") return response(await uploadSession(principal, await body(req)));
    if (path[0] === "media" && path.length === 3) {
      const evidenceId = z.string().uuid().parse(path[1]);
      if (path[2] === "content" && method === "PUT") return response(await putLocalMedia(principal, evidenceId, req));
      if (path[2] === "finalize" && method === "POST") return response(await finalizeMedia(principal, evidenceId));
      if (path[2] === "view" && method === "GET") {
        const result = await viewMedia(principal, evidenceId);
        if (result.bytes) return new NextResponse(new Uint8Array(result.bytes), { headers: { "Content-Type": result.mime, "Cache-Control": "no-store" } });
        return response(result);
      }
    }
    if (path[0] === "conflicts" && path.length >= 2) {
      const operationId = z.string().uuid().parse(path[1]);
      if (path[2] === "reviews" && method === "POST") return response(await reviewConflict(principal, operationId, await body(req)));
      if (path.length === 2 && method === "GET") return response(await conflictDetail(principal, operationId));
    }
    if (joined === "notifications" && method === "GET") {
      const after = req.nextUrl.searchParams.get("after") ?? undefined;
      if (after && !/^\d{1,15}$/.test(after)) throw new ApiError(422, "invalid_cursor", "Invalid notification checkpoint.");
      return response(await notifications(principal, after));
    }
    if (path[0] === "notifications" && path[2] === "read" && method === "POST") return response(await markRead(principal, identifier(path[1])));
    throw new ApiError(404, "not_found", "This API route is unavailable.");
  } catch (error) {
    if (error instanceof ApiError) return response({ error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof z.ZodError) return response({ error: { code: "invalid_request", message: "Review the request fields." } }, 422);
    return response({ error: { code: "server_unavailable", message: "The server could not complete this request. Saved work is retained; retry." } }, 503);
  }
}
}


