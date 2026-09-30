import { webRoute } from "@/lib/mobile/web";
import { storeOrders, applyOperation } from "@/lib/mobile/service";
export const dynamic = "force-dynamic";
export const GET = webRoute(async (_req, _params, principal) => ({ orders: await storeOrders(principal) }));
export const POST = webRoute(async (req, _params, principal) => ({ success: true, ...await applyOperation(principal, { ...await req.json(), type: "store_order_created" }) }));
