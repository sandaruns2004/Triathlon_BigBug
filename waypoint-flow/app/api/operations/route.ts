import { db } from "@/lib/db/firebase";
import { webRoute } from "@/lib/mobile/web";
import { ensure, requireRole } from "@/lib/mobile/domain";
import { identifier } from "@/lib/mobile/errors";
import { assignTrip, resolveShortfall, resolveHold, resolveReview, approveReview, deferOrder, restoreOrder } from "@/lib/mobile/operations";
import { auditEntries } from "@/lib/mobile/audit";
import { z } from "zod";

export const GET=webRoute(async (_req,_params,p)=>{
  requireRole(p,"dispatcher");
  const [trips,drivers,exceptions,reviews,orders,audit]=await Promise.all([
    db.collection("trips").where("depot","==",p.depot).get(),
    db.collection("users").where("depot","==",p.depot).where("role","==","driver").get(),
    db.collection("exceptions").where("depot","==",p.depot).where("resolved","==",false).get(),
    db.collection("conflict_reviews").where("depot","==",p.depot).get(),
    db.collection("orders").where("depot","==",p.depot).get(),
    auditEntries(p),
  ]);
  return {trips:await Promise.all(trips.docs.map(async d=>({...d.data(),tripId:d.id,
    stops:(await db.collection("trip_stops").where("tripId","==",d.id).get()).docs.map(s=>({...s.data(),stopId:s.id}))}))),
    drivers:drivers.docs.filter(d=>d.data().enabled!==false&&!d.data().invited).map(d=>({userId:d.id,name:d.data().name})),
    exceptions:exceptions.docs.map(d=>({...d.data(),exceptionId:d.id})),reviews:await Promise.all(reviews.docs.map(async d=>({...d.data(),reviewId:d.id,
      canonical:(await db.collection("trip_stops").doc(d.data().stopId).get()).data()}))),
    orders:orders.docs.filter(d=>["needs_deferral","deferred"].includes(d.data().status)).map(d=>({...d.data(),orderId:d.id})),audit};
});
export const POST=webRoute(async(req,_params,p)=>{
  requireRole(p,"dispatcher");
  const input=z.object({action:z.enum(["assign","resolve_shortfall","resolve_hold","resolve_review","approve_review","defer","restore"]),entityId:z.string(),payload:z.unknown()}).strict().parse(await req.json());
  const id=identifier(input.entityId);
  switch(input.action){
    case "assign":return assignTrip(p,id,input.payload);
    case "resolve_shortfall":return resolveShortfall(p,id,input.payload);
    case "resolve_hold":return resolveHold(p,id,input.payload);
    case "resolve_review":return resolveReview(p,id,input.payload);
    case "approve_review":return approveReview(p,id,input.payload);
    case "defer":return deferOrder(p,id,input.payload);
    case "restore":return restoreOrder(p,id,input.payload);
  }
});
