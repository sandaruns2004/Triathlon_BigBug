import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * POST /api/driver/trips/[id]/start
 * Marks a trip as 'on_route' when the driver departs.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "driver") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tripRef = db.collection("trips").doc(params.id);
  const tripSnap = await tripRef.get();

  if (!tripSnap.exists) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  await tripRef.update({
    status: "on_route",
    departedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
