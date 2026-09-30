import { webRoute } from "@/lib/mobile/web";
import { deferOrder } from "@/lib/mobile/operations";
export const POST = webRoute(async (req, params, principal) => {
  const input = await req.json();
  return deferOrder(principal, params.id, { reason: input.reason, ...(input.revisedDate ? { revisedDate: input.revisedDate } : {}) });
});
