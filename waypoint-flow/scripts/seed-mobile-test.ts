import bcrypt from "bcrypt";
import {createHash} from "node:crypto";
import { db } from "../lib/db/firebase";
import { businessDate, addDays, evidencePolicy } from "../lib/mobile/domain";

export async function seedMobileTestData() {
  if (process.env.MOBILE_TEST_MODE !== "emulator" || !process.env.FIREBASE_PROJECT_ID?.startsWith("demo-") ||
      process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8085") throw new Error("Test seeding is restricted to the isolated demo emulator.");
  const passwordHash = await bcrypt.hash(process.env.MOBILE_TEST_PASSWORD ?? "local-emulator-only", 10);
  const actors = [
    { id: "test-driver", role: "driver", name: "Test Driver", depot: "Peliyagoda", outletId: null },
    { id: "test-driver-b", role: "driver", name: "Other Driver", depot: "Peliyagoda", outletId: null },
    { id: "test-store", role: "store_manager", name: "Test Store Manager", depot: null, outletId: "OUT005" },
    { id: "test-store-b", role: "store_manager", name: "Other Store Manager", depot: null, outletId: "OUT006" },
    { id: "test-dispatcher", role: "dispatcher", name: "Test Dispatcher", depot: "Peliyagoda", outletId: null },
    { id: "test-loader", role: "loader", name: "Test Loader", depot: "Peliyagoda", outletId: null },
  ];
  const batch = db.batch(), date = businessDate();
  batch.delete(db.collection("trips").doc("TEST-CONFLICT-TRIP"));
  batch.delete(db.collection("trip_stops").doc("TEST-CONFLICT-STOP"));
  for (const actor of actors) {
    const email=actor.id+"@emulator.waypoint.test";
    batch.delete(db.collection("login_limits").doc(createHash("sha256").update(email).digest("hex")));
    batch.set(db.collection("users").doc(actor.id), { ...actor, email, passwordHash, enabled: true, authVersion: 0 });
  }
  for (const [outletId, window] of [["OUT005", ["04:00", "07:45"]], ["OUT006", ["03:00", "08:00"]]] as const) {
    batch.set(db.collection("outlets").doc(outletId), { outletId, name: "Test Fresh " + outletId, brand: "Fresh", district: "Colombo",
      depot: "Peliyagoda", dockType: "rear_dock", parkingConstraint: "normal", windowOpenTime: window[0], windowCloseTime: window[1], operatingDays: [0,1,2,3,4,5,6] });
  }
  const products = [
    { productId: "MILK-CASE", name: "Fresh milk", brand: "Fresh", unit: "case", weightKg: 12, volumeM3: 0.03, temperature: "reefer", available: true, maxQuantity: 100 },
    { productId: "YOGURT-TRAY", name: "Yoghurt", brand: "Fresh", unit: "tray", weightKg: 2, volumeM3: 0.01, temperature: "reefer", available: true, maxQuantity: 100 },
  ];
  for (const product of products) batch.set(db.collection("products").doc(product.productId), product);
  batch.set(db.collection("vehicles").doc("VEH001"), { vehicleId: "VEH001", depot: "Peliyagoda", type: "truck", temp: "reefer",
    weightCapKg: 5510, volumeCapM3: 26.4, available: true });
  const base = { vehicleId: "VEH001", driverId: "test-driver", driverName: "Test Driver", depot: "Peliyagoda", district: "Colombo", brand: "Fresh",
    serviceDate: date, planDate: date, finish: "07:30", assignmentVersion: 1, releaseVersion: 1, routeRevision: 1, progressVersion: 0,
    released: false, held: false, evidencePolicy, status: "loading", stopsCompleted: 0, resolvedCount: 0, weightKg: 320, volumeM3: 0.88,
    weightCapKg: 5510, volumeCapM3: 26.4, assignmentHistory: [], etaDeparture: date + "T04:30:00+05:30", etaReturn: date + "T07:30:00+05:30" };
  batch.set(db.collection("trips").doc("TEST-TRIP-1"), { ...base, tripId: "TEST-TRIP-1", tripNumber: 1, stopCount: 2 });
  batch.set(db.collection("trips").doc("TEST-TRIP-2"), { ...base, tripId: "TEST-TRIP-2", tripNumber: 2, previousTripId: "TEST-TRIP-1",
    released: true, status: "ready_to_depart", stopCount: 1 });
  for (const [index, tripId, outletId] of [[1, "TEST-TRIP-1", "OUT005"], [2, "TEST-TRIP-1", "OUT006"], [3, "TEST-TRIP-2", "OUT005"]] as const) {
    const orderId = "TEST-ORDER-" + index, stopId = "TEST-STOP-" + index;
    const lines = products.map((p, i) => ({ lineId: "TEST-LINE-" + index + "-" + i, productId: p.productId, name: p.name, quantity: i === 0 ? 12 : 8, unit: p.unit }));
    batch.set(db.collection("orders").doc(orderId), { orderId, outletId, outletName: "Test Fresh " + outletId, depot: "Peliyagoda", brand: "Fresh",
      district: "Colombo", dockType: "rear_dock", parkingConstraint: "normal", tempRequirement: "reefer", tripId, planDate: date,
      status: "loading", fulfillmentVersion: 0, receiptVersion: 0, updateVersion: 0, lines, items: lines, orderWeightKg: 160, orderVolumeM3: 0.44, createdAt: new Date().toISOString() });
    batch.set(db.collection("trip_stops").doc(stopId), { stopId, tripId, orderId, outletId, outletName: "Test Fresh " + outletId,
      stopOrder: index, status: index === 3 ? "loaded" : "loading", loadingState: index === 3 ? "loaded" : "pending",
      shortfallOpen: false, stopManifestRevision: 1, stopDeliveryVersion: 0, lines, expectedKg: 160,
      address: "Test receiving dock, Colombo", window: outletId === "OUT005" ? "04:00–07:45" : "03:00–08:00", instruction: "Test fixture: use rear dock." });
  }
  batch.set(db.collection("orders").doc("TEST-DEFERRED"), { orderId: "TEST-DEFERRED", outletId: "OUT005", outletName: "Test Fresh OUT005",
    depot: "Peliyagoda", brand: "Fresh", district: "Colombo", status: "pending", tripId: null, fulfillmentVersion: 0, receiptVersion: 0,
    updateVersion: 0, lines: [], planDate: addDays(date, 1), createdAt: new Date().toISOString() });
  await batch.commit();
  return { actors: actors.map(a => ({ userId: a.id, email: a.id + "@emulator.waypoint.test", role: a.role })),
    serviceDate: date, tripId: "TEST-TRIP-1", orderId: "TEST-ORDER-1", stopId: "TEST-STOP-1" };
}
if (process.argv[1]?.endsWith("seed-mobile-test.ts")) seedMobileTestData().then(result => { process.stdout.write(JSON.stringify(result, null, 2) + "\n"); process.exit(0); })
  .catch(() => { process.stderr.write("Isolated emulator seed failed; no operational reset is permitted.\n"); process.exit(1); });
