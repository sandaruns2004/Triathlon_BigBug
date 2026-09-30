import { db } from "@/lib/db/firebase";
import { webRoute } from "@/lib/mobile/web";
import { businessDate, requireRole } from "@/lib/mobile/domain";
export const GET=webRoute(async(_req,_params,p)=>{
  requireRole(p,"dispatcher");
  const snap=await db.collection("plans").where("depot","==",p.depot).where("planDate","==",businessDate()).get();
  return {plans:snap.docs.map(d=>({...d.data(),planId:d.id}))};
});
export const POST=webRoute(async(_req,_params,p)=>{
  requireRole(p,"dispatcher");const today=businessDate(),planId="PLAN-"+p.depot!.toUpperCase().slice(0,3)+"-"+today;
  const ref=db.collection("plans").doc(planId);
  const plan=await db.runTransaction(async tx=>{
    const old=await tx.get(ref);if(old.exists)return old.data();
    const value={planId,depot:p.depot,planDate:today,status:"draft",createdBy:p.userId,createdAt:new Date().toISOString(),tripCount:0,deferredCount:0};
    tx.create(ref,value);return value;
  });return {plan};
});
