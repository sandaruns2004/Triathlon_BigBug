import { db } from "@/lib/db/firebase";
import type { Principal } from "@/lib/auth/credentials";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { identifier, ApiError } from "./errors";
import { ensure, requireRole, addDays, businessDate, digest, validateProof, requireVersion, evidencePolicy, type RecordData } from "./domain";
import { writeAudit } from "./audit";

function requireDepot(principal: Principal, record: RecordData) {
  ensure(principal.depot && principal.depot === record.depot, 403, "forbidden", "This work belongs to another depot.");
}
function event(tx: FirebaseFirestore.Transaction, principal: Principal, type: string, entityId: string, depot: string, outletId: string | null = null, driverId: string | null = null) {
  const eventId = randomUUID();
  tx.create(db.collection("domain_events").doc(eventId), { eventId, type, entityId, depot, outletId, driverId,
    published: false, createdAt: new Date().toISOString() });
  writeAudit(tx, principal, { action: type, entityType: "operation", entityId, depot, outletId });
}
export async function assignTrip(principal: Principal, tripId: string, input: unknown) {
  requireRole(principal, "dispatcher");
  const body = z.object({ driverId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/), reason: z.string().trim().min(1).max(500) }).strict().parse(input);
  await db.runTransaction(async tx => {
    const ref = db.collection("trips").doc(identifier(tripId));
    const doc = await tx.get(ref); ensure(doc.exists, 404, "not_found", "Trip not found.");
    const trip = doc.data()!; requireDepot(principal, trip);
    ensure(!["on_route", "returning", "completed"].includes(trip.status), 409, "hold_before_reassignment", "Hold active work before reassignment.");
    const driver = await tx.get(db.collection("users").doc(body.driverId));
    ensure(driver.exists && driver.data()!.role === "driver" && driver.data()!.enabled !== false && !["invited", "disabled"].includes(driver.data()!.accountStatus) && driver.data()!.depot === trip.depot, 422, "invalid_driver", "Choose an enabled Driver from this depot.");
    const version = (trip.assignmentVersion ?? 0) + 1;
    const history = [...(trip.assignmentHistory ?? [])];
    if (trip.driverId) history.push({ driverId: trip.driverId, assignmentVersion: trip.assignmentVersion ?? 0, released: trip.released ?? false, endedAt: new Date().toISOString() });
    tx.update(ref, { driverId: body.driverId, driverName: driver.data()!.name, assignmentVersion: version, assignmentHistory: history,
      assignmentReason: body.reason, assignedAt: new Date().toISOString(), assignedBy: principal.userId });
    event(tx, principal, "trip_assigned", tripId, trip.depot, null, body.driverId);
  });
  return { status: "accepted" };
}
export async function loadStop(principal: Principal, stopId: string) {
  requireRole(principal, "loader");
  let allLoaded = false;
  await db.runTransaction(async tx => {
    const ref = db.collection("trip_stops").doc(identifier(stopId));
    const stopDoc = await tx.get(ref); ensure(stopDoc.exists, 404, "not_found", "Stop not found.");
    const stop = stopDoc.data()!;
    const tripRef = db.collection("trips").doc(stop.tripId);
    const trip = (await tx.get(tripRef)).data(); ensure(trip, 404, "not_found", "Trip not found.");
    requireDepot(principal, trip!);
    ensure(!trip!.holdKind || trip!.holdKind === "shortfall", 409, "operations_hold", "Operations must resolve the route hold before loading.");
    ensure(["planned", "loading", "ready_to_depart"].includes(trip!.status), 409, "loading_closed", "Loading cannot change a departed trip.");
    ensure(stop.active !== false && !stop.shortfallOpen && stop.orderId && Array.isArray(stop.lines) && stop.lines.length > 0, 409, "manifest_unresolved", "Resolve shortfall and provide complete manifest lines before loading.");
    const stops = await tx.get(db.collection("trip_stops").where("tripId", "==", stop.tripId));
    allLoaded = stops.docs.filter(d => d.data().active !== false).every(d => d.id === stopId || (d.data().loadingState === "loaded" && !d.data().shortfallOpen));
    tx.update(ref, { status: "loaded", loadingState: "loaded", loadedAt: new Date().toISOString(), loadedById: principal.userId });
    tx.update(tripRef, { status: allLoaded ? "ready_to_depart" : "loading", released: allLoaded, held: false,
      releaseVersion: (trip!.releaseVersion ?? 0) + (allLoaded && !trip!.released ? 1 : 0) });
    event(tx, principal, allLoaded ? "trip_released" : "loading_updated", stop.tripId, trip!.depot, null, trip!.driverId ?? null);
  });
  return { success: true, allLoaded };
}
export async function reportShortfall(principal: Principal, input: unknown) {
  requireRole(principal, "loader");
  const body = z.object({ tripId: z.string(), stopId: z.string(), detail: z.string().trim().min(1).max(1000), evidenceIds: z.array(z.string().uuid()).max(3).default([]) }).strict().parse(input);
  const exceptionId = randomUUID();
  await db.runTransaction(async tx => {
    const tripRef = db.collection("trips").doc(identifier(body.tripId));
    const stopRef = db.collection("trip_stops").doc(identifier(body.stopId));
    const [tripDoc, stopDoc] = await Promise.all([tx.get(tripRef), tx.get(stopRef)]);
    ensure(tripDoc.exists && stopDoc.exists && stopDoc.data()!.tripId === body.tripId, 404, "not_found", "Trip/stop not found.");
    const trip = tripDoc.data()!; requireDepot(principal, trip);
    ensure(!trip.holdKind || trip.holdKind === "shortfall", 409, "operations_hold", "Operations must resolve the route hold first.");
    ensure(["planned", "loading", "ready_to_depart"].includes(trip.status), 409, "loading_closed", "Contact operations about an already departed trip.");
    const evidence = await Promise.all(body.evidenceIds.map(id => tx.get(db.collection("evidence").doc(id))));
    ensure(evidence.every(d => d.exists && d.data()!.ownerId === principal.userId && d.data()!.purpose === "shortfall" && d.data()!.stopId === body.stopId && d.data()!.status === "finalized"), 422, "evidence_not_ready", "Finalize authorized loading evidence first.");
    ensure(!stopDoc.data()!.shortfallOpen, 409, "shortfall_already_reported", "This stop already has an unresolved shortfall.");
    tx.create(db.collection("exceptions").doc(exceptionId), { exceptionId, type: "shortfall", title: "Loading shortfall", detail: body.detail,
      tripId: body.tripId, stopId: body.stopId, evidenceIds: body.evidenceIds, vehicleId: trip.vehicleId, depot: trip.depot, resolved: false, reportedById: principal.userId, createdAt: new Date().toISOString() });
    tx.update(stopRef, { shortfallOpen: true, shortfallId: exceptionId, loadingState: "shortfall", status: "shortfall_reported" });
    tx.update(tripRef, { held: true, holdKind: "shortfall", released: false, status: "loading", releaseVersion: (trip.releaseVersion ?? 0) + 1 });
    event(tx, principal, "loading_shortfall", body.tripId, trip.depot, null, trip.driverId ?? null);
  });
  return { success: true, exceptionId };
}
export async function resolveShortfall(principal: Principal, exceptionId: string, input: unknown) {
  requireRole(principal, "dispatcher");
  const body = z.object({ reason: z.string().trim().min(1).max(1000),
    quantities: z.record(z.string(), z.number().int().nonnegative()) }).strict().parse(input);
  await db.runTransaction(async tx => {
    const exRef = db.collection("exceptions").doc(identifier(exceptionId));
    const exDoc = await tx.get(exRef); ensure(exDoc.exists && exDoc.data()!.type === "shortfall", 404, "not_found", "Shortfall not found.");
    const ex = exDoc.data()!; requireDepot(principal, ex);
    ensure(!ex.resolved, 409, "already_resolved", "This shortfall is already resolved.");
    const tripRef = db.collection("trips").doc(ex.tripId);
    const stopRef = db.collection("trip_stops").doc(ex.stopId);
    const [tripDoc, stopDoc] = await Promise.all([tx.get(tripRef), tx.get(stopRef)]);
    const trip = tripDoc.data()!, stop = stopDoc.data()!;
    const orderRef = db.collection("orders").doc(identifier(stop.orderId));
    const order = (await tx.get(orderRef)).data(); ensure(order, 404, "not_found", "Linked order not found.");
    const all = await tx.get(db.collection("trip_stops").where("tripId", "==", ex.tripId));
    const lines = (stop.lines ?? []) as RecordData[];
    ensure(lines.length > 0 && Object.keys(body.quantities).length === lines.length, 422, "invalid_lines", "Review each approved line.");
    const approved = lines.map(line => {
      const quantity = body.quantities[line.lineId];
      ensure(Number.isInteger(quantity) && quantity >= 0 && quantity <= line.quantity, 422, "invalid_quantity", "Adjusted quantities cannot exceed approved goods.");
      return { ...line, quantity };
    });
    const allLoaded = all.docs.filter(doc => doc.data().active !== false).every(doc => doc.id === ex.stopId || (doc.data().loadingState === "loaded" && !doc.data().shortfallOpen));
    const otherShortfall = all.docs.some(doc => doc.id !== ex.stopId && doc.data().shortfallOpen);
    tx.update(stopRef, { lines: approved, stopManifestRevision: (stop.stopManifestRevision ?? 0) + 1, shortfallOpen: false,
      loadingState: "loaded", status: "loaded", resolutionNote: body.reason });
    tx.update(orderRef, { approvedLines: approved, fulfillmentVersion: (order!.fulfillmentVersion ?? 0) + 1, shortfallReason: body.reason });
    tx.update(exRef, { resolved: true, resolvedById: principal.userId, resolution: body.reason, resolvedAt: new Date().toISOString() });
    tx.update(tripRef, { routeRevision: (trip.routeRevision ?? 0) + 1, held: otherShortfall, holdKind: otherShortfall ? "shortfall" : null,
      status: allLoaded ? "ready_to_depart" : "loading", released: allLoaded, releaseVersion: (trip.releaseVersion ?? 0) + 1 });
    event(tx, principal, "shortfall_resolved", stop.orderId, trip.depot, stop.outletId, trip.driverId ?? null);
  });
  return { status: "accepted" };
}
export async function deferOrder(principal: Principal, orderId: string, input: unknown) {
  requireRole(principal, "dispatcher");
  const body = z.object({ reason: z.string().trim().min(1).max(1000), revisedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).strict().parse(input);
  await db.runTransaction(async tx => {
    const ref = db.collection("orders").doc(identifier(orderId));
    const doc = await tx.get(ref); ensure(doc.exists, 404, "not_found", "Order not found.");
    const order = doc.data()!; requireDepot(principal, order);
    ensure(!order.proofId && !["on_route", "delivered", "partial", "receipt_confirmed"].includes(order.status), 409, "deferral_not_eligible", "Do not defer goods already in transit or delivered.");
    const revisedDate = body.revisedDate ?? addDays(businessDate(), 1);
    ensure(revisedDate > businessDate() && !Number.isNaN(Date.parse(revisedDate + "T00:00:00Z")), 422, "invalid_date", "Choose a future proposed date.");
    if (order.tripId) {
      const tripRef = db.collection("trips").doc(order.tripId);
      const tripDoc = await tx.get(tripRef);
      ensure(tripDoc.exists && !["on_route", "returning", "completed"].includes(tripDoc.data()!.status), 409, "trip_departed", "Operations must resolve the active route first.");
      tx.update(tripRef, { held: true, holdKind: "route_replan", released: false, status: "loading", holdReason: "Deferred order needs route replanning", releaseVersion: (tripDoc.data()!.releaseVersion ?? 0) + 1 });
    }
    tx.update(ref, { status: "deferred", deferralReason: body.reason, revisedDate, proposedDate: revisedDate, planDate: revisedDate,
      history: [...(order.history ?? []), { type: "deferred", reason: body.reason, proposedDate: revisedDate, actorId: principal.userId, at: new Date().toISOString() }],
      updateVersion: (order.updateVersion ?? 0) + 1, deferredConfirmedAt: new Date().toISOString() });
    event(tx, principal, "order_deferred", orderId, order.depot, order.outletId);
  });
  return { success: true };
}
export async function resolveHold(principal: Principal, tripId: string, input: unknown) {
  requireRole(principal, "dispatcher");
  const body = z.object({ reason: z.string().trim().min(1).max(1000) }).strict().parse(input);
  await db.runTransaction(async tx => {
    const ref = db.collection("trips").doc(identifier(tripId));
    const doc = await tx.get(ref); ensure(doc.exists, 404, "not_found", "Trip not found.");
    const trip = doc.data()!; requireDepot(principal, trip);
    const stops = await tx.get(db.collection("trip_stops").where("tripId", "==", tripId));
    ensure(trip.status === "held" && !stops.docs.some(d => d.data().shortfallOpen), 409, "hold_not_eligible", "Resolve loading/route prerequisites first.");
    tx.update(ref, { held: false, status: trip.previousStatus === "returning" ? "returning" : "on_route", holdResolution: body.reason,
      holdResolvedBy: principal.userId, holdResolvedAt: new Date().toISOString() });
    event(tx, principal, "hold_resolved", tripId, trip.depot, null, trip.driverId);
  });
  return { status: "accepted" };
}
export async function restoreOrder(principal: Principal, orderId: string, input: unknown) {
  requireRole(principal, "dispatcher");
  const body=z.object({reason:z.string().trim().min(1).max(1000),serviceDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}).strict().parse(input);
  ensure(body.serviceDate>=businessDate()&&!Number.isNaN(Date.parse(body.serviceDate+"T00:00:00Z")),422,"invalid_date","Choose today or a future planning date.");
  await db.runTransaction(async tx=>{
    const orderRef=db.collection("orders").doc(identifier(orderId)),orderDoc=await tx.get(orderRef);
    ensure(orderDoc.exists,404,"not_found","Order not found.");
    const order=orderDoc.data()!;requireDepot(principal,order);
    ensure(order.status==="deferred"&&!order.proofId,409,"restore_not_eligible","Only an undelivered deferred order can return to planning.");
    let previousTrip:FirebaseFirestore.DocumentSnapshot|undefined,stops:FirebaseFirestore.QuerySnapshot|undefined;
    if(order.tripId){
      previousTrip=await tx.get(db.collection("trips").doc(order.tripId));
      ensure(previousTrip.exists&&previousTrip.data()!.depot===principal.depot&&previousTrip.data()!.holdKind==="route_replan",409,"route_changed","Resolve the original route hold first.");
      stops=await tx.get(db.collection("trip_stops").where("tripId","==",order.tripId));
    }
    if(stops&&previousTrip){
      const removed=stops.docs.filter(d=>d.data().orderId===orderId&&d.data().active!==false);
      const remaining=stops.docs.filter(d=>d.data().orderId!==orderId&&d.data().active!==false);
      ensure(removed.every(d=>!d.data().proofId),409,"proof_exists","Do not remove a delivered stop.");
      for(const stop of removed)tx.update(stop.ref,{active:false,status:"deferred",retiredReason:body.reason,retiredAt:new Date().toISOString()});
      const released=remaining.length>0&&remaining.every(d=>d.data().loadingState==="loaded"&&!d.data().shortfallOpen);
      tx.update(previousTrip.ref,{routeRevision:(previousTrip.data()!.routeRevision??0)+1,releaseVersion:(previousTrip.data()!.releaseVersion??0)+1,
        stopCount:remaining.length,held:remaining.some(d=>d.data().shortfallOpen),holdKind:remaining.some(d=>d.data().shortfallOpen)?"shortfall":null,
        released,status:remaining.length===0?"cancelled":released?"ready_to_depart":"loading"});
      event(tx,principal,"route_updated",previousTrip.id,principal.depot!,null,previousTrip.data()!.driverId??null);
    }
    tx.update(orderRef,{status:"pending",tripId:null,stopId:null,planId:null,planDate:body.serviceDate,revisedDate:body.serviceDate,
      fulfillmentVersion:(order.fulfillmentVersion??0)+1,updateVersion:(order.updateVersion??0)+1,
      history:[...(order.history??[]),{type:"restored_to_planning",reason:body.reason,serviceDate:body.serviceDate,actorId:principal.userId,at:new Date().toISOString()}]});
    event(tx,principal,"order_restored",orderId,principal.depot!,order.outletId);
  });
  return {status:"accepted"};
}
export async function approveReview(principal: Principal, reviewId: string, input: unknown) {
  requireRole(principal,"dispatcher");
  const body=z.object({reason:z.string().trim().min(1).max(1000),stopManifestRevision:z.number().int(),
    stopDeliveryVersion:z.number().int(),proof:z.unknown()}).strict().parse(input);
  const decisionHash=digest(body);
  return db.runTransaction(async tx=>{
    const reviewRef=db.collection("conflict_reviews").doc(identifier(reviewId)),reviewDoc=await tx.get(reviewRef);
    ensure(reviewDoc.exists,404,"not_found","Review not found.");const review=reviewDoc.data()!;requireDepot(principal,review);
    if(review.status==="approved_amendment"){ensure(review.decisionHash===decisionHash,409,"decision_changed","Keep the original approved amendment.");return review.receipt;}
    ensure(review.status==="awaiting_operations"&&review.operation.type==="delivery_recorded",409,"review_not_eligible","This review cannot amend a delivery.");
    const stopRef=db.collection("trip_stops").doc(identifier(review.stopId)),tripRef=db.collection("trips").doc(identifier(review.tripId));
    const [stopDoc,tripDoc]=await Promise.all([tx.get(stopRef),tx.get(tripRef)]);
    ensure(stopDoc.exists&&tripDoc.exists&&stopDoc.data()!.tripId===tripRef.id&&tripDoc.data()!.depot===principal.depot,403,"forbidden","Review linkage changed.");
    const stop=stopDoc.data()!,trip=tripDoc.data()!;
    requireVersion(stop.stopManifestRevision,body.stopManifestRevision,"Approved manifest");
    requireVersion(stop.stopDeliveryVersion??0,body.stopDeliveryVersion,"Stop outcome");
    ensure(stop.active!==false&&!stop.proofId&&["on_route","returning","held"].includes(trip.status),409,"proof_already_exists","Only an unresolved active stop can receive an approved amendment.");
    const orderRef=db.collection("orders").doc(identifier(stop.orderId)),orderDoc=await tx.get(orderRef);
    ensure(orderDoc.exists&&orderDoc.data()!.tripId===tripRef.id&&orderDoc.data()!.outletId===stop.outletId&&!orderDoc.data()!.proofId,409,"order_changed","Review the current linked order first.");
    const proof=validateProof(stop.lines,body.proof,trip.evidencePolicy??evidencePolicy);
    const proofRef=db.collection("proofs").doc(proof.proofId);
    ensure(!(await tx.get(proofRef)).exists,409,"proof_exists","This amendment identifier already exists.");
    const media=await Promise.all(proof.evidenceIds.map(id=>tx.get(db.collection("evidence").doc(id))));
    ensure(media.every(d=>d.exists&&d.data()!.ownerId===review.userId&&d.data()!.stopId===stopDoc.id&&
      d.data()!.status==="finalized"&&["proof","conflict_review"].includes(d.data()!.purpose)),422,"evidence_not_ready","Original authorized review evidence must be verified first.");
    const stops=await tx.get(db.collection("trip_stops").where("tripId","==",tripRef.id));
    const active=stops.docs.filter(d=>d.data().active!==false);
    const resolved=active.filter(d=>d.data().proofId).length+1;
    const delivered=active.filter(d=>["delivered","partial"].includes(d.data().status)).length+(["full","partial"].includes(proof.outcome)?1:0);
    const status=proof.outcome==="full"?"delivered":proof.outcome;
    const receivedAt=new Date().toISOString();
    tx.create(proofRef,{...proof,tripId:tripRef.id,stopId:stopDoc.id,orderId:orderRef.id,userId:review.userId,version:1,
      observedAt:review.operation.observedAt,receivedAt,originalOperationId:review.operationId,reviewId,approvedById:principal.userId,amendmentReason:body.reason});
    tx.update(stopRef,{proofId:proof.proofId,status,deliveredLines:proof.lines,stopDeliveryVersion:(stop.stopDeliveryVersion??0)+1,deliveredAt:receivedAt});
    tx.update(orderRef,{proofId:proof.proofId,status,proofVersion:1,deliveredLines:proof.lines,fulfillmentVersion:(orderDoc.data()!.fulfillmentVersion??0)+1,deliveredAt:receivedAt});
    tx.update(tripRef,{resolvedCount:resolved,stopsCompleted:delivered,progressVersion:(trip.progressVersion??0)+1,
      ...(trip.held?{}:{status:resolved===active.length?"returning":"on_route"})});
    const receipt={reviewId,status:"approved_amendment",proofId:proof.proofId,orderId:orderRef.id,approvedById:principal.userId,receivedAt};
    tx.update(reviewRef,{status:"approved_amendment",resolution:body.reason,decisionHash,receipt,resolvedById:principal.userId,resolvedAt:receivedAt});
    event(tx,principal,"delivery_amended",orderRef.id,principal.depot!,stop.outletId,trip.driverId);
    event(tx,principal,"review_resolved",reviewId,principal.depot!,null,review.userId);
    return receipt;
  });
}
export async function resolveReview(principal: Principal, reviewId: string, input: unknown) {
  requireRole(principal, "dispatcher");
  const body = z.object({ reason: z.string().trim().min(1).max(1000), decision: z.enum(["retain_for_audit", "request_followup"]) }).strict().parse(input);
  await db.runTransaction(async tx => {
    const ref = db.collection("conflict_reviews").doc(identifier(reviewId));
    const doc = await tx.get(ref); ensure(doc.exists, 404, "not_found", "Review not found.");
    const review = doc.data()!; requireDepot(principal, review);
    ensure(review.status === "awaiting_operations", 409, "already_resolved", "This review is already resolved.");
    // Reviewing evidence never silently overwrites canonical delivery or marks the original operation accepted.
    tx.update(ref, { status: body.decision, resolution: body.reason, resolvedById: principal.userId, resolvedAt: new Date().toISOString() });
    event(tx, principal, "review_resolved", reviewId, review.depot, null, review.userId);
  });
  return { status: "accepted" };
}
