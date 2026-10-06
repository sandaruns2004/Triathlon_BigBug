import { businessDate } from "@/lib/mobile/domain";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * GET /api/dispatcher/overview
 * Returns: daily metrics, trips (today), unresolved exceptions
 * for the authenticated dispatcher's depot.
 *
 * NOTE: Firestore requires a composite index for multi-field where+orderBy.
 * To avoid the index requirement during development, we sort in memory.
 * For production, create the index via the Firebase Console link in the error.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "dispatcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const depot = (session.user as any).depot ?? "Peliyagoda";
  const today = businessDate();

  // Run all queries in parallel
  // Exceptions: NO orderBy to avoid composite index requirement — sorted in memory
  const [metricsSnap, tripsSnap, exceptionsSnap] = await Promise.all([
    db.collection("daily_metrics")
      .doc(`${today}_${depot}`)
      .get(),

    db.collection("trips")
      .where("depot", "==", depot)
      .where("planDate", "==", today)
      .get(),

    db.collection("exceptions")
      .where("depot", "==", depot)
      .where("resolved", "==", false)
      .get(),
  ]);

  const metrics = metricsSnap.exists
    ? metricsSnap.data()
    : {
        ordersToPlan: 0,
        tripsPlanned: 0,
        tripsTotal: 0,
        fleetActive: 0,
        fleetTotal: 0,
        driversIn: 0,
        driversTotal: 0,
        activeExceptions: 0,
      };

  const trips = tripsSnap.docs.map((d) => d.data());

  const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const exceptions = exceptionsSnap.docs
    .map((d) => d.data())
    .sort((a, b) => {
      const sev = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
      if (sev !== 0) return sev;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Dynamically calculate active exceptions rather than relying on stale daily_metrics snapshot
  if (metrics) {
    metrics.activeExceptions = exceptions.length;
  }

  return NextResponse.json({ metrics, trips, exceptions });
}

