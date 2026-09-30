import { webRoute } from "@/lib/mobile/web";
import { reportShortfall } from "@/lib/mobile/operations";
export const POST = webRoute(async (req, _params, principal) => {
  const input = await req.json();
  return reportShortfall(principal, { tripId: input.tripId, stopId: input.stopId, detail: input.detail, evidenceIds: input.evidenceIds ?? [] });
});
