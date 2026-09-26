# Desktop — Loader Load Board

## Purpose

The shared dock screen turns the published delivery plan into a safe loading sequence. It helps the loader load last-stop goods first, detect exceptions before departure, and release only checked vehicles.

## Layout

- **Header:** depot, dock/shift, current time, and large count: `3 vehicles loading · 1 attention needed`.
- **Vehicle lane board:** horizontal cards for Scheduled, Loading, Loading issue, Ready to depart, and Departed. Cards show vehicle, trip, departure deadline, route stop count, temperature requirement, and progress.
- **Selected trip panel:** route stop sequence shown in unloading order; the load instruction explicitly reverses it: “Load Stop 6 first → Stop 1 last.” Each stop expands to quantities, handling type, and scan/check status.
- **Right checklist:** vehicle cleanliness/temperature check, item count, damage check, load securement, and final seal/dispatch confirmation.

## Key interactions

- Use barcode scan where available; retain large `Mark checked` controls for manual fallback with named user/time audit.
- A missing or damaged item opens the shortfall flow before dispatch; a trip with unresolved red items cannot be marked Ready to depart.
- When all checks pass, `Ready to depart` notifies the assigned driver that the trip is ready and changes dispatcher status live.
- Temperature-sensitive goods show a specific requirement and required vehicle condition; never collapse them into a generic item count.

## Shared-device design

Use 18 px+ labels, high-contrast large target areas, short time-on-task flows, and automatic sign-out after inactivity. The screen must work with gloves and intermittent scanning hardware, not just a mouse.

