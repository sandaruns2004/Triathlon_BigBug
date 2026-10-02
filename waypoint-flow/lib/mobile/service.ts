import { db } from "@/lib/db/firebase";
import type { Principal } from "@/lib/auth/credentials";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { ApiError, identifier } from "./errors";
import { operationSchema, operationKey, digest, ensure, requireRole, assertTripOwner, assertOrderOwner,
  requireVersion, validateStart, validateProof, validateOrder, businessDate, serviceOptions, evidencePolicy,
  type Operation, type RecordData } from "./domain";

const row = (snap: FirebaseFirestore.DocumentSnapshot): RecordData => {
  ensure(snap.exists, 404, "not_found", "The requested record was not found.");
  return snap.data()!;
};
export async function driverTrips(principal: Principal, date = businessDate()) {
  requireRole(principal, "driver");
  const found = await db.collection("trips").where("driverId", "==", principal.userId).get();
  return Promise.all(found.docs.filter(doc => (doc.data().serviceDate ?? doc.data().planDate) === date)
    .sort((a, b) => (a.data().tripNumber ?? 1) - (b.data().tripNumber ?? 1)).map(doc => tripSnapshot(principal, doc.id)));
}
export async function tripSnapshot(principal: Principal, tripId: string): Promise<RecordData & { stops: RecordData[] }> {
  const trip = row(await db.collection("trips").doc(identifier(tripId)).get());
  assertTripOwner(principal, trip);
  const stops = await db.collection("trip_stops").where("tripId", "==", tripId).get();
  const ordered = stops.docs.filter(doc => doc.data().active !== false).map(doc => ({ ...doc.data(), stopId: doc.id })).sort((a: RecordData, b: RecordData) => a.stopOrder - b.stopOrder);
  const plan = trip.planId ? (await db.collection("plans").doc(identifier(trip.planId)).get()).data() : null;
  const previousTrip = trip.previousTripId ? (await db.collection("trips").doc(identifier(trip.previousTripId)).get()).data() : null;
  const startEligible = trip.status === "ready_to_depart" && trip.released === true && !trip.held &&
    ordered.length > 0 && ordered.every((s:RecordData)=>s.loadingState==="loaded"&&!s.shortfallOpen) &&
    (!trip.planId || plan?.status === "published") && ((trip.tripNumber??1) === 1 || previousTrip?.status === "completed");
  return { ...trip, tripId, serviceDate: trip.serviceDate ?? trip.planDate, serverTime: new Date().toISOString(),
    startEligible, handling: trip.tempRequirement ?? (trip.brand === "Fresh" ? "Refrigerated" : "See approved product handling"),
    finish: trip.finish ?? "08:00", routeRevision: trip.routeRevision ?? 1,
    evidencePolicy: trip.evidencePolicy ?? evidencePolicy,
    stops: await Promise.all(ordered.map(async (stop: RecordData) => {
      const order = row(await db.collection("orders").doc(identifier(stop.orderId)).get());
      ensure(order.tripId === tripId && order.outletId === stop.outletId, 409, "manifest_linkage_changed", "Operations must repair this manifest linkage.");
      return { ...stop, orderId: stop.orderId, orderFulfillmentVersion: order.fulfillmentVersion ?? 0,
      name: stop.outletName ?? stop.name ?? stop.outletId, window: stop.window ?? "",
      instruction: stop.instruction ?? "", lines: stop.lines ?? [] };
    })) };
}
export async function storeOrders(principal: Principal) {
  requireRole(principal, "store_manager");
  const found = await db.collection("orders").where("outletId", "==", principal.outletId).get();
  return found.docs.map(doc => ({ ...doc.data(), orderId: doc.id }))
    .sort((a: RecordData, b: RecordData) => String(b.createdAt ?? b.planDate).localeCompare(String(a.createdAt ?? a.planDate)));
}
export async function orderDetail(principal: Principal, orderId: string): Promise<RecordData> {
  const order = row(await db.collection("orders").doc(identifier(orderId)).get());
  assertOrderOwner(principal, order);
  // Never return the full trip containing other outlets' stops to a Store user.
  const trip = order.tripId ? (await db.collection("trips").doc(identifier(order.tripId)).get()).data() : undefined;
  return { ...order, orderId, serverTime: new Date().toISOString(), tracking: trip ? {
    status: trip.status, vehicleId: trip.vehicleId, etaDeparture: trip.etaDeparture ?? null,
    etaReturn: trip.etaReturn ?? null, held: trip.held ?? false, holdReason: trip.holdReason ?? null
  } : null };
}
export async function storeCatalogue(principal: Principal) {
  requireRole(principal, "store_manager");
  const outlet = row(await db.collection("outlets").doc(identifier(principal.outletId)).get());
  const products = await db.collection("products").where("brand", "==", outlet.brand).get();
  return { revision: 1, products: products.docs.filter(doc => doc.data().available !== false).map(doc => ({ ...doc.data(), productId: doc.id })),
    outlet: { outletId: principal.outletId, name: outlet.name, brand: outlet.brand }, serviceOptions: serviceOptions(outlet) };
}
function domainEvent(tx: FirebaseFirestore.Transaction, eventId: string, data: RecordData) {
  tx.create(db.collection("domain_events").doc(eventId), { eventId, published: false, createdAt: new Date().toISOString(), ...data });
}
function eventScope(principal: Principal, order?: RecordData, trip?: RecordData) {
  return { outletId: order?.outletId ?? null, depot: order?.depot ?? trip?.depot ?? principal.depot,
    driverId: trip?.driverId ?? null };
}
export async function applyOperation(principal: Principal, input: unknown) {
  const op = operationSchema.parse(input);
  const ownerScope = op.concurrency.ownerScope as RecordData | undefined;
  if (ownerScope) ensure(ownerScope.role === principal.role && ownerScope.depot === principal.depot &&
    ownerScope.outletId === principal.outletId, 409, "scope_changed", "Saved work belongs to the earlier role or outlet. Operations must authorize recovery.");
  ensure(Date.parse(op.observedAt) <= Date.now() + 300000, 422, "invalid_time", "The observation time is in the future. Check the phone clock.");
  const key = operationKey(principal.userId, op.operationId);
  const payloadHash = digest(op);
  const opRef = db.collection("mobile_operations").doc(key);
  return db.runTransaction(async tx => {
    const existing = await tx.get(opRef);
    if (existing.exists) {
      ensure(existing.data()!.payloadHash === payloadHash, 409, "operation_payload_changed", "An operation ID cannot be reused with changed proof.");
      return { ...existing.data()!.receipt, status: "already_applied" };
    }
    for (const dependency of op.dependencyIds) {
      const previous = await tx.get(db.collection("mobile_operations").doc(operationKey(principal.userId, dependency)));
      ensure(previous.exists && previous.data()!.receipt.status === "accepted", 409, "dependency_pending", "Sync earlier required work first.");
    }
    const now = new Date().toISOString();
    let entityId = "", versions: RecordData = {}, result: RecordData = {}, event: RecordData = {};
    if (op.type === "store_order_created") {
      requireRole(principal, "store_manager");
      const outlet = row(await tx.get(db.collection("outlets").doc(identifier(principal.outletId))));
      const products = await tx.get(db.collection("products").where("brand", "==", outlet.brand));
      const validated = validateOrder(op.payload, outlet, products.docs.map(d => ({ ...d.data(), productId: d.id })));
      entityId = "ORD-" + key.slice(0, 24);
      const order = { orderId: entityId, outletId: principal.outletId, outletName: outlet.name, brand: outlet.brand,
        district: outlet.district, depot: outlet.depot, dockType: outlet.dockType, parkingConstraint: outlet.parkingConstraint,
        tempRequirement: validated.tempRequirement, orderWeightKg: validated.weight, orderVolumeM3: validated.volume,
        lines: validated.lines, items: validated.lines, planDate: validated.input.requestedDate, requestedDate: validated.input.requestedDate,
        note: validated.input.note, status: "pending", tripId: null, deferredYesterday: false, daysSinceLastServed: 0,
        fulfillmentVersion: 0, receiptVersion: 0, createdAt: now, createdBy: principal.userId };
      tx.create(db.collection("orders").doc(entityId), order);
      result = { orderId: entityId, outcome: "awaiting_plan" };
      event = { type: "order_created", entityId, ...eventScope(principal, order) };
    } else if (["receipt_recorded", "store_issue"].includes(op.type) || (op.type === "update_acknowledged" && op.orderId)) {
      requireRole(principal, "store_manager");
      const orderRef = db.collection("orders").doc(identifier(op.orderId));
      const order = row(await tx.get(orderRef));
      assertOrderOwner(principal, order);
      entityId = orderRef.id;
      if (op.type === "receipt_recorded") {
        const input = z.object({ lines: z.array(z.object({ lineId: z.string(), receivedQty: z.number().int().nonnegative(), unit: z.string(), reason: z.string().max(500).default("") }).strict()).min(1).max(100),
          note: z.string().max(1000).default(""), evidenceIds: z.array(z.string().uuid()).max(3).default([]) }).strict().parse(op.payload);
        requireVersion(order.receiptVersion ?? 0, op.concurrency.receiptVersion, "Receipt");
        requireVersion(order.proofVersion, op.concurrency.proofVersion, "Delivery proof");
        ensure(["delivered", "partial"].includes(order.status) && order.proofId && !order.receiptId, 409, "receipt_not_eligible", "A server-confirmed delivery is required, or this receipt was already confirmed.");
        const delivered = order.deliveredLines as RecordData[];
        ensure(delivered.length === input.lines.length && new Set(input.lines.map(l => l.lineId)).size === delivered.length, 422, "invalid_lines", "Review every delivered line.");
        let discrepancy = false;
        for (const line of input.lines) {
          const actual = delivered.find(d => d.lineId === line.lineId);
          ensure(actual && line.unit === actual.unit && line.receivedQty <= actual.deliveredQty, 422, "invalid_quantity", "Accepted quantities cannot exceed actual delivered goods.");
          if (line.receivedQty !== actual!.deliveredQty) {
            discrepancy = true;
            ensure(line.reason.trim().length > 0, 422, "reason_required", "Explain each receipt difference.");
          }
        }
        const evidence = await Promise.all(input.evidenceIds.map(eid => tx.get(db.collection("evidence").doc(eid))));
        for (const file of evidence) ensure(file.exists && file.data()!.ownerId === principal.userId && file.data()!.orderId === orderRef.id && file.data()!.status === "finalized", 422, "evidence_not_ready", "Receipt evidence is not finalized for this order.");
        const receiptId = key;
        const receipt = { receiptId, orderId: entityId, proofId: order.proofId, userId: principal.userId, lines: input.lines, note: input.note,
          evidenceIds: input.evidenceIds, discrepancy, receivedAt: now, observedAt: op.observedAt, version: (order.receiptVersion ?? 0) + 1 };
        tx.create(db.collection("receipts").doc(receiptId), receipt);
        tx.update(orderRef, { receiptId, receiptVersion: receipt.version, acceptedLines: input.lines, receiptConfirmedAt: now,
          receiptDiscrepancy: discrepancy, noteReference: "DN-" + entityId, status: "receipt_confirmed" });
        if (discrepancy) tx.create(db.collection("exceptions").doc("receipt-" + key), { type: "receipt_discrepancy", orderId: entityId,
          outletId: order.outletId, depot: order.depot, title: "Receipt quantity difference", detail: input.note || "Review line-level receipt reasons.",
          resolved: false, createdAt: now, reportedById: principal.userId });
        versions = { receiptVersion: receipt.version }; result = { receiptId, noteReference: "DN-" + entityId, outcome: "receipt_confirmed" };
      } else if (op.type === "store_issue") {
        const input = z.object({ category: z.enum(["missing", "quantity", "damaged", "temperature", "business_impact", "other"]),
          reason: z.string().trim().min(1).max(1000), lineIds: z.array(z.string()).max(100).default([]), evidenceIds: z.array(z.string().uuid()).max(3).default([]) }).strict().parse(op.payload);
        ensure(input.lineIds.every(id => (order.lines ?? []).some((line: RecordData) => line.lineId === id)), 422, "invalid_lines", "Select lines from this order.");
        ensure(["other", "business_impact"].includes(input.category) || input.lineIds.length > 0, 422, "lines_required", "Select affected order lines.");
        const media = await Promise.all(input.evidenceIds.map(id => tx.get(db.collection("evidence").doc(id))));
        for (const file of media) ensure(file.exists && file.data()!.ownerId === principal.userId && file.data()!.orderId === entityId && file.data()!.status === "finalized", 422, "evidence_not_ready", "Finalize issue evidence first.");
        tx.create(db.collection("exceptions").doc(key), { exceptionId: key, type: "store_issue", ...input, orderId: entityId,
          outletId: order.outletId, depot: order.depot, reportedById: principal.userId, title: "Store issue", detail: input.reason, resolved: false, createdAt: now });
        tx.update(orderRef, { lastIssueId: key, issueState: "open" }); result = { issueId: key, outcome: "issue_reported" };
      } else {
        requireVersion(order.updateVersion ?? 0, op.concurrency.updateVersion, "Order update");
        tx.set(db.collection("acknowledgments").doc(key), { userId: principal.userId, orderId: entityId, version: order.updateVersion ?? 0, createdAt: now });
        result = { outcome: "acknowledged" };
      }
      event = { type: op.type, entityId, ...eventScope(principal, order) };
    } else {
      requireRole(principal, "driver");
      const tripRef = db.collection("trips").doc(identifier(op.tripId));
      const trip = row(await tx.get(tripRef));
      assertTripOwner(principal, trip);
      const stopsSnap = await tx.get(db.collection("trip_stops").where("tripId", "==", tripRef.id));
      const stops = stopsSnap.docs.filter(doc => doc.data().active !== false).map(doc => ({ ...doc.data(), stopId: doc.id })) as RecordData[];
      entityId = tripRef.id;
      if (op.type === "trip_start") {
        if (trip.planId) {
          const plan = row(await tx.get(db.collection("plans").doc(identifier(trip.planId))));
          ensure(plan.status === "published" && plan.depot === trip.depot, 409, "plan_not_published", "Operations must publish the assigned plan before departure.");
        }
        const prior = trip.previousTripId ? row(await tx.get(db.collection("trips").doc(identifier(trip.previousTripId)))) : undefined;
        validateStart(principal, trip, stops, op, prior);
        ensure(op.payload.parkedAcknowledged === true, 422, "parked_required", "Confirm you are safely parked.");
        const orders = await Promise.all(stops.map(s => tx.get(db.collection("orders").doc(identifier(s.orderId)))));
        ensure(orders.every((d, i) => d.exists && d.data()!.tripId === tripRef.id && d.data()!.outletId === stops[i].outletId), 409, "linkage_changed", "Review linked orders before departure.");
        for (const order of orders) tx.update(order.ref, { status: "on_route" });
        tx.update(tripRef, { status: "on_route", departedAt: now });
        result = { outcome: "on_route" };
      } else if (op.type === "trip_closeout") {
        ensure(!trip.held && ["on_route", "returning"].includes(trip.status) && stops.every(s => s.proofId) && stops.length > 0, 409, "closeout_not_ready", "All stop outcomes must be accepted and holds resolved before closeout.");
        ensure(op.payload.returnedToDepot === true && op.payload.parkedAcknowledged === true, 422, "return_required", "Confirm parked return to the depot.");
        const next = await tx.get(db.collection("trips").where("previousTripId", "==", tripRef.id));
        const nextTripEligible = next.docs.some(doc => doc.data().driverId === principal.userId && doc.data().released === true && !doc.data().held);
        const deliveredCount = stops.filter(s => ["delivered", "partial"].includes(s.status)).length;
        tx.update(tripRef, { status: "completed", closedAt: now, resolvedCount: stops.length, stopsCompleted: deliveredCount });
        result = { tripStatus: "completed", resolvedCount: stops.length, deliveredCount, nextTripEligible };
      } else if (["trip_issue", "delivery_issue"].includes(op.type)) {
        const input = z.object({ reason: z.string().trim().min(1).max(1000),
          category: z.enum(["breakdown", "delay", "closed", "access", "refused", "other"]), parkedAcknowledged: z.literal(true) }).strict().parse(op.payload);
        requireVersion(trip.assignmentVersion, op.concurrency.assignmentVersion, "Assignment");
        if (op.stopId) ensure(stops.some(s => s.stopId === op.stopId), 403, "forbidden", "The stop is outside your route.");
        tx.create(db.collection("exceptions").doc(key), { exceptionId: key, tripId: tripRef.id, vehicleId: trip.vehicleId, stopId: op.stopId ?? null,
          type: input.category, title: "Driver " + input.category, detail: input.reason, depot: trip.depot, reportedById: principal.userId, resolved: false, createdAt: now });
        if (input.category === "breakdown") tx.update(tripRef, { held: true, status: "held", previousStatus: trip.status, holdReason: input.reason });
        result = { issueId: key, outcome: input.category === "breakdown" ? "held" : "issue_reported" };
      } else if (op.type === "update_acknowledged") {
        requireVersion(trip.routeRevision, op.concurrency.routeRevision, "Route");
        tx.set(db.collection("acknowledgments").doc(key), { userId: principal.userId, tripId: entityId, routeRevision: trip.routeRevision, createdAt: now });
        result = { outcome: "acknowledged" };
      } else if (op.type === "delivery_recorded") {
        const stopDoc = stopsSnap.docs.find(doc => doc.id === op.stopId && doc.data().active !== false);
        ensure(stopDoc, 404, "stop_not_found", "The stop is not on this route.");
        const stop = stopDoc!.data();
        requireVersion(trip.assignmentVersion, op.concurrency.assignmentVersion, "Assignment");
        requireVersion(stop.stopManifestRevision, op.concurrency.stopManifestRevision, "Manifest");
        requireVersion(stop.stopDeliveryVersion ?? 0, op.concurrency.stopDeliveryVersion, "Stop outcome");
        ensure(!trip.held && ["on_route", "returning"].includes(trip.status) && !stop.proofId, 409, "delivery_not_eligible", "Departure must be accepted, holds resolved and the stop unresolved.");
        ensure(stop.orderId && Array.isArray(stop.lines) && stop.lines.length > 0, 409, "manifest_incomplete", "Operations must provide a complete linked manifest.");
        const orderRef = db.collection("orders").doc(identifier(stop.orderId));
        const order = row(await tx.get(orderRef));
        requireVersion(order.fulfillmentVersion ?? 0, (op.concurrency.orderFulfillmentVersions as RecordData | undefined)?.[stop.orderId], "Order fulfillment");
        ensure(order.tripId === tripRef.id && order.outletId === stop.outletId, 409, "linkage_changed", "The order linkage changed.");
        const proof = validateProof(stop.lines, op.payload, trip.evidencePolicy ?? evidencePolicy);
        const proofRef = db.collection("proofs").doc(proof.proofId);
        ensure(!(await tx.get(proofRef)).exists, 409, "proof_exists", "This proof identifier already exists.");
        const media = await Promise.all(proof.evidenceIds.map(id => tx.get(db.collection("evidence").doc(id))));
        for (const file of media) ensure(file.exists && file.data()!.ownerId === principal.userId && file.data()!.stopId === stopDoc!.id &&
          file.data()!.tripId === tripRef.id && file.data()!.status === "finalized" && file.data()!.purpose === "proof", 422, "evidence_not_ready", "Finalize authorized delivery evidence first.");
        const status = proof.outcome === "full" ? "delivered" : proof.outcome;
        tx.create(proofRef, { ...proof, proofId: proof.proofId, tripId: tripRef.id, stopId: stopDoc!.id, orderId: stop.orderId,
          userId: principal.userId, originalConcurrency: op.concurrency, observedAt: op.observedAt, receivedAt: now, version: 1 });
        tx.update(stopDoc!.ref, { status, proofId: proof.proofId, deliveredLines: proof.lines, stopDeliveryVersion: (stop.stopDeliveryVersion ?? 0) + 1, deliveredAt: now });
        tx.update(orderRef, { status, proofId: proof.proofId, proofVersion: 1, deliveredLines: proof.lines,
          fulfillmentVersion: (order.fulfillmentVersion ?? 0) + 1, deliveredAt: now });
        const resolved = stops.filter(s => s.proofId).length + 1;
        const delivered = stops.filter(s => ["delivered", "partial"].includes(s.status)).length + (["full", "partial"].includes(proof.outcome) ? 1 : 0);
        tx.update(tripRef, { resolvedCount: resolved, stopsCompleted: delivered, progressVersion: (trip.progressVersion ?? 0) + 1,
          status: resolved === stops.length ? "returning" : "on_route" });
        entityId = stopDoc!.id; result = { proofId: proof.proofId, orderId: stop.orderId, outcome: proof.outcome };
        versions = { stopDeliveryVersion: (stop.stopDeliveryVersion ?? 0) + 1, orderFulfillmentVersion: (order.fulfillmentVersion ?? 0) + 1 };
        event = { type: "delivery_recorded", entityId: stop.orderId, ...eventScope(principal, order, trip) };
      } else throw new ApiError(422, "unsupported_operation", "This operation is not supported.");
      if (!event.type) event = { type: op.type, entityId, ...eventScope(principal, undefined, trip) };
    }
    const receipt = { operationId: op.operationId, status: "accepted", entityId, versions, serverReceivedAt: now, ...result };
    tx.create(opRef, { userId: principal.userId, operationId: op.operationId, payloadHash, operation: op, receipt });
    domainEvent(tx, key, event);
    return receipt;
  });
}
export async function operationResult(principal: Principal, operationId: string) {
  const op = row(await db.collection("mobile_operations").doc(operationKey(principal.userId, operationId)).get());
  return op.receipt;
}
export async function deliveryNote(principal: Principal, orderId: string) {
  const order = await orderDetail(principal, orderId);
  ensure(order.receiptId, 409, "note_not_ready", "Confirm receipt before opening the server-confirmed note.");
  const receipt = row(await db.collection("receipts").doc(order.receiptId).get());
  const proof = row(await db.collection("proofs").doc(order.proofId).get());
  ensure(proof.orderId === orderId, 409, "proof_linkage_changed", "Operations must review this delivery note linkage.");
  return { reference: order.noteReference, orderId, outletId: order.outletId, proofId: order.proofId, receiptId: order.receiptId,
    issuedAt: order.receiptConfirmedAt, revision: order.receiptVersion, orderedLines: order.lines,
    approvedLines: order.approvedLines ?? order.lines, deliveredLines: order.deliveredLines, acceptedLines: receipt.lines,
    evidenceIds: proof.evidenceIds ?? [], recipientName: proof.recipientName ?? "", deliveredAt: proof.receivedAt,
    issueId: order.lastIssueId ?? null, discrepancy: receipt.discrepancy };
}
export async function publishPendingEvents(limit = 50) {
  const events = await db.collection("domain_events").where("published", "==", false).limit(limit).get();
  for (const eventDoc of events.docs) {
    const event = eventDoc.data();
    const users = await db.collection("users").get();
    const recipients = users.docs.filter(doc => {
      const user = doc.data();
      return user.enabled !== false && (doc.id === event.driverId ||
        (user.role === "store_manager" && !!event.outletId && user.outletId === event.outletId) ||
        (["dispatcher", "loader"].includes(user.role) && !!event.depot && user.depot === event.depot));
    });
    await db.runTransaction(async tx => {
      const notificationRefs = recipients.map(user => db.collection("notifications").doc(digest([eventDoc.id, user.id])));
      const existing = await Promise.all(notificationRefs.map(ref => tx.get(ref)));
      const counters = await Promise.all(recipients.map(user => tx.get(db.collection("notification_counters").doc(user.id))));
      existing.forEach((snapshot, index) => {
        if (!snapshot.exists) tx.create(notificationRefs[index], { notificationId: notificationRefs[index].id, eventId: eventDoc.id,
          userId: recipients[index].id, entityId: event.entityId, type: event.type, createdAt: event.createdAt,
          sequence: (counters[index].data()?.sequence ?? 0) + 1,
          recipientRole: recipients[index].data().role, recipientOutletId: recipients[index].data().outletId ?? null,
          recipientDepot: recipients[index].data().depot ?? null,
          message: event.type.replaceAll("_", " ") + " · " + event.entityId, read: false });
        if (!snapshot.exists) tx.set(counters[index].ref, { sequence: (counters[index].data()?.sequence ?? 0) + 1 });
      });
      tx.update(eventDoc.ref, { published: true, publishedAt: new Date().toISOString() });
    });
  }
  return events.size;
}
export async function notifications(principal: Principal, after?: string) {
  await publishPendingEvents();
  const found = await db.collection("notifications").where("userId", "==", principal.userId).get();
  const all = found.docs.map(doc => ({ ...doc.data(), notificationId: doc.id })).filter((n: RecordData) => n.recipientRole === principal.role &&
    n.recipientOutletId === principal.outletId && n.recipientDepot === principal.depot) as RecordData[];
  all.sort((a, b) => a.sequence - b.sequence);
  const filtered = after ? all.filter(n => n.sequence > Number(after)) : all;
  const page = filtered.slice(0, 100);
  return { notifications: page, cursor: page.length ? String(page.at(-1)!.sequence) : after ?? null,
    hasMore: filtered.length > page.length };
}
export async function markRead(principal: Principal, id: string) {
  const ref = db.collection("notifications").doc(identifier(id));
  await db.runTransaction(async tx => {
    const notification = row(await tx.get(ref));
    ensure(notification.userId === principal.userId, 403, "forbidden", "This update belongs to another account.");
    ensure(notification.recipientRole === principal.role && notification.recipientOutletId === principal.outletId && notification.recipientDepot === principal.depot, 403, "scope_changed", "This update belongs to an earlier account scope.");
    const counterRef = db.collection("notification_counters").doc(principal.userId);
    const counter = await tx.get(counterRef);
    if (notification.read) return;
    const sequence = (counter.data()?.sequence ?? 0) + 1;
    tx.update(ref, { read: true, sequence });
    tx.set(counterRef, { sequence });
  });
  return { status: "accepted" };
}
export async function reviewConflict(principal: Principal, operationId: string, input: unknown) {
  const parsed = z.object({ operation: operationSchema, reason: z.string().trim().min(1).max(1000) }).strict().parse(input);
  ensure(parsed.operation.operationId === operationId, 422, "invalid_operation", "The review does not match the saved operation.");
  const op = parsed.operation;
  const key = operationKey(principal.userId, operationId);
  const trip = row(await db.collection("trips").doc(identifier(op.tripId)).get());
  requireRole(principal, "driver");
  const history = trip.assignmentHistory ?? [];
  ensure(trip.driverId === principal.userId || history.some((h: RecordData) => h.driverId === principal.userId &&
    h.assignmentVersion === op.concurrency.assignmentVersion), 403, "no_historical_assignment", "Operations must recover proof for this assignment.");
  const stop = row(await db.collection("trip_stops").doc(identifier(op.stopId)).get());
  ensure(stop.tripId === trip.tripId, 403, "forbidden", "Review must reference the original trip.");
  await db.runTransaction(async tx => {
    const ref = db.collection("conflict_reviews").doc(key);
    const old = await tx.get(ref);
    if (old.exists) {
      ensure(old.data()!.payloadHash === digest(op), 409, "review_changed", "Original proof must remain unchanged.");
      return;
    }
    tx.create(ref, { reviewId: key, userId: principal.userId, operationId, operation: op, payloadHash: digest(op),
      reason: parsed.reason, tripId: op.tripId, stopId: op.stopId, depot: trip.depot, status: "awaiting_operations", createdAt: new Date().toISOString() });
    domainEvent(tx, "review-" + key, { type: "conflict_review_requested", entityId: key, depot: trip.depot, driverId: principal.userId, outletId: null });
  });
  return { reviewId: key, status: "awaiting_operations" };
}
export async function conflictDetail(principal: Principal, operationId: string) {
  const review = row(await db.collection("conflict_reviews").doc(operationKey(principal.userId, operationId)).get());
  ensure(review.userId === principal.userId, 403, "forbidden", "This review belongs to another account.");
  const stop = row(await db.collection("trip_stops").doc(review.stopId).get());
  // Return only the original stop's permitted comparison; no replacement-driver route.
  return { reviewId: review.reviewId, status: review.status, resolution: review.resolution ?? null, receipt: review.receipt ?? null,
    canonical: { stopId: stop.stopId, lines: stop.lines, stopManifestRevision: stop.stopManifestRevision,
      stopDeliveryVersion: stop.stopDeliveryVersion, status: stop.status }, original: review.operation };
}
