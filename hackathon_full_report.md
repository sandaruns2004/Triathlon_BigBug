# Tech-Triathlon 2026 · Hackathon Full Report
## Team BigBug · Waypoint Delivery System — Build Specification

> **Deadline:** 4 October 2026 · 11:59 PM Sri Lanka Time  
> **Repo:** `BigBug_WaypointDelivery` (GitHub monorepo)  
> **Spec source:** Designathon submission (BigBug_Designathon)

---

## PART 1 — WHAT WE ARE BUILDING

### System Name: Waypoint

A full-stack, real-time delivery workflow management system for an FMCG distributor operating from Peliyagoda and Kandy depots across 12 Sri Lankan districts.

### Four Roles, One Unified System

| Role | Interface Type | Device |
|---|---|---|
| Dispatcher | Web App (data-dense) | Desktop |
| Loader | Web App (touch-first) | Tablet |
| Driver | PWA (offline-capable) | Mobile |
| Store Manager | PWA (notification-driven) | Mobile |

### What the System Must Do

1. **Plan:** Dispatcher creates a delivery plan for a day. Allocation engine assigns orders to vehicle trips.
2. **Validate:** System checks all 9 operating constraints in real time.
3. **Defer:** Orders that cannot be assigned (capacity, time, unavailability) are automatically deferred.
4. **Load:** Loader scans items onto the correct vehicle, system validates every item.
5. **Deliver:** Driver navigates stops, records outcomes with photo + signature, handles exceptions.
6. **Receive:** Store manager tracks live ETA, verifies receipt, flags discrepancies.
7. **Alert:** Real-time events propagate between all roles (breakdown → dispatcher; delay → store manager).

---

## PART 2 — TECH STACK (COMPLETE)

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14.x (App Router) | Full-stack React framework; SSR for dispatcher, CSR for PWA roles |
| **React** | 18.x | UI rendering |
| **TypeScript** | 5.x | Type safety across frontend + shared schemas |
| **Tailwind CSS** | 3.x | Utility-first responsive styling |
| **shadcn/ui** | latest | Accessible, unstyled base components (buttons, dialogs, cards) |
| **Zustand** | 4.x | Lightweight client state management |
| **Socket.IO Client** | 4.x | Real-time bidirectional events |
| **Leaflet.js** | 1.9.x | Interactive maps (OpenStreetMap, no API key required) |
| **next-pwa** | 5.x | PWA manifest + service worker for offline support |
| **React Hook Form** | 7.x | Form state management |
| **Zod** | 3.x | Schema validation (shared with backend) |
| **Recharts** | 2.x | Capacity gauge charts, dashboard stats |
| **html5-qrcode** | 2.x | Barcode/QR scanner via device camera |
| **react-webcam** | 7.x | Photo capture (delivery proof) |
| **react-signature-canvas** | 1.x | Signature pad for delivery sign-off |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20 LTS | JavaScript runtime |
| **Express.js** | 4.x | HTTP server (API routes alongside Next.js) |
| **Socket.IO Server** | 4.x | WebSocket server for real-time events |
| **Prisma** | 5.x | Type-safe ORM with auto-generated client |
| **NextAuth.js** | 4.x | Authentication (JWT sessions, role-based) |
| **bcrypt** | 5.x | Password hashing |
| **Zod** | 3.x | Request validation |
| **csv-parse** | 5.x | Parsing challenge CSVs for seeding |
| **node-cron** | 3.x | Scheduled jobs (ETA recalculation every 2 min) |

### Database & Storage

| Technology | Purpose |
|---|---|
| **PostgreSQL 15** | Primary relational database |
| **Redis 7** (optional) | Session store + real-time state cache |
| **Cloudinary** (optional) | Photo storage (delivery + discrepancy photos) |
| **Local Docker Volume** | File storage fallback if no Cloudinary |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker** | Container runtime |
| **Docker Compose** | Orchestrate app + db + (redis) |
| **Railway / Render** | Cloud deployment (PostgreSQL + Node.js) |
| **GitHub Actions** | CI: lint + build on every push |
| **GitHub** | Source control (monorepo) |

---

## PART 3 — SYSTEM ARCHITECTURE

```
╔══════════════════════════════════════════════════════════════════╗
║                        CLIENT LAYER                             ║
║  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐ ║
║  │ Dispatcher  │  │   Loader    │  │  Driver  │  │  Store   │ ║
║  │  (Desktop)  │  │  (Tablet)   │  │  (PWA)   │  │  (PWA)   │ ║
║  └──────┬──────┘  └──────┬──────┘  └────┬─────┘  └────┬─────┘ ║
╚═════════╪═══════════════╪═══════════════╪══════════════╪════════╝
          │               │               │              │
          ▼               ▼               ▼              ▼
╔═════════════════════════════════════════════════════════════════╗
║                   APPLICATION LAYER (Next.js)                   ║
║  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐  ║
║  │  REST API Routes │  │  Socket.IO   │  │  NextAuth.js     │  ║
║  │  /api/plans      │  │  Server      │  │  JWT Sessions    │  ║
║  │  /api/trips      │  │  (real-time) │  │  Role-based      │  ║
║  │  /api/orders     │  └──────┬───────┘  └──────────────────┘  ║
║  │  /api/deliveries │         │                                 ║
║  │  /api/alerts     │         │                                 ║
║  └──────────┬───────┘         │                                 ║
╚═════════════╪═════════════════╪═══════════════════════════════╝
              │                 │
╔═════════════╪═════════════════╪═══════════════════════════════╗
║             ▼                 ▼                               ║
║          BUSINESS LOGIC LAYER                                  ║
║  ┌────────────────────────────────────────────────────────┐   ║
║  │  AllocationEngine          ConstraintChecker           │   ║
║  │  TripTimeCalculator        AlertDispatcher             │   ║
║  │  ETACalculator             DeferralManager             │   ║
║  └────────────────────────┬───────────────────────────────┘   ║
╚═══════════════════════════╪═══════════════════════════════════╝
                            │
╔═══════════════════════════╪═══════════════════════════════════╗
║                           ▼                                   ║
║              DATA LAYER (Prisma ORM)                           ║
║  ┌──────────────────────────────────────────────────────┐     ║
║  │              PostgreSQL 15                           │     ║
║  │  vehicles · outlets · districts · calendar           │     ║
║  │  deliveryPlans · trips · orders · deliveries         │     ║
║  │  loadItems · alerts · users                          │     ║
║  └──────────────────────────────────────────────────────┘     ║
╚═══════════════════════════════════════════════════════════════╝
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Next.js monorepo** | All four role UIs share components, types, and auth — no duplication |
| **REST + Socket.IO** | REST for CRUD operations; WebSockets only for real-time push events |
| **Prisma ORM** | Auto-generated types match our Zod schemas — end-to-end type safety |
| **PWA for driver/loader** | Offline-first is non-negotiable; patchy signal in hill districts and warehouses |
| **PostgreSQL over NoSQL** | Relational data (orders, trips, vehicles) is inherently structured; joins are cheap |
| **Docker Compose** | Single command start — critical for judge evaluation |

---

## PART 4 — DATABASE SCHEMA (PRISMA)

```prisma
// prisma/schema.prisma

// ─── REFERENCE DATA (seeded from challenge CSVs) ───────────────

model Vehicle {
  vehicleId        String    @id @map("vehicle_id")
  type             String    // truck | van
  temp             String    // reefer | ambient
  weightCapKg      Float     @map("weight_cap_kg")
  volumeCapM3      Float     @map("volume_cap_m3")
  fuelType         String    @map("fuel_type")
  kmPerL           Float     @map("km_per_l")
  weeklyFuelQuotaL Int       @map("weekly_fuel_quota_l")
  depot            String    // Peliyagoda | Kandy
  trips            Trip[]
  @@map("vehicles")
}

model Outlet {
  outletId           String     @id @map("outlet_id")
  brand              String     // Fresh | Style | Tech
  district           String
  depot              String
  dockType           String     @map("dock_type")   // rear_dock | street | mall_bay
  parkingConstraint  String     @map("parking_constraint")
  mallWindow         String?    @map("mall_window")
  windowOpenTime     String     @map("window_open_time")
  windowCloseTime    String     @map("window_close_time")
  orders             Order[]
  @@map("outlets")
}

model District {
  district                     String  @id
  depot                        String
  roadClass                    String  @map("road_class")
  freeFlowKmh                  Float   @map("free_flow_kmh")
  depotToDistrictKm            Float   @map("depot_to_district_km")
  depotToDistrictFreeflowMin   Float   @map("depot_to_district_freeflow_min")
  interStopKm                  Float   @map("inter_stop_km")
  interStopFreeflowMin         Float   @map("inter_stop_freeflow_min")
  @@map("districts")
}

model ServiceAllowance {
  id                  Int    @id @default(autoincrement())
  brand               String
  dockType            String @map("dock_type")
  serviceAllowanceMin Int    @map("service_allowance_min")
  @@unique([brand, dockType])
  @@map("service_allowances")
}

model CalendarDay {
  date          DateTime @id
  dow           Int
  dowName       String   @map("dow_name")
  isWeekend     Boolean  @map("is_weekend")
  isoYear       Int      @map("iso_year")
  isoWeek       Int      @map("iso_week")
  isPayday      Boolean  @map("is_payday")
  festival      String?
  festivalRamp  Float    @map("festival_ramp")
  isHoliday     Boolean  @map("is_holiday")
  monsoon       Boolean
  isOperating   Boolean  @map("is_operating")
  @@map("calendar")
}

model TrafficSpeed {
  id          Int    @id @default(autoincrement())
  district    String
  hour        Int
  monsoon     Boolean
  speedIndex  Int    @map("speed_index")
  @@unique([district, hour, monsoon])
  @@map("traffic_speeds")
}

// ─── OPERATIONAL DATA ───────────────────────────────────────────

model User {
  userId       String     @id @default(cuid()) @map("user_id")
  name         String
  email        String     @unique
  passwordHash String     @map("password_hash")
  role         String     // dispatcher | loader | driver | store_manager
  depot        String?
  outletId     String?    @map("outlet_id")
  createdAt    DateTime   @default(now()) @map("created_at")
  plans        DeliveryPlan[] @relation("CreatedBy")
  deliveries   Delivery[]
  @@map("users")
}

model DeliveryPlan {
  planId      String   @id @default(cuid()) @map("plan_id")
  date        DateTime
  depot       String
  status      String   @default("draft") // draft | allocated | active | completed
  createdBy   String   @map("created_by")
  creator     User     @relation("CreatedBy", fields: [createdBy], references: [userId])
  createdAt   DateTime @default(now()) @map("created_at")
  trips       Trip[]
  orders      Order[]
  @@map("delivery_plans")
}

model Trip {
  tripId        String   @id @default(cuid()) @map("trip_id")
  planId        String   @map("plan_id")
  plan          DeliveryPlan @relation(fields: [planId], references: [planId])
  vehicleId     String   @map("vehicle_id")
  vehicle       Vehicle  @relation(fields: [vehicleId], references: [vehicleId])
  tripNumber    Int      @map("trip_number")  // 1 or 2
  brand         String
  district      String
  status        String   @default("planned") // planned | loading | en_route | completed | breakdown
  estimatedStartTime  DateTime? @map("estimated_start_time")
  actualStartTime     DateTime? @map("actual_start_time")
  orders        Order[]
  alerts        Alert[]
  @@map("trips")
}

model Order {
  orderId            String    @id @default(cuid()) @map("order_id")
  planId             String    @map("plan_id")
  plan               DeliveryPlan @relation(fields: [planId], references: [planId])
  tripId             String?   @map("trip_id")
  trip               Trip?     @relation(fields: [tripId], references: [tripId])
  outletId           String    @map("outlet_id")
  outlet             Outlet    @relation(fields: [outletId], references: [outletId])
  brand              String
  district           String
  depot              String
  dockType           String    @map("dock_type")
  parkingConstraint  String    @map("parking_constraint")
  tempRequirement    String    @map("temp_requirement")
  orderUnits         Int       @map("order_units")
  orderWeightKg      Float     @map("order_weight_kg")
  orderVolumeM3      Float     @map("order_volume_m3")
  deferredYesterday  Boolean   @default(false) @map("deferred_yesterday")
  daysSinceLastServed Int      @default(0) @map("days_since_last_served")
  stopSequence       Int?      @map("stop_sequence")
  status             String    @default("unassigned") // unassigned | assigned | loading | en_route | delivered | deferred | failed
  decision           String?   // served | deferred
  loadItem           LoadItem?
  delivery           Delivery?
  @@map("orders")
}

model LoadItem {
  loadItemId  String   @id @default(cuid()) @map("load_item_id")
  orderId     String   @unique @map("order_id")
  order       Order    @relation(fields: [orderId], references: [orderId])
  scanStatus  String   @default("pending") // pending | confirmed | rejected
  scannedAt   DateTime? @map("scanned_at")
  loaderId    String?  @map("loader_id")
  @@map("load_items")
}

model Delivery {
  deliveryId    String    @id @default(cuid()) @map("delivery_id")
  orderId       String    @unique @map("order_id")
  order         Order     @relation(fields: [orderId], references: [orderId])
  driverId      String    @map("driver_id")
  driver        User      @relation(fields: [driverId], references: [userId])
  outcome       String    // delivered | partial | not_delivered | outlet_closed
  arrivedAt     DateTime? @map("arrived_at")
  leftAt        DateTime? @map("left_at")
  photoUrl      String?   @map("photo_url")
  signatureUrl  String?   @map("signature_url")
  notes         String?
  discrepancies Discrepancy[]
  @@map("deliveries")
}

model Discrepancy {
  discrepancyId  String   @id @default(cuid()) @map("discrepancy_id")
  deliveryId     String   @map("delivery_id")
  delivery       Delivery @relation(fields: [deliveryId], references: [deliveryId])
  type           String   // short | damaged | wrong_item
  description    String
  photoUrl       String?  @map("photo_url")
  reportedBy     String   @map("reported_by") // store_manager userId
  createdAt      DateTime @default(now()) @map("created_at")
  @@map("discrepancies")
}

model Alert {
  alertId    String   @id @default(cuid()) @map("alert_id")
  type       String   // VEHICLE_BREAKDOWN | OUTLET_CLOSED | LOAD_REJECTED | DELIVERY_FAILED | ETA_RISK
  severity   String   // CRITICAL | HIGH | MEDIUM | LOW
  tripId     String?  @map("trip_id")
  trip       Trip?    @relation(fields: [tripId], references: [tripId])
  payload    Json
  resolved   Boolean  @default(false)
  resolvedAt DateTime? @map("resolved_at")
  createdAt  DateTime @default(now()) @map("created_at")
  @@map("alerts")
}
```

---

## PART 5 — ALLOCATION ENGINE (DETAILED)

The allocation engine is 20% of the Hackathon score. It must handle demand-exceeds-capacity correctly.

### File: `lib/allocation/engine.ts`

```typescript
interface Order {
  orderId: string;
  outletId: string;
  brand: string;
  district: string;
  depot: string;
  dockType: string;
  parkingConstraint: string;
  tempRequirement: string;
  orderWeightKg: number;
  orderVolumeM3: number;
  deferredYesterday: boolean;
  daysSinceLastServed: number;
}

interface Vehicle {
  vehicleId: string;
  type: string;        // truck | van
  temp: string;        // reefer | ambient
  weightCapKg: number;
  volumeCapM3: number;
  depot: string;
  available: boolean;
}

interface Trip {
  tripId: string;
  vehicleId: string;
  tripNumber: number;  // 1 | 2
  brand: string;
  district: string;
  orders: Order[];
  timeBudgetUsed: number;
}

interface AllocationResult {
  trips: Trip[];
  deferred: Order[];
  violations: ConstraintViolation[];
}

// ─── CONSTANTS ────────────────────────────────────────────────
const FRESH_TIME_BUDGET   = 270; // minutes (03:30–08:00)
const DAYTIME_TIME_BUDGET = 480; // minutes (09:00–17:00)
const MAX_TRIPS_PER_VEHICLE = 2;

// ─── STEP 1: PRIORITIZE ORDERS ────────────────────────────────
function prioritizeOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    if (a.deferredYesterday !== b.deferredYesterday)
      return b.deferredYesterday ? 1 : -1;            // deferred_yesterday first
    if (a.daysSinceLastServed !== b.daysSinceLastServed)
      return b.daysSinceLastServed - a.daysSinceLastServed; // longest wait first
    return a.orderVolumeM3 - b.orderVolumeM3;          // smaller orders first (easier to fit)
  });
}

// ─── STEP 2: GROUP BY (BRAND, DISTRICT) ───────────────────────
function groupOrders(orders: Order[]): Map<string, Order[]> {
  const groups = new Map<string, Order[]>();
  for (const order of orders) {
    const key = `${order.brand}:${order.district}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(order);
  }
  return groups;
}

// ─── STEP 3: CONSTRAINT CHECKS ────────────────────────────────
function canVehicleServeOrder(vehicle: Vehicle, order: Order): boolean {
  if (vehicle.depot !== order.depot)                               return false;
  if (order.tempRequirement === 'chilled' && vehicle.temp !== 'reefer') return false;
  if (order.parkingConstraint === 'van_only' && vehicle.type !== 'van') return false;
  return true;
}

function checkCapacity(vehicle: Vehicle, existingOrders: Order[], newOrder: Order): boolean {
  const totalVol = existingOrders.reduce((s, o) => s + o.orderVolumeM3, 0) + newOrder.orderVolumeM3;
  const totalWt  = existingOrders.reduce((s, o) => s + o.orderWeightKg, 0) + newOrder.orderWeightKg;
  return totalVol <= vehicle.volumeCapM3 && totalWt <= vehicle.weightCapKg;
}

function calculateTripTime(
  district: string,
  brand: string,
  orders: Order[],
  districtData: Record<string, any>,
  serviceAllowances: Record<string, number>
): number {
  const d = districtData[district];
  const n = orders.length;
  if (n === 0) return 0;
  return (
    d.depotToDistrictFreeflowMin +
    (n - 1) * d.interStopFreeflowMin +
    orders.reduce((sum, o) => sum + (serviceAllowances[`${brand}:${o.dockType}`] ?? 0), 0)
  );
}

function getTimeBudget(brand: string): number {
  return brand === 'Fresh' ? FRESH_TIME_BUDGET : DAYTIME_TIME_BUDGET;
}

// ─── STEP 4: MAIN ALLOCATION FUNCTION ─────────────────────────
async function allocate(
  orders: Order[],
  vehicles: Vehicle[],
  districtData: Record<string, any>,
  serviceAllowances: Record<string, number>
): Promise<AllocationResult> {
  
  const prioritized = prioritizeOrders(orders);
  const groups = groupOrders(prioritized);
  const trips: Trip[] = [];
  const deferred: Order[] = [];
  
  // Track trips per vehicle
  const vehicleTrips = new Map<string, Trip[]>();
  vehicles.forEach(v => vehicleTrips.set(v.vehicleId, []));

  for (const [groupKey, groupOrders] of groups) {
    const [brand, district] = groupKey.split(':');
    const budget = getTimeBudget(brand);

    // Filter eligible vehicles for this group
    const eligibleVehicles = vehicles.filter(v =>
      v.available &&
      v.depot === groupOrders[0].depot &&
      canVehicleServeOrder(v, groupOrders[0]) &&
      (vehicleTrips.get(v.vehicleId)?.length ?? 0) < MAX_TRIPS_PER_VEHICLE
    );

    for (const order of groupOrders) {
      let assigned = false;

      // Try to add to an existing trip for this (brand, district, vehicle)
      for (const trip of trips) {
        if (trip.brand !== brand || trip.district !== district) continue;
        const vehicle = vehicles.find(v => v.vehicleId === trip.vehicleId)!;
        if (!checkCapacity(vehicle, trip.orders, order)) continue;
        const newTime = calculateTripTime(district, brand, [...trip.orders, order], districtData, serviceAllowances);
        if (newTime > budget) continue;
        trip.orders.push(order);
        trip.timeBudgetUsed = newTime;
        assigned = true;
        break;
      }

      if (assigned) continue;

      // Try to open a new trip on an eligible vehicle
      for (const vehicle of eligibleVehicles) {
        const existingTrips = vehicleTrips.get(vehicle.vehicleId) ?? [];
        if (existingTrips.length >= MAX_TRIPS_PER_VEHICLE) continue;
        if (!checkCapacity(vehicle, [], order)) continue;
        const newTime = calculateTripTime(district, brand, [order], districtData, serviceAllowances);
        if (newTime > budget) continue;

        const newTrip: Trip = {
          tripId: `${vehicle.vehicleId}-T${existingTrips.length + 1}`,
          vehicleId: vehicle.vehicleId,
          tripNumber: existingTrips.length + 1,
          brand, district,
          orders: [order],
          timeBudgetUsed: newTime,
        };
        trips.push(newTrip);
        existingTrips.push(newTrip);
        vehicleTrips.set(vehicle.vehicleId, existingTrips);
        assigned = true;
        break;
      }

      if (!assigned) deferred.push(order);
    }
  }

  return { trips, deferred, violations: [] };
}
```

### API: `POST /api/plans/:id/allocate`
```typescript
router.post('/plans/:id/allocate', requireRole('dispatcher'), async (req, res) => {
  const plan = await db.deliveryPlan.findUnique({ where: { planId: req.params.id }, include: { orders: true } });
  const vehicles = await db.vehicle.findMany({ where: { depot: plan.depot } });
  const availableVehicles = vehicles.filter(v => /* check fleet availability for plan.date */);
  
  const districtData = await db.district.findMany().then(toMap('district'));
  const serviceAllowances = await db.serviceAllowance.findMany().then(toAllowanceMap);
  
  const result = await allocate(plan.orders, availableVehicles, districtData, serviceAllowances);
  
  // Persist allocation
  await db.$transaction([
    ...result.trips.map(trip =>
      db.trip.create({ data: { planId: plan.planId, ...trip } })
    ),
    ...result.deferred.map(order =>
      db.order.update({ where: { orderId: order.orderId }, data: { status: 'deferred', decision: 'deferred' } })
    ),
    db.deliveryPlan.update({ where: { planId: plan.planId }, data: { status: 'allocated' } }),
  ]);
  
  res.json(result);
});
```

---

## PART 6 — REAL-TIME EVENT SYSTEM

### Socket.IO Room Structure
```
Rooms:
  dispatcher:{depot}     ← All dispatchers for a depot
  loader:{vehicleId}     ← Loader assigned to a specific vehicle
  driver:{vehicleId}     ← Driver of a specific vehicle
  outlet:{outletId}      ← Store manager of a specific outlet
```

### Complete Event Taxonomy

| Event Name | Emitter | Receivers | Payload |
|---|---|---|---|
| `vehicle:position` | Driver | Dispatcher | `{ vehicleId, lat, lng, timestamp, nextOutletId }` |
| `trip:started` | Driver | Dispatcher | `{ tripId, vehicleId, timestamp }` |
| `delivery:arrived` | Driver | StoreManager | `{ orderId, outletId, driverName }` |
| `delivery:completed` | Driver | Dispatcher + StoreManager | `{ orderId, outcome, timestamp, photoUrl }` |
| `delivery:outlet_closed` | Driver | Dispatcher + StoreManager | `{ orderId, outletId, reason, photoUrl }` |
| `trip:completed` | Driver | Dispatcher | `{ tripId, completedOrders, deferredOrders }` |
| `load:item_scanned` | Loader | Dispatcher (soft) | `{ orderId, vehicleId, status: ok|rejected }` |
| `load:confirmed` | Loader | Dispatcher | `{ tripId, loaderId, timestamp }` |
| `alert:vehicle_breakdown` | Driver | Dispatcher | `{ vehicleId, tripId, location, pendingOrders }` |
| `alert:created` | Server | Dispatcher | `{ alertId, type, severity, payload }` |
| `alert:resolved` | Dispatcher | Dispatcher | `{ alertId, resolvedBy }` |
| `order:reassigned` | Dispatcher | Driver (new) + StoreManager | `{ orderId, newVehicleId, newEta }` |
| `order:deferred` | Dispatcher / Server | StoreManager | `{ orderId, reason, message }` |
| `eta:updated` | Server (cron) | StoreManager | `{ orderId, newEta, vehicleId }` |

### Server-Side Event Handler: Breakdown
```typescript
io.on('connection', (socket) => {
  socket.on('alert:vehicle_breakdown', async ({ vehicleId, tripId, location }) => {
    // 1. Update trip status
    const trip = await db.trip.update({
      where: { tripId },
      data: { status: 'breakdown' },
      include: { orders: { where: { status: 'en_route' } }, vehicle: true }
    });

    // 2. Find best replacement vehicle
    const suggestion = await findReplacementVehicle(trip);

    // 3. Create alert
    const alert = await db.alert.create({
      data: {
        type: 'VEHICLE_BREAKDOWN',
        severity: 'CRITICAL',
        tripId,
        payload: { vehicleId, location, pendingOrders: trip.orders, suggestion }
      }
    });

    // 4. Push to dispatcher room
    io.to(`dispatcher:${trip.vehicle.depot}`).emit('alert:created', {
      alertId: alert.alertId,
      type: 'VEHICLE_BREAKDOWN',
      severity: 'CRITICAL',
      payload: { vehicleId, pendingOrders: trip.orders, suggestion }
    });

    // 5. Notify store managers of affected outlets
    for (const order of trip.orders) {
      io.to(`outlet:${order.outletId}`).emit('order:deferred', {
        orderId: order.orderId,
        reason: 'VEHICLE_BREAKDOWN',
        message: `Your delivery is delayed due to a vehicle issue. Updated ETA: ${suggestion?.eta ?? 'TBD'}`
      });
    }
  });
});
```

---

## PART 7 — OFFLINE PWA STRATEGY

### Service Worker Config (`next.config.js`)
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Trip manifest — must work offline
      urlPattern: /^\/api\/trips\/.*\/manifest/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'trip-manifest',
        expiration: { maxEntries: 10, maxAgeSeconds: 8 * 60 * 60 }, // 8 hours
      }
    },
    {
      // Trip stops — must work offline
      urlPattern: /^\/api\/trips\/.*\/stops/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'trip-stops',
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50 }
      }
    },
    {
      // API write operations — queue when offline
      urlPattern: /^\/api\/deliveries/,
      handler: 'NetworkOnly',
      options: {
        backgroundSync: {
          name: 'delivery-sync-queue',
          options: { maxRetentionTime: 24 * 60 }, // 24 hours
        }
      }
    }
  ]
});
```

### Offline UI Indicators
- **Driver:** Shows "📴 Offline — 2 deliveries pending sync" banner at top
- **Loader:** Shows "⚠ Offline mode — scans saved locally"
- Both sync automatically when connectivity restores
- IndexedDB used as offline store for pending outcomes

---

## PART 8 — DOCKER CONFIGURATION

### `Dockerfile`
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node server.js"]
```

### `docker-compose.yml`
```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-waypoint}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-waypoint2026}
      POSTGRES_DB: ${POSTGRES_DB:-waypoint_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-waypoint}"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-waypoint}:${POSTGRES_PASSWORD:-waypoint2026}@db:5432/${POSTGRES_DB:-waypoint_db}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:-changeme-in-production}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      NODE_ENV: production

volumes:
  postgres_data:
```

### `.env.example`
```bash
POSTGRES_USER=waypoint
POSTGRES_PASSWORD=waypoint2026
POSTGRES_DB=waypoint_db
DATABASE_URL=postgresql://waypoint:waypoint2026@db:5432/waypoint_db
NEXTAUTH_SECRET=replace-with-random-64-char-string
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## PART 9 — SEEDED ACCOUNTS

| Role | Email | Password | Name | Depot |
|---|---|---|---|---|
| Dispatcher | `dispatcher@waypoint.lk` | `waypoint2026` | Nilantha Perera | Peliyagoda |
| Loader | `loader@waypoint.lk` | `waypoint2026` | Chamara Bandara | Peliyagoda |
| Driver | `driver@waypoint.lk` | `waypoint2026` | Roshan Jayasinghe | Peliyagoda |
| Store Manager | `store@waypoint.lk` | `waypoint2026` | Thilini W. | OUT005 (Colombo) |

### Pre-Seeded Demo Day
The seed script creates a demo delivery day (tomorrow's date at runtime) with:
- 30 orders assigned across 8 vehicles (6 Fresh, 4 Style, 3 Tech)
- 5 orders deliberately deferred (demand exceeds capacity)
- 2 orders with `deferred_yesterday = true` (priority visible)
- 1 van-only order (limited to VEH036/037/038)
- Barcodes for loader scan demo included in README

---

## PART 10 — JUDGE WALKTHROUGH

```
SETUP
──────────────────────────────────────────────
1. git clone https://github.com/BigBug/BigBug_WaypointDelivery
2. cd BigBug_WaypointDelivery
3. cp .env.example .env
4. docker compose up
   Wait for: "✓ Server ready on http://localhost:3000"
5. Open http://localhost:3000 in browser

DISPATCHER FLOW
──────────────────────────────────────────────
6.  Login: dispatcher@waypoint.lk / waypoint2026
7.  See Daily Plan Board for today's demo day
8.  Observe: orange badge on 2 priority orders (deferred_yesterday)
9.  Click "Run Allocation" → watch orders fill into vehicle trip slots
10. See deferred orders appear in right column (demand exceeded capacity)
11. Click VEH006 Trip 1 → see Route Detail with ordered stops
12. Click Live Map → observe vehicle pins for the demo day
13. Trigger breakdown: on Alert panel, click "Simulate: VEH003 Breakdown"
14. See full-screen Route Collapse alert with system suggestion
15. Accept the suggestion → confirm reallocation
16. See store manager notification sent (check in store manager session)

LOADER FLOW
──────────────────────────────────────────────
17. Open new tab / incognito: loader@waypoint.lk / waypoint2026
18. Select VEH006 from the vehicle grid
19. See Trip 1 manifest (stops in sequence, temperature chips)
20. Click "Start Scanning" → camera opens
21. Scan barcode from README (correct item) → green flash ✔
22. Scan barcode 2 (wrong vehicle item) → red full-screen alert fires
23. Dismiss alert, scan correct items → complete Trip 1
24. Sign off → confirm load notification appears in dispatcher alerts

DRIVER FLOW
──────────────────────────────────────────────
25. Open new tab: driver@waypoint.lk / waypoint2026
26. See My Trips (Trip 1: Fresh, Trip 2: Style)
27. Click Start Trip 1
28. See Current Stop for OUT005 (delivery window countdown)
29. Click Navigate → Google Maps deep-link opens (can skip)
30. Click Record Delivery → confirm items → capture photo → sign
31. Submit → success; next stop appears
32. On third stop: click "Outlet Closed" → photo prompt → select reason → submit
33. See alert fired in dispatcher session (check other tab)
34. Complete remaining stops → view Trip Summary → submit

STORE MANAGER FLOW
──────────────────────────────────────────────
35. Open new tab: store@waypoint.lk / waypoint2026
36. See "Upcoming Delivery" card for OUT005 with live ETA
37. Observe ETA update as driver progresses in step 30
38. When driver completes the delivery at OUT005 in step 30:
    → receipt modal appears automatically
39. Confirm items with tap-to-confirm per item
40. Mark one item as "Short quantity" → take photo → submit discrepancy
41. Sign → digital delivery note generated → view PDF
42. Verify: discrepancy appears as alert in dispatcher session

DEGRADATION DEMO
──────────────────────────────────────────────
43. Already demonstrated in step 13 (Route Collapse)
44. Demonstrate Dead Stop: from driver session, hit "Outlet Closed" on step 32
45. Demonstrate Wrong Load: from loader session in step 22
```

---

## PART 11 — DEPARTURES FROM DESIGNATHON DESIGN

*To be documented as the build progresses. Significant changes from the Day 5 design must appear here per the rules.*

| Screen | Planned (Designathon) | Actual (Hackathon) | Reason |
|---|---|---|---|
| D4 Live Map | Real GPS tracking | Simulated positions (cron job) | GPS requires native app; web PWA has limitations |
| L3 Scanner | Native camera | html5-qrcode (web) | Scope decision; same UX outcome |
| R3 Navigation | In-app map | Deep-link to Google Maps | Reliability; out-of-scope navigation engine |

---

## PART 12 — JUDGING CRITERIA & HOW WE ADDRESS EACH

| Criterion | Weight | Our Response |
|---|---|---|
| **Functional completeness** | 20% | All 4 roles implemented; judge walkthrough covers end-to-end flow |
| **Planning & allocation engine** | 20% | Greedy bin-packer with all 9 constraints; tested against check_allocation.py logic |
| **Degradation, offline, recovery** | 10% | Route Collapse + Outlet Closed + Wrong Load + offline PWA queue |
| **Fidelity to Day 5 design** | 10% | Figma screens used as spec; departures documented above |
| **Engineering quality** | 25% | TypeScript end-to-end, Prisma ORM, Zod validation, Docker, GitHub Actions |
| **Creativity** | 5% | Real-time map, barcode scanning, automated ETA push, digital POD |
| **Demo video** | 10% | 5–8 min walkthrough of all 4 roles + architecture explanation |

---

## PART 13 — 5-DAY BUILD SCHEDULE

| Day | Date | Sprint Goal | Key Deliverables |
|---|---|---|---|
| **Day 6** | 30 Sep | Foundation | Repo created, Docker works, DB schema, auth, 4 seeded users, reference data seeded |
| **Day 7** | 1 Oct | Engine + Dispatcher | Allocation engine with constraint validation, Dispatcher Plan Board + Allocation UI |
| **Day 8** | 2 Oct | Loader + Driver | Loader scan flow, Driver stop flow, offline PWA setup |
| **Day 9** | 3 Oct | Store Manager + Real-time | StoreManager receipt flow, Socket.IO events, Breakdown + Outlet Closed degradation flows |
| **Day 10 AM** | 4 Oct | Deploy + Video | Deploy to Railway/Render, seed demo day, record 5–8 min video |
| **Day 10 PM** | 4 Oct | **Submit 11:59 PM** | GitHub repo public, URL live, form submitted |

---

## PART 14 — SUBMISSION CHECKLIST

| Item | Done? |
|---|---|
| ☐ GitHub monorepo: `BigBug_WaypointDelivery` (public) | |
| ☐ `README.md`: setup + credentials + numbered walkthrough + departures | |
| ☐ `docker compose up` → starts full stack + seeds data in one command | |
| ☐ `.env.example` at repo root | |
| ☐ `docs/architecture.md` (Mermaid architecture diagram) | |
| ☐ `docs/data-model.md` (ER diagram + schema description) | |
| ☐ `docs/ai-disclosure.md` (AI tool usage explanation) | |
| ☐ Deployed public URL — accessible without VPN | |
| ☐ 4 seeded accounts confirmed working on deployed URL | |
| ☐ All 4 role flows functional on deployed URL | |
| ☐ Allocation engine handles demand > capacity correctly | |
| ☐ At least 1 degradation flow working end-to-end | |
| ☐ Driver + Loader tested on phone-sized screen | |
| ☐ Demo video 5–8 min — YouTube Unlisted | |
| ☐ Submission form: repo link + URL + credentials + video URL | |
