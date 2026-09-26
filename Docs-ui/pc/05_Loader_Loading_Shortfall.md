# Desktop — Loading Shortfall

## Failure scenario: an item is missing or damaged at the dock

## Purpose

Stop an incorrect manifest from becoming a delivery failure, without losing the loader’s place in the loading sequence.

## Layout

The shortfall opens as a focused side panel over the Load Board:

- Order/outlet, item, expected versus available quantity, stop number, vehicle and departure deadline.
- Choice: `Missing`, `Damaged`, `Temperature concern`, or `Other`.
- Quantity affected, optional photo/scan reference, and short note.
- Impact panel: “This outlet will receive a partial delivery” and “Dispatcher decision required before 06:40.”
- Actions: `Save and continue loading` and `Escalate to dispatcher`. The latter is primary for material shortages.

## Behaviour

- Save creates an immutable exception, updates the dispatcher queue, and marks the trip `Loading issue`.
- If a replacement is confirmed, the loader records it and resumes the exact checklist step; if not, dispatch receives choices such as partial delivery, reallocation, or deferment.
- The driver manifest shows the approved adjusted quantity and any receipt instruction—never an unexplained mismatch.
- Store notification occurs only after the dispatcher selects the customer-facing resolution, avoiding contradictory messages.

