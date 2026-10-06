import { webRoute } from "@/lib/mobile/web";
import { orderDetail } from "@/lib/mobile/service";
export const dynamic = "force-dynamic";
export const GET = webRoute(async (_req, params, principal) => {
  const { db } = await import("@/lib/db/firebase");
  const exceptionsSnap = await db.collection("exceptions").where("orderId", "==", params.id).orderBy("createdAt", "desc").get();
  const exceptions = exceptionsSnap.docs.map(d => d.data());
  return { 
    order: await orderDetail(principal, params.id),
    exceptions 
  };
});
