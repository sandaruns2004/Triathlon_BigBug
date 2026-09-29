import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * GET /api/store/orders/[id]
 * Fetches specific order details. If assigned to a trip, fetches trip/vehicle details.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "store_manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orderId = params.id;
  const orderSnap = await db.collection("orders").doc(orderId).get();

  if (!orderSnap.exists) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = orderSnap.data()!;

  // Security check: ensure this order belongs to the logged in store manager
  if (order.outletId !== (session.user as any).outletId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let trip = null;
  let vehicle = null;

  if (order.tripId) {
    const tripSnap = await db.collection("trips").doc(order.tripId).get();
    if (tripSnap.exists) {
      trip = tripSnap.data();
      
      if (trip && trip.vehicleId) {
        const vehicleSnap = await db.collection("vehicles").doc(trip.vehicleId).get();
        if (vehicleSnap.exists) {
          vehicle = vehicleSnap.data();
        }
      }
    }
  }

  return NextResponse.json({ order, trip, vehicle });
}
