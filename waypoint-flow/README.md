# Waypoint Flow - BigBug Team

A connected delivery operations platform for Waypoint Group, designed for the Tech-Triathlon 2026 Hackathon.

## Tech Stack
- Next.js 14 (App Router)
- Firebase Firestore (NoSQL Database)
- Socket.IO (Real-time updates)
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
You can log in to `http://localhost:3000` with any of the following accounts:

| Role | Email | Password |
|---|---|---|
| Dispatcher | `dispatcher@waypoint.lk` | `waypoint2026` |
| Loader | `loader@waypoint.lk` | `waypoint2026` |
| Driver | `driver@waypoint.lk` | `waypoint2026` |
| Store Manager | `store@waypoint.lk` | `waypoint2026` |

## Judge Walkthrough (45 Steps)

### Store Manager Flow
1. Login: `store@waypoint.lk` / `waypoint2026`
2. See Store Manager Home.
3. Tap "New order" → choose delivery date → add items → Review → Submit.
4. See order status: "Submitted — awaiting plan".

### Dispatcher Flow
5. New tab: `dispatcher@waypoint.lk` / `waypoint2026`
6. See Daily Operations Overview with morning health strip.
7. Click "Open plan builder".
8. Click "Auto-suggest" to allocate orders to trips.
9. See deferred orders in the bottom impact tray.
10. Click a deferred order → select reason → "Confirm deferral".
11. Click "Publish plan".

### Loader Flow
12. New tab: `loader@waypoint.lk` / `waypoint2026`
13. Select a vehicle from the board.
14. Scan barcodes or manually mark items checked.
15. If an item is missing, click "Report shortfall" and escalate to dispatcher.
16. Complete remaining items → "Ready to depart".

### Driver Flow
17. New tab: `driver@waypoint.lk` / `waypoint2026`
18. Click "Start trip".
19. Navigate to Stop 1 → "I'm parked" → Complete delivery.
20. Confirm quantities, signature, and submit.
21. Toggle airplane mode to simulate offline operation.
22. Reconnect and visit Sync Centre to upload offline records.

### Store Receipt
23. Return to `store@waypoint.lk` tab.
24. Tap "Confirm receipt".
25. Report discrepancies (if any) and submit.
