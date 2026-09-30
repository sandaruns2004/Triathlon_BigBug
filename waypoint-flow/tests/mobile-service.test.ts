import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { db } from "../lib/db/firebase";
import { seedMobileTestData } from "../scripts/seed-mobile-test";
import { currentPrincipal, nativeLogin, principalFromBearer } from "../lib/auth/credentials";
import { driverTrips, tripSnapshot, applyOperation, orderDetail, deliveryNote, publishPendingEvents, notifications,
  reviewConflict, conflictDetail, storeCatalogue } from "../lib/mobile/service";
import { loadStop, reportShortfall, resolveShortfall, deferOrder, assignTrip, restoreOrder, approveReview } from "../lib/mobile/operations";
import { uploadSession, putLocalMedia, finalizeMedia, viewMedia } from "../lib/mobile/media";
import { validateProof, businessDate, operationKey, type Operation } from "../lib/mobile/domain";
import { ApiError } from "../lib/mobile/errors";

async function principal(id: string) { return currentPrincipal(id, (await db.collection("users").doc(id).get()).data()!); }
const failure = (status: number) => (error: unknown) => error instanceof ApiError && error.status === status;
const op = (type: Operation["type"], fields: Record<string, unknown> = {}) => ({
  operationId: randomUUID(), schemaVersion: 1, type, observedAt: new Date().toISOString(), concurrency: {}, payload: {}, dependencyIds: [], ...fields,
});
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZfkAAAAASUVORK5CYII=", "base64");
async function photo(driver: Awaited<ReturnType<typeof principal>>, tripId: string, stopId: string) {
  const evidenceId = randomUUID(), sha256 = createHash("sha256").update(png).digest("hex");
  await uploadSession(driver, { evidenceId, tripId, stopId, bytes: png.length, mime: "image/png", sha256 });
  await putLocalMedia(driver, evidenceId, new Request("http://localhost/test", { method: "PUT", body: png }));
  await finalizeMedia(driver, evidenceId);
  return evidenceId;
}
async function exchange(customToken: string) {
  const response = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-emulator-api-key", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  assert.equal(response.status, 200);
  const data = await response.json() as { idToken: string };
  return new Request("http://localhost/api/mobile/v1/me", { headers: { Authorization: "Bearer " + data.idToken } });
}

test("isolated cross-role journey, replay, scoped revisions and authorization", async () => {
  await seedMobileTestData();
  const driver = await principal("test-driver"), otherDriver = await principal("test-driver-b"),
    store = await principal("test-store"), otherStore = await principal("test-store-b"),
    loader = await principal("test-loader"), dispatcher = await principal("test-dispatcher");
  const login = await nativeLogin("test-driver@emulator.waypoint.test", "local-emulator-only");
  const bearer = await exchange(login.customToken);
  assert.equal((await principalFromBearer(bearer)).userId, driver.userId);
  assert.equal((await driverTrips(otherDriver)).length, 0);
  await assert.rejects(orderDetail(otherStore, "TEST-ORDER-1"), failure(403));

  await loadStop(loader, "TEST-STOP-1");
  const shortfall = await reportShortfall(loader, { tripId: "TEST-TRIP-1", stopId: "TEST-STOP-2", detail: "Two damaged milk cases" });
  let trip = await tripSnapshot(driver, "TEST-TRIP-1");
  const blockedStart = op("trip_start", { tripId: trip.tripId, concurrency: { assignmentVersion: trip.assignmentVersion, releaseVersion: trip.releaseVersion }, payload: { parkedAcknowledged: true } });
  await assert.rejects(applyOperation(driver, blockedStart), failure(409));
  const shortStop = trip.stops.find(s => s.stopId === "TEST-STOP-2")!;
  await resolveShortfall(dispatcher, shortfall.exceptionId, { reason: "Approved partial load", quantities: Object.fromEntries(shortStop.lines.map((l: any) => [l.lineId, l.quantity - (l.productId === "MILK-CASE" ? 2 : 0)])) });
  trip = await tripSnapshot(driver, "TEST-TRIP-1");
  assert.equal(trip.released, true);
  const start = op("trip_start", { tripId: trip.tripId, concurrency: { assignmentVersion: trip.assignmentVersion, releaseVersion: trip.releaseVersion }, payload: { parkedAcknowledged: true } });
  const unpublishedPlan="TEST-PUBLISH-"+randomUUID();
  await db.collection("plans").doc(unpublishedPlan).set({planId:unpublishedPlan,depot:"Peliyagoda",status:"allocated"});
  await db.collection("trips").doc(trip.tripId).update({planId:unpublishedPlan});
  assert.equal((await tripSnapshot(driver,trip.tripId)).startEligible,false);
  await assert.rejects(applyOperation(driver,start),(e:unknown)=>e instanceof ApiError&&e.code==="plan_not_published");
  await db.collection("plans").doc(unpublishedPlan).update({status:"published"});
  await assert.rejects(applyOperation(otherDriver, start), failure(403));
  assert.equal((await applyOperation(driver, start)).status, "accepted");
  assert.equal((await applyOperation(driver, start)).status, "already_applied");
  await assert.rejects(applyOperation(driver, { ...start, payload: { parkedAcknowledged: false } }), failure(409));
  const secondTrip = await tripSnapshot(driver, "TEST-TRIP-2");
  await assert.rejects(applyOperation(driver, op("trip_start", { tripId: secondTrip.tripId,
    concurrency: { assignmentVersion: secondTrip.assignmentVersion, releaseVersion: secondTrip.releaseVersion }, payload: { parkedAcknowledged: true } })), failure(409));

  // Use ONE approved snapshot for both offline stops; progress of the first must not invalidate the second.
  const proofOperations = [];
  for (const stop of trip.stops) {
    const evidenceId = await photo(driver, trip.tripId, stop.stopId);
    const request = op("delivery_recorded", { tripId: trip.tripId, stopId: stop.stopId, dependencyIds: [start.operationId],
      concurrency: { assignmentVersion: trip.assignmentVersion, stopManifestRevision: stop.stopManifestRevision,
        stopDeliveryVersion: stop.stopDeliveryVersion, orderFulfillmentVersions: { [stop.orderId]: stop.orderFulfillmentVersion } },
      payload: { proofId: randomUUID(), outcome: "full", parkedAcknowledged: true, recipientName: "Test recipient",
        note: "", reason: "", evidenceIds: [evidenceId], lines: stop.lines.map((l: any) => ({ lineId: l.lineId, deliveredQty: l.quantity, unit: l.unit, reason: "" })) } });
    proofOperations.push(request);
    const result = await applyOperation(driver, request);
    assert.equal(result.status, "accepted");
    // Lost response after commit: resubmit the exact persisted operation.
    assert.equal((await applyOperation(driver, request)).status, "already_applied");
    await assert.rejects(applyOperation(driver, { ...request, operationId: randomUUID() }), failure(409));
  }
  const completedRoute = await tripSnapshot(driver, trip.tripId);
  assert.equal(completedRoute.stopsCompleted, 2);
  assert.equal(completedRoute.resolvedCount, 2);
  const order = await orderDetail(store, "TEST-ORDER-1");
  const receipt = op("receipt_recorded", { orderId: order.orderId,
    concurrency: { receiptVersion: order.receiptVersion, proofVersion: order.proofVersion },
    payload: { lines: order.deliveredLines.map((l: any) => ({ lineId: l.lineId, receivedQty: l.deliveredQty, unit: l.unit, reason: "" })), note: "", evidenceIds: [] } });
  await assert.rejects(applyOperation(otherStore, receipt), failure(403));
  assert.equal((await applyOperation(store, receipt)).outcome, "receipt_confirmed");
  assert.equal((await applyOperation(store, receipt)).status, "already_applied");
  assert.equal((await deliveryNote(store, order.orderId)).reference, "DN-TEST-ORDER-1");
  await assert.rejects(applyOperation(store, { ...receipt, operationId: randomUUID() }), failure(409));
  const closeout = op("trip_closeout", { tripId: trip.tripId, dependencyIds: proofOperations.map(o => o.operationId),
    payload: { returnedToDepot: true, parkedAcknowledged: true } });
  const closed = await applyOperation(driver, closeout);
  assert.equal(closed.tripStatus, "completed");
  assert.equal(closed.nextTripEligible, true);
  assert.equal((await applyOperation(driver, closeout)).status, "already_applied");
  await deferOrder(dispatcher, "TEST-DEFERRED", { reason: "Demand exceeds capacity" });
  assert.equal((await orderDetail(store, "TEST-DEFERRED")).deferralReason, "Demand exceeds capacity");
  // A publisher crash before this call leaves durable pending events; retries never duplicate recipient records.
  await publishPendingEvents(100);
  const firstCount = (await db.collection("notifications").get()).size;
  await publishPendingEvents(100);
  assert.equal((await db.collection("notifications").get()).size, firstCount);
  const updates = await notifications(store);
  assert.ok(updates.notifications.some(n => n.type === "delivery_recorded"));
  assert.ok(updates.notifications.some(n => n.type === "order_deferred"));
  assert.ok(updates.notifications.every(n => n.recipientOutletId === "OUT005"));
});

test("failed and refused outcomes do not invent recipient proof", () => {
  const manifest = [{ lineId: "LINE-1", productId: "MILK", name: "Milk", quantity: 12, unit: "case" }];
  const failed = { proofId: randomUUID(), outcome: "refused", parkedAcknowledged: true, recipientName: "", note: "", reason: "Outlet refused delivery",
    evidenceIds: [], lines: [{ lineId: "LINE-1", deliveredQty: 0, unit: "case", reason: "Refused" }] };
  assert.equal(validateProof(manifest, failed).outcome, "refused");
  assert.throws(() => validateProof(manifest, { ...failed, outcome: "full" }));
  assert.equal(businessDate(new Date("2026-09-29T20:00:00Z")), "2026-09-30");
});

test("reassigned proof has restricted historical review; reset rejects delayed custom-token exchange", async () => {
  const driver = await principal("test-driver"), dispatcher = await principal("test-dispatcher");
  const originalTrip = (await db.collection("trips").doc("TEST-TRIP-1").get()).data()!;
  const originalStop = (await db.collection("trip_stops").doc("TEST-STOP-1").get()).data()!;
  await db.collection("trips").doc("TEST-CONFLICT-TRIP").set({ ...originalTrip, tripId: "TEST-CONFLICT-TRIP", status: "held", held: true,
    assignmentVersion: 1, driverId: driver.userId, assignmentHistory: [] });
  await db.collection("trip_stops").doc("TEST-CONFLICT-STOP").set({ ...originalStop, stopId: "TEST-CONFLICT-STOP", tripId: "TEST-CONFLICT-TRIP",
    proofId: null, stopDeliveryVersion: 0 });
  const saved = op("delivery_recorded", { tripId: "TEST-CONFLICT-TRIP", stopId: "TEST-CONFLICT-STOP", concurrency: { assignmentVersion: 1 },
    payload: { proofId: randomUUID(), reason: "Original saved proof" } });
  await assignTrip(dispatcher, "TEST-CONFLICT-TRIP", { driverId: "test-driver-b", reason: "Breakdown recovery" });
  await assert.rejects(applyOperation(driver, saved), failure(403));
  const review = await reviewConflict(driver, saved.operationId, { operation: saved, reason: "Saved before reassignment" });
  assert.equal(review.status, "awaiting_operations");
  const comparison = await conflictDetail(driver, saved.operationId);
  assert.equal(comparison.canonical.stopId, "TEST-CONFLICT-STOP");
  assert.equal((comparison as any).trip, undefined);
  assert.equal((await db.collection("conflict_reviews").doc(operationKey(driver.userId, saved.operationId)).get()).data()!.operation.operationId, saved.operationId);
  const beforeReset = await nativeLogin("test-driver@emulator.waypoint.test", "local-emulator-only");
  await db.collection("users").doc(driver.userId).update({ authVersion: 1 });
  const delayed = await exchange(beforeReset.customToken);
  await assert.rejects(principalFromBearer(delayed), failure(401));
});

test("canonical Store creation, audited historical amendment and deferral restoration", async () => {
  const store=await principal("test-store"),driver=await principal("test-driver"),dispatcher=await principal("test-dispatcher"),
    otherStore=await principal("test-store-b");
  const catalogue=await storeCatalogue(store);
  const create=op("store_order_created",{payload:{requestedDate:catalogue.serviceOptions.serviceDates[0],catalogueRevision:catalogue.revision,
    serviceOptionsVersion:catalogue.serviceOptions.version,note:"Receiving dock test",lines:[{productId:"MILK-CASE",quantity:3,unit:"case"}]}});
  await assert.rejects(applyOperation(store,{...create,payload:{...create.payload,weight:0}}));
  await assert.rejects(applyOperation(store,{...create,concurrency:{ownerScope:{role:"store_manager",depot:null,outletId:"OUT006"}}}),failure(409));
  const created=await applyOperation(store,create);
  assert.equal((await applyOperation(store,create)).orderId,created.orderId);
  const order=await orderDetail(store,created.orderId);
  assert.equal(order.orderWeightKg,36);assert.equal(order.lines[0].quantity,3);
  await assert.rejects(orderDetail(otherStore,created.orderId),failure(403));
  // Controlled reassignment fixture: same REAL created order, linked to the historical stop.
  // Planning date is simulated explicitly; this test does not certify the fleet scheduler.
  await db.collection("orders").doc(created.orderId).update({tripId:"TEST-CONFLICT-TRIP",status:"on_route"});
  await db.collection("trip_stops").doc("TEST-CONFLICT-STOP").update({orderId:created.orderId,outletId:"OUT005",lines:order.lines,
    stopManifestRevision:2,stopDeliveryVersion:0,proofId:null,status:"pending"});
  const saved=op("delivery_recorded",{tripId:"TEST-CONFLICT-TRIP",stopId:"TEST-CONFLICT-STOP",concurrency:{assignmentVersion:1},
    payload:{proofId:randomUUID(),reason:"Captured before reassignment",evidenceIds:[]}});
  const review=await reviewConflict(driver,saved.operationId,{operation:saved,reason:"Historical proof requires current-manifest review"});
  const evidenceId=randomUUID(),sha256=createHash("sha256").update(png).digest("hex");
  await uploadSession(driver,{evidenceId,tripId:"TEST-CONFLICT-TRIP",stopId:"TEST-CONFLICT-STOP",reviewOperationId:saved.operationId,
    bytes:png.length,mime:"image/png",sha256});
  await putLocalMedia(driver,evidenceId,new Request("http://localhost/test",{method:"PUT",body:png}));
  await finalizeMedia(driver,evidenceId);
  const decision={reason:"Verified original evidence against revised manifest",stopManifestRevision:2,stopDeliveryVersion:0,
    proof:{proofId:randomUUID(),outcome:"full",parkedAcknowledged:true,recipientName:"Test recipient",reason:"",note:"Audited correction",
      evidenceIds:[evidenceId],lines:order.lines.map((l:any)=>({lineId:l.lineId,deliveredQty:l.quantity,unit:l.unit,reason:""}))}};
  await assert.rejects(approveReview(driver,review.reviewId,decision),failure(403));
  await assert.rejects(approveReview(dispatcher,review.reviewId,{...decision,stopManifestRevision:1}),failure(409));
  const amended=await approveReview(dispatcher,review.reviewId,decision);
  assert.deepEqual(await approveReview(dispatcher,review.reviewId,decision),amended);
  await assert.rejects(approveReview(dispatcher,review.reviewId,{...decision,reason:"Changed approved decision"}),failure(409));
  const originalReview=(await db.collection("conflict_reviews").doc(review.reviewId).get()).data()!;
  assert.deepEqual(originalReview.operation,saved);assert.equal(originalReview.status,"approved_amendment");
  const delivered=await orderDetail(store,created.orderId);
  assert.equal(delivered.status,"delivered");assert.equal(delivered.proofId,decision.proof.proofId);
  const receipt=op("receipt_recorded",{orderId:created.orderId,concurrency:{receiptVersion:delivered.receiptVersion,proofVersion:delivered.proofVersion},
    payload:{lines:delivered.deliveredLines.map((l:any)=>({lineId:l.lineId,receivedQty:l.deliveredQty,unit:l.unit,reason:""})),note:"",evidenceIds:[]}});
  await applyOperation(store,receipt);
  assert.equal((await deliveryNote(store,created.orderId)).reference,"DN-"+created.orderId);
  assert.deepEqual((await deliveryNote(store,created.orderId)).evidenceIds,[evidenceId]);
  assert.deepEqual((await viewMedia(store,evidenceId)).bytes,png);
  await assert.rejects(viewMedia(otherStore,evidenceId),failure(403));
  await assert.rejects(applyOperation(store,op("store_issue",{orderId:created.orderId,payload:{category:"damaged",reason:"Damaged crate",lineIds:[],evidenceIds:[]}})),failure(422));
  await restoreOrder(dispatcher,"TEST-DEFERRED",{reason:"Capacity available on revised date",serviceDate:catalogue.serviceOptions.serviceDates[0]});
  const restored=await orderDetail(store,"TEST-DEFERRED");
  assert.equal(restored.status,"pending");assert.equal(restored.history.at(-1).type,"restored_to_planning");
  assert.ok(restored.history.some((h:any)=>h.type==="deferred"));
  await assert.rejects(restoreOrder(dispatcher,"TEST-DEFERRED",{reason:"Duplicate restoration",serviceDate:catalogue.serviceOptions.serviceDates[0]}),failure(409));
});
