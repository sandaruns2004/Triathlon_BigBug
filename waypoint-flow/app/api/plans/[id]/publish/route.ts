import {db} from "@/lib/db/firebase";
import {webRoute} from "@/lib/mobile/web";
import {ensure,requireRole} from "@/lib/mobile/domain";
import {identifier} from "@/lib/mobile/errors";
import {writeAudit} from "@/lib/mobile/audit";
export const PATCH=webRoute(async(_req,params,p)=>{
  requireRole(p,"dispatcher");const ref=db.collection("plans").doc(identifier(params.id));
  await db.runTransaction(async tx=>{
    const plan=await tx.get(ref);ensure(plan.exists&&plan.data()!.depot===p.depot,403,"forbidden","This plan belongs to another depot.");
    ensure(["allocated","published"].includes(plan.data()!.status),409,"plan_not_allocated","Allocate this plan first.");
    const trips=await tx.get(db.collection("trips").where("planId","==",ref.id));
    ensure(trips.docs.length>0&&trips.docs.every(d=>d.data().driverId),409,"assignment_missing","Assign Drivers in Operations control before publishing.");
    if(plan.data()!.status==="published")return;
    const orders=await tx.get(db.collection("orders").where("planId","==",ref.id));
    tx.update(ref,{status:"published",publishedAt:new Date().toISOString()});
    for(const order of orders.docs)tx.create(db.collection("domain_events").doc("publish-"+ref.id+"-"+order.id),{
      type:"plan_published",entityId:order.id,depot:p.depot,outletId:order.data().outletId,driverId:null,
      published:false,createdAt:new Date().toISOString()});
    writeAudit(tx,p,{action:"plan_published",entityType:"plan",entityId:ref.id,depot:p.depot});
  });return {success:true};
});
