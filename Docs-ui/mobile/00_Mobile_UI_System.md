# Waypoint Flow — Mobile UI System

## Product intent

Mobile provides the field-safe companion experience for drivers and the quick, responsive outlet experience for store managers. It does not compress the dispatcher’s plan builder into a phone; it focuses on actions users can complete in short, real-world moments.

## Visual direction

Use the same white-and-green system as desktop: deep green `#146B45`, action green `#1F8A5B`, pale green `#EAF6EF`, near-black text `#17221D`, and subtle grey borders `#DCE5DF`. Keep white backgrounds dominant. Large status labels, icons, and text support use in glare and motion-free stops.

## Mobile foundation

- **Bottom navigation, driver:** Today, Route, Activity, Profile. The active delivery task appears persistently above navigation when relevant.
- **Bottom navigation, store:** Home, Orders, Notifications, Profile.
- **Touch targets:** minimum 48 × 48 dp; primary actions full width near the thumb zone.
- **Safety:** route guidance and delivery recording are explicitly for use while parked. The app never asks for a signature/photo or detailed form while navigation is active.
- **Offline:** retain task data and queued actions locally. State must say `Saved on this phone` versus `Synced`, with a clear count and last successful sync time.
- **Accessibility:** 16 px minimum body text, high contrast, label every icon, and never depend on swipe-only actions.

## Required mobile pages

| File | Primary role | Job to be done |
|---|---|---|
| `01_Driver_Today.md` | Driver | Start a safe, informed workday. |
| `02_Driver_Route_and_Stop.md` | Driver | Navigate and complete a stopped delivery. |
| `03_Driver_Proof_of_Delivery.md` | Driver | Record outcome, evidence, and discrepancy. |
| `04_Driver_Offline_and_Sync.md` | Driver | Continue safely without connection and reconcile later. |
| `05_Store_Mobile_Home.md` | Store Manager | See order state and urgent delivery updates. |
| `06_Store_Mobile_Order_and_Tracking.md` | Store Manager | Quickly order, track, receive, or report an issue. |
| `07_Authentication.md` | All roles | Sign in, activate an account, and recover access. |
