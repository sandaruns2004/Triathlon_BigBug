import { webRoute } from "@/lib/mobile/web";
import { driverTrips } from "@/lib/mobile/service";
export const dynamic = "force-dynamic";
export const GET = webRoute(async (_req, _params, principal) => {
  const trips = await driverTrips(principal);
  const trip = trips.find(t => t.status !== "completed") ?? null;
  return { trip, stops: trip?.stops ?? [] };
});
