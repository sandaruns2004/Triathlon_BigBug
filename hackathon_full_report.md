# Tech-Triathlon 2026 · Hackathon Full Report
## Team BigBug · Waypoint Flow — Build Specification

> **Product name:** Waypoint Flow  
> **Company:** Waypoint Group (Peliyagoda & Kandy depots · 120 outlets · 60 vehicles · 3 brands)  
> **Deadline:** 4 October 2026 · 11:59 PM Sri Lanka Time  
> **Repo:** `BigBug_WaypointDelivery` (GitHub monorepo)  
> **Spec source:** Designathon submission (BigBug_Designathon) + `Docs-ui/` screen specifications

---

## 🚧 BUILD STATUS (as of 29 September 2026)

| Day | Goal | Status |
|---|---|---|
| Day 6 | Foundation: scaffold, auth, firebase, seed, design system | ✅ COMPLETE |
| Day 7 | Dispatcher D1 (overview), D2 (plan builder), D3 (deferral) | ✅ COMPLETE |
| Day 8 | Loader D4/D5, Driver M1/M2/M3/M4 | ✅ COMPLETE |
| Day 9 | Store Manager D6/D7/M5/M6, Socket.IO real-time events | ✅ COMPLETE |
| Day 10 | Deploy to Vercel, seed production, record video, submit | 🔄 IN PROGRESS |

**Stack corrections vs. original plan:**
- ❌ Prisma (original) → ✅ Firebase Firestore (actual)
- ❌ AWS Amplify (original) → ✅ Vercel (actual)
- ❌ PostgreSQL (original) → ✅ Firebase Firestore (actual)

---

## PART 1 — WHAT WE ARE BUILDING

### System Name: Waypoint Flow

A full-stack, real-time delivery workflow management system for **Waypoint Group** — a Sri Lankan retail group operating three brands (Fresh, Style, Tech) from two depots across 12 districts.

### The Delivery Chain (All Four Roles)

```
Store Manager places order
       ↓
Dispatcher plans & allocates routes (03:00–09:00)
       ↓
Loader loads vehicles in reverse stop order, scans items (03:30–10:00)
       ↓
Driver navigates stops, records proof of delivery (04:00–17:00)
       ↓
Store Manager tracks ETA, receives delivery, confirms receipt
```

### Four Roles, One Unified System

| Role | Interface | Device | Screen key |
|---|---|---|---|
| Dispatcher | Web App (data-dense desktop) | Desktop 1440 px | D1 D2 D3 |
| Loader | Web App (touch/glove-safe) | Shared tablet/terminal | D4 D5 |
| Store Manager | Web + PWA (notification-driven) | Desktop or mobile | D6 D7 + M5 M6 |
| Driver | PWA (offline-capable, field-safe) | Mobile 390 px | M1 M2 M3 M4 |

### What the System Must Do

1. **Order** — Store Manager submits an order with cut-off validation (not after submission).
2. **Plan** — Dispatcher creates a delivery plan; allocation engine assigns orders to vehicle trips.
3. **Validate** — System enforces all 9 operating constraints in real time; hard blocks reject assignment; soft warnings allow with explanation.
4. **Defer** — Orders that cannot be assigned (capacity, temperature, time, vehicle type) are deferred with a mandatory reason + store notification.
5. **Load** — Loader scans items in reverse stop order; shortfall triggers escalation before departure; vehicle cannot depart with unresolved items.
6. **Deliver** — Driver navigates stops (parked only), records outcome per stop with photo + signature; handles offline, outlet closed, access issues.
7. **Receive** — Store Manager tracks live ETA, verifies line-item receipt, flags discrepancies, triggers digital delivery note.
8. **Alert** — Real-time events propagate between all roles (breakdown → dispatcher + stores; delay → stores; scan rejection → dispatcher; load confirmed → driver).

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
| **Leaflet.js** | 1.9.x | Interactive maps (OpenStreetMap tiles — no API key required) |
| **next-pwa** | 5.x | PWA manifest + service worker for offline support (Driver + Loader) |
| **React Hook Form** | 7.x | Form state management |
| **Zod** | 3.x | Schema validation (shared with backend) |
| **Recharts** | 2.x | Capacity gauge (weight + volume bars), dashboard health stats |
| **html5-qrcode** | 2.x | Barcode/QR scanner via device camera (Loader screen) |
| **react-webcam** | 7.x | Photo capture (Proof of Delivery) |
| **react-signature-canvas** | 1.x | Signature pad for delivery sign-off |
| **Lucide React** | latest | **Single icon library** — outline style, 2 px stroke desktop / 1.75–2 px mobile |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20 LTS | JavaScript runtime |
| **Express.js** | 4.x | HTTP server alongside Next.js API routes |
| **Socket.IO Server** | 4.x | WebSocket server for real-time events |
| **Firebase Admin SDK** | 12.x | Database connection and admin operations |
| **NextAuth.js** | 4.x | Authentication (JWT sessions, role-based, invitation-only) |
| **bcrypt** | 5.x | Password hashing |
| **Zod** | 3.x | Request validation (shared schema with frontend) |
| **csv-parse** | 5.x | Parsing challenge CSVs for DB seeding |
| **node-cron** | 3.x | ETA recalculation every 2 min; daily plan status updates |

### Database & Storage

| Technology | Purpose |
|---|---|
| **Firebase Firestore** | Primary NoSQL database |
| **Redis 7** (optional) | Session store + real-time state cache for live vehicle positions |
| **AWS S3** | Cloud file storage for Proof of Delivery and discrepancy photos |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker** | Container runtime |
| **Docker Compose** | Orchestrate app + optional redis — one command start |
| **Vercel** | Cloud deployment (Next.js hosting) |
| **GitHub Actions** | CI: lint + type check + build on every push to `main` |
| **GitHub** | Source control (monorepo) |

---

## PART 3 — VISUAL DESIGN SYSTEM (from Docs-ui)

### "Calm Operational Clarity" — The Design Direction

The interface must feel like a **precision operational tool**, not a consumer app or generic SaaS dashboard. Every pixel exists to help users complete a task faster and more safely.

**What to avoid:** glassmorphism, neon gradients, generic AI SaaS blob art, decorative illustrations in time-critical views, colour as the only status signal, floating 3D icons.

### Color Tokens (apply as Tailwind CSS custom colors)

```javascript
// tailwind.config.js
colors: {
  'wp-green':   '#146B45',   // deep Waypoint green — brand, navigation selected
  'wp-action':  '#1F8A5B',   // primary buttons, interactive primary
  'wp-success': '#168050',   // confirmed/delivered success state
  'wp-pale':    '#EAF6EF',   // supportive surface, pale backgrounds
  'wp-ink':     '#17221D',   // primary text
  'wp-muted':   '#63716A',   // secondary text, labels
  'wp-border':  '#DCE5DF',   // borders, dividers
  'wp-canvas':  '#F6F8F7',   // page canvas background
}
// Semantic (standard Tailwind):
// amber-*  → attention / at-risk (never amber alone — pair with label)
// red-*    → blocked / failed (blocking state only)
// blue-grey → informational states
```

### Typography (Inter font — add via Google Fonts)

| Use | Size | Weight |
|---|---|---|
| Page titles | 28–32 px | 600 |
| Section headings | 18–20 px | 600 |
| Card headings | 16 px | 500 |
| Body text (desktop) | 14–16 px | 400 |
| Body text (mobile minimum) | 16 px | 400 |
| Tabular data (times, weights, volumes) | 14 px tabular-nums | 500 |

### Shape & Elevation

- **Corner radius:** 10 px for cards/controls; 14 px for large panels and sheets
- **Shadows:** sparse and soft — `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` only
- **Borders:** `1px solid #DCE5DF` — always subtle

### Icon System — Lucide React (mandatory single library)

Use Lucide exclusively. No mixing with Material Icons, Font Awesome, or emoji.

| Product need | Lucide icon | Usage note |
|---|---|---|
| Home / overview | `House` | Store Home |
| Planning | `Route` | Planning nav, route detail |
| Operations | `Activity` | Dispatcher dashboard |
| Orders | `ClipboardList` | Orders list |
| Outlets | `Store` | Outlet directory |
| Fleet / vehicle | `Truck` | Fleet status, trip rows |
| Reports | `ChartNoAxesCombined` | Reporting only |
| Search | `Search` | Global/table search |
| Notifications | `Bell` | Notification centre |
| Settings | `Settings` | Profile/admin |
| Navigation handoff | `Navigation` | "Open navigation" — driver |
| Refrigerated | `Snowflake` | Always pair with "Refrigerated" text |
| Capacity | `Package` / `Weight` | Pair with exact values |
| Proof of delivery | `Signature` `Camera` `FileCheck2` | Use most specific |
| Scanner | `ScanBarcode` | Loader barcode scan |
| Offline | `CloudOff` | Always with status text |
| Sync | `RefreshCw` `CloudCheck` | With status text |
| Warning | `TriangleAlert` | Attention/at-risk — use sparingly |
| Error / blocked | `CircleX` | Blocking/failed state |
| Success | `CircleCheck` | Completion/valid |
| Deferred | `Clock3` | Show reason + revised date |
| History | `History` | Audit trail |
| Filter | `SlidersHorizontal` | Filter controls |
| More actions | `Ellipsis` | Non-critical overflow only |

### Status Language (9 states — consistent across all roles)

| Status | Color | Icon | When |
|---|---|---|---|
| `Needs planning` | muted grey | `Clock` | Order submitted, not yet in a plan |
| `Planned` | wp-green | `Route` | Order assigned to a trip |
| `Loading` | amber | `Package` | Loader actively loading vehicle |
| `Ready to depart` | wp-action | `CircleCheck` | All items scanned, loader signed off |
| `On route` | wp-green | `Truck` | Driver has started the trip |
| `Delivered` | wp-success | `CircleCheck` | Delivery confirmed at stop |
| `Issue reported` | amber | `TriangleAlert` | Discrepancy or access issue |
| `Deferred` | grey/amber | `Clock3` | Cannot be served — reason shown |
| `Offline` | amber | `CloudOff` | Driver/loader device lost connectivity |

---

## PART 4 — SCREEN-TO-ROUTE MAPPING (from Docs-ui)

Every screen in the Designathon maps to a Next.js route. Build them in this order.

### Desktop Screens

#### D1 — Dispatcher Operations Overview → `/dispatcher`

**Purpose:** Control tower — "Is today's plan deliverable, what needs my attention now?"

**Must implement:**
- Left nav rail: Waypoint Flow logo + [Planning, Operations, Orders, Outlets, Fleet, Reports] + user menu
- Top bar: operating date + depot selector (`All / Peliyagoda / Kandy`) + global search + `Bell` notification + connection health
- Page header: "Today's operations" + date + `Open plan builder` (primary action)
- **Morning health strip:** 5 clickable metrics — Orders planned · Vehicles dispatched · On-time forecast % · Orders at risk · Unresolved exceptions
- **Live route map (⅔ width):** vehicle dots, green route lines, depot pins, outlet status markers, compact legend. Selecting a vehicle highlights next stop + syncs to trip row.
- **Exception queue (⅓ width):** ordered by urgency. Types: Loading shortfall, Delivery access issue, ETA breach, Offline driver (>threshold), Unplanned order. Each shows owner + elapsed time + `Resolve`.
- **Trips table:** vehicle ID · depot · Trip 1/2 · route progress · next stop · capacity display (`2.8 / 3.5 t · 14 / 18 m³`) · `Snowflake` reefer badge · ETA risk chip · status chip.
- Saved filters: `Fresh before 8 AM`, `Refrigerated`, `At risk`
- Right-side detail drawer (click any queue item): facts + history + suggested action (e.g., "Notify store with revised ETA")
- Empty state (before plan published): illustration `web/no-active-route.png` + "No routes published" + link to Plan Builder

**At-risk signals:** amber, always explain *why* (window breach, service time, access, loading issue).  
**Capacity display:** both weight AND volume. Never one dimension only.

---

#### D2 — Dispatcher Plan Builder → `/dispatcher/plan`

**Purpose:** Allocate orders to feasible vehicle trips — the allocation engine's human interface.

**Must implement:**
- Top planning bar: date picker + depot + `Auto-suggest` (secondary) + `Save draft` + `Publish plan` (primary, green)
- Plan quality indicator: "2 blockers · 4 warnings" — plain language, never colour alone
- **Left column — Unassigned orders queue:** search + filter chips. Each order card: outlet + brand + delivery window + handling class ("Chilled" / "Frozen" as text badges, not colour alone) + weight + volume + priority chip + order age
- **Centre — Route canvas:** tabs per vehicle trip (`WP-12 · Trip 1`). Stop cards with stop # + outlet + ETA estimate + drag-handle. Manual drag-to-assign OR click `Assign` from drawer.
- **Right column — Vehicle inspector:** reefer/ambient label + `Snowflake` badge + weight bar + volume bar + weekly fuel quota remaining + route duration + constraint validation list
- **Bottom impact tray:** unassigned count + predicted deferrals + outlet impact + route warnings
- **Hard constraint modal:** "This frozen order requires a refrigerated vehicle." + list of eligible vehicles + action
- **Soft warning:** allow assignment but show projected ETA breach / fuel overrun with plain language explanation
- Reorder stops → recalculates ETA immediately → shows any breached delivery window
- `Auto-suggest` → marks suggestions as reviewable; dispatcher is accountable for publishing
- **Publish confirmation sheet:** routes released + deferred orders list + affected store notifications sent

---

#### D3 — Capacity Deferral & Impact → `/dispatcher/deferral/[orderId]`

**Purpose:** Make a deferral deliberate, transparent, auditable — NOT a silent spreadsheet decision.

**Must implement:**
- Header: "Review order deferral" + order ID + outlet + brand + promised window + goods class
- **Left — Decision context:** alternatives considered + compatible vehicle availability + capacity shortfall explanation + reason category `Unavailable` vs `Manually rejected`
- **Centre — Store impact:** next possible service date + priority/stock indicator + **vertical timeline** (Submitted → Planning exception → Proposed deferral → Store notified)
- **Right — Decision form:**
  - Reason selector (required): No compatible refrigerated capacity / Vehicle capacity / Window conflict / Access constraint / Operational disruption / Other
  - Note field (required for "Other")
  - Revised proposed date picker
  - Store notification preview (what the store manager will receive)
- Footer: `Keep unassigned` (secondary outlined) | `Confirm deferral & notify store` (primary)
- Confirm action sets: status = `Deferred` + records dispatcher + timestamp + reason + alternatives considered + sends notification
- Alternate state: "Restore to planning" when capacity later opens — full history retained

**Critical:** The reason for deferral must always be stored and visible to the store manager. No silent deferrals.

---

#### D4 — Loader Load Board → `/loader`

**Purpose:** Turn the published plan into a safe loading sequence. Load in reverse stop order. Detect issues before departure.

**Must implement:**
- Header: depot + `Dock A · Morning shift` + live time clock + `3 vehicles loading · 1 attention needed`
- **Vehicle lane board:** horizontal columns — Scheduled / Loading / Loading issue / Ready to depart / Departed. Vehicle cards show vehicle ID + trip + departure deadline + stop count + temperature requirement + progress (`4/6 stops checked`)
- **Selected trip panel:** stops listed in **unloading order** with explicit instruction: `"Load Stop 6 first → Stop 1 last"` (bold, prominent). Each stop expands: quantities + chilled/frozen/fragile handling type + scan/check status
- **Right checklist (5 items):** vehicle cleanliness/temp check · item count · damage check · load securement · final seal
- Barcode scan control (primary) + large `Mark checked` fallback (for manual use — 18 px+ labels, glove-safe targets)
- Named user + timestamp audit on every `Mark checked`
- **Blocking state:** unresolved red item → `Ready to depart` button disabled
- **Completion state:** all green → `Ready to depart` active (green) → notifies driver + updates dispatcher status in real time
- Shared-device auto sign-out notice after inactivity
- Temperature safety: each chilled/frozen item shows specific requirement — never collapses into generic count

---

#### D5 — Loading Shortfall → `/loader` (overlay panel on D4)

**Purpose:** Record a missing or damaged item before it becomes a customer delivery failure.

**Must implement:**
- Load Board is **dimmed** in background (not hidden — context preserved)
- Right-side focused panel (never full-page modal):
  - Panel title: "Loading shortfall"
  - Operational context: Order ID + outlet + item name + Expected vs Available count + stop + vehicle + departure deadline
  - **Issue type selector:** Missing / Damaged / Temperature concern / Other
  - Quantity affected field + optional photo/scan reference + note
  - **Impact panel:** "This outlet will receive a partial delivery" + "Dispatcher decision required before 06:40 AM"
  - Actions: `Save and continue loading` (secondary outlined) | `Escalate to dispatcher` (primary green)
- After escalation: trip status → "Loading issue", exception appears in dispatcher queue, loader resumes exact checklist position
- Downstream resolution: when dispatcher approves, driver manifest updates with adjusted quantities; store notified only after resolution is selected

---

#### D6 — Store Order Composer → `/store/orders/new`

**Purpose:** Submit a confident order with delivery eligibility, cut-offs, and constraints clear before submission.

**Must implement:**
- Header: "Create order" + outlet identity (`Waypoint Fresh — Borella`) + selected delivery window + cut-off countdown (`Order by 2:00 PM today`) + `Order history` link
- **Two-pane body:**
  - Left: searchable product/category catalogue. Order rows: SKU + name + pack/unit + quantity stepper (keyboard-friendly) + availability status + handling class text label ("Chilled" / "Frozen" — text, not colour alone)
  - Right: sticky "Order summary" card — item count + weight/volume estimate + chilled/frozen requirement callout + preferred window selector + PO/reference field + validation messages
- Footer: `Save draft` (secondary) | `Review order` (primary)
- **Review sheet:** summary + requested date/window + special handling + disclaimer: "Submission is subject to fleet planning — arrival time confirmed after planning." + green `Submit order`
- After submit: status = `Submitted — awaiting plan` + timestamp. No ETA promise.
- Disabled invalid dates + restricted line feedback shown **before** submission, not after
- Draft recovery visible (persists between sessions)
- Empty state: illustration `web/no-orders-yet.png` + "Create your first order"

---

#### D7 — Store Order Tracking & Receipt → `/store/orders/[orderId]`

**Purpose:** Track order from submission through receipt. Make deferral transparent. Record discrepancies.

**Must implement:**
- Header: status badge + order ID (`WF-24817`) + outlet + brand + requested date + latest ETA + `Contact operations` (secondary)
- **Horizontal/vertical progress timeline:** Submitted → Planned → Loading → On route → Delivered → Receipt confirmed (with timestamps + plain-language updates per step)
- **Deferred branch:** visually distinct from main timeline. Shows reason category + dispatcher note + revised service date + `Acknowledge` / `Contact operations` / `Report business impact`. Never appears as unexplained "Delayed".
- Delivery card: ETA window + driver-arrival state + delivery notes (no unnecessary driver personal data)
- **Line-item receipt table:** Ordered / Delivered / Accepted / Discrepancy / Notes. Example: `Frozen peas 12 ordered / 10 delivered` with `2 missing` amber discrepancy
- Action panel: `Confirm receipt` (primary green) | `Report issue` (secondary outlined — equally discoverable)
- **Report issue flow:** select affected lines → category (wrong quantity / damage / missing goods / temperature concern / other) → note → optional photo
- Activity/conversation history below the receipt section
- Success state: illustration `web/delivery-complete.png`

---

#### D8 — Desktop Authentication → `/login`

**Purpose:** Secure, invitation-only sign-in and account activation.

**Must implement:**
- Wide layout: pale-green left panel (`#EAF6EF`) with `web/auth-route-motif.png` + Waypoint Flow horizontal logo + tagline "Connected delivery operations" | white right form panel (max 440 px)
- **Screen 1 — Sign in:** work email + password (show/hide) + `Keep me signed in` checkbox + green `Sign in` + `Forgot password?` + `Activate your account`
- **Screen 2 — Activate account:** 4-step (invitation → password → profile → success). Masked email + assigned role/depot read-only + password requirements visible first + `Activate account`
- **Screen 3 — Forgot password:** email field + `Send reset link` + neutral confirmation (does not reveal if email exists)
- **Screen 4 — Reset password:** new password + confirm + strength requirements + completion state + return to sign in
- Accessible: visible labels, keyboard focus ring (green), error text beside field, generic invalid-details message (no account enumeration)

---

### Mobile Screens

**All mobile frames:** 390 px width, safe-area insets respected, bottom navigation above home indicator.  
**Touch targets:** minimum 48 × 48 dp everywhere.  
**Font minimum:** 16 px body text.  
**Primary actions:** full-width, near thumb zone.

---

#### M1 — Driver Today → `/driver`

**Purpose:** Start an informed, safe workday.

**Must implement:**
- Top bar: greeting (`Good morning, Nimal`) + depot/shift label + profile avatar + **connection pill** (`Synced just now` | `Offline — 2 actions queued`)
- **Primary trip card:** vehicle ID + trip number + status (`Ready to depart`) + stop count + estimated finish + `Snowflake` reefer badge + green `Start trip` (disabled until loader releases via `load:confirmed` event)
- "Start trip" helper text: "Start only when safely parked."
- **Stop preview list:** numbered; only current/next stop expanded; later stops compact
- **"Before you leave" card:** readiness acknowledgements + `View manifest` + `Loading notes` links
- **Second trip card (quieter):** "Trip 2 — Available after Trip 1 completion"
- **Waiting state:** "Waiting for loading confirmation" — blocked, not empty
- **Empty state:** illustration `mobile/no-assigned-trip.png` + "No route assigned yet"
- **Driver onboarding (first use):** illustration `mobile/driver-onboarding-route-ready.png`
- Bottom nav: Today (active) · Route · Activity · Profile

---

#### M2 — Driver Route & Stop → `/driver/route`

**Purpose:** Navigate to a stop (in-transit) and complete a delivery (parked).

**Must implement:**
- **Screen A — In-transit:** "Trip 1 · Stop 1 of 6" header + next-stop card (outlet + window + ETA) + compact map with green route line + pale-green access note (`Use rear receiving bay · call before arrival`) + full-width `Open navigation` (deep-links to Google Maps) + outlined `I'm parked`
- **"Route updated" card:** highlighted notice when operations changed a stop. Requires acknowledgement. Cannot silently overwrite.
- **Screen B — Parked stop:** bottom-sheet delivery panel — stop # + outlet + short contact/access instruction + expected goods list with quantities + green `Complete delivery` + outlined `Report a problem`
- **Outside-window amber prompt:** "You've arrived outside the delivery window." + Continue / Contact operations / Report access issue
- **Route drawer:** all stops with text statuses (Completed · Current · Future · Skipped). Driver cannot reorder stops.

---

#### M3 — Proof of Delivery → `/driver/delivery/[orderId]`

**Purpose:** Record a complete delivery outcome while parked. Offline-capable, interruption-friendly.

**Must implement:**
- **Step 1 — Confirm quantities:** "Stop 1 · Waypoint Fresh — Borella" + line-item table (Expected vs Delivered). Default = loader manifest. Each line: mark Partial / Missing / Damaged / Refused + reason chip. `Continue to proof`
- **Step 2 — Capture proof:** recipient name + optional signature panel (`react-signature-canvas`) + large `Add delivery photo` button (`react-webcam`) + photo thumbnail with `Retake` + delivery note
- **Step 3 — Review outcome:** summary card (Delivered in full / Partial delivery / Delivery failed / Refused) + timestamp + recipient + evidence thumbnails + highlighted discrepancies + full-width green `Complete stop`
- Progress indicator: `1 of 3` + `Back` + `Save for later` (saves to IndexedDB)
- **Offline state footer:** `"Saved on this phone — will sync when online"` (not a misleading success confirmation)

---

#### M4 — Driver Offline & Sync → `/driver/sync`

**Purpose:** Continue safely without connection. Reconcile queued actions later.

**Must implement:**
- **Persistent amber offline banner (non-blocking):** `"You're offline. Your route and delivery records are available on this phone."` + queued action count + `"Last synced 07:42 AM"`
- **Sync centre page:** connection state card + storage assurance (`"Records are encrypted and saved on this phone"`) + `Sync now` (disabled when offline, enabled when connected)
- **Queued actions list:** each row — outlet + action type + local timestamp + evidence count + `"Saved on this phone"` label. Example rows:
  - `Waypoint Fresh — Borella · Proof of delivery · 08:04 AM · 2 photos`
  - `Waypoint Style — Rajagiriya · Delivery completed · 08:29 AM`
  - `Waypoint Tech — Nugegoda · Access issue · 08:41 AM`
- **Conflict card:** `"Route changed while you were offline"` — shows old vs new stop info — `Review difference` + `Contact operations`. Never silent overwrite.
- **Reconnection state:** green check + `"4 records synced"` + `View activity` link
- Illustration: `mobile/offline-records-safe.png`
- Bottom nav: Activity (active for sync centre)

---

#### M5 — Store Manager Home → `/store`

**Purpose:** See order state and urgent delivery updates in plain language.

**Must implement:**
- Header: outlet name (`Waypoint Fresh — Borella`) + date + `Bell` notification badge
- **Hero delivery card:** status chip (`On route`) + `"Expected 7:35–7:55 AM"` + item summary + full-width `Track delivery`
- **Deferred delivery hero (alternate):** amber/neutral emphasis + "Delivery deferred" + revised date + reason summary + "View details"
- **2×2 quick actions grid:** labelled icons — New order / Order history / Confirm receipt / Report issue
- **Recent activity timeline:** compact timestamped — "Order submitted" · "Delivery plan confirmed" · "Vehicle departed depot"
- **"Needs your attention" section:** e.g., "Order cut-off today — submit by 2:00 PM" + "Receipt awaiting confirmation — WF-24817"
- **No-delivery state:** "Plan your next delivery" + next eligible date
- Illustrations: `mobile/store-onboarding-order-receipt.png` (onboarding), `mobile/delivery-received.png` (receipt state)
- Bottom nav: Home (active) · Orders · Notifications · Profile

---

#### M6 — Store Mobile Order, Tracking & Receipt → `/store/orders`

**Purpose:** Order, track, receive, and report issues — mobile-optimised.

**Must implement:**
- **Screen 1 — New order:** delivery date/window selector + cut-off visible + searchable product list + quantity steppers + persistent cart badge + chilled/frozen label
- **Screen 2 — Review order:** selected items + requested delivery + reference field + disclaimer ("Final arrival time confirmed after planning") + green `Submit order`
- **Screen 3 — Order tracking:** timeline (Submitted → Planned → Loading → On route → Delivered → Receipt confirmed) + current step active + ETA window + deferred alternate branch with reason + revised date + "Contact operations" + "Report business impact"
- **Screen 4 — Confirm receipt:** line-item table (Ordered / Delivered / Accepted) + `Confirm receipt` primary | `Report issue` secondary (equally easy to reach)
  - Report issue bottom sheet: line selectors + category chips + note field + optional photo
- Draft/saved state visible — user can leave and return without losing form
- Every status: plain-language text + timestamp

---

#### M7 — Mobile Authentication → `/login` (mobile responsive)

**Must implement:**
- **Splash screen:** illustration `mobile/splash-route.png` + logo mark centred
- **Sign in:** `"Welcome to Waypoint Flow"` + email + password (show/hide) + green `Sign in` + links
- **Offline sign-in message:** `"Connect to the internet to sign in. Previously signed-in users can continue with available offline delivery records."`
- **Activate account (4 steps):** invitation → password → profile → `"Account activated"` — invitation-based only, not open registration
- Generic invalid-details error (no account enumeration)
- Temporary lockout with exact retry time + recovery link
- Biometric quick-unlock option (after first successful sign-in only)
- Background accent: `mobile/login-route-accent.png`

---

## PART 5 — NEXT.JS APP ROUTER STRUCTURE

```
BigBug_WaypointDelivery/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                  ← D8/M7 Authentication
│   │
│   ├── dispatcher/
│   │   ├── layout.tsx                    ← Desktop layout (left rail + top bar)
│   │   ├── page.tsx                      ← D1: Operations Overview
│   │   ├── plan/
│   │   │   └── page.tsx                  ← D2: Plan Builder
│   │   ├── deferral/
│   │   │   └── [orderId]/page.tsx        ← D3: Capacity Deferral
│   │   └── alerts/
│   │       └── page.tsx                  ← Alert console
│   │
│   ├── loader/
│   │   ├── layout.tsx                    ← Tablet layout (large touch targets)
│   │   └── page.tsx                      ← D4: Load Board + D5: Shortfall panel
│   │
│   ├── driver/
│   │   ├── layout.tsx                    ← Mobile layout (bottom nav + offline banner)
│   │   ├── page.tsx                      ← M1: Driver Today
│   │   ├── route/
│   │   │   └── page.tsx                  ← M2: Route & Stop
│   │   ├── delivery/
│   │   │   └── [orderId]/page.tsx        ← M3: Proof of Delivery
│   │   └── sync/
│   │       └── page.tsx                  ← M4: Offline & Sync Centre
│   │
│   └── store/
│       ├── layout.tsx                    ← Mobile layout (bottom nav)
│       ├── page.tsx                      ← M5: Store Manager Home
│       └── orders/
│           ├── page.tsx                  ← M6: Order list + new order
│           ├── new/page.tsx              ← D6: Order Composer
│           └── [orderId]/page.tsx        ← D7/M6: Tracking + Receipt
│
├── components/
│   ├── ui/                               ← shadcn/ui base (buttons, dialogs, cards)
│   ├── layout/
│   │   ├── DesktopShell.tsx              ← Left rail + top bar (dispatcher, loader, store desktop)
│   │   ├── MobileShell.tsx              ← Bottom nav + offline banner (driver, store mobile)
│   │   └── ConnectionPill.tsx           ← "Synced" / "Offline — N queued"
│   ├── dispatcher/
│   │   ├── HealthStrip.tsx              ← 5-metric morning health strip
│   │   ├── RouteMap.tsx                 ← Leaflet map with vehicle dots
│   │   ├── ExceptionQueue.tsx           ← Urgency-ordered exception list
│   │   ├── TripsTable.tsx               ← Full trips table with filters
│   │   ├── DetailDrawer.tsx             ← Right-side slide-out drawer
│   │   ├── PlanBuilder/
│   │   │   ├── UnassignedOrders.tsx
│   │   │   ├── RouteCanvas.tsx
│   │   │   ├── VehicleInspector.tsx
│   │   │   └── ImpactTray.tsx
│   │   └── DeferralPanel.tsx
│   ├── loader/
│   │   ├── VehicleLaneBoard.tsx
│   │   ├── LoadingChecklist.tsx
│   │   ├── BarcodeScanner.tsx           ← html5-qrcode wrapper
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
│       ├── StatusChip.tsx               ← All 9 status states
│       ├── CapacityBar.tsx              ← Weight + volume bar pair
│       ├── SnowflakeBadge.tsx
│       └── AlertBanner.tsx
│
├── lib/
│   ├── allocation/
│   │   ├── engine.ts                    ← Allocation engine (see Part 6)
│   │   ├── constraints.ts               ← 9 constraint functions
│   │   └── trip-time.ts                 ← Trip time calculator
│   ├── socket/
│   │   ├── server.ts                    ← Socket.IO server setup
│   │   └── client.ts                    ← Client-side hook (useSocket)
│   ├── offline/
│   │   └── queue.ts                     ← IndexedDB queue for delivery outcomes
│   ├── auth/
│   │   └── nextauth.ts                  ← NextAuth config
│   └── db/
│       └── firebase.ts                  ← Firebase Admin singleton
│
├── firebase/
│   ├── firestore.rules                  ← Firestore security rules
│   └── seed.ts                          ← CSV → DB seed script
│
├── public/
│   ├── sw.js                            ← Service worker (PWA)
│   ├── manifest.json                    ← PWA manifest
│   └── assets/                          ← Illustrations from Docs-ui/generated-assets/
│       ├── brand/
│       │   ├── waypoint-flow-mark.svg
│       │   └── waypoint-flow-horizontal.svg
│       ├── web/
│       │   ├── auth-route-motif.png
│       │   ├── no-active-route.png
│       │   ├── no-orders-yet.png
│       │   ├── delivery-complete.png
│       │   └── capacity-constraint.png
│       └── mobile/
│           ├── splash-route.png
│           ├── login-route-accent.png
│           ├── no-assigned-trip.png
│           ├── offline-records-safe.png
│           └── delivery-received.png
│
└── docs/
    ├── architecture.md                  ← Mermaid architecture diagram
    ├── data-model.md                    ← ER diagram + schema description
    └── ai-disclosure.md                 ← AI tool usage disclosure
```

---

## PART 6 — ALLOCATION ENGINE (Complete TypeScript)

The allocation engine is **20% of the Hackathon score**. It must correctly handle demand-exceeds-capacity situations.

### File: `lib/allocation/engine.ts`

```typescript
// ─── TYPES ────────────────────────────────────────────────────────
interface Order {
  orderId: string;
  outletId: string;
  brand: string;          // Fresh | Style | Tech
  district: string;
  depot: string;          // Peliyagoda | Kandy
  dockType: string;       // rear_dock | street | mall_bay
  parkingConstraint: string; // normal | van_only | mall_dock
  tempRequirement: string;   // ambient | chilled
  orderWeightKg: number;
  orderVolumeM3: number;
  deferredYesterday: boolean;
  daysSinceLastServed: number;
}

interface Vehicle {
  vehicleId: string;
  type: string;       // truck | van
  temp: string;       // reefer | ambient
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

// ─── CONSTANTS ─────────────────────────────────────────────────────
const FRESH_TIME_BUDGET   = 270; // min — 03:30 to 08:00
const DAYTIME_TIME_BUDGET = 480; // min — 09:00 to 17:00
const MAX_TRIPS_PER_VEHICLE = 2;

// ─── STEP 1: PRIORITIZE ORDERS ─────────────────────────────────────
// Rule: deferred_yesterday first → longest wait first → smallest volume first
function prioritizeOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    if (a.deferredYesterday !== b.deferredYesterday)
      return b.deferredYesterday ? 1 : -1;
    if (a.daysSinceLastServed !== b.daysSinceLastServed)
      return b.daysSinceLastServed - a.daysSinceLastServed;
    return a.orderVolumeM3 - b.orderVolumeM3;
  });
}

// ─── STEP 2: GROUP BY (BRAND, DISTRICT) ────────────────────────────
// Constraint: one brand per trip, one district per trip
function groupOrders(orders: Order[]): Map<string, Order[]> {
  const groups = new Map<string, Order[]>();
  for (const order of orders) {
    const key = `${order.brand}:${order.district}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(order);
  }
  return groups;
}

// ─── STEP 3: CONSTRAINT CHECKS ─────────────────────────────────────
// 9 operating constraints enforced here

// C1: Depot match
// C2: Temperature — chilled orders need reefer vehicle
// C3: Van-only parking constraint
function canVehicleServeOrder(vehicle: Vehicle, order: Order): boolean {
  if (vehicle.depot !== order.depot)                                return false; // C1
  if (order.tempRequirement === 'chilled' && vehicle.temp !== 'reefer') return false; // C2
  if (order.parkingConstraint === 'van_only' && vehicle.type !== 'van') return false; // C3
  return true;
}

// C4: Weight capacity, C5: Volume capacity
function checkCapacity(vehicle: Vehicle, existingOrders: Order[], newOrder: Order): boolean {
  const totalVol = existingOrders.reduce((s, o) => s + o.orderVolumeM3, 0) + newOrder.orderVolumeM3;
  const totalWt  = existingOrders.reduce((s, o) => s + o.orderWeightKg, 0) + newOrder.orderWeightKg;
  return totalVol <= vehicle.volumeCapM3 && totalWt <= vehicle.weightCapKg; // C4 + C5
}

// C6: Time budget constraint
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

// C7: Fresh time budget = 270 min; Style/Tech = 480 min
function getTimeBudget(brand: string): number {
  return brand === 'Fresh' ? FRESH_TIME_BUDGET : DAYTIME_TIME_BUDGET;
}

// C8: Max 2 trips per vehicle per day (enforced by vehicleTrips map)
// C9: One brand per trip, one district per trip (enforced by group key)

// ─── STEP 4: MAIN ALLOCATION FUNCTION ──────────────────────────────
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
  const vehicleTrips = new Map<string, Trip[]>();
  vehicles.forEach(v => vehicleTrips.set(v.vehicleId, []));

  for (const [groupKey, groupOrders] of groups) {
    const [brand, district] = groupKey.split(':');
    const budget = getTimeBudget(brand);

    const eligibleVehicles = vehicles.filter(v =>
      v.available &&
      v.depot === groupOrders[0].depot &&
      canVehicleServeOrder(v, groupOrders[0]) &&
      (vehicleTrips.get(v.vehicleId)?.length ?? 0) < MAX_TRIPS_PER_VEHICLE
    );

    for (const order of groupOrders) {
      let assigned = false;

      // Try to fit into an existing trip for this (brand, district)
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
        if (existingTrips.length >= MAX_TRIPS_PER_VEHICLE) continue; // C8
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

      if (!assigned) deferred.push(order); // Demand exceeded capacity — defer
    }
  }

  return { trips, deferred, violations: [] };
}
```

### The 9 Constraints (all must be enforced)

| # | Constraint | Enforced in |
|---|---|---|
| C1 | Depot match — vehicle and order must share the same depot | `canVehicleServeOrder` |
| C2 | Temperature — chilled orders → reefer vehicle only | `canVehicleServeOrder` |
| C3 | Van-only outlets → van-type vehicle only | `canVehicleServeOrder` |
| C4 | Weight capacity must not be exceeded | `checkCapacity` |
| C5 | Volume capacity must not be exceeded | `checkCapacity` |
| C6 | Time budget — Fresh ≤ 270 min; Style/Tech ≤ 480 min | `calculateTripTime` + budget check |
| C7 | Fresh deliveries must complete by 08:00 AM (270 min from 03:30) | `getTimeBudget` |
| C8 | Maximum 2 trips per vehicle per day | `vehicleTrips` map |
| C9 | One brand + one district per trip | `groupOrders` group key |

### Allocation API Endpoints

```
POST /api/plans                    → Create a plan for a date + depot
POST /api/plans/:id/allocate       → Run allocation engine + persist results
GET  /api/plans/:id                → Get full plan with trips + orders
GET  /api/plans/:id/summary        → Plan quality: blockers + warnings + deferred count
PUT  /api/trips/:id/orders         → Manual reassignment (dispatcher override)
POST /api/orders/:id/defer         → Manually defer + record reason
GET  /api/constraints/validate     → Validate current trip allocation
PATCH /api/plans/:id/publish       → Publish plan → triggers loader notification
```

---

## PART 7 — DATABASE SCHEMA (PRISMA)

```prisma
// prisma/schema.prisma

// ─── REFERENCE DATA (seeded from challenge CSVs) ───────────────────

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
  name               String
  brand              String     // Fresh | Style | Tech
  district           String
  depot              String
  dockType           String     @map("dock_type")    // rear_dock | street | mall_bay
  parkingConstraint  String     @map("parking_constraint") // normal | van_only | mall_dock
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

// ─── OPERATIONAL DATA ──────────────────────────────────────────────

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
  status      String   @default("draft") // draft | allocated | published | active | completed
  createdBy   String   @map("created_by")
  creator     User     @relation("CreatedBy", fields: [createdBy], references: [userId])
  createdAt   DateTime @default(now()) @map("created_at")
  publishedAt DateTime? @map("published_at")
  trips       Trip[]
  orders      Order[]
  @@map("delivery_plans")
}

model Trip {
  tripId             String   @id @default(cuid()) @map("trip_id")
  planId             String   @map("plan_id")
  plan               DeliveryPlan @relation(fields: [planId], references: [planId])
  vehicleId          String   @map("vehicle_id")
  vehicle            Vehicle  @relation(fields: [vehicleId], references: [vehicleId])
  tripNumber         Int      @map("trip_number")  // 1 or 2
  brand              String
  district           String
  status             String   @default("planned")
  // planned | loading | loading_issue | ready_to_depart | on_route | completed | breakdown
  estimatedStartTime DateTime? @map("estimated_start_time")
  actualStartTime    DateTime? @map("actual_start_time")
  completedAt        DateTime? @map("completed_at")
  orders             Order[]
  loadItems          LoadItem[]
  alerts             Alert[]
  @@map("trips")
}

model Order {
  orderId            String    @id @default(cuid()) @map("order_id")
  planId             String?   @map("plan_id")
  plan               DeliveryPlan? @relation(fields: [planId], references: [planId])
  tripId             String?   @map("trip_id")
  trip               Trip?     @relation(fields: [tripId], references: [tripId])
  outletId           String    @map("outlet_id")
  outlet             Outlet    @relation(fields: [outletId], references: [outletId])
  submittedBy        String?   @map("submitted_by") // store_manager userId
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
  status             String    @default("submitted")
  // submitted | unassigned | assigned | loading | on_route | delivered | deferred | failed
  decision           String?   // served | deferred
  deferralReason     String?   @map("deferral_reason") // REQUIRED when deferred — never null if deferred
  deferralNote       String?   @map("deferral_note")
  revisedDeliveryDate DateTime? @map("revised_delivery_date")
  deferredAt         DateTime? @map("deferred_at")
  deferredBy         String?   @map("deferred_by") // dispatcher userId
  loadItem           LoadItem?
  delivery           Delivery?
  createdAt          DateTime  @default(now()) @map("created_at")
  @@map("orders")
}

model LoadItem {
  loadItemId   String    @id @default(cuid()) @map("load_item_id")
  orderId      String    @unique @map("order_id")
  order        Order     @relation(fields: [orderId], references: [orderId])
  tripId       String    @map("trip_id")
  trip         Trip      @relation(fields: [tripId], references: [tripId])
  scanStatus   String    @default("pending") // pending | confirmed | shortfall | rejected
  scannedAt    DateTime? @map("scanned_at")
  loaderId     String?   @map("loader_id")
  shortfallType String?  @map("shortfall_type") // missing | damaged | temperature_concern | other
  shortfallQty Int?      @map("shortfall_qty")
  shortfallNote String?  @map("shortfall_note")
  @@map("load_items")
}

model Delivery {
  deliveryId    String    @id @default(cuid()) @map("delivery_id")
  orderId       String    @unique @map("order_id")
  order         Order     @relation(fields: [orderId], references: [orderId])
  driverId      String    @map("driver_id")
  driver        User      @relation(fields: [driverId], references: [userId])
  outcome       String    // delivered | partial | not_delivered | outlet_closed | refused
  arrivedAt     DateTime? @map("arrived_at")
  leftAt        DateTime? @map("left_at")
  photoUrl      String?   @map("photo_url")
  signatureUrl  String?   @map("signature_url")
  recipientName String?   @map("recipient_name")
  notes         String?
  syncedAt      DateTime? @map("synced_at")   // null = saved locally only
  discrepancies Discrepancy[]
  @@map("deliveries")
}

model Discrepancy {
  discrepancyId  String   @id @default(cuid()) @map("discrepancy_id")
  deliveryId     String   @map("delivery_id")
  delivery       Delivery @relation(fields: [deliveryId], references: [deliveryId])
  type           String   // short | damaged | wrong_item | temperature_concern
  quantity       Int?
  description    String
  photoUrl       String?  @map("photo_url")
  reportedBy     String   @map("reported_by") // store_manager userId
  createdAt      DateTime @default(now()) @map("created_at")
  @@map("discrepancies")
}

model Alert {
  alertId    String   @id @default(cuid()) @map("alert_id")
  type       String   // VEHICLE_BREAKDOWN | OUTLET_CLOSED | LOAD_SHORTFALL | LOAD_REJECTED | DELIVERY_FAILED | ETA_RISK | OFFLINE_DRIVER
  severity   String   // CRITICAL | HIGH | MEDIUM | LOW
  tripId     String?  @map("trip_id")
  trip       Trip?    @relation(fields: [tripId], references: [tripId])
  payload    Json
  resolved   Boolean  @default(false)
  resolvedBy String?  @map("resolved_by")
  resolvedAt DateTime? @map("resolved_at")
  createdAt  DateTime @default(now()) @map("created_at")
  @@map("alerts")
}
```

---

## PART 8 — REAL-TIME EVENT SYSTEM (Socket.IO)

### Room Structure
```
Rooms:
  dispatcher:{depot}    ← All dispatchers for Peliyagoda or Kandy
  loader:{vehicleId}    ← Loader assigned to a specific vehicle
  driver:{vehicleId}    ← Driver of a specific vehicle
  outlet:{outletId}     ← Store manager of a specific outlet
```

### Complete Event Taxonomy

| Event | Emitter | Receivers | Payload |
|---|---|---|---|
| `vehicle:position` | Driver | Dispatcher | `{ vehicleId, lat, lng, timestamp, nextOutletId }` |
| `trip:started` | Driver | Dispatcher | `{ tripId, vehicleId, timestamp }` |
| `delivery:arrived` | Driver | StoreManager | `{ orderId, outletId }` |
| `delivery:completed` | Driver | Dispatcher + StoreManager | `{ orderId, outcome, timestamp, photoUrl }` |
| `delivery:outlet_closed` | Driver | Dispatcher + StoreManager | `{ orderId, outletId, reason, photoUrl }` |
| `trip:completed` | Driver | Dispatcher | `{ tripId, completedOrders, deferredOrders }` |
| `load:item_scanned` | Loader | Dispatcher (soft) | `{ orderId, vehicleId, status: ok\|shortfall }` |
| `load:shortfall` | Loader | Dispatcher | `{ orderId, tripId, shortfallType, qty, note }` |
| `load:confirmed` | Loader | Dispatcher + Driver | `{ tripId, loaderId, timestamp }` |
| `alert:vehicle_breakdown` | Driver | Dispatcher | `{ vehicleId, tripId, location, pendingOrders }` |
| `alert:created` | Server | Dispatcher | `{ alertId, type, severity, payload }` |
| `alert:resolved` | Dispatcher | Dispatcher room | `{ alertId, resolvedBy }` |
| `order:reassigned` | Dispatcher | Driver (new) + StoreManager | `{ orderId, newVehicleId, newEta }` |
| `order:deferred` | Dispatcher / Server | StoreManager | `{ orderId, reason, revisedDate, message }` |
| `eta:updated` | Server (cron) | StoreManager | `{ orderId, newEta, vehicleId }` |

### Socket.IO: Breakdown Handler

```typescript
socket.on('alert:vehicle_breakdown', async ({ vehicleId, tripId, location }) => {
  const trip = await db.trip.update({
    where: { tripId },
    data: { status: 'breakdown' },
    include: { orders: { where: { status: 'on_route' } }, vehicle: true }
  });
  const suggestion = await findReplacementVehicle(trip);
  const alert = await db.alert.create({
    data: {
      type: 'VEHICLE_BREAKDOWN', severity: 'CRITICAL', tripId,
      payload: { vehicleId, location, pendingOrders: trip.orders, suggestion }
    }
  });
  io.to(`dispatcher:${trip.vehicle.depot}`).emit('alert:created', {
    alertId: alert.alertId, type: 'VEHICLE_BREAKDOWN', severity: 'CRITICAL',
    payload: { vehicleId, pendingOrders: trip.orders, suggestion }
  });
  for (const order of trip.orders) {
    io.to(`outlet:${order.outletId}`).emit('order:deferred', {
      orderId: order.orderId, reason: 'VEHICLE_BREAKDOWN',
      message: `Your delivery is delayed. Updated ETA: ${suggestion?.eta ?? 'TBD'}`
    });
  }
});
```

---

## PART 9 — OFFLINE PWA STRATEGY (Driver + Loader)

### Service Worker Config (`next.config.js`)

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^\/api\/trips\/.*\/manifest/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'trip-manifest',
        expiration: { maxEntries: 10, maxAgeSeconds: 8 * 60 * 60 }
      }
    },
    {
      urlPattern: /^\/api\/trips\/.*\/stops/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'trip-stops',
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50 }
      }
    },
    {
      urlPattern: /^\/api\/deliveries/,
      handler: 'NetworkOnly',
      options: {
        backgroundSync: {
          name: 'delivery-sync-queue',
          options: { maxRetentionTime: 24 * 60 } // 24 hours
        }
      }
    }
  ]
});
```

### Offline UI Rules (from Docs-ui specs)

- **Driver offline banner:** amber, non-blocking, persistent: `"You're offline. Your route and delivery records are available on this phone."` + count + last sync time
- **Delivery outcomes saved offline:** state = `"Saved on this phone"` NOT `"Synced"` — the distinction is mandatory
- **Sync centre:** `Sync now` disabled when offline; enabled only when connected
- **Conflict handling:** never silent overwrite — show old vs new, require driver acknowledgement, preserve both records
- **Reconnection:** show count synced + link to activity (no false all-clear)
- IndexedDB used as offline store for queued delivery outcomes

---

## PART 10 — DOCKER CONFIGURATION

### `Dockerfile`
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

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
      NEXT_PUBLIC_SOCKET_URL: ${NEXTAUTH_URL:-http://localhost:3000}
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

### Judge Start Command
```bash
git clone https://github.com/BigBug/BigBug_WaypointDelivery
cd BigBug_WaypointDelivery
cp .env.example .env
docker compose up
# Wait for: "✓ Server ready on http://localhost:3000"
# Open http://localhost:3000
```

---

## PART 11 — SEEDED ACCOUNTS & DEMO DATA

| Role | Email | Password | Name | Depot/Outlet |
|---|---|---|---|---|
| Dispatcher | `dispatcher@waypoint.lk` | `waypoint2026` | Nilantha Perera | Peliyagoda |
| Loader | `loader@waypoint.lk` | `waypoint2026` | Chamara Bandara | Peliyagoda |
| Driver | `driver@waypoint.lk` | `waypoint2026` | Roshan Jayasinghe | Peliyagoda |
| Store Manager | `store@waypoint.lk` | `waypoint2026` | Thilini W. | OUT005 (Colombo) |

### Demo Day (seeded at runtime = tomorrow's date)

- 30 orders assigned across 8 vehicles (6 Fresh, 4 Style, 3 Tech)
- **5 orders deliberately deferred** (demand exceeds capacity — visible in deferred list)
- **2 orders with `deferredYesterday = true`** — appear with priority badge in plan builder
- **1 van-only order** — limited to VEH036/037/038
- Barcodes for loader scan demo listed in `README.md`
- OUT005 receives delivery via VEH006 Trip 1 (syncs to store manager view)

---

## PART 12 — JUDGE WALKTHROUGH

> This is the numbered walkthrough to include in `README.md`.

```
SETUP
─────────────────────────────────────────
1. git clone https://github.com/BigBug/BigBug_WaypointDelivery
2. cd BigBug_WaypointDelivery
3. cp .env.example .env
4. docker compose up
   Wait for: "✓ Server ready on http://localhost:3000"
5. Open http://localhost:3000

STORE MANAGER FLOW (Place an order first — the workflow starts here)
─────────────────────────────────────────
6.  Login: store@waypoint.lk / waypoint2026
7.  See Store Manager Home — "Plan your next delivery"
8.  Tap "New order" → choose delivery date → add items → Review → Submit
9.  See order status: "Submitted — awaiting plan"

DISPATCHER FLOW
─────────────────────────────────────────
10. New tab: dispatcher@waypoint.lk / waypoint2026
11. See Daily Operations Overview with morning health strip
12. Observe orange priority badge on 2 deferred_yesterday orders
13. Click "Open plan builder" → see unassigned orders queue
14. Click "Auto-suggest" → watch orders fill into vehicle trip slots
15. See deferred orders in bottom impact tray (demand exceeded capacity)
16. Click on a deferred order → "Review deferral" page → select reason → "Confirm deferral & notify store"
17. Return to plan — click "Publish plan" → confirmation sheet → publish
18. Back on Operations tab: see live health strip update

LOADER FLOW
─────────────────────────────────────────
19. New tab: loader@waypoint.lk / waypoint2026
20. Select VEH006 from vehicle lane board
21. See trip panel: stops in reverse load order ("Load Stop 6 first → Stop 1 last")
22. Click "Start scanning" → camera opens
23. Scan barcode from README (correct item) → green flash ✔
24. Scan barcode 2 (wrong vehicle item) → red alert + shortfall panel
25. Select shortfall type → note → "Escalate to dispatcher"
26. Confirm alert appears in dispatcher exception queue (check other tab)
27. Complete remaining items → checklist all green → "Ready to depart"
28. Confirm driver app now shows "Ready to depart" (trip started available)

DRIVER FLOW
─────────────────────────────────────────
29. New tab: driver@waypoint.lk / waypoint2026
30. See Driver Today: Trip 1 card now shows "Ready to depart"
31. Click "Start trip" (from parked position)
32. Navigate to Stop 1 → "I'm parked" → Complete delivery (3-step POD)
33. Step 1: Confirm quantities (one item: partial — 10 of 12 delivered)
34. Step 2: Recipient name + photo → "Add delivery photo"
35. Step 3: Review outcome "Partial delivery" → "Complete stop"
36. On Stop 3: click "Report a problem" → "Outlet Closed" → photo → reason → submit
37. See alert appear in dispatcher exception queue
38. Simulate offline: toggle airplane mode → continue stop 4 with offline banner
39. Reconnect → see sync centre with queued records → "Sync now"
40. Complete remaining stops → Trip summary → submit

STORE MANAGER FLOW (Receipt)
─────────────────────────────────────────
41. Return to store@waypoint.lk tab
42. See delivery hero card update to "Delivered"
43. Tap "Confirm receipt" → line-item table appears
44. Mark "Frozen peas — 2 missing" → category: Missing goods → note → submit
45. "Confirm receipt" → success state with illustration
46. Check notifications: deferred order appears with reason (from step 16)
```

---

## PART 13 — DEPARTURES FROM DESIGNATHON DESIGN

| Screen | Designathon Plan | Hackathon Implementation | Reason |
|---|---|---|---|
| D1 Live Map | Real GPS vehicle tracking | Simulated positions via cron job | GPS requires native app; web PWA has browser limitations |
| D4 Scanner | Native camera scanner | `html5-qrcode` (web) | Scope decision; functionally equivalent UX |
| M2 Navigation | In-app turn-by-turn map | Deep-link to Google Maps | Reliability and scope; navigation engine out of scope |
| M4 Biometric | Device biometric unlock | Password only (biometric as enhancement) | Time constraint; deferred to post-submission |

---

## PART 14 — JUDGING CRITERIA MAPPING

| Criterion | Weight | How We Address It |
|---|---|---|
| **Functional completeness** | 20% | All 4 roles implemented end-to-end; judge walkthrough covers 45 steps across all roles |
| **Planning & allocation engine** | 20% | Greedy bin-packer enforcing all 9 constraints; tested against `check_allocation.py` logic; deferred list visible and auditable |
| **Degradation, offline, recovery** | 10% | Vehicle breakdown → store notification; outlet closed → dispatcher alert; loading shortfall → escalation; offline queue → sync |
| **Fidelity to Day 5 design** | 10% | All screen specs from `Docs-ui/` implemented; Lucide icons, exact color tokens, "Calm Operational Clarity" direction; departures documented |
| **Engineering quality** | 25% | TypeScript end-to-end, Prisma ORM, shared Zod schemas, Docker Compose one-command start, GitHub Actions CI |
| **Creativity** | 5% | Real-time Leaflet map, barcode scanning, automated ETA push, digital POD with photo + signature, offline sync centre |
| **Demo video** | 10% | 5–8 min walkthrough of all 4 roles + architecture + allocation engine explanation |

---

## PART 15 — 5-DAY BUILD SCHEDULE

| Day | Date | Sprint Goal | Key Deliverables |
|---|---|---|---|
| **Day 6** | 30 Sep | Foundation | Repo + Docker + DB schema + auth + 4 seeded users + all reference data seeded from CSVs |
| **Day 7** | 1 Oct | Engine + Dispatcher | Allocation engine (all 9 constraints) + D1 Operations Overview + D2 Plan Builder + D3 Deferral |
| **Day 8** | 2 Oct | Loader + Driver | D4 Load Board + D5 Shortfall panel + M1 Driver Today + M2 Route & Stop + M3 POD + offline PWA |
| **Day 9** | 3 Oct | Store + Real-time | D6 Order Composer + D7 Tracking + M5 Home + M6 Order/Receipt + Socket.IO events + M4 Sync Centre |
| **Day 10 AM** | 4 Oct | Deploy + Auth + Polish | D8/M7 Auth flows + deploy Railway/Render + seed demo day + final testing |
| **Day 10 PM** | 4 Oct | **Submit 11:59 PM** | Record 5–8 min demo video → GitHub public + URL live + form submitted |

---

## PART 16 — AI TOOL DISCLOSURE (`docs/ai-disclosure.md`)

| Work | AI-Assisted | Detail |
|---|---|---|
| Architecture design | ✅ Partial | AI suggested component boundaries; team finalised structure |
| Allocation engine logic | ✅ Partial | AI drafted TypeScript scaffold; team implemented and tested all 9 constraints |
| Firestore data model | ✅ Partial | AI suggested schema; team designed from challenge data + Designathon specs |
| React component UI | ✅ Partial | AI generated boilerplate; team designed interaction logic and visual system |
| Socket.IO event taxonomy | ❌ No | Team designed all events from Designathon handoff requirements |
| Seed data scripts | ✅ Yes | AI wrote CSV→Firestore seed parser; team reviewed and validated |
| Vercel / Firebase config | ✅ Partial | AI generated base config; team customised |
| Visual system (colors, icons, typography) | ✅ Yes | Directly from `Docs-ui/` specification files generated with AI assistance |
| Demo video | ❌ No | Recorded and narrated by team |

---

## PART 17 — SUBMISSION CHECKLIST

| Item | Done? |
|---|---|
| ✅ Next.js 14 project scaffolded in `Triathlon_BigBug/waypoint-flow/` | DONE |
| ✅ All 712 npm packages installed | DONE |
| ✅ Firebase project connected (real credentials in .env) | DONE |
| ✅ `app/(auth)/login/page.tsx` — D8/M7 login screen | DONE |
| ✅ Role-based middleware protecting all 4 role routes | DONE |
| ✅ Seed script: 8 Firestore collections seeded with demo data | DONE |
| ✅ `lib/allocation/engine.ts` — All 9 constraints implemented | DONE |
| ✅ D1 Dispatcher Operations Overview — wired to live Firestore | DONE |
| ✅ HealthStrip, TripsTable, ExceptionQueue, RouteMap components | DONE |
| ✅ `app/api/dispatcher/overview` API route | DONE |
| ✅ D2 Plan Builder (`/dispatcher/plan`) | DONE |
| ✅ D3 Capacity Deferral (`/dispatcher/deferral/[orderId]`) | DONE |
| ✅ D4/D5 Loader Load Board + Shortfall Panel | DONE |
| ✅ M1/M2/M3/M4 Driver screens + offline sync | DONE |
| ✅ D6/D7/M5/M6 Store Manager screens | DONE |
| ✅ Socket.IO real-time events | DONE |
| ▢ GitHub monorepo: `BigBug_WaypointDelivery` (public) | PENDING |
| ▢ `README.md`: setup + credentials + 45-step numbered walkthrough | PENDING |
| ▢ Deploy to Vercel | PENDING |
| ▢ 4 seeded accounts confirmed working on deployed URL | PENDING |
| ▢ Demo video 5–8 min — YouTube Unlisted | PENDING |
| ▢ Submission form: repo link + URL + credentials + video URL | PENDING |
