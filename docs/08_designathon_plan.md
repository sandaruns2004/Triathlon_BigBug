# 08 · Designathon — Full Planning & Execution Guide

> **Deadline:** Day 5 · 29 September 2026 · **11:59 PM Sri Lanka Time**  
> **Submission File:** `BigBug_Designathon.zip`  
> **Challenge:** Design one unified system for all four roles in the Waypoint delivery workflow

---

## 1. Problem Understanding

### What is Waypoint?
Waypoint is an FMCG last-mile delivery management system for a Sri Lankan distribution company operating from **Peliyagoda** and **Kandy** depots. It serves 120 retail outlets across 12 districts with three brand lines: **Fresh** (pre-dawn, chilled), **Style**, and **Tech** (both daytime, ambient).

### The Core Problem
The delivery workflow involves **four distinct roles** that are currently disconnected:
- A **dispatcher's** route plan doesn't automatically reach the **loader**
- A **driver's** delivery outcome doesn't automatically update the **store manager**
- There is no single system view of what is happening across the operation

The challenge: **Design one system that connects all four roles end-to-end.**

---

## 2. The Four Roles

### Role 1 — Dispatcher 🖥️
**Context:** Office-based, desktop. Works from ~3 AM (Fresh planning) through end of day.

| Aspect | Detail |
|---|---|
| Primary goal | Plan, validate, and dispatch delivery routes |
| Key pain points | Manual constraint checking, no live vehicle visibility, no emergency re-routing |
| Critical decisions | Which orders to defer, which vehicle per trip, how to recover from breakdowns |
| Device | Desktop (web browser, large screen) |
| Peak hours | 03:00–08:00 (Fresh), 08:30–10:00 (Style/Tech dispatch) |

### Role 2 — Loader 📦
**Context:** Warehouse floor, tablet. Loud, physical environment. Gloved hands.

| Aspect | Detail |
|---|---|
| Primary goal | Load correct items onto the correct vehicle in the right order |
| Key pain points | Paper manifests, no barcode scan validation, wrong loads discovered on-road |
| Critical decisions | Sequence of loading, flagging weight/volume discrepancies |
| Device | Tablet (large touch targets, portrait mode) |
| Peak hours | 03:30–07:00 (Fresh), 08:00–10:00 (Style/Tech) |

### Role 3 — Driver 🚚
**Context:** Vehicle cab + outlet yard. Mobile, intermittent connectivity.

| Aspect | Detail |
|---|---|
| Primary goal | Navigate to stops, complete deliveries, capture proof of delivery |
| Key pain points | Paper delivery sheets, no GPS guidance, no digital proof of delivery |
| Critical decisions | Outlet closed → defer or wait, partial delivery, getting signatures |
| Device | Mobile phone (portrait, one-hand friendly) |
| Peak hours | 04:00–08:00 (Fresh), 09:00–17:00 (Style/Tech) |

### Role 4 — Store Manager 🏪
**Context:** Retail outlet. Mobile. Busy managing their store.

| Aspect | Detail |
|---|---|
| Primary goal | Know when delivery is coming, verify receipt, flag discrepancies |
| Key pain points | No ETA visibility, disputes over what was delivered, manual sign-off on paper |
| Critical decisions | Accept/reject delivery, flag damaged goods, query missing items |
| Device | Mobile phone (portrait) |
| Peak hours | 05:00–08:00 (Fresh outlets), 09:00–17:00 (Style/Tech outlets) |

---

## 3. User Personas

### Persona 1 — Nilantha (Dispatcher)
> *"I need to know the moment something goes wrong so I can fix it before the outlets open."*

- **Age:** 38 | **Location:** Peliyagoda depot | **Experience:** 11 years
- **Daily routine:** Arrives 2:45 AM, reviews overnight orders, assigns Fresh routes by 3:15 AM, monitors live until 8 AM, then shifts to daytime planning
- **Frustrations:** Calls from drivers about closed outlets; no way to see which vehicle is where; reassigning a breakdown means calling 4 people manually
- **Goals:** Zero deferred Fresh orders; instant emergency visibility; one-click reallocation

### Persona 2 — Chamara (Loader)
> *"Sometimes I load a truck and an hour later the driver calls saying one item doesn't match."*

- **Age:** 26 | **Location:** Peliyagoda warehouse | **Experience:** 3 years
- **Daily routine:** Arrives 3:00 AM, receives printed manifests, picks items, loads into vehicle bays, signs off
- **Frustrations:** Paper manifests get wet/torn; can't tell if an item is for trip 1 or trip 2; no feedback when a load is correct
- **Goals:** Scan items and get instant go/no-go; see items grouped by trip and stop sequence

### Persona 3 — Roshan (Driver)
> *"I reach an outlet that's closed and I have no idea what to do — call Nilantha and wait."*

- **Age:** 31 | **Location:** Peliyagoda fleet | **Experience:** 5 years, Fresh + Style routes
- **Daily routine:** Picks up truck 3:45 AM, drives 8–12 stops per trip, collects signatures, returns to depot
- **Frustrations:** Paper delivery sheets get soggy; disputes with managers; no navigation; can't easily record a partial delivery
- **Goals:** One screen per stop, offline capability, photo + signature capture, clear next-stop navigation

### Persona 4 — Thilini (Store Manager)
> *"The truck sometimes arrives 30 minutes early. We're not ready, the dock isn't open, and everything stalls."*

- **Age:** 44 | **Location:** Colombo Fresh outlet | **Experience:** 8 years managing the outlet
- **Daily routine:** Opens store 5:00 AM, expects Fresh delivery by 6 AM, manually checks invoice vs items received
- **Frustrations:** No ETA, paper invoices, long disputes if something is missing
- **Goals:** Live ETA on her phone, digital delivery summary, easy discrepancy flagging

---

## 4. Screen Flows Per Role

### 4.1 Dispatcher Screens (Desktop)

| Screen | Purpose & Priorities |
|---|---|
| **D1 — Daily Plan Board** | Master view of all routes for the day. Shows each vehicle, its trips, order count, estimated return time, and live status. Priority: Immediate visibility of any constraint violation (red badges). |
| **D2 — Order Allocation** | Drag-and-drop or click-to-assign interface. Left panel = unassigned orders, right = vehicle slots. Shows real-time capacity (volume + weight bars), time budget gauge per vehicle. Deferred orders bucket visible at bottom. |
| **D3 — Route Detail** | Click into a trip → see ordered stop list, estimated times, delivery windows, outlet constraints. Allow reordering stops. |
| **D4 — Live Operations Map** | Real-time map view. Vehicle pins with status (en-route, at-outlet, delayed, off-track). Countdown to outlet window close for at-risk stops. |
| **D5 — Alert Console** | Sidebar that surfaces critical events: breakdown alert, outlet closed report, driver delay, scanner rejection. Each alert has a one-click action button. |
| **D6 — Emergency Reallocation** *(Degradation)* | Triggered when a vehicle breakdown is reported. Shows affected stops, lists candidate vehicles with remaining capacity + time budget. Dispatcher picks replacement vehicle; system re-sequences stops and notifies driver + store managers. |

### 4.2 Loader Screens (Tablet)

| Screen | Purpose & Priorities |
|---|---|
| **L1 — Vehicle Assignment** | Loader taps their vehicle for today. Shows trip 1 and trip 2 items to load. Large touch targets. |
| **L2 — Trip Manifest** | Scrollable list of items for a trip, grouped by stop order. Each item shows product name, units, weight, temperature flag. |
| **L3 — Scan & Load** | Camera-based barcode scanner. Green ✔ = correct item. Red ✖ = wrong item / wrong vehicle. Audio feedback. Shows running totals of volume and weight against vehicle capacity. |
| **L4 — Load Complete Confirmation** | Summary screen showing all items confirmed, capacity utilisation, any skipped items. One-button sign-off sends confirmation to dispatcher. |
| **L5 — Wrong Item Alert** *(Degradation)* | Full-screen red alert when scanned item belongs to different vehicle or trip. Shows correct vehicle/trip, option to flag or re-route item. Notifies dispatcher automatically. |

### 4.3 Driver Screens (Mobile)

| Screen | Purpose & Priorities |
|---|---|
| **R1 — My Trips** | Today's trips summary. Start time, total stops, estimated duration. Start Trip button. |
| **R2 — Current Stop** | One stop at a time. Outlet name, address, delivery window countdown, items to deliver (units, temp requirement). Photo + signature capture. |
| **R3 — Navigation** | Deep-link to maps (Google Maps / Waze) for routing. ETA updated in real time. |
| **R4 — Delivery Outcome** | After each stop: Delivered / Partial / Not Delivered. If partial/not delivered → mandatory reason selection + photo. |
| **R5 — Outlet Closed** *(Degradation)* | Special flow when outlet is found closed. Driver captures photo of closed shutters, selects reason (locked/no staff/outside window), system notifies dispatcher and store manager immediately, order auto-flagged for defer. |
| **R6 — Trip Summary** | End of trip: all stops status, successful deliveries count, deferred/failed count. Submit to depot. |

### 4.4 Store Manager Screens (Mobile)

| Screen | Purpose & Priorities |
|---|---|
| **S1 — Upcoming Delivery** | Card showing expected delivery: ETA (live), items count, driver name, vehicle plate. Updates in real time. |
| **S2 — ETA Alert** | Push notification + in-app card when driver is 15 minutes away. |
| **S3 — Delivery Receipt** | On arrival: list of items being delivered. Manager taps to confirm each item or mark discrepancy (short, damaged, wrong item). |
| **S4 — Sign-off** | Digital signature capture. Generates digital delivery note. Sent to email automatically. |
| **S5 — Discrepancy Flag** *(Degradation)* | If items are missing/damaged at receipt: manager photographs + describes issue. Submitted directly to dispatcher as a dispute ticket. No need to call. |

---

## 5. Degradation Screens (Full Details)

### Degradation 1 — "Route Collapse" ⭐ PRIMARY
**Scenario:** A reefer truck (VEH003) breaks down at 05:15 AM during the pre-dawn Fresh run with 4 stops remaining.

**Why it matters:** Fresh deliveries are time-critical (outlets close at 07:30–08:00). Chilled products deteriorate. Every minute of delay risks SLA breach and product spoilage.

**Design response:**
- Dispatcher sees a full-screen alert with the broken-down vehicle, affected outlets, and remaining time on each outlet's window
- System auto-suggests the best available reefer vehicle (by remaining capacity + proximity)
- Dispatcher confirms reassignment in 2 taps
- Store managers receive automatic "Delivery delayed — updated ETA: 07:10 AM" push notification
- Driver of the replacement vehicle receives updated route on their phone

**Key design decisions:** Auto-suggest removes cognitive load during a panic moment. Outlet countdown timers make urgency visible. One-tap confirm prioritises speed.

---

### Degradation 2 — "Dead Stop"
**Scenario:** Driver arrives at an outlet but it is closed (shutters down, no staff).

**Why it matters:** A no-access at a Fresh outlet means perishable goods return to depot. Unresolved, it triggers a missed-delivery flag against the driver and a stockout at the outlet.

**Design response:**
- Driver opens "Outlet Closed" flow, photographs the shutters
- Selects reason (outside window / locked / no contact person)
- System immediately notifies dispatcher + store manager
- Dispatcher sees the alert in the console and can attempt a phone call via the app or mark order as deferred
- Store manager receives: "Your delivery attempt at [time] could not be completed. Contact your depot for rescheduling."

---

### Degradation 3 — "Wrong Load Caught"
**Scenario:** Loader scans an item meant for VEH006 Trip 2 onto VEH003 Trip 1 at 3:45 AM.

**Why it matters:** A wrong load discovered on the road causes a detour, time loss, and potential SLA breach for two outlets.

**Design response:**
- Scanner screen flashes red, audio beep
- Full-screen: "This item belongs to VEH006 · Trip 2. Return to Bay 6."
- Loader cannot proceed until item is removed or dispatcher overrides
- Dispatcher receives a soft notification (not full-screen) showing the item conflict

---

## 6. Design System & Style Guide

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#1A56DB` | Primary actions, active states |
| `surface` | `#F8FAFF` | App background |
| `success` | `#0E9F6E` | Confirmed, loaded, delivered |
| `warning` | `#FF8A4C` | Time pressure, near-deadline |
| `danger` | `#E02424` | Breakdown, wrong item, failed delivery |
| `neutral-900` | `#111928` | Primary text |
| `neutral-400` | `#9CA3AF` | Secondary text, disabled |
| `reefer-blue` | `#C3DDFD` | Chilled product indicators |
| `ambient-warm` | `#FEF3C7` | Ambient product indicators |

### Typography
- **Display/Headings:** Inter (600, 700)
- **Body:** Inter (400, 500)
- **Data/Numbers:** Inter Mono (tabular figures)

### Key Interaction Patterns
| Pattern | Usage |
|---|---|
| Bottom sheet | Mobile — actions and details |
| Status badges | Colour-coded vehicle / order / trip states |
| Progress ring | Capacity utilisation gauge on dispatcher + loader |
| Countdown chip | Time remaining to outlet window close |
| Haptic + audio | Scanner confirm/reject on loader tablet |
| Full-screen takeover | Degradation alerts — cannot be dismissed without action |

### Touch Targets
- Loader + Driver screens: minimum 48×48 dp targets (gloved hands)
- All critical actions: full-width button at bottom of screen

---

## 7. Information Architecture

```
Waypoint App
├── Dispatcher Portal (web, desktop)
│   ├── Plan View (Daily Plan Board)
│   ├── Allocate (Order Assignment)
│   ├── Monitor (Live Map + Alert Console)
│   └── History / Reports
│
├── Loader App (web, tablet)
│   ├── Vehicle Selection
│   ├── Trip Manifest
│   └── Scan & Load
│
├── Driver App (web → PWA, mobile)
│   ├── My Trips
│   ├── Current Stop
│   └── Delivery Outcome
│
└── Store Manager App (web → PWA, mobile)
    ├── Upcoming Delivery
    ├── Receipt
    └── History
```

---

## 8. Core Design Tradeoff

**Unified vs Role-Optimised:**

We chose **role-optimised surfaces** sharing a **unified data layer** rather than one single interface for everyone.

A single UI would compromise every role: too complex for a driver at 5 AM, too simple for a dispatcher managing 60 vehicles. Each role gets a surface designed for their environment and cognitive load, but all surfaces read and write to the same order/trip/delivery state — so a dispatcher's change instantly propagates to driver and store manager.

**Tradeoff accepted:** We do not design a separate native app for each role (scope). Everything is a responsive web app (PWA) delivered through the browser. Native features (push notifications, offline) are progressively enhanced.

---

## 9. AI Tool Disclosure (Required)

| Work Item | AI-Assisted? | How |
|---|---|---|
| Persona research & drafting | ✅ Yes | Gemini / Antigravity used to draft persona profiles; team reviewed and edited for domain accuracy |
| Screen flow naming & rationale | ✅ Yes | AI suggested screen names; rationale paragraphs co-written |
| Color palette selection | ❌ No | Manual selection |
| Wireframe / Hi-fi design | ❌ No | Designed by team in Figma |
| Prototype interactions | ❌ No | Set up manually in Figma |
| Demo video script | ✅ Partial | AI drafted bullet points; team recorded and narrated |

---

## 10. Figma File Structure

```
BigBug_Designathon.fig
├── Page 1: Cover + Problem Framing
├── Page 2: Delivery Workflow Diagram (end-to-end)
├── Page 3: Personas (Nilantha, Chamara, Roshan, Thilini)
├── Page 4: Dispatcher Screens (D1–D6)
├── Page 5: Loader Screens (L1–L5)
├── Page 6: Driver Screens (R1–R6)
├── Page 7: Store Manager Screens (S1–S5)
├── Page 8: Degradation Screens + Rationale
├── Page 9: Style Guide (colors, typography, components)
├── Page 10: AI Tool Disclosure
└── Page 11: Core Tradeoff (optional)
```

---

## 11. Submission Checklist

| Item | Status |
|---|---|
| ☐ 4 personas completed in Figma | |
| ☐ All role screen flows with rationale paragraphs | |
| ☐ ≥1 degradation screen designed ("Route Collapse") | |
| ☐ Figma prototype interactions linked | |
| ☐ Demo video recorded (3–5 min), uploaded to YouTube as Unlisted | |
| ☐ AI Disclosure page in Figma | |
| ☐ Figma exported to PDF | |
| ☐ ZIP created: `BigBug_Designathon.zip` | |
| ☐ Submission form submitted with: ZIP + Figma URL + YouTube URL | |

---

## 12. Submission Package Structure

```
BigBug_Designathon.zip
└── BigBug_Designathon/
    ├── BigBug_Designathon.pdf     ← All Figma pages exported
    ├── BigBug_Designathon.fig     ← Source Figma file
    └── README_submission.txt      ← Prototype URL + YouTube URL
```

**Submission form requires:**
- ZIP file upload
- Prototype shareable link (Figma)
- Demo video URL (YouTube Unlisted)

---

## 13. 4-Day Execution Plan

| Day | Date | Task | Owner |
|---|---|---|---|
| Day 2 | 26 Sep | Problem framing, personas drafted, Figma file created | All |
| Day 3 | 27 Sep | Wireframes all 4 roles + degradation scenarios | Design lead |
| Day 4 | 28 Sep | Hi-fi polish + prototype links + style guide | Design lead |
| Day 5 AM | 29 Sep | Demo video recorded, ZIP packaged | All |
| Day 5 PM | 29 Sep | **Submit before 11:59 PM** | Team leader |
