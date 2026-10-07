import { businessDate } from "@/lib/mobile/domain";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * GET /api/plans/[id]
 * Fetch a specific plan along with available vehicles, unassigned orders, and the trips in the plan.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "dispatcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const depot = (session.user as any).depot ?? "Peliyagoda";
  const today = businessDate();
  const planId = params.id;

  // Run queries in parallel
  const [planSnap, vehiclesSnap, ordersSnap, tripsSnap] = await Promise.all([
    db.collection("plans").doc(planId).get(),
    db.collection("vehicles").where("depot", "==", depot).where("available", "==", true).get(),
    db.collection("orders").where("depot", "==", depot).where("planDate", "==", today).where("tripId", "==", null).get(),
    db.collection("trips").where("planId", "==", planId).get(), // Assuming trips are linked to planId if created via this plan
  ]);

  if (!planSnap.exists) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const plan = planSnap.data();
  // Ensure the plan belongs to the dispatcher's depot
  if (plan?.depot !== depot) {
    return NextResponse.json({ error: "Forbidden: Plan depot mismatch" }, { status: 403 });
  }

  const vehicles = vehiclesSnap.docs.map((d) => d.data());
  const unassignedOrders = ordersSnap.docs.map((d) => d.data());
  const trips = tripsSnap.docs.map((d) => d.data());

  // Fetch stops for the trips to populate the RouteCanvas
  if (trips.length > 0) {
    const stopsSnap = await db.collection("trip_stops")
      .where("tripId", "in", trips.map(t => t.tripId))
      .get();
    
    const stopsByTrip = stopsSnap.docs.reduce((acc, doc) => {
      const data = doc.data();
      if (!acc[data.tripId]) acc[data.tripId] = [];
      // Map properties to match RouteCanvas expectations
      acc[data.tripId].push({
        orderId: data.orderId,
        outletId: data.outletName || data.outletId, // Prefer name if available
        district: plan?.district || "Colombo", // District isn't directly on stop, fallback to a sensible default or fetch if needed
        orderWeightKg: data.expectedKg || 0,
        stopOrder: data.stopOrder
      });
      return acc;
    }, {} as Record<string, any[]>);

    for (const trip of trips) {
      if (stopsByTrip[trip.tripId]) {
        trip.orders = stopsByTrip[trip.tripId].sort((a, b) => a.stopOrder - b.stopOrder);
        // Attempt to get district from trip if possible
        trip.orders.forEach(o => o.district = trip.district || o.district);
      } else {
        trip.orders = [];
      }
    }
  }

  return NextResponse.json({ plan, vehicles, unassignedOrders, trips });
}
