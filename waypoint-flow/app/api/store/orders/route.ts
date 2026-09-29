import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * GET /api/store/orders
 * Fetches orders for the logged-in store manager's outlet.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "store_manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const outletId = (session.user as any).outletId;

  // Fetch orders sorted by planDate (client will format if needed, but we can do a simple query)
  const ordersSnap = await db.collection("orders")
    .where("outletId", "==", outletId)
    .get();

  const orders = ordersSnap.docs
    .map(d => d.data())
    .sort((a, b) => new Date(b.planDate).getTime() - new Date(a.planDate).getTime());

  return NextResponse.json({ orders });
}

/**
 * POST /api/store/orders
 * Creates a new order from the Store Manager composer.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "store_manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { items, totalWeight, totalVolume, brand, tempRequirement } = await req.json();
  const outletId = (session.user as any).outletId;

  // Get outlet details to attach depot and constraints
  const outletSnap = await db.collection("outlets").doc(outletId).get();
  const outlet = outletSnap.data() || {};

  const orderId = `ORD-${Date.now()}`;
  const today = new Date();
  // Plan for tomorrow by default if created today
  const planDate = new Date(today.getTime() + 86400000).toISOString().split("T")[0];

  const order = {
    orderId,
    outletId,
    outletName: outlet.name || "Unknown Store",
    brand: brand || outlet.brand || "Mixed",
    district: outlet.district || "Unknown",
    depot: outlet.depot || "Peliyagoda",
    dockType: outlet.dockType || "street",
    parkingConstraint: outlet.parkingConstraint || "normal",
    tempRequirement: tempRequirement || "ambient",
    orderWeightKg: totalWeight,
    orderVolumeM3: totalVolume,
    status: "pending",
    deferredYesterday: false,
    daysSinceLastServed: 0,
    planDate,
    tripId: null,
    items, // the specific products requested
    createdAt: new Date().toISOString()
  };

  await db.collection("orders").doc(orderId).set(order);

  return NextResponse.json({ success: true, orderId });
}
