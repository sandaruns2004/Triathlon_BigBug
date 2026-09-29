import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * GET /api/loader/trips
 * Fetches trips for the loader's depot that need loading (planned or loading).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "loader") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const depot = (session.user as any).depot ?? "Peliyagoda";
  const today = new Date().toISOString().split("T")[0];

  const tripsSnap = await db.collection("trips")
    .where("depot", "==", depot)
    .where("planDate", "==", today)
    .where("status", "in", ["planned", "loading"])
    .get();

  const trips = tripsSnap.docs.map((d) => d.data());

  return NextResponse.json({ trips });
}
