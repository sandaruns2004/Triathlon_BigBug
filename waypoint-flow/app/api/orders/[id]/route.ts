import {db} from "@/lib/db/firebase";
import {webRoute} from "@/lib/mobile/web";
import {identifier} from "@/lib/mobile/errors";
import {ensure,assertOrderOwner,requireRole} from "@/lib/mobile/domain";
export const GET=webRoute(async(_req,params,p)=>{
  const doc=await db.collection("orders").doc(identifier(params.id)).get();
  ensure(doc.exists,404,"not_found","Order not found.");const order=doc.data()!;
  if(p.role==="store_manager")assertOrderOwner(p,order);
  else{requireRole(p,"dispatcher","loader");ensure(order.depot===p.depot,403,"forbidden","This order belongs to another depot.");}
  return {order:{...order,orderId:doc.id}};
});
