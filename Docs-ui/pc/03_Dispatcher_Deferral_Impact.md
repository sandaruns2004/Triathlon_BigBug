# Desktop — Capacity Deferral & Impact

## Failure scenario: insufficient fleet capacity

This is the fully developed degradation flow. Demand can exceed the usable fleet, especially when refrigerated vehicles, outlet windows, and seasonal Style peaks collide. A deferral must be deliberate, explainable, and visible to the store.

## Trigger

From Plan Builder, an order remains unassigned or an assignment would create an unresolved hard conflict. Select `Review deferral`.

## Layout

- **Header:** “Review order deferral” with the order ID, outlet, brand, promised window, goods class, and original requested date.
- **Left — Decision context:** route alternatives considered, availability of compatible vehicles, capacity shortfall, fuel/route-limit constraints, and nearby compatible orders. Clearly distinguish unavailable options from manually rejected options.
- **Center — Store impact:** next possible service date, effect on outlet stock/priority if available, and a timeline: submitted → planning exception → proposed deferment → store notified.
- **Right — Decision form:** required reason selector (`No compatible refrigerated capacity`, `Vehicle capacity`, `Window conflict`, `Access constraint`, `Operational disruption`, `Other`), note, revised proposed date, and store notification preview.
- **Footer:** `Keep unassigned` secondary; `Confirm deferral & notify store` destructive-but-recoverable primary.

## Behaviour

- Confirmation changes the order to `Deferred`, records dispatcher, timestamp, reason, and alternatives considered, then sends an in-app/email notification to the store manager.
- The store’s order page displays the reason category, revised date, and a path to acknowledge or raise an issue. Do not hide the decision behind a generic “delayed” label.
- If capacity later opens, the dispatcher can `Restore to planning`; the history remains intact and the store receives a new update.

## Why it matters

It prevents invisible spreadsheet decisions, protects scarce refrigerated capacity, and preserves a defensible audit trail without forcing the store manager to chase the planning office.

