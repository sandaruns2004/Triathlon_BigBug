import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * GET /api/loader/trips/[id]
 * Fetches the trip and its stops/orders for loading.
 * Returns stops sorted in REVERSE order (Last In, First Out loading).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "loader") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tripId = params.id;
  const [tripSnap, stopsSnap] = await Promise.all([
    db.collection("trips").doc(tripId).get(),
    db.collection("trip_stops").where("tripId", "==", tripId).get(),
  ]);

  if (!tripSnap.exists) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const trip = tripSnap.data();

  // Sort stops in reverse order (highest stopOrder first, so they get loaded first)
  const stops = stopsSnap.docs
    .map((d) => d.data())
    .sort((a, b) => b.stopOrder - a.stopOrder);

  // For a real app we'd join with the `orders` collection to get item-level details.
  // For the hackathon, we use the expectedKg from the stop as the loading target.

  return NextResponse.json({ trip, stops });
}
