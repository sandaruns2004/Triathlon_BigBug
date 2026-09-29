import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * POST /api/driver/stops/[stopId]/deliver
 * Marks a stop as delivered with signature proof.
 */
export async function POST(req: NextRequest, { params }: { params: { stopId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "driver") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { signature } = await req.json();

  const stopRef = db.collection("trip_stops").doc(params.stopId);
  const stopSnap = await stopRef.get();

  if (!stopSnap.exists) {
    return NextResponse.json({ error: "Stop not found" }, { status: 404 });
  }

  const stop = stopSnap.data()!;

  const batch = db.batch();

  // 1. Mark stop as delivered
  batch.update(stopRef, {
    status: "delivered",
    deliveredAt: new Date().toISOString(),
    signatureUrl: signature || null, // In reality, this would be an S3 URL
  });

  // 2. Update trip completed stops count
  const tripRef = db.collection("trips").doc(stop.tripId);
  const tripSnap = await tripRef.get();
  
  if (tripSnap.exists) {
    const trip = tripSnap.data()!;
    const newCompletedCount = (trip.stopsCompleted || 0) + 1;
    
    // If this was the last stop, mark trip as returning or completed
    const newStatus = newCompletedCount >= trip.stopCount ? "returning" : "on_route";
    
    batch.update(tripRef, {
      stopsCompleted: newCompletedCount,
      status: newStatus,
    });
  }

  // 3. Mark the corresponding order as delivered
  // To find the order, we match tripId and outletId
  const ordersSnap = await db.collection("orders")
    .where("tripId", "==", stop.tripId)
    .where("outletId", "==", stop.outletId)
    .get();
    
  ordersSnap.docs.forEach(doc => {
    batch.update(doc.ref, {
      status: "delivered",
      deliveredAt: new Date().toISOString(),
    });
  });

  await batch.commit();

  return NextResponse.json({ success: true });
}
