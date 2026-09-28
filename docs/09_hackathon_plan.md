# 09 · Hackathon — Full Planning & Implementation Guide

> **Product:** Waypoint Flow · **Company:** Waypoint Group  
> **Deadline:** Day 10 · 4 October 2026 · **11:59 PM Sri Lanka Time**  
> **Repo Name:** `BigBug_WaypointDelivery` (GitHub monorepo)  
> **Spec source:** `Docs-ui/` screen specifications (D1–D8 desktop + M1–M7 mobile)

---

## 1. What We Must Build

A **responsive web application** (Waypoint Flow) that lets a judge complete the **full delivery workflow** across all four roles:

```
Store Manager orders → Dispatcher plans → Loader loads → Driver delivers → Store Manager receives
```

### Hard Requirements

1. ✅ Responsive web app (all four roles — desktop dispatcher/loader, mobile driver/store)
2. ✅ Driver + Loader experiences work on phone-sized screens (390 px)
3. ✅ Respects all 9 operating constraints (capacity, temperature, outlet access, delivery windows, depot, brand, van-only, fuel, max trips)
4. ✅ Allocation engine handles demand > capacity (defer mechanism with mandatory reason + store notification)
5. ✅ Judge walkthrough (numbered steps in README — starts with Store Manager placing an order)
6. ✅ Deployed public URL with 4 seeded accounts (one per role)
7. ✅ GitHub monorepo with Docker Compose (`docker compose up` = one-command start)
8. ✅ `docs/` folder: architecture diagram + data model + AI disclosure
9. ✅ Demo video 5–8 min (YouTube unlisted)
10. ✅ Design fidelity to `Docs-ui/` specs (Lucide icons, exact color tokens, status language)

---

## 2. Tech Stack

### Frontend

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR for dispatcher, CSR for driver/loader PWA; one codebase |
| Styling | **Tailwind CSS** | Rapid responsive development, utility-first |
| Component library | **shadcn/ui** | Accessible, unstyled base components |
| State management | **Zustand** | Lightweight, works well with Next.js |
| Real-time | **Socket.IO client** | Live updates, alerts, cross-role events |
| Maps | **Leaflet.js** (OpenStreetMap) | Free, synchronized with list/table view |
| PWA | **next-pwa** | Offline support for driver (field connectivity) |
| Charts | **Recharts** | Capacity bars (weight + volume), dashboard health stats |
| Forms | **React Hook Form + Zod** | Validated inputs with shared schema |
| Camera | **react-webcam** | Photo capture (proof of delivery) |
| Barcode | **html5-qrcode** | Barcode scanner for loader screen |
| **Icons** | **Lucide React** | **Single icon library — mandatory. Outline style, 2 px stroke desktop, 1.75–2 px mobile. No mixing.** |
| Signature | **react-signature-canvas** | Signature pad for delivery sign-off |

### Backend

| Layer | Choice | Reason |
|---|---|---|
| Runtime | **Node.js 20 LTS** | JS ecosystem, same language as frontend |
| Framework | **Express.js** | Lightweight, well-understood |
| Real-time | **Socket.IO** | Bidirectional events for live tracking |
| DB Client | **Firebase Admin SDK** | Database connection and queries |
| Auth | **NextAuth.js** (JWT) | Role-based sessions; invitation-only activation |
| API style | **REST + JSON** | Simple, judge-friendly to inspect |
| Validation | **Zod** (shared schema) | Shared types between FE/BE |
| Scheduled jobs | **node-cron** | ETA recalculation every 2 min |

### Database & Infrastructure

| Item | Choice |
|---|---|
| Database | **Firebase Firestore** |
| Containerisation | **Docker + Docker Compose** |
| Deployment | **Vercel** (Next.js hosting) |
| File storage | **AWS S3** (photo storage) |
| CI | GitHub Actions (lint + type-check + build) |

---

## 3. Visual Design System (from Docs-ui — apply exactly)

### Color Tokens (add to `tailwind.config.js`)

```javascript
colors: {
  'wp-green':   '#146B45',  // brand, navigation selected state
  'wp-action':  '#1F8A5B',  // primary buttons
  'wp-success': '#168050',  // confirmed/delivered state
  'wp-pale':    '#EAF6EF',  // supportive surfaces
  'wp-ink':     '#17221D',  // primary text
  'wp-muted':   '#63716A',  // secondary text
  'wp-border':  '#DCE5DF',  // borders, dividers
  'wp-canvas':  '#F6F8F7',  // page canvas
}
// amber-* for attention/at-risk
// red-* for blocked/failed ONLY
// Never use colour as the only status signal — always pair with label + icon
```

### Typography

- **Font:** Inter (Google Fonts)
- Page titles: 28–32 px / 600 weight
- Section headings: 18–20 px / 600
- Body: 14–16 px desktop, **16 px minimum mobile**
- Tabular data: 14 px / `font-variant-numeric: tabular-nums`

### Shape

- Cards/controls: 10 px border-radius
- Large panels/sheets: 14 px border-radius
- Borders: `1px solid #DCE5DF`
- Shadows: sparse and soft only

### 9-State Status Language (consistent across ALL roles)

| Status | Color | When |
|---|---|---|
| `Needs planning` | grey | Order submitted, not in a plan |
| `Planned` | wp-green | Assigned to a trip |
| `Loading` | amber | Loader actively loading |
| `Ready to depart` | wp-action | All items scanned, loader signed off |
| `On route` | wp-green | Driver started trip |
| `Delivered` | wp-success | Confirmed at stop |
| `Issue reported` | amber | Discrepancy or access issue |
| `Deferred` | grey/amber | Cannot be served — **reason always shown** |
| `Offline` | amber | Device lost connectivity |

### Lucide Icon Reference (key icons)

```
Snowflake         → refrigerated badge (always pair with "Refrigerated" text)
Truck             → vehicle/fleet
Route             → planning navigation
Activity          → operations dashboard
ScanBarcode       → loader scanning
CloudOff          → offline state
RefreshCw         → sync
CircleCheck       → success/completion
CircleX           → blocked/failed
Clock3            → deferred (+ reason text)
TriangleAlert     → at-risk warning (use sparingly)
```

---

## 4. Screen-to-Route Mapping (from Docs-ui)

### Desktop Screens

| Screen spec | Route | Primary role | Key feature |
|---|---|---|---|
| `D1_Dispatcher_Operations_Overview.md` | `/dispatcher` | Dispatcher | Health strip + map + exception queue + trips table |
| `D2_Dispatcher_Plan_Builder.md` | `/dispatcher/plan` | Dispatcher | 3-column: orders + route canvas + vehicle inspector |
| `D3_Dispatcher_Deferral_Impact.md` | `/dispatcher/deferral/[orderId]` | Dispatcher | Deliberate deferral + mandatory reason + store notification |
| `D4_Loader_Load_Board.md` | `/loader` | Loader | Reverse stop order + barcode scan + 5-item checklist |
| `D5_Loader_Loading_Shortfall.md` | `/loader` (overlay) | Loader | Shortfall panel without losing loading context |
| `D6_Store_Order_Composer.md` | `/store/orders/new` | Store Manager | 2-pane order form + cut-off validation before submit |
| `D7_Store_Order_Tracking_and_Receipt.md` | `/store/orders/[orderId]` | Store Manager | Timeline + deferred branch + line-item receipt |
| `D8_Authentication.md` | `/login` (desktop) | All | Split layout + activation flow |

### Mobile Screens

| Screen spec | Route | Primary role | Key feature |
|---|---|---|---|
| `M1_Driver_Today.md` | `/driver` | Driver | Trip card (disabled until `load:confirmed`) + connection pill |
| `M2_Driver_Route_and_Stop.md` | `/driver/route` | Driver | In-transit + parked modes + route drawer |
| `M3_Driver_Proof_of_Delivery.md` | `/driver/delivery/[orderId]` | Driver | 3-step POD + offline labelled `"Saved on this phone"` |
| `M4_Driver_Offline_and_Sync.md` | `/driver/sync` | Driver | Amber banner + sync centre + conflict card |
| `M5_Store_Mobile_Home.md` | `/store` | Store Manager | Hero delivery card + deferred hero alternate |
| `M6_Store_Mobile_Order_and_Tracking.md` | `/store/orders` | Store Manager | Order → Track → Confirm receipt |
| `M7_Authentication.md` | `/login` (mobile) | All | Splash + sign in + offline sign-in message |

---

## 5. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER / PWA                            │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Dispatcher │  │   Loader   │  │  Driver  │  │Store Manager│  │
│  │ (desktop)  │  │ (tablet)   │  │  (PWA)   │  │  (PWA/web)  │  │
│  └─────┬──────┘  └─────┬──────┘  └────┬─────┘  └──────┬──────┘  │
└────────┼───────────────┼──────────────┼────────────────┼─────────┘
         │          HTTPS / WebSocket   │                │
         ▼               ▼             ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Next.js App Server (Node.js)                    │
│  ┌────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ API Routes │  │  Socket.IO Server │  │  NextAuth.js (JWT)  │  │
│  │ /api/...   │  │  (real-time)      │  │  Role-based sessions │  │
│  └─────┬──────┘  └────────┬─────────┘  └──────────────────────┘  │
│        │                  │                                        │
│  ┌─────▼──────────────────▼──────────────────────────────────┐    │
│  │                  Business Logic Layer                       │    │
│  │  AllocationEngine · ConstraintChecker · ETACalculator      │    │
│  │  TripTimeCalculator · AlertDispatcher · DeferralManager    │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Firebase Admin SDK │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Firebase Firestore │
                    │  (seeded from      │
                    │   challenge CSVs)  │
                    └────────────────────┘
```

---

## 6. Allocation Engine — 9 Constraints

```typescript
// lib/allocation/constraints.ts

const FRESH_TIME_BUDGET   = 270; // min (03:30–08:00)
const DAYTIME_TIME_BUDGET = 480; // min (09:00–17:00)
const MAX_TRIPS_PER_VEHICLE = 2;

// C1: Depot match
// C2: Temperature (chilled → reefer only)
// C3: Van-only parking constraint
function canVehicleServeOrder(vehicle, order): boolean {
  if (vehicle.depot !== order.depot)                               return false;
  if (order.tempRequirement === 'chilled' && vehicle.temp !== 'reefer') return false;
  if (order.parkingConstraint === 'van_only' && vehicle.type !== 'van') return false;
  return true;
}

// C4: Weight capacity
// C5: Volume capacity
function checkCapacity(vehicle, existingOrders, newOrder): boolean {
  const totalVol = existingOrders.reduce((s, o) => s + o.orderVolumeM3, 0) + newOrder.orderVolumeM3;
  const totalWt  = existingOrders.reduce((s, o) => s + o.orderWeightKg, 0) + newOrder.orderWeightKg;
  return totalVol <= vehicle.volumeCapM3 && totalWt <= vehicle.weightCapKg;
}

// C6 + C7: Time budget per brand
function getTimeBudget(brand: string): number {
  return brand === 'Fresh' ? FRESH_TIME_BUDGET : DAYTIME_TIME_BUDGET;
}

// C8: Max 2 trips per vehicle → enforced via vehicleTrips map
// C9: One brand + one district per trip → enforced via group key `brand:district`
```

**Allocation Algorithm:**
1. Prioritize: `deferred_yesterday` first → `days_since_last_served` DESC → `order_volume_m3` ASC
2. Group by `(brand, district)` key — only same-group orders share a trip
3. For each group, greedily bin-pack into eligible vehicles
4. Unassignable orders → status = `deferred`, mandatory `deferralReason` field set

### Allocation API

```
POST /api/plans                    → Create plan for a date + depot
POST /api/plans/:id/allocate       → Run allocation engine + persist results
GET  /api/plans/:id                → Full plan with trips + orders
PATCH /api/plans/:id/publish       → Publish plan → triggers loader notification
POST /api/orders/:id/defer         → Manual deferral + reason (required)
PUT  /api/trips/:id/orders         → Manual reassignment (dispatcher override)
```

---

## 7. Data Model

### Core Collections (NoSQL)

*(Note: The following relational structure will be mapped to Firestore Document Collections.)*

```text
-- Reference data (seeded from challenge CSVs)
Vehicle        (vehicle_id, type, temp, weight_cap_kg, volume_cap_m3, depot, weekly_fuel_quota_l, ...)
Outlet         (outlet_id, name, brand, district, depot, dock_type, parking_constraint, window_open_time, window_close_time, ...)
District       (district, depot, depot_to_district_freeflow_min, inter_stop_freeflow_min, ...)
ServiceAllow   (brand, dock_type, service_allowance_min)
Calendar       (date, is_payday, festival, is_holiday, monsoon, is_operating)
TrafficSpeed   (district, hour, monsoon, speed_index)

-- Operational data
User           (user_id, name, role, email, password_hash, depot, outlet_id)
DeliveryPlan   (plan_id, date, depot, status, created_by, published_at)
Trip           (trip_id, plan_id, vehicle_id, trip_number, brand, district, status, estimated_start_time)
Order          (order_id, plan_id, trip_id, outlet_id, status, decision, deferral_reason*, deferral_note, revised_delivery_date, ...)
LoadItem       (load_item_id, order_id, trip_id, scan_status, loader_id, shortfall_type, shortfall_qty, shortfall_note)
Delivery       (delivery_id, order_id, driver_id, outcome, arrived_at, photo_url, signature_url, synced_at)
Discrepancy    (discrepancy_id, delivery_id, type, quantity, description, photo_url, reported_by)
Alert          (alert_id, type, severity, trip_id, payload, resolved, resolved_by)
```

> **`deferral_reason`** — `NOT NULL` when `status = 'deferred'`. Never a silent deferral.  
> **`synced_at`** — `NULL` means delivery outcome saved locally on driver device only.

### Key Relationships
```
DeliveryPlan → Trip (1:many)
Trip → Order (1:many)
Trip → Vehicle (many:1)
Order → Outlet (many:1)
Order → LoadItem (1:1)
Order → Delivery (1:1)
Delivery → Discrepancy (1:many)
Alert → Trip (many:1)
```

---

## 8. Real-Time Events (Socket.IO)

### Room Structure
```
dispatcher:{depot}    ← All dispatchers for that depot
loader:{vehicleId}    ← Loader for a specific vehicle
driver:{vehicleId}    ← Driver for a specific vehicle
outlet:{outletId}     ← Store manager of a specific outlet
```

### Key Events

| Event | Direction | Payload |
|---|---|---|
| `vehicle:position` | Driver → Dispatcher | `{ vehicleId, lat, lng, timestamp, nextOutletId }` |
| `trip:started` | Driver → Dispatcher | `{ tripId, vehicleId, timestamp }` |
| `delivery:arrived` | Driver → StoreManager | `{ orderId, outletId }` |
| `delivery:completed` | Driver → Dispatcher + StoreManager | `{ orderId, outcome, timestamp }` |
| `delivery:outlet_closed` | Driver → Dispatcher + StoreManager | `{ orderId, outletId, reason }` |
| `load:item_scanned` | Loader → Dispatcher | `{ orderId, vehicleId, status: ok\|shortfall }` |
| `load:shortfall` | Loader → Dispatcher | `{ orderId, tripId, shortfallType, qty }` |
| `load:confirmed` | Loader → Dispatcher + **Driver** | `{ tripId, loaderId, timestamp }` |
| `alert:vehicle_breakdown` | Driver → Dispatcher | `{ vehicleId, tripId, location }` |
| `alert:created` | Server → Dispatcher | `{ alertId, type, severity, payload }` |
| `order:deferred` | Dispatcher/Server → StoreManager | `{ orderId, reason, revisedDate, message }` |
| `eta:updated` | Server (cron) → StoreManager | `{ orderId, newEta, vehicleId }` |

> **`load:confirmed`** triggers the Driver Today screen to enable "Start trip" button.

---

## 9. Offline & Degradation

### PWA Offline Strategy (Driver primary; Loader secondary)

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  runtimeCaching: [
    {
      urlPattern: /^\/api\/trips\/.*\/manifest/,
      handler: 'CacheFirst',      // Trip manifest — must work offline
      options: { cacheName: 'trip-manifest', expiration: { maxAgeSeconds: 8 * 3600 } }
    },
    {
      urlPattern: /^\/api\/trips\/.*\/stops/,
      handler: 'NetworkFirst',    // Try network, fallback to cache
      options: { cacheName: 'trip-stops', networkTimeoutSeconds: 5 }
    },
    {
      urlPattern: /^\/api\/deliveries/,
      handler: 'NetworkOnly',
      options: {
        backgroundSync: { name: 'delivery-sync-queue', options: { maxRetentionTime: 24 * 60 } }
      }
    }
  ]
});
```

### Offline UI Rules (mandatory from Docs-ui spec)

| Rule | Implementation |
|---|---|
| Offline banner text | `"You're offline. Your route and delivery records are available on this phone."` — amber, non-blocking, persistent |
| State labelling | `"Saved on this phone"` when offline — NEVER `"Synced"` or `"Submitted"` |
| Sync now button | Disabled when offline. Active only when connected. |
| Conflict | Show old vs new stop info — `Review difference` + `Contact operations`. Never silent overwrite. |
| Reconnection | Show count synced + link to activity. No false all-clear. |

### Three Degradation Flows (must all be implemented)

1. **Vehicle Breakdown:** Driver reports → Trip status → `breakdown` → Alert to dispatcher with replacement suggestion → Store managers of affected outlets receive `order:deferred` event
2. **Loading Shortfall:** Loader records missing/damaged item → D5 Shortfall panel → `load:shortfall` event → Dispatcher exception queue → Resolution: adjusted quantities on driver manifest + store notification
3. **Driver Offline:** Amber banner + queue to IndexedDB → Sync when reconnected → M4 Sync Centre with queued list + conflict card if route changed while offline

---

## 10. Docker Setup

### Judge Start Command (in README)
```bash
git clone https://github.com/BigBug/BigBug_WaypointDelivery
cd BigBug_WaypointDelivery
cp .env.example .env
docker compose up
# Wait for: "✓ Server ready on http://localhost:3000"
```

### `docker-compose.yml` Key Config
```yaml
services:
  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U waypoint"]
      interval: 10s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    command: sh -c "npm run seed:firebase && node server.js"
```

---

## 11. Monorepo Structure

```
BigBug_WaypointDelivery/
├── README.md                           ← Setup + credentials + numbered walkthrough + departures
├── docker-compose.yml
├── .env.example
├── Dockerfile
│
├── app/                                ← Next.js App Router
│   ├── (auth)/login/page.tsx           ← D8/M7 Authentication
│   ├── dispatcher/
│   │   ├── page.tsx                    ← D1: Operations Overview
│   │   ├── plan/page.tsx               ← D2: Plan Builder
│   │   └── deferral/[orderId]/page.tsx ← D3: Capacity Deferral
│   ├── loader/page.tsx                 ← D4: Load Board + D5: Shortfall panel
│   ├── driver/
│   │   ├── page.tsx                    ← M1: Driver Today
│   │   ├── route/page.tsx              ← M2: Route & Stop
│   │   ├── delivery/[orderId]/page.tsx ← M3: Proof of Delivery
│   │   └── sync/page.tsx               ← M4: Offline & Sync Centre
│   └── store/
│       ├── page.tsx                    ← M5: Store Manager Home
│       └── orders/
│           ├── new/page.tsx            ← D6: Order Composer
│           └── [orderId]/page.tsx      ← D7/M6: Tracking + Receipt
│
├── components/
│   ├── ui/                             ← shadcn/ui base
│   ├── layout/                         ← DesktopShell · MobileShell · ConnectionPill
│   ├── dispatcher/                     ← HealthStrip · RouteMap · ExceptionQueue · TripsTable · PlanBuilder/
│   ├── loader/                         ← VehicleLaneBoard · LoadingChecklist · BarcodeScanner · ShortfallPanel
│   ├── driver/                         ← TripCard · StopCard · OfflineBanner · SyncCentre · pod/
│   ├── store/                          ← DeliveryHeroCard · OrderTimeline · ReceiptTable · ReportIssueSheet
│   └── shared/                         ← StatusChip · CapacityBar · SnowflakeBadge · AlertBanner
│
├── lib/
│   ├── allocation/engine.ts            ← Allocation engine (all 9 constraints)
│   ├── socket/server.ts                ← Socket.IO server
│   ├── offline/queue.ts                ← IndexedDB queue for driver
│   └── db/firebase.ts                  ← Firebase Admin singleton
│
├── firebase/
│   ├── firestore.rules
│   └── seed.ts                         ← CSV → DB seed
│
├── public/
│   ├── manifest.json                   ← PWA manifest
│   ├── sw.js                           ← Service worker
│   └── assets/                         ← Illustrations from Docs-ui/generated-assets/
│       ├── brand/waypoint-flow-mark.svg
│       ├── brand/waypoint-flow-horizontal.svg
│       ├── web/auth-route-motif.png
│       ├── web/no-active-route.png
│       ├── mobile/splash-route.png
│       ├── mobile/login-route-accent.png
│       ├── mobile/no-assigned-trip.png
│       └── mobile/offline-records-safe.png
│
└── docs/
    ├── architecture.md                 ← Mermaid diagram
    ├── data-model.md                   ← ER diagram + schema description
    └── ai-disclosure.md                ← AI tool usage disclosure
```

---

## 12. Seeded Accounts

| Role | Email | Password | Name |
|---|---|---|---|
| Dispatcher | `dispatcher@waypoint.lk` | `waypoint2026` | Nilantha Perera |
| Loader | `loader@waypoint.lk` | `waypoint2026` | Chamara Bandara |
| Driver | `driver@waypoint.lk` | `waypoint2026` | Roshan Jayasinghe |
| Store Manager | `store@waypoint.lk` | `waypoint2026` | Thilini W. |

### Demo Day Data (seeded at runtime = tomorrow's date)
- 30 orders across 8 vehicles (6 Fresh, 4 Style, 3 Tech)
- 5 orders deliberately deferred (demand > capacity)
- 2 orders with `deferredYesterday = true` (priority badge visible)
- 1 van-only order (limited to VEH036–038)
- OUT005 seeded to receive delivery via VEH006 Trip 1 (links to store manager view)

---

## 13. Judge Walkthrough (for README)

```
1.  git clone → cp .env.example .env → docker compose up
2.  Open http://localhost:3000

[Store Manager — place an order first]
3.  Login: store@waypoint.lk / waypoint2026
4.  Tap "New order" → select date → add items → Review → Submit
5.  See: "Submitted — awaiting plan"

[Dispatcher — plan, allocate, and defer]
6.  New tab: dispatcher@waypoint.lk / waypoint2026
7.  See Operations Overview with morning health strip
8.  Open Plan Builder → click "Auto-suggest"
9.  See orders fill into trips; deferred appear in impact tray
10. Click deferred order → Deferral page → select reason → "Confirm & notify store"
11. Click "Publish plan" → publish confirmation → confirm

[Loader — load in reverse stop order]
12. New tab: loader@waypoint.lk / waypoint2026
13. Select VEH006 → see "Load Stop 6 first → Stop 1 last"
14. Scan correct item → green flash ✔
15. Scan wrong item → Shortfall panel → escalate to dispatcher
16. Complete all items → "Ready to depart" → driver notified

[Driver — deliver and handle offline]
17. New tab: driver@waypoint.lk / waypoint2026
18. See Trip 1 "Ready to depart" → "Start trip" (from parked)
19. Stop 1: "I'm parked" → 3-step POD → Complete stop
20. Stop 3: "Report a problem" → Outlet Closed → photo → submit
21. Toggle airplane mode → offline banner appears → complete stop offline
22. Reconnect → Sync Centre → "Sync now" → 2 records synced

[Store Manager — receive and confirm]
23. Return to store tab
24. Hero card shows "Delivered"
25. "Confirm receipt" → line-item table → mark discrepancy → confirm
26. See deferred order with reason (from step 10)
```

---

## 14. 5-Day Build Plan

| Day | Date | Sprint Goal | Key Deliverables |
|---|---|---|---|
| **Day 6** | 30 Sep | Foundation | Repo + Docker + Firebase rules + NextAuth + 4 seeded users + all reference data seeded (CSVs → DB) |
| **Day 7** | 1 Oct | Engine + Dispatcher | Allocation engine (9 constraints) + D1 Operations Overview + D2 Plan Builder + D3 Deferral page |
| **Day 8** | 2 Oct | Loader + Driver | D4 Load Board + D5 Shortfall panel + M1 Driver Today + M2 Route & Stop + M3 Proof of Delivery + offline PWA |
| **Day 9** | 3 Oct | Store + Real-time | D6 Order Composer + D7 Tracking/Receipt + M5 Home + M6 Order/Receipt + M4 Sync Centre + all Socket.IO events |
| **Day 10 AM** | 4 Oct | Auth + Deploy + Polish | D8/M7 Auth flows + deploy to Vercel + seed demo day + final cross-role test |
| **Day 10 PM** | 4 Oct | **Submit 11:59 PM** | Record 5–8 min demo video → repo public → URL live → form submitted |

---

## 15. Judging Criteria Mapping

| Criterion | Weight | How We Address It |
|---|---|---|
| **Functional completeness** | 20% | All 4 roles end-to-end; walkthrough covers Store → Dispatcher → Loader → Driver → Store receipt |
| **Planning & allocation engine** | 20% | Greedy bin-packer, all 9 constraints, tested against `check_allocation.py`; deferred list auditable |
| **Degradation, offline, recovery** | 10% | Breakdown + outlet closed + loading shortfall + offline PWA queue + sync centre |
| **Fidelity to Day 5 design** | 10% | Lucide icons exclusively, exact color tokens (#146B45 etc.), 9-state status language, screen specs from Docs-ui |
| **Engineering quality** | 25% | TypeScript end-to-end, Firebase Admin SDK, shared Zod, Docker one-command, GitHub Actions CI |
| **Creativity** | 5% | Real-time Leaflet map, barcode scanner, automated ETA push, digital POD, offline sync centre |
| **Demo video** | 10% | 5–8 min: all 4 roles + architecture + allocation engine explanation |

---

## 16. Departures from Designathon Design

| Screen | Designathon Plan | Hackathon Implementation | Reason |
|---|---|---|---|
| D1 Live Map | Real GPS vehicle tracking | Simulated positions via cron job | GPS requires native app; web PWA browser limitation |
| D4 Scanner | Native camera | `html5-qrcode` web library | Scope decision; same functional outcome |
| M2 Navigation | In-app turn-by-turn | Deep-link to Google Maps | Out-of-scope navigation engine |

---

## 17. Submission Checklist

| Item | Done? |
|---|---|
| ☐ GitHub monorepo: `BigBug_WaypointDelivery` (public) | |
| ☐ `README.md`: setup + credentials + numbered walkthrough + departures | |
| ☐ `docker compose up` → starts full stack + seeds data | |
| ☐ `.env.example` at repo root | |
| ☐ `docs/architecture.md` (Mermaid diagram) | |
| ☐ `docs/data-model.md` (ER diagram + schema description) | |
| ☐ `docs/ai-disclosure.md` | |
| ☐ Deployed public URL (no VPN required) | |
| ☐ 4 seeded accounts confirmed working on deployed URL | |
| ☐ All 4 role flows functional end-to-end | |
| ☐ Allocation engine handles demand > capacity (deferred list visible) | |
| ☐ Deferral requires mandatory reason + notifies store manager | |
| ☐ At least 1 degradation flow end-to-end | |
| ☐ Offline queue works — `"Saved on this phone"` label visible | |
| ☐ Driver + Loader tested on 390 px screen | |
| ☐ Lucide icons only — no mixed icon libraries | |
| ☐ Status language consistent across all roles (9 states) | |
| ☐ Demo video 5–8 min YouTube Unlisted | |
| ☐ Submission form: repo + URL + credentials + video | |
