import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * PATCH /api/loader/stops/[stopId]/load
 * Marks a stop as fully loaded.
 */
export async function PATCH(req: NextRequest, { params }: { params: { stopId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "loader") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stopRef = db.collection("trip_stops").doc(params.stopId);
  const stopSnap = await stopRef.get();

  if (!stopSnap.exists) {
    return NextResponse.json({ error: "Stop not found" }, { status: 404 });
  }

  const stop = stopSnap.data()!;
  
  // If the stop was already in 'needs_planning' or 'loading', move it to 'loaded'
  await stopRef.update({
    status: "loaded",
    deliveredKg: stop.expectedKg, // Assuming fully loaded
  });

  // Check if all stops in this trip are loaded. If so, update trip status.
  const tripId = stop.tripId;
  const allStopsSnap = await db.collection("trip_stops").where("tripId", "==", tripId).get();
  const allLoaded = allStopsSnap.docs.every(d => ["loaded", "delivered", "shortfall_reported"].includes(d.data().status));

  if (allLoaded) {
    await db.collection("trips").doc(tripId).update({
      status: "ready_to_depart"
    });
  } else {
    // Ensure trip is at least marked as "loading"
    await db.collection("trips").doc(tripId).update({
      status: "loading"
    });
  }

  return NextResponse.json({ success: true, allLoaded });
}
