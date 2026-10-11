import { businessDate, requireRole } from "@/lib/mobile/domain";
import { webRoute } from "@/lib/mobile/web";
import { db } from "@/lib/db/firebase";

// Derive today's health strip from the same canonical records as the trip table.
export const GET = webRoute(async (_req, _params, principal) => {
  requireRole(principal, "dispatcher");
  const depot = principal.depot!, today = businessDate();
  const [tripsSnap, exceptionsSnap, ordersSnap, vehiclesSnap, driversSnap] = await Promise.all([
    db.collection("trips").where("depot", "==", depot).where("planDate", "==", today).get(),
    db.collection("exceptions").where("depot", "==", depot).where("resolved", "==", false).get(),
    db.collection("orders").where("depot", "==", depot).where("planDate", "==", today).get(),
    db.collection("vehicles").where("depot", "==", depot).get(),
    db.collection("users").where("depot", "==", depot).where("role", "==", "driver").get(),
  ]);
  const trips = tripsSnap.docs.map(d => ({...d.data(), tripId: d.id}));
  const currentTrips = trips.filter((t: any) => t.status !== "cancelled");
  const drivers = driversSnap.docs.filter(d => d.data().enabled !== false && !["disabled", "invited"].includes(d.data().accountStatus));
  const driverIds = new Set(drivers.map(d => d.id));
  const severity: Record<string, number> = {critical: 0, high: 1, medium: 2, low: 3};
  const exceptions = exceptionsSnap.docs.map(d => ({...d.data(), exceptionId: d.id})).sort((a: any, b: any) =>
    (severity[a.severity] ?? 9) - (severity[b.severity] ?? 9) || Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const metrics = {
    ordersToPlan: ordersSnap.docs.filter(d => !d.data().tripId && ["pending", "needs_deferral"].includes(d.data().status)).length,
    tripsPlanned: currentTrips.length,
    tripsTotal: currentTrips.length,
    fleetActive: new Set(currentTrips.map((t: any) => t.vehicleId)).size,
    fleetTotal: vehiclesSnap.size,
    driversIn: new Set(currentTrips.map((t: any) => t.driverId).filter(id => driverIds.has(id))).size,
    driversTotal: drivers.length,
    activeExceptions: exceptions.length,
  };
  return {metrics, trips, exceptions};
});
