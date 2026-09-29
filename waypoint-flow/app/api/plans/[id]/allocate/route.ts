import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";
import { allocate, Order, Vehicle } from "@/lib/allocation/engine";

// Hardcoded lookup tables for the engine (in a real app, these would come from Firestore)
const DISTRICT_DATA: Record<string, { depotToDistrictFreeflowMin: number; interStopFreeflowMin: number }> = {
  "Colombo": { depotToDistrictFreeflowMin: 20, interStopFreeflowMin: 15 },
  "Gampaha": { depotToDistrictFreeflowMin: 30, interStopFreeflowMin: 20 },
  "Kandy":   { depotToDistrictFreeflowMin: 10, interStopFreeflowMin: 12 },
};

const SERVICE_ALLOWANCES: Record<string, number> = {
  "Fresh:street": 10, "Fresh:rear_dock": 15, "Fresh:mall_bay": 20,
  "Style:street": 15, "Style:rear_dock": 20, "Style:mall_bay": 25,
  "Tech:street":  20, "Tech:rear_dock":  25, "Tech:mall_bay":  30,
};

/**
 * POST /api/plans/[id]/allocate
 * Runs the allocation engine for the given plan.
 * Writes generated trips and defers unassigned orders in Firestore.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "dispatcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const depot = (session.user as any).depot ?? "Peliyagoda";
  const today = new Date().toISOString().split("T")[0];
  const planId = params.id;

  // 1. Fetch unassigned orders and available vehicles
  const [ordersSnap, vehiclesSnap] = await Promise.all([
    db.collection("orders").where("depot", "==", depot).where("planDate", "==", today).where("tripId", "==", null).where("status", "in", ["pending", "deferred"]).get(),
    db.collection("vehicles").where("depot", "==", depot).where("available", "==", true).get(),
  ]);

  const orders   = ordersSnap.docs.map((d) => d.data() as Order);
  const vehicles = vehiclesSnap.docs.map((d) => d.data() as Vehicle);

  if (orders.length === 0) {
    return NextResponse.json({ message: "No orders to allocate" }, { status: 200 });
  }

  // 2. Run the Engine
  const { trips, deferred } = await allocate(orders, vehicles, DISTRICT_DATA, SERVICE_ALLOWANCES);

  // 3. Write results to Firestore (in batches)
  const batch = db.batch();

  for (const trip of trips) {
    const tripId = `${planId}-${trip.tripId}`; // e.g. PLAN-PEL-2026-WP-001-T1
    const tripRef = db.collection("trips").doc(tripId);
    
    // Save Trip
    batch.set(tripRef, {
      tripId,
      planId,
      vehicleId:      trip.vehicleId,
      driverName:     "Unassigned", // To be assigned later
      brand:          trip.brand,
      district:       trip.district,
      depot,
      status:         "planned",
      stopCount:      trip.orders.length,
      stopsCompleted: 0,
      weightKg:       trip.orders.reduce((sum, o) => sum + o.orderWeightKg, 0),
      volumeM3:       trip.orders.reduce((sum, o) => sum + o.orderVolumeM3, 0),
      weightCapKg:    vehicles.find(v => v.vehicleId === trip.vehicleId)?.weightCapKg ?? 0,
      volumeCapM3:    vehicles.find(v => v.vehicleId === trip.vehicleId)?.volumeCapM3 ?? 0,
      etaDeparture:   `${today}T09:00:00+05:30`,
      etaReturn:      `${today}T17:00:00+05:30`,
      planDate:       today,
    });

    // Save Trip Stops & update Order status
    trip.orders.forEach((order, index) => {
      // 1. Create stop
      const stopRef = db.collection("trip_stops").doc(`${tripId}-${index + 1}`);
      batch.set(stopRef, {
        stopId:      `${tripId}-${index + 1}`,
        tripId,
        outletId:    order.outletId,
        stopOrder:   index + 1,
        status:      "needs_planning",
        expectedKg:  order.orderWeightKg,
        deliveredKg: null,
      });

      // 2. Update order to assigned
      const orderRef = db.collection("orders").doc(order.orderId);
      batch.update(orderRef, { tripId, status: "planned" });
    });
  }

  // Handle auto-deferred orders
  for (const order of deferred) {
    const orderRef = db.collection("orders").doc(order.orderId);
    batch.update(orderRef, {
      status: "deferred",
      deferralReason: "Auto-deferred by engine: demand exceeds capacity",
    });
  }

  // Update plan metrics
  const planRef = db.collection("plans").doc(planId);
  batch.update(planRef, {
    tripCount: trips.length,
    deferredCount: deferred.length,
    status: "allocated",
  });

  await batch.commit();

  return NextResponse.json({ success: true, tripsGenerated: trips.length, ordersDeferred: deferred.length });
}
