# Desktop — Store Order Tracking & Receipt

## Purpose

Give the outlet a clear, low-effort record from submitted order through receipt or issue resolution.

## Layout

- **Order header:** status badge, order number, brand/outlet, requested date, latest ETA or revised date, and `Contact operations` secondary action.
- **Progress timeline:** Submitted → Planned → Loading → On route → Delivered → Receipt confirmed. Deferred follows a visually distinct branch with reason and revised date.
- **Delivery card:** route/vehicle details only as appropriate, ETA window, driver-arrival state, and delivery notes. Avoid exposing unnecessary driver personal information.
- **Line-item receipt table:** ordered, delivered, accepted, discrepancy, and notes.
- **Action panel:** `Confirm receipt` (when all is correct) or `Report issue` (wrong quantity, damage, missing goods, temperature concern, other), plus a conversation/activity history.

## Deferred state

Prominently state the reason category, dispatcher-recorded note where suitable, revised service date, and what the store can do next: acknowledge, contact operations, or report business impact. A deferral is never presented as an unexplained silent status change.

## Receipt behaviour

Confirming receipt records manager name and time. Reporting an issue asks for affected lines, short note, and optional evidence; it creates an operations exception while preserving the original delivery record.

