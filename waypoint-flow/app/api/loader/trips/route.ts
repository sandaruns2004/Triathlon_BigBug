import {db} from "@/lib/db/firebase";
import {webRoute} from "@/lib/mobile/web";
import {businessDate,requireRole} from "@/lib/mobile/domain";
export const GET=webRoute(async(_req,_params,p)=>{
  requireRole(p,"loader");
  const snap=await db.collection("trips").where("depot","==",p.depot).where("planDate","==",businessDate()).where("status","in",["planned","loading","ready_to_depart"]).get();
  return {trips:snap.docs.map(d=>({...d.data(),tripId:d.id}))};
});
