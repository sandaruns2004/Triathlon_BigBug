import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * GET  /api/plans — list today's plans for this depot
 * POST /api/plans — create a new empty plan
 */

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "dispatcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const depot = (session.user as any).depot ?? "Peliyagoda";
  const today = new Date().toISOString().split("T")[0];

  const snap = await db.collection("plans")
    .where("depot", "==", depot)
    .where("planDate", "==", today)
    .get();

  const plans = snap.docs.map((d) => d.data());
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "dispatcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const depot       = (session.user as any).depot ?? "Peliyagoda";
  const today       = new Date().toISOString().split("T")[0];
  const dispatcherId = (session.user as any).id ?? "user-dispatcher";

  const planId   = `PLAN-${depot.toUpperCase().slice(0, 3)}-${today}`;
  const planData = {
    planId,
    depot,
    planDate:     today,
    status:       "draft",
    createdBy:    dispatcherId,
    createdAt:    new Date().toISOString(),
    tripCount:    0,
    deferredCount: 0,
  };

  await db.collection("plans").doc(planId).set(planData, { merge: true });
  return NextResponse.json({ plan: planData }, { status: 201 });
}
