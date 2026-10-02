import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * POST /api/deliveries/sync
 * Called by the offline queue (lib/offline/queue.ts) when the driver comes back online.
 * Accepts a queued delivery record and persists it to Firestore.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "driver") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    id: string;
    type: string;
    orderId: string;
    outletName: string;
    payload: Record<string, unknown>;
    localTime: string;
    evidenceCount: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, type, orderId, outletName, payload, localTime, evidenceCount } = body;

  if (!id || !type || !orderId) {
    return NextResponse.json({ error: "Missing required fields: id, type, orderId" }, { status: 400 });
  }

  // Write the sync record to Firestore
  const syncRef = db.collection("offline_syncs").doc(id);
  const existing = await syncRef.get();

  // Idempotent — if already synced, return success without re-writing
  if (existing.exists) {
    return NextResponse.json({ success: true, duplicate: true });
  }

  await syncRef.set({
    id,
    type,
    orderId,
    outletName: outletName ?? "",
    payload: payload ?? {},
    localTime: localTime ?? new Date().toISOString(),
    evidenceCount: evidenceCount ?? 0,
    syncedAt: new Date().toISOString(),
    driverId: (session.user as any).id,
    driverName: session.user?.name ?? "",
  });

  // If it's a completed delivery, update the order status
  if (type === "delivery_completed" && orderId) {
    try {
      await db.collection("orders").doc(orderId).update({
        status: "delivered",
        deliveredAt: localTime ?? new Date().toISOString(),
        offlineSync: true,
      });
    } catch {
      // Order may not exist or already be updated — non-fatal
    }
  }

  return NextResponse.json({ success: true });
}
