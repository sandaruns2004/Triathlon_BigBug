import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/firebase";

/**
 * POST /api/seed
 * Seeds Firestore with ALL demo data:
 *   users, vehicles, outlets, trips, trip_stops, exceptions, daily_metrics
 * CSVs are read from public/data/ if present.
 * In development: no secret required.
 */
export async function POST(req: NextRequest) {
  const { secret } = await req.json().catch(() => ({ secret: null }));

  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  const results: Record<string, number> = {};

  // ── 1. USERS ────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("waypoint2026", 10);
  const users = [
    { id: "user-dispatcher", name: "Nilantha Perera",   email: "dispatcher@waypoint.lk", role: "dispatcher",    depot: "Peliyagoda", outletId: null,     passwordHash },
    { id: "user-loader",     name: "Chamara Bandara",   email: "loader@waypoint.lk",     role: "loader",        depot: "Peliyagoda", outletId: null,     passwordHash },
    { id: "user-driver",     name: "Roshan Jayasinghe", email: "driver@waypoint.lk",     role: "driver",        depot: "Peliyagoda", outletId: null,     passwordHash },
    { id: "user-store",      name: "Thilini W.",        email: "store@waypoint.lk",      role: "store_manager", depot: null,         outletId: "OUT005", passwordHash },
  ];
  const uBatch = db.batch();
  for (const user of users) {
    uBatch.set(db.collection("users").doc(user.id), user, { merge: true });
  }
  await uBatch.commit();
  results.users = users.length;

  // ── 2. VEHICLES ──────────────────────────────────────────────────────
  // NOTE: CSV file reading is not supported in Vercel serverless — using demo data directly.
  const demoVehicles = [
    { vehicleId: "WP-001", type: "truck", temp: "ambient", weightCapKg: 4000, volumeCapM3: 18, fuelType: "diesel", kmPerL: 8, weeklyFuelQuotaL: 200, depot: "Peliyagoda", available: true, driverName: "Roshan J.",  currentStatus: "on_route", lat: 6.93,   lng: 79.87 },
    { vehicleId: "WP-014", type: "van",   temp: "reefer",  weightCapKg: 1500, volumeCapM3: 8,  fuelType: "diesel", kmPerL: 10, weeklyFuelQuotaL: 100, depot: "Peliyagoda", available: true, driverName: "Kamal P.",  currentStatus: "loading",  lat: 6.92,   lng: 79.86 },
    { vehicleId: "WP-022", type: "truck", temp: "ambient", weightCapKg: 4000, volumeCapM3: 18, fuelType: "diesel", kmPerL: 8, weeklyFuelQuotaL: 200, depot: "Peliyagoda", available: true, driverName: "Nimal S.",  currentStatus: "planned",  lat: null,   lng: null  },
    { vehicleId: "WP-031", type: "van",   temp: "ambient", weightCapKg: 1500, volumeCapM3: 8,  fuelType: "petrol", kmPerL: 12, weeklyFuelQuotaL: 100, depot: "Kandy",      available: true, driverName: "Asanka W.", currentStatus: "on_route", lat: 7.2906, lng: 80.6337 },
    { vehicleId: "WP-040", type: "truck", temp: "reefer",  weightCapKg: 4000, volumeCapM3: 18, fuelType: "diesel", kmPerL: 7, weeklyFuelQuotaL: 200, depot: "Kandy",      available: false, driverName: null,       currentStatus: "idle",     lat: null,   lng: null  },
  ];
  const dvBatch = db.batch();
  for (const v of demoVehicles) {
    dvBatch.set(db.collection("vehicles").doc(v.vehicleId), v, { merge: true });
  }
  await dvBatch.commit();
  results.vehicles = demoVehicles.length;

  // ── 3. OUTLETS ──────────────────────────────────────────────────────
  // NOTE: CSV file reading is not supported in Vercel serverless — using demo data directly.
  const demoOutlets = [
    { outletId: "OUT005", name: "Fresh Mart Nugegoda",     brand: "Fresh", district: "Colombo",  depot: "Peliyagoda", dockType: "street",    parkingConstraint: "normal",    windowOpenTime: "08:00", windowCloseTime: "17:00" },
    { outletId: "OUT012", name: "Style Hub Bambalapitiya", brand: "Style", district: "Colombo",  depot: "Peliyagoda", dockType: "rear_dock", parkingConstraint: "normal",    windowOpenTime: "09:00", windowCloseTime: "17:00" },
    { outletId: "OUT019", name: "Tech World Kandy",        brand: "Tech",  district: "Kandy",    depot: "Kandy",      dockType: "mall_bay",  parkingConstraint: "mall_dock", windowOpenTime: "10:00", windowCloseTime: "21:00" },
    { outletId: "OUT027", name: "Fresh Mart Kelaniya",     brand: "Fresh", district: "Gampaha",  depot: "Peliyagoda", dockType: "street",    parkingConstraint: "van_only",  windowOpenTime: "07:00", windowCloseTime: "12:00" },
    { outletId: "OUT034", name: "Style Hub Negombo",       brand: "Style", district: "Gampaha",  depot: "Peliyagoda", dockType: "rear_dock", parkingConstraint: "normal",    windowOpenTime: "09:00", windowCloseTime: "17:00" },
    { outletId: "OUT045", name: "Fresh Mart Wattala",      brand: "Fresh", district: "Gampaha",  depot: "Peliyagoda", dockType: "street",    parkingConstraint: "van_only",  windowOpenTime: "07:00", windowCloseTime: "12:00" },
  ];
  const doBatch = db.batch();
  for (const o of demoOutlets) {
    doBatch.set(db.collection("outlets").doc(o.outletId), o, { merge: true });
  }
  await doBatch.commit();
  results.outlets = demoOutlets.length;

  // ── 4. TRIPS (today's demo plan) ────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const demoTrips = [
    {
      tripId:         "WP-001-T1",
      vehicleId:      "WP-001",
      driverName:     "Roshan Jayasinghe",
      brand:          "Fresh",
      district:       "Colombo",
      depot:          "Peliyagoda",
      status:         "on_route",
      stopCount:      4,
      stopsCompleted: 2,
      weightKg:       3800,
      weightCapKg:    4000,
      volumeM3:       16.5,
      volumeCapM3:    18,
      etaDeparture:   `${today}T03:30:00+05:30`,
      etaReturn:      `${today}T08:00:00+05:30`,
      planDate:       today,
      lat:            6.93,
      lng:            79.87,
    },
    {
      tripId:         "WP-014-T1",
      vehicleId:      "WP-014",
      driverName:     "Kamal Perera",
      brand:          "Style",
      district:       "Colombo",
      depot:          "Peliyagoda",
      status:         "loading",
      stopCount:      8,
      stopsCompleted: 0,
      weightKg:       1400,
      weightCapKg:    1500,
      volumeM3:       7.2,
      volumeCapM3:    8,
      etaDeparture:   `${today}T09:00:00+05:30`,
      etaReturn:      `${today}T17:00:00+05:30`,
      planDate:       today,
      lat:            6.92,
      lng:            79.86,
    },
    {
      tripId:         "WP-022-T1",
      vehicleId:      "WP-022",
      driverName:     "Nimal Siripala",
      brand:          "Tech",
      district:       "Gampaha",
      depot:          "Peliyagoda",
      status:         "planned",
      stopCount:      2,
      stopsCompleted: 0,
      weightKg:       2100,
      weightCapKg:    4000,
      volumeM3:       9.0,
      volumeCapM3:    18,
      etaDeparture:   `${today}T09:30:00+05:30`,
      etaReturn:      `${today}T17:00:00+05:30`,
      planDate:       today,
      lat:            null,
      lng:            null,
    },
    {
      tripId:         "WP-031-T1",
      vehicleId:      "WP-031",
      driverName:     "Asanka Wickramasinghe",
      brand:          "Fresh",
      district:       "Kandy",
      depot:          "Kandy",
      status:         "ready_to_depart",
      stopCount:      5,
      stopsCompleted: 0,
      weightKg:       1250,
      weightCapKg:    1500,
      volumeM3:       6.5,
      volumeCapM3:    8,
      etaDeparture:   `${today}T03:30:00+05:30`,
      etaReturn:      `${today}T08:00:00+05:30`,
      planDate:       today,
      lat:            7.2906,
      lng:            80.6337,
    },
  ];

  const tBatch = db.batch();
  for (const trip of demoTrips) {
    tBatch.set(db.collection("trips").doc(trip.tripId), trip, { merge: true });
  }
  await tBatch.commit();
  results.trips = demoTrips.length;

  // ── 5. TRIP STOPS ────────────────────────────────────────────────────
  const demoStops = [
    { stopId: "STOP-001-1", tripId: "WP-001-T1", outletId: "OUT005", outletName: "Fresh Mart Nugegoda",    stopOrder: 1, status: "delivered",   expectedKg: 850,  deliveredKg: 850,  address: "23 High Level Rd, Nugegoda" },
    { stopId: "STOP-001-2", tripId: "WP-001-T1", outletId: "OUT027", outletName: "Fresh Mart Kelaniya",    stopOrder: 2, status: "delivered",   expectedKg: 1200, deliveredKg: 1150, address: "48 Kandy Rd, Kelaniya" },
    { stopId: "STOP-001-3", tripId: "WP-001-T1", outletId: "OUT034", outletName: "Style Hub Negombo",      stopOrder: 3, status: "on_route",    expectedKg: 950,  deliveredKg: null, address: "12 Lewis Pl, Negombo" },
    { stopId: "STOP-001-4", tripId: "WP-001-T1", outletId: "OUT012", outletName: "Style Hub Bambalapitiya", stopOrder: 4, status: "needs_planning", expectedKg: 800, deliveredKg: null, address: "8 Galle Rd, Colombo 03" },
    { stopId: "STOP-014-1", tripId: "WP-014-T1", outletId: "OUT005", outletName: "Fresh Mart Nugegoda",    stopOrder: 1, status: "needs_planning", expectedKg: 200, deliveredKg: null, address: "23 High Level Rd, Nugegoda" },
  ];

  const sBatch = db.batch();
  for (const stop of demoStops) {
    sBatch.set(db.collection("trip_stops").doc(stop.stopId), stop, { merge: true });
  }
  await sBatch.commit();
  results.trip_stops = demoStops.length;

  // ── 6. EXCEPTIONS ────────────────────────────────────────────────────
  const demoExceptions = [
    {
      exceptionId: "EX-01",
      type:        "breakdown",
      title:       "Vehicle Breakdown",
      detail:      "WP-001 reported engine failure near Kandy Rd, Kelaniya.",
      vehicleId:   "WP-001",
      tripId:      "WP-001-T1",
      severity:    "critical",
      resolved:    false,
      createdAt:   new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      depot:       "Peliyagoda",
    },
    {
      exceptionId: "EX-02",
      type:        "shortfall",
      title:       "Loading Shortfall",
      detail:      "Missing 2× Fresh Milk cases for OUT045. Loader reported damage.",
      vehicleId:   "WP-014",
      tripId:      "WP-014-T1",
      severity:    "high",
      resolved:    false,
      createdAt:   new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      depot:       "Peliyagoda",
    },
    {
      exceptionId: "EX-03",
      type:        "delay",
      title:       "Route Delay",
      detail:      "WP-014 running 45 min behind schedule due to traffic at Dematagoda junction.",
      vehicleId:   "WP-014",
      tripId:      "WP-014-T1",
      severity:    "medium",
      resolved:    false,
      createdAt:   new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      depot:       "Peliyagoda",
    },
  ];

  const eBatch = db.batch();
  for (const ex of demoExceptions) {
    eBatch.set(db.collection("exceptions").doc(ex.exceptionId), ex, { merge: true });
  }
  await eBatch.commit();
  results.exceptions = demoExceptions.length;

  // ── 7. DAILY METRICS SNAPSHOT ────────────────────────────────────────
  const metrics = {
    date:               today,
    depot:              "Peliyagoda",
    ordersToPlan:       142,
    tripsPlanned:       12,
    tripsTotal:         18,
    fleetActive:        16,
    fleetTotal:         20,
    driversIn:          14,
    driversTotal:       20,
    activeExceptions:   3,
    updatedAt:          new Date().toISOString(),
  };
  await db.collection("daily_metrics").doc(`${today}_Peliyagoda`).set(metrics, { merge: true });
  results.daily_metrics = 1;

  // ── 8. ORDERS (deferred + pending) ───────────────────────────────────
  const demoOrders = [
    {
      orderId:          "ORD-2026-001",
      outletId:         "OUT005",
      outletName:       "Fresh Mart Nugegoda",
      brand:            "Fresh",
      district:         "Colombo",
      depot:            "Peliyagoda",
      dockType:         "street",
      parkingConstraint:"normal",
      tempRequirement:  "ambient",
      orderWeightKg:    850,
      orderVolumeM3:    3.5,
      status:           "delivered",
      deferredYesterday:false,
      daysSinceLastServed: 0,
      planDate:         today,
      tripId:           "WP-001-T1",
    },
    {
      orderId:          "ORD-2026-002",
      outletId:         "OUT027",
      outletName:       "Fresh Mart Kelaniya",
      brand:            "Fresh",
      district:         "Gampaha",
      depot:            "Peliyagoda",
      dockType:         "street",
      parkingConstraint:"van_only",
      tempRequirement:  "ambient",
      orderWeightKg:    1200,
      orderVolumeM3:    5.0,
      status:           "issue_reported",
      deferredYesterday:false,
      daysSinceLastServed: 0,
      planDate:         today,
      tripId:           "WP-001-T1",
    },
    {
      orderId:          "ORD-2026-003",
      outletId:         "OUT019",
      outletName:       "Tech World Kandy",
      brand:            "Tech",
      district:         "Kandy",
      depot:            "Kandy",
      dockType:         "mall_bay",
      parkingConstraint:"mall_dock",
      tempRequirement:  "ambient",
      orderWeightKg:    450,
      orderVolumeM3:    2.2,
      status:           "deferred",
      deferredYesterday:true,
      daysSinceLastServed: 2,
      deferralReason:   "Demand exceeds capacity",
      deferralDate:     today,
      planDate:         today,
      tripId:           null,
    },
    {
      orderId:          "ORD-2026-004",
      outletId:         "OUT012",
      outletName:       "Style Hub Bambalapitiya",
      brand:            "Style",
      district:         "Colombo",
      depot:            "Peliyagoda",
      dockType:         "rear_dock",
      parkingConstraint:"normal",
      tempRequirement:  "ambient",
      orderWeightKg:    1400,
      orderVolumeM3:    6.0,
      status:           "pending",
      deferredYesterday:false,
      daysSinceLastServed: 1,
      planDate:         today,
      tripId:           null,
    },
    {
      orderId:          "ORD-2026-005",
      outletId:         "OUT034",
      outletName:       "Style Hub Negombo",
      brand:            "Style",
      district:         "Gampaha",
      depot:            "Peliyagoda",
      dockType:         "rear_dock",
      parkingConstraint:"normal",
      tempRequirement:  "ambient",
      orderWeightKg:    2000,
      orderVolumeM3:    10.0,
      status:           "pending",
      deferredYesterday:true,
      daysSinceLastServed: 2,
      planDate:         today,
      tripId:           null,
    },
    {
      orderId:          "ORD-2026-006",
      outletId:         "OUT045",
      outletName:       "Fresh Mart Wattala",
      brand:            "Fresh",
      district:         "Gampaha",
      depot:            "Peliyagoda",
      dockType:         "street",
      parkingConstraint:"van_only",
      tempRequirement:  "chilled",
      orderWeightKg:    800,
      orderVolumeM3:    4.0,
      status:           "pending",
      deferredYesterday:false,
      daysSinceLastServed: 0,
      planDate:         today,
      tripId:           null,
    },
  ];

  const orderBatch = db.batch();
  for (const order of demoOrders) {
    orderBatch.set(db.collection("orders").doc(order.orderId), order, { merge: true });
  }
  await orderBatch.commit();
  results.orders = demoOrders.length;

  // ── 9. PRODUCTS (catalogue for store managers) ──────────────────────
  const demoProducts = [
    // Fresh brand products
    { brand: "Fresh", name: "Full Cream Milk 1L",       unit: "case/12",  weightKg: 12,  volumeM3: 0.014, temperature: "ambient", maxQuantity: 500, available: true },
    { brand: "Fresh", name: "Low-Fat Milk 1L",          unit: "case/12",  weightKg: 12,  volumeM3: 0.014, temperature: "ambient", maxQuantity: 500, available: true },
    { brand: "Fresh", name: "Natural Yoghurt 500g",     unit: "case/6",   weightKg: 3.5, volumeM3: 0.006, temperature: "ambient", maxQuantity: 200, available: true },
    { brand: "Fresh", name: "Strawberry Yoghurt 200g",  unit: "case/12",  weightKg: 2.6, volumeM3: 0.006, temperature: "ambient", maxQuantity: 200, available: true },
    { brand: "Fresh", name: "Cheddar Cheese 250g",      unit: "case/6",   weightKg: 1.8, volumeM3: 0.004, temperature: "reefer",  maxQuantity: 100, available: true },
    { brand: "Fresh", name: "Butter 500g",              unit: "case/10",  weightKg: 5.2, volumeM3: 0.008, temperature: "reefer",  maxQuantity: 150, available: true },
    { brand: "Fresh", name: "Orange Juice 1L",          unit: "case/12",  weightKg: 13,  volumeM3: 0.016, temperature: "ambient", maxQuantity: 300, available: true },
    { brand: "Fresh", name: "Apple Juice 200ml",        unit: "case/24",  weightKg: 5.5, volumeM3: 0.008, temperature: "ambient", maxQuantity: 400, available: true },
    { brand: "Fresh", name: "Sparkling Water 500ml",    unit: "case/24",  weightKg: 12,  volumeM3: 0.018, temperature: "ambient", maxQuantity: 500, available: true },
    { brand: "Fresh", name: "Still Water 1.5L",         unit: "case/12",  weightKg: 18,  volumeM3: 0.024, temperature: "ambient", maxQuantity: 500, available: true },
    // Style brand products
    { brand: "Style", name: "Shampoo Pro 400ml",        unit: "case/12",  weightKg: 5.5, volumeM3: 0.008, temperature: "ambient", maxQuantity: 200, available: true },
    { brand: "Style", name: "Conditioner Silk 400ml",   unit: "case/12",  weightKg: 5.5, volumeM3: 0.008, temperature: "ambient", maxQuantity: 200, available: true },
    { brand: "Style", name: "Face Wash Gentle 150ml",   unit: "case/24",  weightKg: 3.8, volumeM3: 0.006, temperature: "ambient", maxQuantity: 300, available: true },
    { brand: "Style", name: "Moisturiser SPF50 75ml",   unit: "case/24",  weightKg: 2.2, volumeM3: 0.004, temperature: "ambient", maxQuantity: 250, available: true },
    { brand: "Style", name: "Body Lotion 300ml",        unit: "case/12",  weightKg: 4.0, volumeM3: 0.006, temperature: "ambient", maxQuantity: 200, available: true },
    { brand: "Style", name: "Deodorant Roll-On 75ml",   unit: "case/24",  weightKg: 2.0, volumeM3: 0.004, temperature: "ambient", maxQuantity: 300, available: true },
    { brand: "Style", name: "Lip Balm 4g",              unit: "case/48",  weightKg: 0.4, volumeM3: 0.002, temperature: "ambient", maxQuantity: 500, available: true },
    { brand: "Style", name: "Sunscreen SPF30 100ml",    unit: "case/24",  weightKg: 2.8, volumeM3: 0.004, temperature: "ambient", maxQuantity: 200, available: true },
    // Tech brand products
    { brand: "Tech",  name: "USB-C Cable 1m",           unit: "case/20",  weightKg: 2.0, volumeM3: 0.006, temperature: "ambient", maxQuantity: 200, available: true },
    { brand: "Tech",  name: "Phone Case Universal",     unit: "case/10",  weightKg: 1.5, volumeM3: 0.008, temperature: "ambient", maxQuantity: 150, available: true },
    { brand: "Tech",  name: "Screen Protector 6.5\"",   unit: "case/20",  weightKg: 0.8, volumeM3: 0.004, temperature: "ambient", maxQuantity: 200, available: true },
    { brand: "Tech",  name: "Earbuds Wireless",         unit: "case/6",   weightKg: 1.2, volumeM3: 0.006, temperature: "ambient", maxQuantity: 100, available: true },
    { brand: "Tech",  name: "Power Bank 10000mAh",      unit: "each",     weightKg: 0.9, volumeM3: 0.003, temperature: "ambient", maxQuantity: 100, available: true },
    { brand: "Tech",  name: "Micro USB Cable 1m",       unit: "case/20",  weightKg: 1.8, volumeM3: 0.005, temperature: "ambient", maxQuantity: 200, available: true },
    { brand: "Tech",  name: "Bluetooth Speaker Mini",   unit: "case/4",   weightKg: 2.4, volumeM3: 0.008, temperature: "ambient", maxQuantity: 80,  available: true },
  ];

  const pBatch = db.batch();
  for (let i = 0; i < demoProducts.length; i++) {
    const p = demoProducts[i];
    const productId = `PROD-${p.brand.toUpperCase().slice(0,2)}-${String(i + 1).padStart(3, "0")}`;
    pBatch.set(db.collection("products").doc(productId), { ...p, productId }, { merge: true });
  }
  await pBatch.commit();
  results.products = demoProducts.length;

  return NextResponse.json({ success: true, seeded: results });
}
