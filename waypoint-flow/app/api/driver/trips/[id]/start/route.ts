import { webRoute } from "@/lib/mobile/web";
import { applyOperation } from "@/lib/mobile/service";
export const POST = webRoute(async (req, params, principal) => {
  const operation = await req.json();
  const result = await applyOperation(principal, { ...operation, type: "trip_start", tripId: params.id });
  return { success: true, ...result };
});
