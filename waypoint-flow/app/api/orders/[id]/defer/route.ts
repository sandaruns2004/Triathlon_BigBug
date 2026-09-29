import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * POST /api/orders/[id]/defer
 * Confirms a deferral reason for an order and updates the order status.
 * Emits order:deferred (handled via Firestore listener on the Store Manager side for now).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "dispatcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reason } = await req.json();
  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const orderRef = db.collection("orders").doc(params.id);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await orderRef.update({
    status: "deferred",
    deferralReason: reason,
    deferredConfirmedAt: new Date().toISOString(),
    planDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Move plan date to tomorrow
  });

  return NextResponse.json({ success: true });
}
