import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * GET /api/driver/trip
 * Fetches the active trip for the logged-in driver.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "driver") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const driverName = (session.user as any).name;
  const today = new Date().toISOString().split("T")[0];

  const tripsSnap = await db.collection("trips")
    .where("driverName", "==", driverName)
    .where("planDate", "==", today)
    .where("status", "in", ["ready_to_depart", "on_route"])
    .limit(1)
    .get();

  if (tripsSnap.empty) {
    return NextResponse.json({ trip: null, stops: [] });
  }

  const trip = tripsSnap.docs[0].data();
  
  // Fetch stops for this trip
  const stopsSnap = await db.collection("trip_stops")
    .where("tripId", "==", trip.tripId)
    .get();

  // Sort stops by stopOrder (ascending for delivery sequence)
  const stops = stopsSnap.docs
    .map(d => d.data())
    .sort((a, b) => a.stopOrder - b.stopOrder);

  return NextResponse.json({ trip, stops });
}
