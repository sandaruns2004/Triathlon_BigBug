# Tech-Triathlon 2026 · Designathon Full Report
## Team BigBug · Waypoint Delivery System

> **Deadline:** 29 September 2026 · 11:59 PM Sri Lanka Time  
> **Submission:** `BigBug_Designathon.zip` + Figma prototype URL + YouTube video URL

---

## PART 1 — CHALLENGE BRIEF ANALYSIS

### The Core Ask

> *"Design one system that helps all four roles complete the delivery workflow."*

The brief has three layers:

1. **Understand the operation** — The FMCG distribution system runs on two depots, three brands, 60 vehicles, and 120 outlets. Time windows are strict, temperature rules are non-negotiable, and a failure at any link breaks the whole chain.

2. **Connect the roles** — A dispatcher's decision must reach the loader. A driver's delivery outcome must reach the store manager. The four roles are not parallel — they are sequential, and the system must make that sequencing visible and actionable.

3. **Show restraint** — Judges value prioritization. Don't design every possible screen. Design the *right* screens.

---

## PART 2 — OPERATION UNDERSTANDING

### The Delivery Chain

```
[Dispatcher] Plans & assigns routes (03:00–09:00)
      ↓
[Loader] Loads vehicles, scans items (03:30–10:00)
      ↓
[Driver] Drives routes, delivers, captures proof (04:00–17:00)
      ↓
[Store Manager] Receives, verifies, signs off (05:00–17:00)
```

### Two Operating Windows

| Window | Time | Brand | Temperature |
|---|---|---|---|
| Pre-dawn | 03:30–08:00 | **Fresh** | ❄️ Chilled (reefer trucks) |
| Daytime | 09:00–17:00 | **Style / Tech** | 🌡️ Ambient |

### Critical Constraints (that must inform design decisions)

| Constraint | Design Impact |
|---|---|
| Each trip = one brand + one district | Dispatcher UI must group orders by brand + district |
| Max 270 min for Fresh trips | Time budget gauge is a first-class UI element |
| Chilled orders → reefer only | Vehicle assignment must flag temp mismatch in red |
| van_only outlets → vans only | Outlet cards must show parking constraint prominently |
| Max 2 trips per vehicle per day | Vehicle column shows trip 1 and trip 2 slots |
| Deferred_yesterday orders are priority | These must surface first in the allocation queue |

---

## PART 3 — USER PERSONAS

### Persona 1 — Nilantha Perera · Dispatcher

> *"I need to know the moment something goes wrong so I can fix it before the outlets open."*

**Demographics:** 38 years old · Peliyagoda depot · 11 years at the company  
**Device:** Desktop (Windows, Chrome, 24" monitor)  
**Hours:** Arrives 2:45 AM, leaves ~4:00 PM

**A day in his life:**
- 2:45 AM → reviews overnight order list
- 3:00 AM → begins assigning Fresh orders to reefer trucks
- 3:30 AM → trucks roll out; switches to monitoring
- 5:00 AM → first call from a driver (outlet closed)
- 8:30 AM → Style/Tech allocation begins
- 1:00 PM → reviewing return reports

**Pain points:**
- No live vehicle visibility → relies on driver phone calls
- Constraint checking is manual → errors only discovered when driver calls
- Reallocation after a breakdown means calling 4+ people manually
- Deferred orders aren't tracked systematically

**Goals:**
- See every vehicle's status in one view
- Get alerted instantly when something breaks
- Reallocate in 2 taps, not 10 calls

**Motivations:** Professional pride in a smooth operation. Hates having to tell outlets their delivery failed.

---

### Persona 2 — Chamara Bandara · Loader

> *"Sometimes I load a truck and an hour later the driver calls saying one item doesn't match."*

**Demographics:** 26 years old · Peliyagoda warehouse · 3 years  
**Device:** Tablet (Android, 10", damp/cold warehouse environment)  
**Hours:** 3:00 AM – 10:00 AM

**A day in his life:**
- 3:00 AM → picks up printed manifest
- 3:15 AM → starts pulling items from cold room
- 3:45 AM → loads onto assigned truck by stop sequence
- 4:00 AM → trucks start leaving
- 7:00 AM → Style/Tech loading begins
- 10:00 AM → shift ends

**Pain points:**
- Paper manifests get wet and torn in the cold room
- No confirmation that he's loading the right item → mistakes only caught later
- Items from two trips on one manifest → confusion about sequence
- No feedback when a load is correct

**Goals:**
- Scan barcode → instant confirm/reject
- See items grouped by trip and stop sequence
- Digital sign-off that replaces paper

**Physical context:** Gloves. Noisy. Cold. Screen must be readable in poor lighting. Large touch targets essential.

---

### Persona 3 — Roshan Jayasinghe · Driver

> *"I reach an outlet that's closed and I have no idea what to do — call Nilantha and wait."*

**Demographics:** 31 years old · Peliyagoda fleet · 5 years  
**Device:** Mobile (Android, 6.1", used one-handed in truck cab)  
**Hours:** 3:45 AM – 2:00 PM (Fresh + second trip)

**A day in his life:**
- 3:45 AM → picks up truck, checks paper delivery sheet
- 4:15 AM → first stop (Colombo Fresh outlet)
- 4:15–8:00 AM → completes 8 stops, collects signatures
- 9:00 AM → starts second trip (Style/Tech)
- 2:00 PM → returns to depot, submits paper sheets

**Pain points:**
- Paper delivery sheets get soaked in early morning rain
- Disputes with store managers → no record of what was handed over
- No turn-by-turn navigation → relies on memory
- When outlet is closed → no procedure, must call Nilantha

**Goals:**
- One screen per stop (not a full list to scroll through)
- Photo + signature capture for every delivery
- Clear offline capability (patchy signal in Puttalam, hill districts)
- Structured "outlet closed" flow → no more guessing

---

### Persona 4 — Thilini Wickramasinghe · Store Manager

> *"The truck sometimes arrives 30 minutes early. We're not ready, the dock isn't open, and everything stalls."*

**Demographics:** 44 years old · Colombo Fresh outlet (OUT005) · 8 years  
**Device:** Mobile (iPhone 13, personal device)  
**Hours:** 5:00 AM – 6:00 PM

**A day in his life:**
- 5:00 AM → opens store, expects Fresh delivery by 6 AM
- 6:00 AM → truck arrives; manual check of items vs paper invoice
- 6:30 AM → signs paper delivery note; files it for accounts
- 9:00 AM → store opens; busy until evening

**Pain points:**
- No ETA visibility → must be at the loading dock from 5 AM "just in case"
- Paper invoices → disputes if something is missing (no photo evidence)
- Long process to flag a discrepancy → must call depot, navigate IVR

**Goals:**
- Push notification when driver is 15 minutes away
- Digital delivery note sent to her email
- One-tap discrepancy flag with photo → no phone calls needed

---

## PART 4 — SCREEN FLOWS

### 4.1 Dispatcher Flows (Desktop)

---

**D1 · Daily Plan Board**

The master view. Three columns: Unassigned Orders, Vehicles & Trips, Deferred Orders.

- Left column: Orders grouped by (brand, district). Priority orders (deferred_yesterday) appear at top with an orange badge.
- Center column: Each vehicle shows two trip slots. Capacity bars (volume + weight). Time budget gauge. Status chip (idle / loading / en-route / returned).
- Right column: Deferred orders with reason.

*Rationale:* The dispatcher needs the whole day in one view. The three-column layout mirrors the mental model: things to assign, things already assigned, things that can't be assigned. Capacity bars prevent the #1 error (over-assigning). Status chips allow monitoring without switching screens.

---

**D2 · Order Allocation**

Click "Assign" on any order → drawer opens showing compatible vehicles only (filtered by brand, district, depot, temp, parking constraint).

Each vehicle card shows: remaining capacity bars, time budget remaining, trip 1/2 slot available. One-click assigns.

*Rationale:* Filtering to compatible vehicles removes guessing. Showing remaining capacity and time budget after assignment lets the dispatcher make an informed decision in one step.

---

**D3 · Route Detail**

Click any trip → ordered stop list. Each stop shows: outlet name, district, dock type, delivery window, order weight/volume, planned arrival time.

Dispatcher can drag stops to reorder. System recalculates estimated times and flags any window violations in red.

*Rationale:* Sometimes the auto-sequence is wrong. A dispatcher who knows a particular outlet's traffic pattern needs to be able to fix the order. Immediate recalculation makes the consequence of reordering visible.

---

**D4 · Live Operations Map**

Map (OpenStreetMap/Leaflet) with vehicle pins. Pin color = status:
- 🔵 Blue = en-route
- 🟢 Green = at outlet (delivering)
- 🟡 Yellow = delayed (>10 min behind schedule)
- 🔴 Red = breakdown / emergency

Clicking a pin shows: driver name, current stop, next stop, ETA, time remaining on next window.

*Rationale:* The dispatcher currently has zero visibility after trucks leave. This screen replaces all phone calls for "where is VEH007?" The color coding allows instant anomaly detection across 60 vehicles.

---

**D5 · Alert Console (Sidebar)**

Persistent right sidebar (collapsible). Stacked cards per alert:
- 🔴 CRITICAL: Breakdown, constraint violation, load rejection
- 🟠 HIGH: Outlet closed, delivery failed
- 🟡 MEDIUM: Driver delayed >15 min
- ⚪ LOW: Load confirmed, delivery completed

Each alert has a one-click action button (e.g., "Reassign", "Call Driver", "Mark Deferred").

*Rationale:* Alerts that require navigation away from the map break focus. A sidebar that persists on all dispatcher screens means no information is hidden. Action buttons reduce response time from "receive alert → figure out what to do" to "receive alert → tap action".

---

**D6 · Emergency Reallocation** *(Degradation Screen — CRITICAL)*

Full-screen overlay triggered by a breakdown alert. Cannot be dismissed without action.

- Top section: Affected trip (vehicle, driver, current location, remaining stops list with window countdowns)
- Middle section: System-suggested replacement vehicle with explanation ("VEH009 · 4 stops remaining capacity · 47 min budget remaining · best match")
- Bottom section: Alternative vehicles ranked by suitability
- Prominent "Accept Suggestion" button + "Choose Manually" link

On confirm:
- Driver of VEH009 receives new route on their phone
- Store managers of affected outlets receive "Updated ETA" push notification
- Dispatcher sees a green success banner

*Rationale:* A breakdown during Fresh pre-dawn is the highest-stakes emergency in this operation. Products spoil, outlet SLAs are breached. The full-screen takeover forces resolution. Auto-suggestion removes decision paralysis. Store manager notification closes the loop automatically.

---

### 4.2 Loader Flows (Tablet)

---

**L1 · Vehicle Selection**

Simple card grid: all vehicles assigned for today, with depot and loading bay number. Loader taps their vehicle.

*Rationale:* Loaders are assigned to a vehicle, not a route. This is the only decision point before loading begins. Making it a large card tap is appropriate for tablet + gloves.

---

**L2 · Trip Manifest**

Tabbed view: Trip 1 | Trip 2. Each trip shows a scrollable list of items in stop sequence. Each item: product name, units, weight, volume, temperature chip (❄️ or 🌡️), dock type icon.

Checkboxes are not the primary interaction — scanning is. This screen is reference-only before the scanner opens.

*Rationale:* The loader needs to see the complete picture before starting. Grouping by trip avoids the "is this for trip 1 or trip 2?" confusion. Temperature chips make reefer items visually distinct.

---

**L3 · Scan & Load**

Camera scanner view. Large viewfinder. Each scan:
- ✅ Green flash + chime = correct item for this vehicle + trip
- ❌ Red flash + buzz = wrong vehicle, wrong trip, or unrecognised item

Below the viewfinder: running counters for volume loaded (x.x / y.y m³) and weight loaded (x,xxx / y,yyy kg). Progress bar fills as capacity is used.

Items scan off the manifest automatically. When all items for a stop are scanned, the stop row collapses with a green tick.

*Rationale:* Errors caught here cost zero. Errors caught after the truck leaves cost an hour. The audio + visual feedback allows the loader to work without reading each screen. The capacity bars prevent overloading (a constraint violation that check_allocation.py flags).

---

**L4 · Load Complete**

Summary: all stops confirmed, capacity used (vol + wt), any outstanding items. "Sign Off & Notify Dispatcher" button.

*Rationale:* One-button sign-off creates a timestamped record and sends a real-time notification to the dispatcher's alert console. This is the bridge between loading and dispatch.

---

**L5 · Wrong Item Alert** *(Degradation Screen)*

Full-screen red takeover on a wrong-item scan.

Shows: "This item belongs to VEH006 · Trip 2 — Bay 6". Photo of item. "Return item" and "Report to Dispatcher" buttons. Cannot scan next item until resolved.

*Rationale:* A partial resolution (loader proceeds anyway) causes a downstream failure. The blocking full-screen prevents proceeding without acknowledgement. The correct vehicle + bay information helps the loader fix it immediately.

---

### 4.3 Driver Flows (Mobile)

---

**R1 · My Trips**

Two cards: Trip 1 (Fresh) and Trip 2 (Style/Tech). Each shows: brand, district, stop count, estimated duration, start time. "Start Trip" button when the time is right.

*Rationale:* The driver needs context before starting. Knowing the district and stop count lets them mentally prepare. The estimated duration sets expectations.

---

**R2 · Current Stop**

One stop at a time — full screen. Shows:
- Outlet name, district, delivery window countdown (large, color changes from green → orange → red as window closes)
- Items to deliver: units, temp requirement, weight
- "Navigate" button → deep-links to Google Maps / Waze
- "Record Delivery" button → leads to R4

*Rationale:* Drivers should focus on one stop at a time. Showing only the current stop reduces distraction. The countdown timer is the most critical piece of information — it tells the driver how much urgency applies.

---

**R3 · Navigation**

Deep-link to device maps app. Waypoint provides the outlet address. No custom turn-by-turn — we rely on Google Maps / Waze for routing accuracy. When driver returns to Waypoint, it asks "Arrived?" as a confirmation.

*Rationale:* Building a navigation system from scratch is out of scope and inferior to what drivers already use. The right design decision is to hand off navigation to a specialist tool and reclaim control when the driver confirms arrival.

---

**R4 · Delivery Outcome**

After arrival confirmation, driver sees:
- Items checklist (pre-filled from trip order)
- "Delivered" / "Partial" / "Not Delivered" toggle
- Photo capture (mandatory for Partial + Not Delivered)
- Signature pad (full delivery only)

On submit → outcome sent to server → store manager notified → dispatcher updated.

*Rationale:* The outcome screen is where the chain closes. Photo + signature make disputes resolvable. The mandatory photo for non-deliveries creates accountability without being punitive.

---

**R5 · Outlet Closed** *(Degradation Screen)*

Activated from R2 via "Outlet Closed" button. Full-screen flow:
1. "Take photo of closed outlet" → camera opens
2. "Select reason": Outside delivery window / Shutters down / No contact person / Other
3. "Submit" → photo + reason sent to server

Server automatically:
- Flags order as deferred
- Notifies dispatcher (alert console)
- Notifies store manager: "Your delivery at [time] could not be completed. Contact your depot."

*Rationale:* Currently drivers in this situation call Nilantha and wait. This creates a structured, documented, low-effort process. The photograph creates a record that protects the driver from false claims.

---

**R6 · Trip Summary**

End of trip: all stops listed with their outcome (✅ Delivered / ⚠ Partial / ❌ Not Delivered). Total successful deliveries, weight delivered, deferred count. "Complete Trip" button.

*Rationale:* The trip summary is the driver's end-of-shift record. Reviewing it before submission lets the driver catch any omissions. The metrics (weight delivered, stops completed) give a sense of accomplishment and create depot performance data.

---

### 4.4 Store Manager Flows (Mobile)

---

**S1 · Upcoming Delivery Card**

Home screen shows one card (or two if Style + Fresh on same day). Each card: brand, expected time window, live ETA, driver name, vehicle plate, items count.

*Rationale:* The store manager's goal is minimal friction. One card that shows everything they need to prepare for the delivery — no navigation required.

---

**S2 · ETA Alert**

Push notification + in-app banner: "Your Fresh delivery is 15 minutes away. Driver: Roshan · VEH037"

*Rationale:* This notification solves the store manager's #1 pain point — having to be at the dock from 5 AM. They can now arrive when needed.

---

**S3 · Delivery Receipt**

When driver marks "arrived", store manager screen switches to receipt mode. Shows each item with a tap-to-confirm or tap-to-flag (Damaged / Short / Wrong Item). Quick and sequential.

*Rationale:* The receipt must be fast — the driver is waiting at the dock. Tap-to-confirm per item is faster than a full form. Discrepancy flags are non-blocking (store manager can flag and confirm in one step).

---

**S4 · Sign-off**

Digital signature pad. One-button submit. Generates PDF delivery note → emailed to store manager.

*Rationale:* The digital signature replaces the paper delivery note entirely. The automatic email eliminates the "I lost the invoice" problem.

---

**S5 · Discrepancy Flag** *(Degradation Screen)*

If an item is flagged in S3, a drawer expands: photo capture + description field + submit. Creates a dispute ticket directly in the dispatcher's alert console.

*Rationale:* Currently, a missing item dispute means calling the depot, navigating an IVR, and waiting. This reduces the process to three taps and a photo. It also creates a timestamped, evidence-backed record that protects both parties.

---

## PART 5 — DEGRADATION SCENARIOS

### Degradation 1 — "Route Collapse" ⭐ PRIMARY

**When:** Reefer truck (VEH003) breaks down at 05:15 AM mid-Fresh-route, 4 stops remaining.

**Why it matters to Waypoint:** Fresh deliveries have hard close times (07:30–08:00). Chilled products deteriorate in a non-reefer vehicle. Missing a Fresh window means a stockout at the outlet. Stockouts damage the relationship with the retailer and the brand's reliability reputation.

**The design response:**
- Dispatcher receives full-screen alert (cannot dismiss without action)
- Shows: VEH003's remaining stops, countdown timers on each window
- System auto-suggests VEH007 (reefer, 19.4 m³ remaining, within time budget)
- Dispatcher accepts in 2 taps
- Driver of VEH007 receives updated route on phone
- Affected store managers receive: "Updated ETA: 07:10 AM"
- Alert resolves and closes

---

### Degradation 2 — "Dead Stop"

**When:** Driver (Roshan, VEH037) arrives at OUT005 at 05:00 AM — shutters are down.

**Why it matters:** A no-access at a Fresh outlet wastes pre-dawn capacity, risks spoilage, and leaves the outlet without stock. Without a structured process, drivers improvise — sometimes waiting 30 minutes, sometimes driving away with no record.

**The design response:**
- Driver taps "Outlet Closed" on R2
- Photographs shutters, selects reason
- Order flagged as deferred with timestamp + photo
- Dispatcher alerted immediately
- Store manager receives automated notification

---

### Degradation 3 — "Wrong Load Caught"

**When:** Loader scans a VEH006 Trip 2 item onto VEH003 Trip 1 at 3:45 AM.

**Why it matters:** A wrong load discovered mid-route costs 30–60 minutes of detour time, risks SLA breaches for two outlets, and undermines driver trust in the manifest system. Catching it at the scanner costs zero.

**The design response:**
- Scanner screen: full-screen red flash + buzz
- "This item belongs to VEH006 · Trip 2 · Bay 6. Return item."
- Loader cannot proceed until item is resolved
- Soft notification to dispatcher (not critical — handled by loader)

---

## PART 6 — CORE DESIGN TRADEOFF

**Unified interface vs role-optimised surfaces**

The brief says "one system" — but that doesn't mean one interface. We chose role-optimised surfaces (dispatcher desktop, loader tablet, driver mobile, store manager mobile) sharing one unified data layer.

**Why:** The dispatcher at 3 AM needs information density. The driver at 5 AM needs extreme simplicity and one-hand usability. A single interface would compromise every role. The right abstraction is a shared database and event system — the "one system" — with role-specific front-ends optimised for each user's environment, cognitive load, and device.

**Tradeoff accepted:** Four separate surface designs means four times the design effort. We prioritised quality-per-role over covering every edge case in every role. Judges will see complete, purposeful screens rather than many incomplete ones.

---

## PART 7 — AI TOOL DISCLOSURE

| Work Item | AI-Assisted | How Used |
|---|---|---|
| Persona research | ✅ Yes | Gemini / Antigravity used to draft initial profiles; team edited for domain accuracy |
| Screen flow naming | ✅ Yes | AI suggested names; team selected and refined |
| Rationale paragraphs | ✅ Partial | AI drafted bullets; team wrote final paragraphs |
| Color palette | ❌ No | Manual design decision |
| Wireframes / Hi-fi | ❌ No | Designed by team in Figma |
| Prototype interactions | ❌ No | Set up manually in Figma |
| Degradation scenario identification | ✅ Partial | AI brainstormed scenarios; team selected and designed |
| Demo video | ❌ No | Recorded and narrated by team |

---

## PART 8 — SUBMISSION PACKAGE

```
BigBug_Designathon.zip
└── BigBug_Designathon/
    ├── BigBug_Designathon.pdf     ← All Figma pages exported as PDF
    ├── BigBug_Designathon.fig     ← Figma source file
    └── README_submission.txt      ← Contains:
                                       - Figma prototype shareable link
                                       - YouTube demo video URL (unlisted)
                                       - Short notes on assumptions
```

**Submission form requires:**
1. ZIP file upload → `BigBug_Designathon.zip`
2. Prototype shareable link → Figma "Anyone with link can view"
3. Demo video URL → YouTube Unlisted (3–5 minutes)
