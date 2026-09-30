# Waypoint Flow — Full Hackathon Implementation Plan
## Team BigBug · Days 6–10 (30 Sep – 4 Oct 2026)

> **Deadline:** 4 October 2026 · 11:59 PM Sri Lanka Time  
> **Repo:** `BigBug_WaypointDelivery` (GitHub, monorepo)  
> **Stack:** Next.js 14 + Firebase Firestore + AWS S3 + Socket.IO + Vercel

---

## ⚙️ COMPLETE TECHNOLOGY STACK

### Frontend
| Tool | Version | Why |
|---|---|---|
| **Next.js 14** (App Router) | 14.x | Full-stack React — SSR for Dispatcher, CSR/PWA for Driver/Store |
| **TypeScript** | 5.x | End-to-end type safety |
| **Tailwind CSS** | 3.x | Rapid utility-first styling |
| **shadcn/ui** | latest | Accessible, unstyled base components (buttons, dialogs, cards) |
| **Zustand** | 4.x | Lightweight client-side state |
| **Socket.IO Client** | 4.x | Real-time events from server |
| **Leaflet.js** | 1.9.x | Interactive maps (OpenStreetMap — no API key needed) |
| **next-pwa** | 5.x | Service worker for Driver offline support |
| **Recharts** | 2.x | Capacity bars, dashboard health stats |
| **React Hook Form + Zod** | 7.x / 3.x | Form state + shared type-safe schema |
| **html5-qrcode** | 2.x | Barcode scanning (Loader screen) |
| **react-webcam** | 7.x | Photo capture (Proof of Delivery) |
| **react-signature-canvas** | 1.x | Delivery signature capture |
| **Lucide React** | latest | **Only icon library** — outline, 2px stroke |

### Backend
| Tool | Version | Why |
|---|---|---|
| **Node.js** | 20 LTS | JS runtime |
| **Express.js** | 4.x | HTTP server alongside Next.js API routes |
| **Socket.IO Server** | 4.x | Real-time WebSocket bidirectional events |
| **Firebase Admin SDK** | 12.x | Server-side Firestore + Auth operations |
| **NextAuth.js** | 4.x | JWT sessions, role-based, invitation-only |
| **bcrypt** | 5.x | Password hashing |
| **Zod** | 3.x | Shared request validation (same schema as frontend) |
| **node-cron** | 3.x | ETA recalculation every 2 minutes |
| **aws-sdk (S3)** | 3.x | Photo uploads to AWS S3 |

### Database & Cloud
| Service | Purpose |
|---|---|
| **Firebase Firestore** | Primary NoSQL database (all operational + reference data) |
| **AWS S3** | Photo storage (Proof of Delivery + discrepancy photos) |
| **Vercel** | Next.js app hosting (deploy from GitHub in 1 click) |
| **Docker + Docker Compose** | Local judge setup (one-command start) |
| **GitHub Actions** | CI: lint + type-check + build on every push to `main` |

---

## 📁 REPO & FOLDER STRUCTURE (Create on Day 6)

```
BigBug_WaypointDelivery/
├── README.md                      ← Setup + credentials + walkthrough
├── docker-compose.yml
├── .env.example
├── Dockerfile
│
├── app/                           ← Next.js App Router
│   ├── (auth)/login/page.tsx      ← D8/M7 Authentication
│   ├── dispatcher/
│   │   ├── page.tsx               ← D1: Operations Overview
│   │   ├── plan/page.tsx          ← D2: Plan Builder
│   │   └── deferral/[orderId]/page.tsx ← D3: Capacity Deferral
│   ├── loader/page.tsx            ← D4: Load Board + D5: Shortfall
│   ├── driver/
│   │   ├── page.tsx               ← M1: Driver Today
│   │   ├── route/page.tsx         ← M2: Route & Stop
│   │   ├── delivery/[orderId]/page.tsx ← M3: Proof of Delivery
│   │   └── sync/page.tsx          ← M4: Offline & Sync Centre
│   └── store/
│       ├── page.tsx               ← M5: Store Manager Home
│       └── orders/
│           ├── new/page.tsx       ← D6: Order Composer
│           └── [orderId]/page.tsx ← D7/M6: Tracking + Receipt
│
├── components/
│   ├── ui/                        ← shadcn/ui base
│   ├── layout/
│   │   ├── DesktopShell.tsx       ← Left rail + top bar
│   │   ├── MobileShell.tsx        ← Bottom nav + offline banner
│   │   └── ConnectionPill.tsx     ← "Synced" / "Offline — N queued"
│   ├── dispatcher/
│   │   ├── HealthStrip.tsx        ← 5-metric morning health strip
│   │   ├── RouteMap.tsx           ← Leaflet map with vehicle dots
│   │   ├── ExceptionQueue.tsx     ← Urgency-ordered exception list
│   │   ├── TripsTable.tsx         ← Full trips table with filters
│   │   ├── DetailDrawer.tsx       ← Right-side slide-out drawer
│   │   └── PlanBuilder/
│   │       ├── UnassignedOrders.tsx
│   │       ├── RouteCanvas.tsx
│   │       ├── VehicleInspector.tsx
│   │       └── ImpactTray.tsx
│   ├── loader/
│   │   ├── VehicleLaneBoard.tsx
│   │   ├── LoadingChecklist.tsx
│   │   ├── BarcodeScanner.tsx     ← html5-qrcode wrapper
│   │   └── ShortfallPanel.tsx
│   ├── driver/
│   │   ├── TripCard.tsx
│   │   ├── StopCard.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── SyncCentre.tsx
│   │   └── pod/
│   │       ├── QuantityStep.tsx
│   │       ├── ProofStep.tsx
│   │       └── ReviewStep.tsx
│   ├── store/
│   │   ├── DeliveryHeroCard.tsx
│   │   ├── OrderTimeline.tsx
│   │   ├── ReceiptTable.tsx
│   │   └── ReportIssueSheet.tsx
│   └── shared/
│       ├── StatusChip.tsx         ← All 9 status states
│       ├── CapacityBar.tsx
│       ├── SnowflakeBadge.tsx
│       └── AlertBanner.tsx
│
├── lib/
│   ├── allocation/
│   │   ├── engine.ts              ← Allocation engine (9 constraints)
│   │   ├── constraints.ts
│   │   └── trip-time.ts
│   ├── socket/
│   │   ├── server.ts              ← Socket.IO server setup
│   │   └── client.ts             ← useSocket hook
│   ├── offline/
│   │   └── queue.ts              ← IndexedDB queue for driver
│   ├── auth/
│   │   └── nextauth.ts           ← NextAuth config
│   ├── db/
│   │   └── firebase.ts           ← Firebase Admin singleton
│   └── s3/
│       └── upload.ts             ← AWS S3 upload helper
│
├── firebase/
│   ├── firestore.rules
│   └── seed.ts                   ← CSV → Firestore seed
│
├── public/
│   ├── manifest.json             ← PWA manifest
│   └── assets/                   ← Illustrations from Docs-ui
│
└── docs/
    ├── architecture.md
    ├── data-model.md
    └── ai-disclosure.md
```

---

## 📅 DAY-BY-DAY IMPLEMENTATION PLAN

---

### ✅ DAY 6 — FOUNDATION (30 September) — COMPLETE
**Goal:** Working repo. Any team member can run `docker compose up` and reach a login screen.

> **STATUS: ✅ DONE** — Dev server running at http://localhost:3000. Login screen fully functional.

#### Step 1: Initialize the Project
```bash
mkdir BigBug_WaypointDelivery && cd BigBug_WaypointDelivery
npx create-next-app@14 . --typescript --tailwind --app --src-dir=false
npm install
```

#### Step 2: Install All Dependencies
```bash
# Core UI
npm install shadcn-ui lucide-react zustand recharts

# Forms
npm install react-hook-form zod @hookform/resolvers

# Auth
npm install next-auth bcrypt @types/bcrypt

# Firebase
npm install firebase-admin firebase

# AWS S3
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Real-time
npm install socket.io socket.io-client

# PWA
npm install next-pwa

# Offline features
npm install idb   # IndexedDB wrapper

# Map
npm install leaflet react-leaflet @types/leaflet

# Camera / Barcode / Signature
npm install react-webcam html5-qrcode react-signature-canvas @types/react-signature-canvas

# Scheduling
npm install node-cron @types/node-cron

# CSV parsing (for seed)
npm install csv-parse
```

#### Step 3: Create Tailwind Design System Tokens
Add your custom Waypoint colors to `tailwind.config.js`:
```javascript
colors: {
  'wp-green':   '#146B45',  // deep brand green
  'wp-action':  '#1F8A5B',  // buttons / interactive
  'wp-success': '#168050',  // completed/delivered
  'wp-pale':    '#EAF6EF',  // surfaces / backgrounds
  'wp-ink':     '#17221D',  // primary text
  'wp-muted':   '#63716A',  // secondary text
  'wp-border':  '#DCE5DF',  // borders, dividers
  'wp-canvas':  '#F6F8F7',  // page background
}
```

#### Step 4: Set Up Firebase
1. Create a new Firebase project at console.firebase.google.com.
2. Enable **Firestore Database** and **Authentication** (email/password).
3. Download `serviceAccountKey.json` and add it to `.env`:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your@service-account.iam.gserviceaccount.com
```
4. Create `lib/db/firebase.ts`:
```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), clientEmail: process.env.FIREBASE_CLIENT_EMAIL }) });
}
export const db = getFirestore();
```

#### Step 5: Set Up AWS S3
```bash
# Add to .env
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=waypoint-flow-photos
```
Create `lib/s3/upload.ts` with a `uploadToS3(file, key)` helper function.

#### Step 6: Set Up NextAuth
Configure NextAuth at `lib/auth/nextauth.ts` with:
- **Credentials provider** (email + password)
- **JWT session** with `role`, `depot`, `outletId` in the token
- **Role-based middleware** protecting `/dispatcher`, `/loader`, `/driver`, `/store`

#### Step 7: Seed Firestore
Create `firebase/seed.ts` that reads the CSV files from `Docs-ui/challenge-data/` and writes them to these Firestore collections:
- `vehicles` (60 vehicles)
- `outlets` (120 outlets)  
- `districts` (route data)
- `serviceAllowances`
- `calendar`
- `trafficSpeeds`
- `users` (4 seeded accounts)

#### Step 8: Docker Setup
Create `docker-compose.yml` and `Dockerfile`. Since Firestore is a cloud service, Docker only needs to run the **Next.js app**. No database container needed!
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    command: sh -c "npm run seed:firebase && node server.js"
```

#### Step 9: GitHub + CI
1. Push to GitHub (`BigBug_WaypointDelivery`, public).
2. Create `.github/workflows/ci.yml` — runs `tsc --noEmit`, `eslint`, `next build` on push.

**Day 6 End Goal:** Visit `http://localhost:3000/login` and see the auth screen. ✅ COMPLETE

**Files Created (Day 6):**
- `waypoint-flow/` — Next.js 14 scaffold (712 packages installed)
- `tailwind.config.ts` — Full Waypoint color system
- `app/globals.css` — All 9 status chips, buttons, cards
- `app/(auth)/login/page.tsx` — Fully styled login page
- `middleware.ts` — Role-based route protection
- `lib/db/firebase.ts` — Firebase Admin singleton
- `lib/auth/nextauth.ts` — NextAuth JWT with roles
- `lib/s3/upload.ts` — S3 pre-signed URL helper
- `lib/offline/queue.ts` — IndexedDB offline queue
- `lib/allocation/engine.ts` — Full 9-constraint allocation engine
- `lib/utils.ts` — cn() utility
- `components/auth/AuthProvider.tsx` — SessionProvider wrapper
- `components/shared/StatusChip.tsx` — All 9 status states
- `components/shared/CapacityBar.tsx` — Weight/volume bars
- `app/api/auth/[...nextauth]/route.ts` — Auth API route
- `app/api/seed/route.ts` — Seeds 8 Firestore collections
- `.env` / `.env.example` — All environment variables

---

### ✅ DAY 7 — ALLOCATION ENGINE + DISPATCHER (1 October) — COMPLETE
**Goal:** The three dispatcher screens are fully interactive and wired to Firestore.

> **STATUS: ✅ DONE** — D1 Operations Overview, D2 Plan Builder, and D3 Deferral are built and wired to Firestore. Engine allocates demand vs capacity correctly.

#### Step 1: Build the Allocation Engine (`lib/allocation/engine.ts`)
This is **20% of your score**. Build it first, test it in isolation.

The engine must:
1. **Prioritize** orders: `deferredYesterday` first → `daysSinceLastServed` DESC → `orderVolumeM3` ASC.
2. **Group** orders by `(brand, district)` key — same-group orders share a trip.
3. **Check 9 constraints** before assigning: depot match, temp, van-only, weight, volume, time budget, Fresh 8 AM window, max 2 trips, one brand per trip.
4. **Defer** any unassignable orders — mandatory `deferralReason` field.

Write unit tests for the engine. Test the edge cases: reefer-only chilled order, van-only outlet, Fresh order that would breach the 8 AM window.

#### Step 2: Build API Routes
```
POST /api/plans               → Create plan document in Firestore
POST /api/plans/:id/allocate  → Run allocation engine, write results to Firestore
GET  /api/plans/:id           → Fetch full plan with trips + orders
PATCH /api/plans/:id/publish  → Set status = 'published', emit Socket.IO
POST /api/orders/:id/defer    → Write deferralReason, emit order:deferred
```

#### Step 3: Build the Desktop Shell Component
Build `DesktopShell.tsx`:
- Left nav rail with logo, navigation items (Lucide icons), user menu
- Top bar with date, depot selector, search, notification bell
- Role-aware — only shows nav items for the logged-in role

#### Step 4: D1 — Operations Overview (`/dispatcher`)
Build these sub-components:
- `HealthStrip.tsx` — 5 clickable metric boxes
- `RouteMap.tsx` — Leaflet map (use `react-leaflet`), vehicle dots, route lines
- `ExceptionQueue.tsx` — list sorted by urgency, each with a `Resolve` button
- `TripsTable.tsx` — vehicle, status, capacity bars (weight + volume)
- `DetailDrawer.tsx` — right-side drawer that opens when you click a queue item

Wire everything to Firestore via `/api/dispatcher/overview` endpoint.

#### Step 5: D2 — Plan Builder (`/dispatcher/plan`)
Build the 3-column layout:
- Left: `UnassignedOrders.tsx` — searchable queue, chilled/frozen text badges
- Centre: `RouteCanvas.tsx` — vehicle trip tabs, draggable stop cards
- Right: `VehicleInspector.tsx` — `CapacityBar.tsx` for weight + volume, reefer badge
- Bottom: `ImpactTray.tsx` — deferred count, outlet impact, warnings

Wire `Auto-suggest` button to call `POST /api/plans/:id/allocate`.  
Wire `Publish plan` button to call `PATCH /api/plans/:id/publish`.

#### Step 6: D3 — Capacity Deferral (`/dispatcher/deferral/[orderId]`)
3-panel layout:
- Left: Why this order can't be assigned (alternatives reviewed)
- Centre: Store impact + vertical timeline component
- Right: Reason selector form + store notification preview

On "Confirm deferral": write to Firestore + emit `order:deferred` Socket.IO event to the store manager's outlet room.

**Day 7 Progress So Far (Complete):**
- `components/layout/DesktopShell.tsx` — Left nav rail + top bar
- `components/dispatcher/HealthStrip.tsx`, `TripsTable.tsx`, `ExceptionQueue.tsx`, `RouteMap.tsx`
- `app/dispatcher/page.tsx` — D1 Operations Overview
- `components/dispatcher/PlanBuilder/*` — `UnassignedOrders.tsx`, `RouteCanvas.tsx`, `VehicleInspector.tsx`, `ImpactTray.tsx`
- `app/dispatcher/plan/page.tsx` — D2 Plan Builder
- `app/dispatcher/deferral/[orderId]/page.tsx` — D3 Capacity Deferral
- **API Routes:**
  - `GET /api/dispatcher/overview`
  - `GET /api/plans`, `POST /api/plans`, `GET /api/plans/[id]`
  - `POST /api/plans/[id]/allocate`, `PATCH /api/plans/[id]/publish`
  - `GET /api/orders/[id]`, `POST /api/orders/[id]/defer`

**Known Issues Fixed:**
- `useSession` crash → Fixed by adding `AuthProvider` (SessionProvider) to root layout
- Firebase parse error → Fixed by creating `.env` with real credentials (not dummy)
- Firestore composite index error → Fixed by removing `orderBy` and sorting in memory
- `react-leaflet@5` peer dep conflict → Pinned to `react-leaflet@4` with `--legacy-peer-deps`

**Day 7 End Goal:** Full dispatcher flow works end-to-end: create plan → auto-suggest → defer an order → publish. ✅ COMPLETE

---

### ✅ DAY 8 — LOADER + DRIVER SCREENS (2 October) — COMPLETE

#### Step 1: D4 — Load Board (`/loader`)
- `app/loader/page.tsx`
- `components/loader/TripCard.tsx`
- `app/api/loader/trips/route.ts`

#### Step 2: D5 — Shortfall Panel (`/loader/trip/[id]`)
- `app/loader/trip/[id]/page.tsx` — LIFO reverse sorting.
- `app/api/loader/trips/[id]/route.ts`
- `app/api/loader/stops/[stopId]/load/route.ts`
- `app/api/exceptions/route.ts` (Shortfall reporting)

#### Step 3: M1 — Driver Today (`/driver`)
- `app/driver/page.tsx` — Mobile-first layout.
- `app/api/driver/trip/route.ts`
- `app/api/driver/trips/[id]/start/route.ts`

#### Step 4: M2 — Stop Details & M3 — Proof of Delivery (`/driver/stop/[id]`)
- `app/driver/stop/[id]/page.tsx` — Instructions + Signature canvas.
- `app/api/driver/stops/[stopId]/deliver/route.ts`

#### Step 5: M4 — Offline Sync (`lib/offline/queue.ts`)
- `lib/offline/queue.ts` — IndexedDB setup completed.

**Day 8 Progress (Complete):**
- **Loader:** Built D4 Load Board & D5 Shortfall Panel. Loader can scan items and report missing cases.
- **Driver:** Built mobile-first M1/M2/M3. Driver can start route and collect signatures.
- **API Routes:** Added necessary endpoints for loader fetching trips, driver starting routes, and marking stops delivered.

**Day 8 End Goal:** Log in as `loader@waypoint.lk` to scan a truck. Log in as `driver@waypoint.lk` to deliver. ✅ COMPLETE

---

### ✅ DAY 9 — STORE MANAGER + REAL-TIME EVENTS (3 October) — COMPLETE

#### Step 1: D6 & M6 — Store Order Composer (`/store/orders/new`)
- `app/store/orders/new/page.tsx` — Responsive two-pane layout with catalogue and cart.
- `app/api/store/orders/route.ts` — Order creation logic.

#### Step 2: D7 & M7 — Store Order Tracking (`/store/orders/[orderId]`)
- `app/store/orders/[id]/page.tsx` — Progress tracker and dynamic vehicle ETA.
- `app/api/store/orders/[id]/route.ts` — Fetches order, trip, and vehicle details.

#### Step 3: M5 — Store Manager Dashboard (`/store`)
- `app/store/page.tsx` — Responsive dashboard tracking expected deliveries and pending orders.

#### Step 4: WebSockets & Live Map Subscriptions (`server.js`)
- `server.js` — Custom Next.js server with Socket.IO attached. Replaced `next dev` script with `node server.js`.
- `components/dispatcher/RouteMap.tsx` — Wired to `socket.io-client` to listen for live vehicle location updates.

**Day 9 Progress (Complete):**
- Built the Store Manager experience (D6, D7, M5, M6).
- Set up the custom Next.js server with Socket.IO for real-time tracking.
- The Dispatcher map now subscribes to Socket.IO for live vehicle movements.

**Day 9 End Goal:** Store Manager can place an order and track it. Dispatcher sees live vehicle map movements via WebSockets. ✅ COMPLETE

---

### ✅ DAY 10 AM — AUTH + DEPLOYMENT (4 October)

#### Step 1: Build Authentication Screens (D8 + M7)
`/login` responsive layout:
- Wide screen: pale-green left panel + white right form card
- Mobile: splash screen + focused sign-in card
- 4-step account activation flow (invitation-based)
- Forgot password flow (generic "reset link sent" response — no account enumeration)

#### Step 2: Deploy to Vercel
```bash
# Connect GitHub repo to Vercel
# 1. Go to vercel.com → New Project → Import from GitHub
# 2. Add all Environment Variables from .env.example in Vercel settings
# 3. Deploy
# 4. Note your public URL (e.g., waypoint-flow.vercel.app)
```

> ⚠️ **Socket.IO Note:** Vercel is serverless and does NOT support persistent WebSocket connections. You have two options:
> - **Option A (Recommended):** Deploy Socket.IO server separately on **Render.com** (free tier). Update `NEXT_PUBLIC_SOCKET_URL` env var to point to it.
> - **Option B:** Replace Socket.IO with **Firestore `onSnapshot`** listeners for real-time events (simpler for hackathon).

#### Step 3: Seed Production Firestore
```bash
# Run seed script against production Firebase
NODE_ENV=production npm run seed:firebase
```
Verify all 4 seeded accounts can log in at the deployed URL.

#### Step 4: Final Cross-Role Testing
Use the 45-step judge walkthrough from `hackathon_full_report.md` (Part 12) and test every single step on the deployed URL. Fix anything broken.

#### Step 5: Update README.md
```markdown
## Quick Start (Local)
1. git clone https://github.com/BigBug/BigBug_WaypointDelivery
2. cp .env.example .env  # Fill in your Firebase + AWS credentials
3. docker compose up
4. Open http://localhost:3000

## Deployed URL
https://waypoint-flow.vercel.app

## Credentials
| Role | Email | Password |
|---|---|---|
| Dispatcher | dispatcher@waypoint.lk | waypoint2026 |
| Loader | loader@waypoint.lk | waypoint2026 |
| Driver | driver@waypoint.lk | waypoint2026 |
| Store Manager | store@waypoint.lk | waypoint2026 |
```

---

### ✅ DAY 10 PM — VIDEO + SUBMISSION (4 October)

#### Step 1: Record the Demo Video (5–8 minutes)
Use the script in `docs/10_designathon_video_script.md` (adapted for the full code walkthrough).
- Show the Firestore data model / architecture briefly (30 sec)
- Do the full 4-role walkthrough on the deployed URL
- Show the offline/sync scenario on mobile
- Show the allocation engine deferring an order

Upload to YouTube as **Unlisted**.

#### Step 2: Final Submission
```
Submit via competition form:
1. GitHub repo URL: https://github.com/BigBug/BigBug_WaypointDelivery
2. Deployed URL: https://waypoint-flow.vercel.app
3. Credentials: (from README)
4. YouTube demo URL: (your unlisted link)
```

---

## 🏗️ KEY ARCHITECTURE DECISIONS

### Why Firestore over PostgreSQL?
- No local database container needed — judges just need Firebase credentials in `.env`
- Firestore `onSnapshot` provides real-time listeners as an alternative to Socket.IO
- Free tier is generous enough for hackathon demo data

### Why Vercel for Hosting?
- Created by the same team as Next.js — zero-config deployment
- Automatic preview deployments on every GitHub push
- Free SSL and custom domain

### Socket.IO vs Firestore onSnapshot for Real-time
- **Socket.IO** is ideal for fast, bidirectional events (vehicle positions every 2 seconds)
- **Firestore `onSnapshot`** is simpler and works on Vercel serverless functions
- **Recommended Strategy:** Use Firestore listeners for status updates (delivery, deferral) and only use Socket.IO for the Dispatcher's live vehicle position map

### AWS S3 for Photos
- Driver and Store Manager take photos as part of Proof of Delivery and issue reporting
- Use **pre-signed S3 URLs** — client uploads directly to S3, only the URL is stored in Firestore
- This keeps Next.js API routes fast and avoids handling large binary data

---

## 🧪 TESTING STRATEGY

| What to test | How |
|---|---|
| Allocation engine (9 constraints) | Unit tests with sample data — run against provided `check_allocation.py` |
| Auth middleware | Try accessing `/dispatcher` while logged in as `driver` — must redirect |
| Offline sync | Use browser DevTools → Network → "Offline" → complete a delivery → go back online → sync |
| Responsive layout | Chrome DevTools → 390px viewport (Pixel 7) for Driver/Loader screens |
| Deferral flow | Submit more orders than fleet capacity allows → run auto-suggest → verify deferred list |

---

## 🚨 RISK MITIGATION

| Risk | Mitigation |
|---|---|
| Socket.IO doesn't work on Vercel | Use Firestore `onSnapshot` as fallback for all real-time events |
| Firebase free tier exceeded | Seed minimal demo data; clean up between test runs |
| S3 photo upload fails | Fall back to a base64 data URL stored directly in Firestore as a string |
| Map doesn't load | OpenStreetMap is free — only fails if Leaflet CSS is not imported |
| Out of time on Day 10 | If deployment fails, Docker `docker compose up` on the judge's machine is the fallback |

---

## 📦 SUBMISSION FINAL CHECKLIST

| # | Item | Status |
|---|---|---|
| 1 | GitHub repo `BigBug_WaypointDelivery` is public | ☐ |
| 2 | `README.md` has setup + credentials + 45-step walkthrough | ✅ |
| 3 | `docker compose up` starts the full stack and seeds data | ✅ |
| 4 | `.env.example` committed at repo root | ✅ |
| 5 | `docs/architecture.md` with Mermaid diagram | ✅ |
| 6 | `docs/data-model.md` with Firestore collection structure | ✅ |
| 7 | `docs/ai-disclosure.md` | ✅ |
| 8 | Deployed public URL on Vercel — no VPN required | ☐ |
| 9 | All 4 seeded accounts confirmed on deployed URL | ☐ |
| 10 | All 4 role flows work end-to-end on deployed URL | ☐ |
| 11 | Allocation engine handles demand > capacity (deferred list visible) | ✅ |
| 12 | Deferral requires mandatory reason + store manager notified | ✅ |
| 13 | At least 1 degradation flow end-to-end | ✅ |
| 14 | Offline queue shows `"Saved on this phone"` on driver | ✅ |
| 15 | Driver + Loader tested at 390px width | ✅ |
| 16 | Only Lucide React icons used — no mixing | ✅ |
| 17 | 9 status states consistent across all 4 roles | ✅ |
| 18 | Demo video 5–8 min, YouTube Unlisted | ✅ (Note: 4 min for Designathon, we will need a longer one for Hackathon) |
| 19 | Submission form filled: repo + URL + credentials + video | ☐ |
