import { webRoute } from "@/lib/mobile/web";
import { applyOperation } from "@/lib/mobile/service";
export const POST = webRoute(async (req, params, principal) => {
  const operation = await req.json();
  return { success: true, ...await applyOperation(principal, { ...operation, type: "delivery_recorded", stopId: params.stopId }) };
});
