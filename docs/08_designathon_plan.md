# 08 · Designathon — Full Planning & Execution Guide

> **Deadline:** Day 5 · 29 September 2026 · **11:59 PM Sri Lanka Time**  
> **Submission File:** `BigBug_Designathon.zip`  
> **System Name:** Waypoint Flow

---

## 1. What the Designathon Asks

Design **one connected delivery planning system** — called **Waypoint Flow** — that connects all four roles across the complete workflow:

```
Store Manager → places order
Dispatcher    → plans, allocates, handles deferrals
Loader        → follows stop sequence, flags shortfalls
Driver        → follows route, records delivery, works offline
Store Manager → confirms receipt, reports issues
```

The key judging idea is **continuity across roles** — not four disconnected dashboards, but a single system where a dispatcher's decision reaches the loader, and a driver's delivery outcome updates the store manager automatically.

---

## 2. The Company: Waypoint Group

| Brand | Outlets | Goods | Delivery Pattern |
|---|---|---|---|
| **Waypoint Fresh** | 80 | Groceries, chilled & frozen | Daily, before stores open at 8 AM |
| **Waypoint Style** | 25 | Garments, cartons | Weekly, seasonal peaks |
| **Waypoint Tech** | 15 | Appliances, electronics | As-needed, heavy/fragile/high-value |

**Network:** 120 outlets · 60 vehicles · 2 depots (Peliyagoda & Kandy) · 16 refrigerated vehicles  
**Operations:** Monday–Saturday  
**Current state:** Spreadsheets, phone calls, printed run sheets, dispatcher knowledge

### Main Problems to Solve
- Fragmented order and planning process
- Poor visibility of delivery progress
- Unclear / poorly recorded deferral decisions
- Weak communication between warehouse, drivers, and stores
- No reliable proof-of-delivery workflow
- Difficulty anticipating future demand and capacity
- Unexpected service-time and lateness problems
- Unreliable field connectivity

---

## 3. Four User Roles

### Dispatcher — Peliyagoda planning office, desktop, stable connectivity
**Needs to:**
- Build the daily delivery plan
- Allocate orders to vehicles and trips (respecting all constraints)
- See delivery progress in real time
- Understand and act on problems after vehicles leave
- Record and explain deferral decisions
- Identify outlets already skipped

### Loader — Warehouse dock, shared tablet/terminal, gloves possible
**Needs to:**
- See the stop sequence in loading order
- Load goods in reverse stop order (load last-stop first)
- Detect missing or damaged items before departure

### Driver — Road, personal phone, intermittent connectivity
**Needs to:**
- Follow the planned route
- Record delivery outcomes at each stop
- Capture proof of delivery
- Work fully offline
- Synchronise records when connectivity returns
- All interactions designed for **use when safely stopped**

### Store Manager — Outlet, desktop or phone
**Needs to:**
- Place and confirm orders
- Know the expected arrival time
- Receive clear notice when an order is deferred (with reason)
- Confirm receipt
- Report delivery issues

---

## 4. Operating Constraints (Design Must Reflect These)

### Vehicle Constraints
- Every vehicle has weight and volume limits
- Chilled/frozen goods → **refrigerated vehicle only**
- Refrigerated vehicles can carry ambient goods
- Ambient vehicles **cannot** carry chilled/frozen
- Each vehicle has a **weekly fuel quota**
- A vehicle can run **up to two routes per day**

### Outlet Constraints
- Every outlet has a delivery window
- Fresh deliveries must arrive **before 8 AM**
- Mall outlets may have fixed access windows
- `van_only` outlets can only be served by vans

### Demand and Deferral
- When demand exceeds capacity, some orders must be deferred
- Dispatcher must **record the reason**
- Design must make deferral **understandable and visible** to the store
- Deferral must never be a silent status change

### Connectivity
- Driver workflow must work **fully offline**
- Must reconcile records cleanly when connection returns

---

## 5. Visual Direction: "Calm Operational Clarity"

Waypoint Flow should feel like a dependable operating system for retail distribution: precise enough for planners, fast enough for the dock, understandable enough for outlet managers.

### Design Principles
- **Information first** — tables, timelines, route lists, capacity bars, and status chips communicate actual work
- **Meaningful restraint** — white canvas, thin neutral borders, sparse shadows = premium clarity without sterility
- **Green with purpose** — reserve for primary actions, route progress, and successful completion
- **Explain the why** — constraints, warnings, deferrals need plain-language rationale and downstream impact
- **One system across roles** — shared type, colours, states; density/navigation adapts per environment
- **Field-safe mobile** — high contrast, large targets, predictable flows, explicit offline/sync state
- **Accessible by default** — visible labels, keyboard focus, no colour-only meaning

### Color Tokens
| Token | Hex | Usage |
|---|---|---|
| Waypoint Green (deep) | `#146B45` | Primary palette, nav rail, headings |
| Action Green | `#1F8A5B` | Primary buttons, interactive states |
| Pale Green | `#EAF6EF` | Surface emphasis, selected states |
| Success | `#168050` | Completed / successful states |
| Ink | `#17221D` | Primary text |
| Muted | `#63716A` | Secondary text |
| Border | `#DCE5DF` | Card borders, dividers |
| Canvas | `#F6F8F7` | Page background |
| Amber | — | Attention / at-risk states |
| Red | — | Blocked or failed work only |
| Blue-grey | — | Informational states |

> ⚠️ **Never use colour alone** — always pair with a label and icon.

### Typography
- **Font:** Inter (neo-grotesk sans-serif)
- Page titles: 28–32 px
- Section titles: 18–20 px
- Body: 14–16 px
- Numbers/times/quantities: **tabular numerals**

### Shape & Shadow
- 10 px corner radius (cards and controls)
- 14 px corner radius (large panels)
- Borders subtle; shadows sparse and soft
- **No** glassmorphism, heavy gradients, or decorative blobs

### Icon System
- Single outline icon family (Lucide recommended)
- Consistent 1.75–2 px visual stroke
- Filled semantic status dots only where they improve scanning

### Avoid
- Neon gradients, glass panels, oversized illustrations
- Generic logistics / AI-SaaS aesthetics
- Decorative analytics that hide real information

---

## 6. System Status Language

Use these exact status terms consistently across all roles:

`Needs planning` · `Planned` · `Loading` · `Loading issue` · `Ready to depart` · `On route` · `Delivered` · `Issue reported` · `Deferred`

---

## 7. Desktop Screen Flows

### Global Shell (All Desktop Screens)
- **Left rail:** Waypoint Flow logo · Planning · Operations · Orders · Outlets · Fleet · Reports · role-aware navigation · user/profile menu at bottom
- **Top bar:** current operating date · depot selector (All / Peliyagoda / Kandy) · global search · notification bell · connection/system health
- **Page header:** title · plain-language operational summary · date/route filters · one primary action

### Interaction Rules
- Click on any order/trip/vehicle/outlet → right-side detail drawer (preserves context)
- Destructive actions (defer, remove, declare shortfall) → require a **reason** + show downstream impact before confirmation
- Tables: search, persistent filters, sortable columns, visible result count
- Maps: always have a synchronized list/table view
- Activity history on all records for cross-role accountability

---

### D1 · Dispatcher Operations Overview

**Purpose:** Answer *"Is today's plan deliverable, and what needs my attention now?"* — the control tower after planning begins.

**Layout:**
1. Header: "Today's operations" + date + depot scope + `Open plan builder` primary button
2. Morning health strip: orders planned · vehicles dispatched · on-time forecast · orders at risk · unresolved exceptions (each metric clickable)
3. Live route map (⅔ width): vehicle dots, route lines, depot pins, outlet status markers, compact legend
4. Exception queue (⅓ width): ordered by urgency — loading shortfall · delivery access issue · ETA breach · offline driver beyond threshold · unplanned order (each shows owner, elapsed time, `Resolve` action)
5. Trips table: vehicle · depot · trip 1/2 · route progress · next stop · capacity · temp requirement · ETA risk · status

**Interactions:**
- Click a queue item → contextual drawer with facts, history, suggested options, and the action
- `Resolve` on a late route → notify affected store manager with revised ETA (message logged)
- Time-sensitive Fresh routes pinned above general routes until window closes
- Map and table selections stay synchronized

**States:**
- Empty before planning: explain no routes published, direct to Plan Builder
- At-risk cards: amber, explain *why* (window/service time/access/loading), never imply certainty
- Vehicle capacity: both weight and volume — e.g., `2.8 / 3.5 t · 14 / 18 m³` + refrigerated snowflake badge

**Handoff:** Published routes → Loader Load Board. Driver + store updates return here as live activity.

---

### D2 · Dispatcher Plan Builder

**Purpose:** Allocate submitted orders into feasible vehicle trips — respecting outlet windows, temperature, van-only rules, capacity, depot, and the two-trip-per-day limit.

**Layout:**
- Top planning bar: selected date · depot · `Auto-suggest` secondary · `Save draft` · `Publish plan` primary · plan quality indicator (plain-language blocking issues/warnings)
- Left column — Unassigned orders: filterable queue with outlet, brand, window, item class, weight, volume, priority, order age. Chilled/frozen items: text badge, not colour alone
- Centre — Route canvas: tabbed vehicle trips (`Vehicle 12 · Trip 1`) with ordered stop cards and travel/arrival estimates. Drag-to-assign or `Assign` from drawer
- Right column — Vehicle inspector: capability, reefer/ambient, weight/volume bars, weekly fuel remaining, status, route duration, constraint validation
- Bottom impact tray: unassigned orders, predicted deferrals, outlet impact, route warnings

**Interactions:**
- Hard constraint fail → assignment prevented; explain cause, offer eligible vehicles: *"This frozen order requires a refrigerated vehicle."*
- Soft constraint at risk → allow assignment only after clear warning, show projected effect
- Reorder stops → ETA recalculates; breached windows shown immediately
- `Auto-suggest` → proposes plan, marks all as reviewable; dispatcher remains accountable for publishing
- `Publish plan` → confirmation sheet: routes/vehicles released, deferred orders, affected stores, outbound notifications

**Rationale:** Three-column layout keeps order pool, route decisions, and vehicle constraints visible simultaneously. Eliminates spreadsheet context-switching while making constraint validity explicit.

---

### D3 · Capacity Deferral & Impact ⭐ PRIMARY DEGRADATION SCREEN

**Scenario:** Demand exceeds available fleet capacity — especially when refrigerated vehicles, outlet windows, and seasonal Style peaks collide.

**Trigger:** From Plan Builder — an order remains unassigned or assignment creates an unresolvable hard conflict → select `Review deferral`.

**Layout:**
- Header: "Review order deferral" + order ID + outlet + brand + promised window + goods class + original requested date
- Left — Decision context: route alternatives considered, compatible vehicle availability, capacity shortfall, fuel/route-limit constraints, nearby compatible orders. Distinguish unavailable vs manually rejected options
- Centre — Store impact: next possible service date, effect on outlet stock/priority, timeline: Submitted → Planning exception → Proposed deferment → Store notified
- Right — Decision form: reason selector (`No compatible refrigerated capacity` / `Vehicle capacity` / `Window conflict` / `Access constraint` / `Operational disruption` / `Other`) + note + revised proposed date + store notification preview
- Footer: `Keep unassigned` secondary · `Confirm deferral & notify store` primary (destructive-but-recoverable)

**Behaviour:**
- Confirmation → order = `Deferred`; records dispatcher, timestamp, reason, alternatives considered; sends in-app/email notification to store manager
- Store sees reason category, revised date, path to acknowledge/raise issue — **never a generic "delayed" label**
- If capacity later opens → dispatcher can `Restore to planning`; history remains; store receives new update

**Why it matters:** Prevents invisible spreadsheet decisions, protects scarce refrigerated capacity, preserves a defensible audit trail without forcing store managers to chase the planning office.

---

### D4 · Loader Load Board

**Purpose:** Turn the published delivery plan into a safe loading sequence — load last-stop goods first, detect exceptions before departure, release only checked vehicles.

**Layout:**
- Header: depot + dock/shift + current time + large count: `3 vehicles loading · 1 attention needed`
- Vehicle lane board: horizontal cards — Scheduled · Loading · Loading issue · Ready to depart · Departed. Cards: vehicle, trip, departure deadline, route stop count, temp requirement, progress
- Selected trip panel: route stop sequence in **unloading order** — load instruction explicitly reverses it: *"Load Stop 6 first → Stop 1 last."* Each stop expands to quantities, handling type, scan/check status
- Right checklist: vehicle cleanliness/temperature check · item count · damage check · load securement · final seal/dispatch confirmation

**Interactions:**
- Barcode scan where available; large `Mark checked` controls as manual fallback (named user/time audit)
- Missing or damaged item → opens shortfall flow before dispatch; trip with unresolved red items **cannot** be marked Ready to depart
- All checks pass → `Ready to depart` notifies driver that trip is ready; changes dispatcher status live

**Shared-device design:** 18 px+ labels, high-contrast large target areas, short time-on-task flows, automatic sign-out after inactivity. Must work with gloves and intermittent scanning hardware.

---

### D5 · Loading Shortfall ⭐ SECONDARY DEGRADATION SCREEN

**Scenario:** An item is missing or damaged at the dock.

**Purpose:** Stop an incorrect manifest becoming a delivery failure, without losing the loader's place in the loading sequence.

**Layout:** Focused side panel over the Load Board:
- Order/outlet, item, expected vs available quantity, stop number, vehicle, departure deadline
- Choice: `Missing` / `Damaged` / `Temperature concern` / `Other`
- Quantity affected, optional photo/scan reference, short note
- Impact panel: *"This outlet will receive a partial delivery"* + *"Dispatcher decision required before 06:40."*
- Actions: `Save and continue loading` · `Escalate to dispatcher` (primary for material shortages)

**Behaviour:**
- Save → immutable exception created, dispatcher queue updated, trip marked `Loading issue`
- Replacement confirmed → loader records it, resumes exact checklist step
- No replacement → dispatcher chooses: partial delivery / reallocation / deferment
- Driver manifest shows approved adjusted quantity; never an unexplained mismatch
- Store notification only after dispatcher selects the customer-facing resolution

---

### D6 · Store Order Composer

**Purpose:** Let a store manager submit a confident order while understanding delivery eligibility and expected timing.

**Layout:**
- Header: outlet identity + selected delivery date/window + cut-off countdown + `Order history` link
- Two-pane body: left = product/category catalogue (search, brand-aware categories); right = persistent order summary
- Order rows: SKU, item name, pack/unit, quantity stepper, availability status, handling class, line note
- Summary: item count, weight/volume estimate, chilled/frozen callout, preferred delivery window, PO/reference, validation messages
- Footer: `Save draft` · `Review order`

**Review & Submit:** Summarizes quantities, requested date/window, special handling, and the fact that submission is a *request subject to fleet planning*. `Submit order` creates a timestamped order with visible status `Submitted — awaiting plan`.

**Guardrails:**
- Show cut-off and invalid dates before selection, not after submit
- Explain unavailable/restricted goods per line; keep saved draft if manager must resolve later
- **Do not promise** a vehicle or exact ETA before dispatch planning. Confirmed ETA appears only once a route is published

---

### D7 · Store Order Tracking & Receipt

**Purpose:** Give the outlet a clear, low-effort record from submitted order through receipt or issue resolution.

**Layout:**
- Order header: status badge + order number + brand/outlet + requested date + latest ETA or revised date + `Contact operations` secondary
- Progress timeline: Submitted → Planned → Loading → On route → Delivered → Receipt confirmed. Deferred follows a **visually distinct branch** with reason and revised date
- Delivery card: route/vehicle details, ETA window, driver-arrival state, delivery notes. Avoid unnecessary driver personal info
- Line-item receipt table: ordered / delivered / accepted / discrepancy / notes
- Action panel: `Confirm receipt` (all correct) or `Report issue` (wrong qty / damage / missing / temp concern / other) + conversation/activity history

**Deferred state:** Prominently state reason category, dispatcher note, revised service date, and what store can do next — acknowledge / contact operations / report business impact. **Never** an unexplained silent status change.

**Receipt behaviour:** `Confirm receipt` records manager name and time. `Report issue` asks for affected lines, short note, optional evidence; creates operations exception while preserving original delivery record.

---

### D8 · Authentication

**Purpose:** Calm, trusted entry point for every Waypoint Flow user. Accounts provisioned by Waypoint administration — **no public sign-up**.

**Shared layout:** White page + restrained pale-green side panel (wide screens) with Waypoint Flow mark and *"Connected delivery operations"* tagline. Centred white form card, max 440 px, clear title, labelled fields, full-width green primary button.

**Sign in:** `Welcome back` heading · work email + password (show/hide) · `Keep me signed in` checkbox (off by default on shared terminals) · `Forgot password?` · `Activate your account` · SSO button only when enabled.

**Account activation:** From secure invitation email. Masked email + assigned org/outlet/depot (read-only). Steps: verify invitation → set password → confirm profile (name, mobile) → success. Role/outlet/depot not editable here.

**Post-login routing:** Dispatchers → Operations Overview · Loaders → Load Board · Drivers → mobile app · Store Managers → outlet home.

---

## 8. Mobile Screen Flows

### Global Mobile Foundation
- **Bottom nav (driver):** Today · Route · Activity · Profile. Active delivery task appears persistently above nav when relevant
- **Bottom nav (store):** Home · Orders · Notifications · Profile
- **Touch targets:** minimum 48 × 48 dp; primary actions full-width near thumb zone
- **Safety:** route guidance and delivery recording explicitly for use while parked. App never asks for signature/photo/form while navigation is active
- **Offline:** retain task data and queued actions locally. State shows `Saved on this phone` vs `Synced`, with queued count and last sync time
- **Accessibility:** 16 px minimum body text, high contrast, every icon labelled, no swipe-only actions

---

### M1 · Driver Today

**Purpose:** Help driver understand the day's assigned work before departure — without exposing planning complexity.

**Layout:**
- Top: greeting + depot/shift + connection pill (`Synced` or `Offline — 2 actions queued`) + profile
- Primary trip card: vehicle, trip number, departure status, stop count, estimated completion, temp/handling badge, dominant `Start trip` button (available only after loader releases the route)
- Stops preview: numbered list with outlet, delivery window, special instruction, status. Only current/next stop expanded by default
- Preparation card: vehicle/trip readiness acknowledgements from operations; link to manifest and loading notes
- Second-trip card: visible but visually quieter, labelled *"Available after Trip 1 completion."*

**States:** Before loader release → `Waiting for loading confirmation`. After departure → `Continue to next stop`. No assignment → explain, offer Refresh/sync.

**Safety:** `Start trip` requires single parked-state acknowledgement. Detailed route actions unavailable until driver confirms safely stopped.

---

### M2 · Driver Route & Stop

**Purpose:** Guide driver to next planned stop; present a short, safe workflow once parked.

**Layout:**
- In-transit view: next outlet name + delivery window + ETA + compact route map + handling/access note + `Open navigation` (hands off to phone's native maps) + `I'm parked` button
- Parked stop sheet: stop number + outlet/contact instructions + expected items and quantities + `Complete delivery` primary + `Report a problem` secondary
- Route drawer: all stops with current / completed / skipped / future status; future route changes highlighted with explanation

**Interactions:**
- `I'm parked` → switches interface from driving mode to delivery mode (does not claim GPS verification is perfect)
- Arrival outside delivery window → amber prompt with options: continue / contact operations / report access issue
- Skipped/failed stop → requires reason; routes event to dispatcher/store record
- Drivers cannot reorder routes; dispatcher updates arrive as a clear *"Route updated"* card requiring acknowledgement

---

### M3 · Driver Proof of Delivery

**Purpose:** Record a complete delivery outcome at the stop, in a sequence that works with poor or absent connection.

**Flow (one decision per screen, visible step indicator `1 of 3`, Back, and `Save for later`):**
1. **Confirm quantities:** expected vs delivered per line; defaults match loader-approved manifest. Driver can mark a line partial / missing / damaged / refused
2. **Capture proof:** recipient name, optional signature, photo(s), delivery note. Explain optional vs required evidence
3. **Review outcome:** Delivered in full / Partial delivery / Delivery failed / Refused. Display discrepancies in plain language
4. **Complete stop:** records local timestamp, moves to next-stop route card

**Layout principles:**
- Camera use: one large labelled button; retake option and thumbnail confirmation
- Quantity adjustments: reason required, support quick common choices
- Dispatcher and store see the same outcome language

**Data continuity:** Final outcome updates dispatcher's operations view and makes store receipt ready. If offline → labelled *"Saved locally — not yet delivered to others"* until sync succeeds.

---

### M4 · Driver Offline & Sync ⭐ MOBILE DEGRADATION SCREEN

**Scenario:** Connectivity drops during delivery.

**Why it matters:** Driver work cannot stop because coverage does. Proof, delivery outcomes, and exception details must remain trustworthy and reconcile cleanly when connection returns.

**Offline banner:** Persistent amber (but calm) banner: *"You're offline. Your route and delivery records are available on this phone."* Shows queued item count + *"Last synced 07:42"*. **Never blocks** the basic route, parked-stop, or proof flow.

**Sync centre layout:**
- Status: connection state, last sync, queued records, storage/security reassurance
- Queued actions list: each record shows stop + action type + local timestamp + evidence count + `Saved on this phone`
- Sync controls: automatic retry when online; `Sync now` only when connection exists; failed record shows readable issue + `Retry`
- Conflict resolution: where dispatcher changed route/order while driver was offline → preserve both records, show difference, instruct driver to contact operations (never silently overwrite proof)

**Reconnection:** `4 records synced` with link to activity. Partial failure → clearly identify unsynced item; no misleading all-clear success message.

---

### M5 · Store Manager Mobile Home

**Purpose:** Give a busy outlet manager immediate confidence about incoming deliveries and a fast path to ordering.

**Layout:**
- Header: outlet name + current day/date + notification bell
- Hero delivery card: today's most relevant order — status, arrival window, key change, `Track delivery`. Deferred orders use a **distinct card** with revised date and reason summary
- Quick actions: `New order` · `Order history` · `Confirm receipt` · `Report issue`
- Recent activity: compact timeline of submission, plan confirmation, route departure, delivery, messages
- Attention section: only actionable notices (cut-off today / deferred order / receipt awaiting / response on issue)

**Behaviour:** If no delivery due → hero becomes *"Plan your next delivery"* with next eligible date/cut-off. Notifications deep-link to the specific order. Home avoids fleet jargon; translates status into what outlet needs to know and do.

---

### M6 · Store Mobile Order, Tracking & Receipt

**Purpose:** Essential desktop store workflow in a compact, interruption-friendly mobile flow.

**New order flow:**
1. Choose delivery: date/window options + visible cut-off; invalid dates cannot be selected
2. Add goods: searchable catalogue, recent items, quantity steppers, cart badge
3. Review: items, handling class, notes/reference, requested window, submission disclaimer
4. Submitted: order ID + status `Awaiting plan` + notification preference

Cart persists between sessions. Chilled/frozen goods have explicit handling label. **App does not claim fleet availability before dispatcher publishes a route.**

**Tracking and receipt:**
- Status header and timeline mirror desktop: Submitted → Planned → Loading → On route → Delivered → Receipt confirmed
- When planned/on route: ETA window and relevant arrival notice
- When deferred: reason, revised date, `Contact operations` / `Report business impact`
- After delivery: line-item compare screen → `Confirm receipt` or `Report issue` (line selection, category, note, optional photo)

**Design rules:**
- Make `Confirm receipt` and `Report issue` equally easy to discover — problem reporting is never a hidden overflow action
- Every status change has plain-language explanation and time, including partial deliveries and deferrals
- User can leave and return to any form without losing entered data

---

### M7 · Mobile Authentication

**Purpose:** Fast, secure app entry for drivers and store managers — respects shared devices, unreliable connectivity, and role-controlled access.

**Mobile auth pattern:** Clean white screen, Waypoint Flow logo, pale-green route accent, one focused task per screen. Full-width 48 dp+ controls with primary action above keyboard. Authentication requires connection: *"Connect to the internet to sign in. Previously signed-in users can continue with available offline delivery records."*

**Sign in:** `Welcome to Waypoint Flow` heading · email + password + show/hide · `Sign in` primary · `Forgot password?` · `Activate account` · SSO button only where configured.

**Biometrics:** Only enabled after initial authenticated sign-in. Shared device → present guidance and avoid enabling biometric by default.

**Account activation (mobile):** From secure invitation — short 4-step flow: invitation check → create password → profile confirmation (name, contact number; role/outlet read-only) → `Account activated`.

**Session failure states:** Session expired → return to sign in, retain locally queued delivery evidence per org policy. No connection → do not claim sign-in succeeded. Locked out → clear retry time and recovery route. Biometrics fail → fall back to password without trapping user.

---

## 9. Figma File Structure

```
BigBug_Designathon.fig
├── Page 1:  Cover + Problem Framing
├── Page 2:  Delivery Workflow Diagram (end-to-end, all roles)
├── Page 3:  Personas × 4 (Dispatcher / Loader / Driver / Store Manager)
├── Page 4:  Design System (color tokens, type, status language, components)
├── Page 5:  Desktop — Dispatcher Screens (D1 Operations · D2 Plan Builder)
├── Page 6:  Desktop — Dispatcher Screens (D3 Deferral Impact — DEGRADATION)
├── Page 7:  Desktop — Loader Screens (D4 Load Board · D5 Shortfall — DEGRADATION)
├── Page 8:  Desktop — Store Screens (D6 Order Composer · D7 Tracking & Receipt)
├── Page 9:  Desktop — Authentication (D8)
├── Page 10: Mobile — Driver Screens (M1 Today · M2 Route & Stop · M3 POD)
├── Page 11: Mobile — Driver Screens (M4 Offline & Sync — DEGRADATION)
├── Page 12: Mobile — Store Screens (M5 Home · M6 Order/Tracking/Receipt)
├── Page 13: Mobile — Authentication (M7)
├── Page 14: AI Tool Disclosure
└── Page 15: Core Tradeoff (optional)
```

---

## 10. Degradation Screens Summary

| Name | Where | Trigger | Why It Matters |
|---|---|---|---|
| **Capacity Deferral & Impact** | Desktop — Dispatcher | Demand > available fleet, especially refrigerated | Prevents invisible deferrals; protects scarce reefer capacity |
| **Loading Shortfall** | Desktop — Loader | Item missing or damaged at dock before departure | Stops wrong manifest becoming a delivery failure on the road |
| **Offline Delivery & Sync** | Mobile — Driver | Coverage drops during delivery route | Proof of delivery must work without connection; reconcile cleanly on return |

---

## 11. Judging Criteria — How We Address Each

| Criterion | Weight | How We Address It |
|---|---|---|
| Problem framing | **25%** | Operation understanding grounded in Waypoint Group's real constraints; workflow continuity map shown upfront |
| Understanding of user context | **20%** | 4 personas tied to working environment (office/dock/road/outlet); device and connectivity realities built into every screen |
| Degradation screen quality | 15% | 3 degradation screens: Capacity Deferral (dispatcher), Loading Shortfall (loader), Offline & Sync (driver) |
| Domain accuracy | 10% | Constraints from booklet reflected in UI: reefer-only for chilled, van-only outlets, 2-trip limit, window enforcement |
| Scope and prioritization | 15% | Role-optimised surfaces, not everything for everyone; deliberate feature restraint |
| Visual & interaction design | 15% | "Calm operational clarity" — consistent green system, Inter, status language, shared patterns across all screens |

---

## 12. AI Tool Disclosure

| Work | AI-Assisted | How |
|---|---|---|
| Persona research | ✅ Partial | Gemini drafted initial profiles; team edited for Waypoint-specific domain accuracy |
| Screen flow naming | ✅ Partial | AI suggested names; team selected and refined against brief |
| Rationale paragraphs | ✅ Partial | AI drafted bullets; team wrote final paragraphs |
| Color palette selection | ❌ No | From official Docs-ui design system |
| Status language definition | ❌ No | Derived from Docs-ui specifications |
| Wireframes / Hi-fi design | ❌ No | Designed by team in Figma |
| Prototype interactions | ❌ No | Set up manually in Figma |
| Demo video | ❌ No | Recorded and narrated by team |

---

## 13. Submission Package

```
BigBug_Designathon.zip
└── BigBug_Designathon/
    ├── BigBug_Designathon.pdf     ← All Figma pages exported as PDF
    ├── BigBug_Designathon.fig     ← Source Figma file
    └── README_submission.txt
        ├── Figma prototype shareable link
        ├── YouTube demo video URL (unlisted, 3–5 min)
        └── Key assumptions noted
```

**Submission form requires:**
1. ZIP file upload → `BigBug_Designathon.zip`
2. Prototype shareable link → Figma "Anyone with link can view"
3. Demo video URL → YouTube Unlisted (3–5 minutes)

---

## 14. Execution Checklist

| Item | Done? |
|---|---|
| ✅ 4 personas in Figma (grounded in working conditions) | |
| ✅ All desktop screen flows with rationale paragraph per screen | |
| ✅ All mobile screen flows with rationale paragraph per screen | |
| ✅ End-to-end workflow diagram showing role continuity | |
| ✅ ≥3 degradation screens (Deferral / Shortfall / Offline) designed | |
| ✅ Design system page (tokens, type, status language, components) | |
| ✅ Figma prototype interactions linked | |
| ☐ Demo video 3–5 min, YouTube Unlisted | |
| ✅ AI Disclosure page in Figma | |
| ✅ PDF export of all pages | |
| ☐ ZIP: `BigBug_Designathon.zip` | |
| ☐ Submit form: ZIP + Figma URL + YouTube URL | |
