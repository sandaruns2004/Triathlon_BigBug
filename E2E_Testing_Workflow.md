# Waypoint Flow: End-to-End Testing Workflow

This document provides a step-by-step guide to testing the full lifecycle of a delivery within the Waypoint Flow ecosystem. Follow this workflow to verify that all backend integrations, state updates, and role-based portals are working together.

## Prerequisite: Seed the Database
Before running the workflow, ensure the database is populated with the base hackathon state.
1. Open your browser and navigate to: `http://localhost:3000/api/seed` 
2. Wait for the JSON response confirming that users, vehicles, outlets, and trips have been successfully seeded.

---

## Phase 1: Store Manager (Order Creation)
**Goal:** Request a new delivery from the store.
1. **Login:** Go to `http://localhost:3000/login` and sign in as the Store Manager.
   - **Email:** `store@waypoint.lk`
   - **Password:** `waypoint2026`
2. **Action:** Navigate to the **New Order** page (from the bottom navigation).
3. **Execution:**
   - Search for a product (e.g., "Fresh milk").
   - Adjust the quantity using the `+` buttons.
   - Click **Review order** and then **Submit order**.
4. **Verification:** You should be redirected to the Order Tracking page (`/store/orders/[id]`), and the backend should reflect the order as "Submitted".

---

## Phase 2: Dispatcher (Control Tower Verification)
**Goal:** Verify that the Dispatcher control tower correctly reacts to real-time events across the ecosystem.
1. **Login:** Open a new incognito window (or sign out) and log in as the Dispatcher.
   - **Email:** `dispatcher@waypoint.lk`
   - **Password:** `waypoint2026`
2. **Action:** View the **Dispatcher Dashboard** (`/dispatcher`).
3. **Execution & Verification:**
   - **Active Exceptions Sidebar:** 
     - Go back to your Store Manager tab and open an active order. Click **"Contact operations"**. 
     - Type a mock issue (e.g., "Where is my truck?") and submit it. 
     - Refresh your Dispatcher tab. You should instantly see a new Exception card appear at the top of the sidebar with your exact text.
     - Click **"Review & Resolve →"** on the card to verify it removes the exception from the queue.
   - **KPI Health Strip:** 
     - Observe the **"Active exceptions"** metric in the top right. It should perfectly match the exact number of cards visible in the sidebar. *(Note: Orders to plan, Trips planned, and Fleet active pull from a daily snapshot seeded by `/api/seed` to simulate high volume).*
   - **Today's Trips Table:**
     - Open the Loader portal (`/loader`), find trip `WP-014`, and click **Release Vehicle**.
     - Refresh the Dispatcher tab. The status chip next to WP-014 will change dynamically from `Loading` (amber) to `On route` (green).
   - **Fleet Map:**
     - The map pins read coordinates directly from the `trips` collection in Firebase. As drivers update their locations in the real world, these pins move dynamically.

---

## Phase 3: Loader (Loading Bay Operations)
**Goal:** Release a vehicle from the depot so the driver can depart.
1. **Login:** Sign in as the Loader.
   - **Email:** `loader@waypoint.lk`
2. **Action:** Go to the **Loader Portal** (`/loader`).
3. **Execution:**
   - Look for a trip in the **Loading** or **Scheduled** lane (e.g., `WP-014`).
   - Click **Review & Dispatch**.
   - Review the manifest and click **Release Vehicle**.
4. **Verification:** The trip should move to the **Ready / Dispatched** lane. The backend trip status is now updated to `dispatched`.

---

## Phase 4: Driver (Execution & Handoff)
**Goal:** Complete a delivery stop and record evidence.
1. **Login:** Switch to mobile view (390px width in DevTools) and log in as the Driver.
   - **Email:** `driver@waypoint.lk`
2. **Action:** Go to the **Driver App** (`/driver`).
3. **Execution:**
   - The assigned trip (e.g., `WP-001`) should appear on the Today screen.
   - Click **Continue your route**.
   - Tap **I'm safely parked**, then **Complete delivery**.
   - Step through the POD (Proof of Delivery) flow: confirm quantities, (optionally) add a note, and submit.
4. **Verification:** The backend logs a delivery record for that stop, and the app routes you to the next stop or the completion screen.

---

## Phase 5: Store Manager (Receipt Confirmation)
**Goal:** Confirm the delivery at the store level.
1. **Login:** Return to the Store Manager session (`store@waypoint.lk`).
2. **Action:** Navigate to the **Home** dashboard (`/store`).
3. **Execution:**
   - You should see the recent delivery notification or order update.
   - Click **Check & confirm receipt**.
   - Review the delivered quantities against the ordered quantities.
   - Click **Confirm all items received**.
4. **Verification:** The backend updates the order state to `receipt_confirmed`, closing the loop on the delivery lifecycle.

---

### Troubleshooting
- **Missing Data:** If lists appear empty, hit the `/api/seed` endpoint again via POST to reset the database to a known clean state.
- **Session Issues:** NextAuth is used for role-based sessions. If you experience role-switching issues, ensure you fully log out or use separate browser profiles/incognito windows for different roles.
