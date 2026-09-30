import { webRoute } from "@/lib/mobile/web";
import { orderDetail } from "@/lib/mobile/service";
export const dynamic = "force-dynamic";
export const GET = webRoute(async (_req, params, principal) => ({ order: await orderDetail(principal, params.id) }));
