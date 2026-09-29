import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * POST /api/exceptions
 * Creates a new exception (e.g. from the Loader reporting a shortfall).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, title, detail, vehicleId, tripId, severity, stopId, depot } = await req.json();

  if (!type || !title || !tripId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const exceptionId = `EX-${Date.now()}`;
  const exceptionData = {
    exceptionId,
    type,         // "shortfall"
    title,        // "Loading Shortfall"
    detail,       // "Missing 2x cases..."
    vehicleId:    vehicleId || null,
    tripId,
    severity:     severity || "high",
    resolved:     false,
    createdAt:    new Date().toISOString(),
    depot:        depot || (session.user as any).depot || "Peliyagoda",
    reportedBy:   (session.user as any).name || "System",
  };

  const batch = db.batch();

  // Create exception
  batch.set(db.collection("exceptions").doc(exceptionId), exceptionData);

  // If this is tied to a stop, update the stop status
  if (stopId) {
    batch.update(db.collection("trip_stops").doc(stopId), {
      status: "shortfall_reported",
    });
  }

  await batch.commit();

  return NextResponse.json({ success: true, exception: exceptionData });
}
