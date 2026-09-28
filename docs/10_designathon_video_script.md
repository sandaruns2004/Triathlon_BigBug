# Waypoint Flow — Demo Video Script & Recording Guide

> **Target length:** 3 to 5 minutes  
> **Format:** Screen recording of the Figma prototype with voiceover  
> **Platform:** Upload to YouTube (Unlisted)  

---

## 🎬 Recording Instructions

1. **Setup:** Open your Figma prototype in "Present" mode. Press `Z` to fit to screen and `Cmd+\` (or `Ctrl+\`) to hide the Figma UI.
2. **Pacing:** Don't rush. Let the judges see the screen for 2–3 seconds before moving the cursor.
3. **Cursor:** Move the cursor deliberately to point at the things you are talking about (e.g., the "Refrigerated" badge or the "Deferral" reason).
4. **Roles:** If you have multiple team members, have a different person voice each role (e.g., Person A is Dispatcher, Person B is Driver). If it's just you, that's fine too!
5. **Focus:** You only have 3–5 minutes. You **cannot** show every single button. Focus entirely on the "Connected Flow" and how data moves between roles.

---

## 🗣️ Sample Narration Script

*(Feel free to adapt this to your own voice. The bold text tells you what to do on screen).*

### 1. Introduction (0:00 - 0:30)
**[Screen: Show Page 1 — Cover / Connected Delivery Hero]**
"Hello judges, we are Team BigBug. Welcome to **Waypoint Flow**. 

When we audited Waypoint Group's operations, we found that planning was fragmented across spreadsheets, and communication relied entirely on phone calls. 

Waypoint Flow isn't just four disconnected dashboards. It is one connected system where a dispatcher's decision reaches the loader, and a driver's delivery outcome updates the store manager automatically. We call this 'Calm Operational Clarity'. Let's look at the flow."

### 2. Store Manager: Placing an Order (0:30 - 1:00)
**[Screen: Show Store Mobile Create Order (M6)]**
"It starts at the outlet. Amali, a Store Manager, needs to place an order. Because she's ordering chilled goods, the app explicitly flags the handling requirement. 

**[Screen: Show Store Mobile Review Order (M6)]**
Notice that we do *not* promise her a false ETA or a specific vehicle right now. We simply confirm her requested delivery window. She submits the order, and it enters the planning pool."

### 3. Dispatcher: Planning & Deferral (1:00 - 2:00)
**[Screen: Show Dispatcher Plan Builder (D2)]**
"At the Peliyagoda depot, Nilantha, our Dispatcher, is building the morning plan. Our 3-column layout shows the unassigned orders, the route canvas, and vehicle constraints all in one place. 

Notice how the system validates operating constraints live. Chilled goods are restricted to refrigerated vehicles. If Nilantha tries to overload the volume limit or violate a 'van-only' constraint, the system warns him.

**[Screen: Show Capacity Deferral (D3) — DEGRADATION SCENARIO 1]**
But what happens when demand exceeds our fleet capacity? This is our first degradation scenario. Instead of an invisible spreadsheet decision, Nilantha must formally defer the order. He must select a reason—like 'No compatible refrigerated capacity'—and the system shows him the exact impact on the store before he confirms."

### 4. Loader: Safe Dispatch (2:00 - 2:30)
**[Screen: Show Loader Load Board (D4)]**
"Once published, the plan goes to the warehouse dock. Chamara, the Loader, uses a shared tablet. 

Because last-in means first-out, the system explicitly tells him to load in reverse stop order. He scans items to mark them checked. If an item is missing, he can flag a 'Loading Shortfall' right here, escalating it to the dispatcher *before* the truck leaves, preventing a failed delivery on the road."

### 5. Driver: Offline Delivery (2:30 - 3:30)
**[Screen: Show Driver Today (M1) then Driver Route (M2)]**
"The truck is loaded. Roshan, the Driver, sees his route. Our mobile app is designed for safety—navigation hands off to the phone's native map, and delivery recording only happens when he taps 'I'm parked'. 

**[Screen: Show Complete Delivery (M3) then Sync Centre (M4) — DEGRADATION SCENARIO 2]**
He confirms quantities and captures proof of delivery. But Roshan is in a hill district, and he loses internet connection. This is our second degradation scenario. 

Waypoint Flow allows him to continue his entire route fully offline. A calm amber banner tells him his records are safe. When he gets back to a coverage area, the Sync Centre automatically pushes his saved records to the depot."

### 6. Store Manager: Closing the Loop (3:30 - 4:00)
**[Screen: Show Store Delivery Receipt (M6)]**
"Back at the outlet, Amali's app updates. The system translated the dispatcher's plan, the loader's checks, and the driver's proof into one simple notification: 'Your delivery is here.' 

**[Screen: Show Store Order Tracking (M6) showing Deferred state]**
And for that order we deferred earlier? Amali sees exactly *why* it was delayed and when it will arrive, without ever needing to call the depot.

**[Screen: Show Workflow Diagram (Page 2)]**
That is Waypoint Flow. One system, four roles, connected from request to receipt. Thank you."
