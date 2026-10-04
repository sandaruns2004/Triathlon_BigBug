# Waypoint Flow - BigBug Team

A connected delivery operations platform for Waypoint Group, designed for the Tech-Triathlon 2026 Hackathon.

## Tech Stack
- Next.js 14 (App Router)
- Firebase Firestore (NoSQL Database)
- Socket.IO / Firestore onSnapshot (Real-time updates)
- Tailwind CSS & shadcn/ui

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/BigBug/BigBug_WaypointDelivery
   cd BigBug_WaypointDelivery/waypoint-flow
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your Firebase credentials.
   ```bash
   cp .env.example .env
   ```

3. **Docker Quick Start (Local)**
   Run the full stack via Docker Compose:
   ```bash
   docker compose up --build
   ```
   Wait for `Server ready on http://localhost:3000`.

## Seeded Accounts
You can log in to `http://localhost:3000` (or the deployed URL) with any of the following accounts:

| Role | Email | Password |
|---|---|---|
| Dispatcher | `dispatcher@waypoint.lk` | `waypoint2026` |
| Loader | `loader@waypoint.lk` | `waypoint2026` |
| Driver | `driver@waypoint.lk` | `waypoint2026` |
| Store Manager | `store@waypoint.lk` | `waypoint2026` |

## Judge Walkthrough (45 Steps)

### Store Manager Flow (Phase 1)
1. Open the app in a new tab: `http://localhost:3000/login`
2. Sign in as `store@waypoint.lk` with password `waypoint2026`.
3. You will see the Store Manager Home `/store`. Verify the hero delivery card or "No delivery" state is visible.
4. Click **"New Restock Order"** to go to `/store/orders/new`.
5. Verify the product catalogue loads and quantity steppers work.
6. Add several items to the order.
7. Click **"Review order"**.
8. Click **"Submit order"**.
9. Verify the order status shows **"Submitted — awaiting plan"**.
10. Navigate to the specific order page `/store/orders/[id]`. Verify the timeline shows the "Submitted" step.

### Dispatcher Flow (Phase 2)
11. Open a new tab, go to `/login`, and sign in as `dispatcher@waypoint.lk` with password `waypoint2026`.
12. You will see the Operations Overview `/dispatcher` (D1).
13. Verify the **Health Strip** shows 5 distinct metrics.
14. Verify the **Route Map** renders properly with Leaflet tiles.
15. Verify the **Trips Table** shows vehicles (e.g., WP-001, WP-014, WP-022, WP-031) with capacity bars.
16. Verify the **Exception Queue** shows active exceptions (e.g., breakdown, shortfall).
17. Click **"Open plan builder"** to navigate to `/dispatcher/plan` (D2).
18. Verify unassigned orders are listed in the left column.
19. Click **"Auto-suggest"** to run the allocation engine.
20. Verify orders fill into the trip canvas and any deferred orders appear in the **Impact Tray**.
21. Click a deferred order in the Impact Tray to navigate to `/dispatcher/deferral/[orderId]` (D3).
22. Verify the 3-panel layout is visible.
23. Select a deferral reason.
24. Click **"Confirm deferral & notify store"**. Verify the order status becomes "deferred".
25. Return to the plan builder and click **"Publish plan"**. Verify the publish confirmation shows routes released and the deferred list.

### Loader Flow (Phase 3)
26. Open a new tab, go to `/login`, and sign in as `loader@waypoint.lk` with password `waypoint2026`.
27. You will see the Load Board `/loader` (D4).
28. Verify the vehicle lane board shows columns (Scheduled, Loading, Loading issue, Ready to depart).
29. Select vehicle **WP-014** to view its trip panel `/loader/trip/[id]`.
30. Verify the stops are listed in **reverse unload order** ("Load Stop N first").
31. Click **"Start scanning"** or use the manual "Mark checked" buttons to process items.
32. Simulate a shortfall by marking an item as missing. Verify the **Shortfall panel** opens.
33. Click **"Escalate to dispatcher"**. (You can check the dispatcher tab to verify the exception appeared).
34. Complete the remaining items.
35. Verify the **"Ready to depart"** button activates. Click it.

### Driver Flow (Phase 4)
36. Open a new tab, go to `/login`, and sign in as `driver@waypoint.lk` with password `waypoint2026`.
37. You will see the Driver Today page `/driver` (M1).
38. Verify the trip card shows "Ready to depart". Click **"Start trip"**.
39. View the stop details page `/driver/stop/[id]` (M2). Verify outlet info, ETA, and access notes are visible.
40. Click **"I'm parked"**. The delivery panel (bottom sheet) opens.
41. Complete the 3-step Proof of Delivery (M3):
    - **Step 1:** Confirm quantities (Expected vs Delivered table).
    - **Step 2:** Capture recipient name and signature (and optionally a photo).
    - **Step 3:** Review outcome and click **"Complete stop"**.
42. **Simulate offline mode:** Open Chrome DevTools → Network → set to "Offline". Verify the amber offline banner appears. Complete a stop while offline, and verify the status shows **"Saved on this phone"**.
43. Go back online. Navigate to **Sync Centre** via the bottom navigation bar (`/driver/sync`). Verify queued records are present. Click **"Sync now"** and confirm they sync successfully.

### Store Manager Receipt Flow (Phase 5)
44. Return to the store manager tab. Verify the hero delivery card updates to "Delivered".
45. Click **"Confirm receipt"**. Verify the line-item table is visible. Mark a discrepancy (e.g., "2 missing") and click **"Confirm receipt"**. Verify the success state appears and the deferred order notification is visible.
