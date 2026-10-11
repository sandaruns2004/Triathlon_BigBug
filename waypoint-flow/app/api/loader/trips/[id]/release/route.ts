import { webRoute } from "@/lib/mobile/web";
import { releaseTrip } from "@/lib/mobile/operations";
export const POST = webRoute(async (req, params, principal) =>
  releaseTrip(principal, params.id, await req.json()));
