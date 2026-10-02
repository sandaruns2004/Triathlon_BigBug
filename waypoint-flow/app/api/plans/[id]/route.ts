import { businessDate } from "@/lib/mobile/domain";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * GET /api/plans/[id]
 * Fetch a specific plan along with available vehicles, unassigned orders, and the trips in the plan.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "dispatcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const depot = (session.user as any).depot ?? "Peliyagoda";
  const today = businessDate();
  const planId = params.id;

  // Run queries in parallel
  const [planSnap, vehiclesSnap, ordersSnap, tripsSnap] = await Promise.all([
    db.collection("plans").doc(planId).get(),
    db.collection("vehicles").where("depot", "==", depot).where("available", "==", true).get(),
    db.collection("orders").where("depot", "==", depot).where("planDate", "==", today).where("tripId", "==", null).get(),
    db.collection("trips").where("planId", "==", planId).get(), // Assuming trips are linked to planId if created via this plan
  ]);

  if (!planSnap.exists) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const plan = planSnap.data();
  // Ensure the plan belongs to the dispatcher's depot
  if (plan?.depot !== depot) {
    return NextResponse.json({ error: "Forbidden: Plan depot mismatch" }, { status: 403 });
  }

  const vehicles = vehiclesSnap.docs.map((d) => d.data());
  const unassignedOrders = ordersSnap.docs.map((d) => d.data());
  const trips = tripsSnap.docs.map((d) => d.data());

  return NextResponse.json({ plan, vehicles, unassignedOrders, trips });
}
