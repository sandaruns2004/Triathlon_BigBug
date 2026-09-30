/**
 * Waypoint Flow — Allocation Engine
 * Enforces all 9 operating constraints (C1–C9).
 * Used by POST /api/plans/:id/allocate
 */

// ─── TYPES ──────────────────────────────────────────────────────────

export interface Order {
  orderId:            string;
  outletId:           string;
  brand:              "Fresh" | "Style" | "Tech";
  district:           string;
  depot:              string;          // Peliyagoda | Kandy
  dockType:           string;          // rear_dock | street | mall_bay
  parkingConstraint:  string;          // normal | van_only | mall_dock
  tempRequirement:    string;          // ambient | chilled | frozen
  orderWeightKg:      number;
  orderVolumeM3:      number;
  deferredYesterday:  boolean;
  daysSinceLastServed: number;
}

export interface Vehicle {
  vehicleId:      string;
  type:           string;  // truck | van
  temp:           string;  // reefer | ambient
  weightCapKg:    number;
  volumeCapM3:    number;
  depot:          string;
  available:      boolean;
}

export interface Trip {
  tripId:        string;
  vehicleId:     string;
  tripNumber:    number;   // 1 | 2
  brand:         string;
  district:      string;
  orders:        Order[];
  timeBudgetUsed: number;
}

export interface AllocationResult {
  trips:      Trip[];
  deferred:   Order[];
}

// ─── CONSTANTS ──────────────────────────────────────────────────────

const FRESH_TIME_BUDGET   = 270; // min — 03:30 to 08:00 (C7)
const DAYTIME_TIME_BUDGET = 480; // min — 09:00 to 17:00
const MAX_TRIPS_PER_VEHICLE = 2; // (C8)

// ─── STEP 1: PRIORITIZE ─────────────────────────────────────────────
// deferred_yesterday first → longest wait → smallest volume
function prioritizeOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    if (a.deferredYesterday !== b.deferredYesterday)
      return b.deferredYesterday ? 1 : -1;
    if (a.daysSinceLastServed !== b.daysSinceLastServed)
      return b.daysSinceLastServed - a.daysSinceLastServed;
    return a.orderVolumeM3 - b.orderVolumeM3;
  });
}

// ─── STEP 2: GROUP BY (BRAND, DISTRICT) ─────────────────────────────
// C9: One brand + one district per trip
function groupOrders(orders: Order[]): Map<string, Order[]> {
  const groups = new Map<string, Order[]>();
  for (const order of orders) {
    const key = `${order.brand}:${order.district}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(order);
  }
  return groups;
}

// ─── CONSTRAINT CHECKS ──────────────────────────────────────────────

// C1: Depot match
// C2: Chilled/frozen → reefer vehicle only
// C3: van_only outlets → van-type vehicle only
export function canVehicleServeOrder(vehicle: Vehicle, order: Order): boolean {
  if (vehicle.depot !== order.depot) return false;                                          // C1
  if (["chilled", "frozen", "reefer"].includes(order.tempRequirement) && vehicle.temp !== "reefer")
    return false;                                                                            // C2
  if (order.parkingConstraint === "van_only" && vehicle.type !== "van") return false;       // C3
  return true;
}

// C4: Weight capacity
// C5: Volume capacity
function checkCapacity(vehicle: Vehicle, existing: Order[], newOrder: Order): boolean {
  const totalWt  = existing.reduce((s, o) => s + o.orderWeightKg,  0) + newOrder.orderWeightKg;
  const totalVol = existing.reduce((s, o) => s + o.orderVolumeM3,  0) + newOrder.orderVolumeM3;
  return totalWt <= vehicle.weightCapKg && totalVol <= vehicle.volumeCapM3;                 // C4+C5
}

// C6 + C7: Time budget per brand
function getTimeBudget(brand: string): number {
  return brand === "Fresh" ? FRESH_TIME_BUDGET : DAYTIME_TIME_BUDGET;
}

// Trip time estimator using district data
function calculateTripTime(
  district:          string,
  brand:             string,
  orders:            Order[],
  districtData:      Record<string, { depotToDistrictFreeflowMin: number; interStopFreeflowMin: number }>,
  serviceAllowances: Record<string, number>
): number {
  const d = districtData[district];
  const n = orders.length;
  if (!d || n === 0) return 0;
  return (
    d.depotToDistrictFreeflowMin +
    (n - 1) * d.interStopFreeflowMin +
    orders.reduce((sum, o) => sum + (serviceAllowances[`${brand}:${o.dockType}`] ?? 0), 0)
  );
}

// ─── MAIN ALLOCATION FUNCTION ────────────────────────────────────────

export async function allocate(
  orders:            Order[],
  vehicles:          Vehicle[],
  districtData:      Record<string, { depotToDistrictFreeflowMin: number; interStopFreeflowMin: number }>,
  serviceAllowances: Record<string, number>
): Promise<AllocationResult> {
  const prioritized   = prioritizeOrders(orders);
  const groups        = groupOrders(prioritized);
  const trips: Trip[] = [];
  const deferred: Order[] = [];

  // Track how many trips each vehicle has used (C8)
  const vehicleTrips = new Map<string, Trip[]>();
  vehicles.forEach((v) => vehicleTrips.set(v.vehicleId, []));

  for (const [groupKey, groupOrders] of groups) {
    const [brand, district] = groupKey.split(":");
    const budget            = getTimeBudget(brand);

    const eligibleVehicles = vehicles.filter(
      (v) =>
        v.available &&
        canVehicleServeOrder(v, groupOrders[0]) &&
        (vehicleTrips.get(v.vehicleId)?.length ?? 0) < MAX_TRIPS_PER_VEHICLE
    );

    for (const order of groupOrders) {
      let assigned = false;

      // Try to fit into an EXISTING trip for this (brand, district)
      for (const trip of trips) {
        if (trip.brand !== brand || trip.district !== district) continue;
        const vehicle = vehicles.find((v) => v.vehicleId === trip.vehicleId)!;
        if (!checkCapacity(vehicle, trip.orders, order)) continue;
        const newTime = calculateTripTime(district, brand, [...trip.orders, order], districtData, serviceAllowances);
        if (newTime > budget) continue;  // C6/C7
        trip.orders.push(order);
        trip.timeBudgetUsed = newTime;
        assigned = true;
        break;
      }

      if (assigned) continue;

      // Try to open a NEW trip on an eligible vehicle
      for (const vehicle of eligibleVehicles) {
        const usedTrips = vehicleTrips.get(vehicle.vehicleId) ?? [];
        if (usedTrips.length >= MAX_TRIPS_PER_VEHICLE) continue; // C8
        if (!checkCapacity(vehicle, [], order)) continue;
        const newTime = calculateTripTime(district, brand, [order], districtData, serviceAllowances);
        if (newTime > budget) continue;

        const newTrip: Trip = {
          tripId:         `${vehicle.vehicleId}-T${usedTrips.length + 1}`,
          vehicleId:      vehicle.vehicleId,
          tripNumber:     usedTrips.length + 1,
          brand,
          district,
          orders:         [order],
          timeBudgetUsed: newTime,
        };
        trips.push(newTrip);
        usedTrips.push(newTrip);
        vehicleTrips.set(vehicle.vehicleId, usedTrips);
        assigned = true;
        break;
      }

      // Could not assign — defer (demand exceeded capacity)
      if (!assigned) deferred.push(order);
    }
  }

  return { trips, deferred };
}
