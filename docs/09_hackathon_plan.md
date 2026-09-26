# 09 · Hackathon — Full Planning & Implementation Guide

> **Deadline:** Day 10 · 4 October 2026 · **11:59 PM Sri Lanka Time**  
> **Repo Name:** `BigBug_WaypointDelivery` (GitHub monorepo)  
> **Deployed URL:** TBD (deploy before deadline, keep live through review)

---

## 1. What We Must Build

A **responsive web application** that lets a judge complete the **full delivery workflow** across all four roles:

```
Store Manager orders → Dispatcher plans → Loader loads → Driver delivers → Store Manager receives
```

### Hard Requirements
1. ✅ Responsive web app (all four roles)
2. ✅ Driver + Loader experiences must work on phone-sized screens
3. ✅ Respects operating constraints: capacity, temperature, outlet access, delivery windows, fuel quotas
4. ✅ Allocation engine handles demand > capacity (defer mechanism)
5. ✅ Judge walkthrough (numbered steps in README)
6. ✅ Deployed public URL with 4 seeded accounts (one per role)
7. ✅ GitHub monorepo with Docker Compose
8. ✅ `docs/` folder: architecture diagram + data model
9. ✅ AI tool disclosure in `docs/`
10. ✅ Demo video 5–8 min (YouTube unlisted)

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
| Charts | **Recharts** | Capacity bars (weight + volume), dashboard stats |
| Forms | **React Hook Form + Zod** | Validated inputs |
| Camera | **react-webcam** | Photo capture (proof of delivery) |
| Barcode | **html5-qrcode** | Barcode scanner for loader screen |
| Icons | **Lucide React** | Consistent outline icon family (1.75–2 px stroke) |

### Backend
| Layer | Choice | Reason |
|---|---|---|
| Runtime | **Node.js 20 LTS** | JS ecosystem, same language as frontend |
| Framework | **Express.js** | Lightweight, well-understood |
| Real-time | **Socket.IO** | Bidirectional events for live tracking |
| ORM | **Prisma** | Type-safe DB queries, migrations |
| Auth | **NextAuth.js** (JWT) | Role-based sessions |
| API style | **REST + JSON** | Simple, judge-friendly to inspect |
| Validation | **Zod** (shared schema) | Shared types between FE/BE |

### Database
| Choice | Reason |
|---|---|
| **PostgreSQL 15** | Relational data fits perfectly (orders, vehicles, trips) |
| Redis (optional) | Real-time caching for live positions |

### Infrastructure
| Item | Choice |
|---|---|
| Containerisation | **Docker + Docker Compose** |
| Deployment | **Railway** or **Render** (free tier, persistent PostgreSQL) |
| File storage | Local volume (Docker) / Cloudinary (photos) |
| CI | GitHub Actions (lint + build check) |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER / PWA                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────┐  ┌───────────┐  │
│  │  Dispatcher  │  │    Loader    │  │Driver│  │Store Mgr  │  │
│  │  (desktop)   │  │  (tablet)    │  │(mob) │  │  (mob)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──┬───┘  └─────┬─────┘  │
│         │                 │             │             │         │
└─────────┼─────────────────┼─────────────┼─────────────┼─────────┘
          │           HTTPS / WebSocket   │             │
          ▼                 ▼             ▼             ▼
┌────────────────────────────────────────────────────────────────┐
│                  Next.js App Server (Node.js)                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  API Routes  │  │  Socket.IO Server │  │  Auth (NextAuth) │ │
│  │  /api/...    │  │  (real-time)      │  │  JWT sessions    │ │
│  └──────┬───────┘  └────────┬─────────┘  └──────────────────┘ │
│         │                   │                                   │
│  ┌──────▼───────────────────▼──────────────────────────────┐   │
│  │              Business Logic Layer                        │   │
│  │  AllocationEngine · TripTimeCalculator · ConstraintCheck │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                ┌─────────▼──────────┐
                │    Prisma ORM      │
                └─────────┬──────────┘
                          │
                ┌─────────▼──────────┐
                │   PostgreSQL 15    │
                │  (seeded with      │
                │   challenge data)  │
                └────────────────────┘
```

---

## 4. Data Model

### Core Tables

```sql
-- Reference data (seeded from challenge CSVs)
Vehicle       (vehicle_id, type, temp, weight_cap_kg, volume_cap_m3, depot, ...)
Outlet        (outlet_id, brand, district, depot, dock_type, parking_constraint, ...)
District      (district, depot, depot_to_district_freeflow_min, inter_stop_freeflow_min, ...)
ServiceAllow  (brand, dock_type, service_allowance_min)
Calendar      (date, is_payday, festival, is_holiday, monsoon, is_operating)
TrafficSpeed  (district, hour, monsoon, speed_index)

-- Operational data
DeliveryPlan  (plan_id, date, depot, status, created_by)
Trip          (trip_id, plan_id, vehicle_id, trip_number, brand, district, status)
Order         (order_id, plan_id, trip_id, outlet_id, status, order_weight_kg, order_volume_m3, ...)
LoadItem      (load_item_id, order_id, trip_id, scan_status, scanned_at, loader_id)
Delivery      (delivery_id, order_id, driver_id, outcome, arrived_at, left_at, photo_url, signature_url)
Alert         (alert_id, type, payload, severity, resolved, created_at)
User          (user_id, name, role, email, password_hash, depot)
```

### Key Relationships
```
DeliveryPlan → Trip (1:many)
Trip → Order (1:many)  
Trip → Vehicle (many:1)
Order → Outlet (many:1)
Order → LoadItem (1:1)
Order → Delivery (1:1)
Alert → Trip / Vehicle (polymorphic)
```

---

## 5. Allocation Engine

The allocation engine is the **core intellectual challenge** of the Hackathon (20% of score).

### Constraints to Enforce
```javascript
// src/lib/allocation/constraints.ts

const CONSTRAINTS = {
  MAX_TRIPS_PER_VEHICLE: 2,
  FRESH_TIME_BUDGET_MIN: 270,   // 03:30–08:00 window
  DAYTIME_TIME_BUDGET_MIN: 480, // 09:00–17:00 window
};

function tripTime(district, brand, stops, districtTravel, serviceAllow) {
  const d = districtTravel[district];
  const n = stops.length;
  if (n === 0) return 0;
  return (
    d.depot_to_district_freeflow_min +
    (n - 1) * d.inter_stop_freeflow_min +
    stops.reduce((sum, s) => sum + serviceAllow[`${brand}:${s.dock_type}`], 0)
  );
}

function checkVehicleConstraints(vehicle, orders) {
  const totalVol = orders.reduce((s, o) => s + o.order_volume_m3, 0);
  const totalWt  = orders.reduce((s, o) => s + o.order_weight_kg, 0);
  if (totalVol > vehicle.volume_cap_m3) return { ok: false, reason: 'VOLUME_EXCEEDED' };
  if (totalWt  > vehicle.weight_cap_kg) return { ok: false, reason: 'WEIGHT_EXCEEDED' };
  if (orders.some(o => o.temp_requirement === 'chilled') && vehicle.temp !== 'reefer')
    return { ok: false, reason: 'TEMP_MISMATCH' };
  if (orders.some(o => o.parking_constraint === 'van_only') && vehicle.type !== 'van')
    return { ok: false, reason: 'PARKING_CONSTRAINT' };
  return { ok: true };
}
```

### Allocation Algorithm
```
1. Sort orders by priority:
   - deferred_yesterday = 1 → highest priority
   - days_since_last_served DESC
   - order_volume_m3 ASC (smaller first — easier to fit)

2. Group orders by (brand, district) — only same-group can share a trip

3. For each group, greedily bin-pack into available vehicles:
   a. Filter vehicles: depot match + availability + temp + parking
   b. For each vehicle (sorted by remaining capacity DESC):
      - Attempt to fill trip 1, then trip 2
      - Check capacity constraints
      - Check time budget constraint
      - If fits → assign; else → try next vehicle

4. Any order that cannot be assigned → decision = 'deferred'

5. Return allocation plan + deferred list
```

### API Endpoints
```
POST /api/plans                   → Create a plan for a date
POST /api/plans/:id/allocate      → Run allocation engine
GET  /api/plans/:id               → Get full plan with trips + orders
PUT  /api/trips/:id/orders        → Manual reassignment (dispatcher override)
POST /api/orders/:id/defer        → Manually defer an order
GET  /api/constraints/validate    → Validate current allocation
```

---

## 6. Role-Based Routes & Pages

### Next.js App Router Structure
```
app/
├── (auth)/
│   └── login/page.tsx              ← Login page
│
├── dispatcher/
│   ├── layout.tsx                  ← Desktop layout (sidebar nav)
│   ├── page.tsx                    ← D1: Daily Plan Board
│   ├── allocate/page.tsx           ← D2: Order Allocation
│   ├── routes/[tripId]/page.tsx    ← D3: Route Detail
│   ├── live/page.tsx               ← D4: Live Operations Map
│   └── alerts/page.tsx             ← D5: Alert Console
│
├── loader/
│   ├── layout.tsx                  ← Tablet layout
│   ├── page.tsx                    ← L1: Vehicle Assignment
│   ├── manifest/[tripId]/page.tsx  ← L2: Trip Manifest
│   └── scan/[tripId]/page.tsx      ← L3: Scan & Load
│
├── driver/
│   ├── layout.tsx                  ← Mobile layout (bottom nav)
│   ├── page.tsx                    ← R1: My Trips
│   ├── stop/[orderId]/page.tsx     ← R2: Current Stop
│   └── summary/[tripId]/page.tsx   ← R6: Trip Summary
│
└── store/
    ├── layout.tsx                  ← Mobile layout
    ├── page.tsx                    ← S1: Upcoming Delivery
    └── receipt/[deliveryId]/page.tsx ← S3: Delivery Receipt
```

---

## 7. Real-Time Events (Socket.IO)

| Event | Direction | Payload |
|---|---|---|
| `vehicle:position` | Driver → Server → Dispatcher | `{ vehicleId, lat, lng, timestamp }` |
| `delivery:arrived` | Driver → Server → StoreManager | `{ orderId, outletId, eta: null }` |
| `delivery:completed` | Driver → Server → Dispatcher + StoreManager | `{ orderId, outcome, timestamp }` |
| `order:deferred` | Dispatcher → Server → StoreManager | `{ orderId, reason, newEta }` |
| `alert:created` | Server → Dispatcher | `{ alertId, type, severity, payload }` |
| `vehicle:breakdown` | Driver → Server → Dispatcher | `{ vehicleId, tripId, location }` |
| `load:confirmed` | Loader → Server → Dispatcher | `{ tripId, loaderId, timestamp }` |
| `scan:rejected` | Loader → Server → Loader + Dispatcher | `{ itemId, vehicleId, reason }` |

---

## 8. Offline & Degradation Handling

### PWA Offline Strategy (Driver + Loader)
```javascript
// next.config.js (next-pwa config)
const withPWA = require('next-pwa')({
  dest: 'public',
  runtimeCaching: [
    {
      urlPattern: /^\/driver\/stop\/.*/,
      handler: 'CacheFirst',     // Stop details cached for offline
    },
    {
      urlPattern: /^\/api\/trips\/.*\/stops/,
      handler: 'NetworkFirst',   // Try network, fallback to cache
      options: { cacheName: 'trip-data', expiration: { maxAgeSeconds: 3600 } }
    }
  ]
});
```

### Offline Queue (Driver)
```javascript
// When offline: store delivery outcomes in IndexedDB
// When back online: sync queue to server automatically
// UI shows: "2 deliveries pending sync" banner
```

### Degradation Scenarios in Code
```javascript
// Vehicle breakdown flow
socket.on('vehicle:breakdown', async ({ vehicleId, tripId, location }) => {
  // 1. Mark trip as 'breakdown'
  await db.trip.update({ where: { id: tripId }, data: { status: 'breakdown' } });
  // 2. Find affected undelivered orders
  const pending = await db.order.findMany({ where: { tripId, status: 'pending' } });
  // 3. Suggest best alternative vehicle
  const suggestion = await allocationEngine.findReplacement(vehicleId, pending);
  // 4. Emit alert to dispatcher
  io.to('dispatcher').emit('alert:created', {
    type: 'VEHICLE_BREAKDOWN',
    severity: 'CRITICAL',
    payload: { vehicleId, pending, suggestion }
  });
  // 5. Notify store managers of affected outlets
  pending.forEach(o => io.to(`outlet:${o.outletId}`).emit('order:deferred', {
    orderId: o.id, reason: 'VEHICLE_BREAKDOWN', newEta: suggestion?.eta ?? null
  }));
});
```

---

## 9. Seed Data

All reference data from the challenge CSVs is seeded into PostgreSQL at startup.

### Seed Script: `prisma/seed.ts`
```typescript
async function main() {
  // 1. Seed vehicles (60 records from vehicles.csv)
  await seedVehicles();
  // 2. Seed outlets (120 records from outlets.csv)
  await seedOutlets();
  // 3. Seed districts (12 records from district_travel.csv)
  await seedDistricts();
  // 4. Seed service allowances (9 records)
  await seedServiceAllowances();
  // 5. Seed calendar (2024–2026)
  await seedCalendar();
  // 6. Seed traffic speeds
  await seedTrafficSpeeds();
  // 7. Create demo users (4 seeded accounts)
  await seedUsers();
  // 8. Create a demo delivery day (pre-allocated plan)
  await seedDemoDeliveryDay();
}
```

### Seeded User Accounts
| Role | Email | Password | Name |
|---|---|---|---|
| Dispatcher | `dispatcher@waypoint.lk` | `waypoint2026` | Nilantha |
| Loader | `loader@waypoint.lk` | `waypoint2026` | Chamara |
| Driver | `driver@waypoint.lk` | `waypoint2026` | Roshan |
| Store Manager | `store@waypoint.lk` | `waypoint2026` | Thilini |

---

## 10. Docker Setup

### `docker-compose.yml`
```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NODE_ENV: production
    ports:
      - "3000:3000"
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && node server.js"

volumes:
  postgres_data:
```

### `.env.example`
```
POSTGRES_USER=waypoint
POSTGRES_PASSWORD=changeme
POSTGRES_DB=waypoint_db
DATABASE_URL=postgresql://waypoint:changeme@db:5432/waypoint_db
NEXTAUTH_SECRET=supersecretrandomstring
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Start Command (for judges)
```bash
git clone https://github.com/BigBug/BigBug_WaypointDelivery
cd BigBug_WaypointDelivery
cp .env.example .env
docker compose up
# App available at http://localhost:3000
```

---

## 11. Monorepo Structure

```
BigBug_WaypointDelivery/
├── README.md                    ← Setup, credentials, walkthrough, departures
├── docker-compose.yml
├── .env.example
├── Dockerfile
├── package.json                 ← Root package (Next.js monorepo)
│
├── app/                         ← Next.js App Router (all roles)
│   ├── (auth)/
│   ├── dispatcher/
│   ├── loader/
│   ├── driver/
│   └── store/
│
├── components/                  ← Shared UI components
│   ├── ui/                      ← shadcn/ui base components
│   ├── allocation/              ← Allocation-specific components
│   ├── map/                     ← Map components (Leaflet)
│   └── scanner/                 ← Barcode scanner component
│
├── lib/
│   ├── allocation/              ← Allocation engine
│   │   ├── engine.ts
│   │   ├── constraints.ts
│   │   └── trip-time.ts
│   ├── socket/                  ← Socket.IO server setup
│   ├── auth/                    ← NextAuth config
│   └── db/                      ← Prisma client
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/
│   ├── sw.js                    ← Service worker (PWA)
│   └── manifest.json
│
└── docs/
    ├── architecture.md          ← Architecture diagram (Mermaid)
    ├── data-model.md            ← ER diagram + schema explanation
    └── ai-disclosure.md         ← AI tool usage disclosure
```

---

## 12. Judge Walkthrough (Numbered Steps)

> This is the judge walkthrough for the README. Assumes `docker compose up` is complete.

```
1.  Open http://localhost:3000
2.  Log in as Dispatcher: dispatcher@waypoint.lk / waypoint2026
3.  See the Daily Plan Board for today's demo delivery day
4.  Click "Run Allocation" → observe orders assigned to vehicles + deferred list
5.  Open a trip → verify district, brand, capacity gauges
6.  Simulate a breakdown: click "⚠ Breakdown" on VEH003 → see alert + auto-suggestion
7.  Accept the suggestion → confirm reallocation
8.  Log out. Log in as Loader: loader@waypoint.lk / waypoint2026
9.  Select VEH006 / Trip 1
10. Open Scan & Load → scan items (use provided barcodes in README)
11. Scan a wrong item → confirm red alert fires
12. Complete loading → confirm load sign-off reaches dispatcher
13. Log out. Log in as Driver: driver@waypoint.lk / waypoint2026
14. Open My Trips → start Trip 1
15. Navigate to first stop → confirm delivery → capture photo + signature
16. Mark second stop as "Outlet Closed" → verify dispatcher alert fires
17. Complete trip → view trip summary
18. Log out. Log in as Store: store@waypoint.lk / waypoint2026
19. See upcoming delivery card with live ETA
20. Receive delivery → confirm items → add discrepancy on one item → sign off
21. Verify digital delivery note generated
```

---

## 13. 5-Day Build Plan

| Day | Date | Focus | Deliverables |
|---|---|---|---|
| Day 6 | 30 Sep | Project setup, DB schema, auth, seed data | Repo live, Docker works, 4 users seeded |
| Day 7 | 1 Oct | Allocation engine + Dispatcher Plan Board + Allocation UI | Engine passes constraint tests |
| Day 8 | 2 Oct | Loader scan flow + Driver stop flow (offline PWA) | Loader + Driver flows functional |
| Day 9 | 3 Oct | Store Manager flow + Real-time (Socket.IO) + Degradation flows | All 4 roles connected |
| Day 10 AM | 4 Oct | Deploy to Railway/Render, final testing, demo video | Live URL, video uploaded |
| Day 10 PM | 4 Oct | **Submit before 11:59 PM** | Repo link + URL + video submitted |

---

## 14. Judging Criteria Mapping

| Criterion | Weight | How We Address It |
|---|---|---|
| Functional completeness across all roles | 20% | All 4 roles fully implemented, judge walkthrough covers every step |
| Planning & allocation engine | 20% | Greedy bin-packer with all 9 constraint checks; handles overflow with defer |
| Degradation, offline, recovery | 10% | Breakdown flow, outlet-closed flow, offline queue with sync |
| Fidelity to Day 5 design | 10% | Figma screens used as direct spec; document any departures in README |
| Engineering quality & architecture | 25% | Prisma ORM, typed API, shared Zod schemas, Docker, CI |
| Creativity | 5% | Real-time map, barcode scanning, automated ETA notifications |
| Demo video | 10% | 5–8 min walkthrough of all 4 roles + code/architecture explanation |

---

## 15. AI Tool Disclosure (`docs/ai-disclosure.md`)

| Work | AI-Assisted | Detail |
|---|---|---|
| Architecture design | ✅ Partial | AI suggested component boundaries; team finalised |
| Allocation engine logic | ✅ Partial | AI drafted pseudocode; team implemented + tested |
| Prisma schema | ❌ No | Designed by team from data model |
| React components | ✅ Partial | AI generated boilerplate; team designed interaction logic |
| Socket.IO event design | ❌ No | Team designed event taxonomy |
| Seed data scripts | ✅ Yes | AI wrote CSV→seed parser; team reviewed |
| Docker Compose | ✅ Partial | AI generated base; team customised |
| Demo video | ❌ No | Recorded and narrated by team |

---

## 16. Submission Checklist

| Item | Status |
|---|---|
| ☐ GitHub monorepo: `BigBug_WaypointDelivery` | |
| ☐ README: setup + credentials + walkthrough + departures | |
| ☐ `docker compose up` starts full stack + seeds data | |
| ☐ `.env.example` at repo root | |
| ☐ `docs/architecture.md` (diagram) | |
| ☐ `docs/data-model.md` (ER diagram) | |
| ☐ `docs/ai-disclosure.md` | |
| ☐ Deployed public URL live | |
| ☐ 4 seeded accounts confirmed working | |
| ☐ Demo video 5–8 min uploaded to YouTube (unlisted) | |
| ☐ Submission form: repo link + deployed URL + credentials + video | |
