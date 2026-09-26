# Desktop — Dispatcher Plan Builder

## Purpose

Allocate submitted orders into feasible vehicle trips while preserving outlet windows, temperature requirements, van-only rules, capacity, depot, and the two-trip-per-day limit.

## Layout

- **Top planning bar:** selected date, depot, `Auto-suggest` secondary action, `Save draft`, and `Publish plan` primary action. A plan quality indicator states blocking issues and warnings in plain language.
- **Left column — Unassigned orders:** filterable queue with outlet, brand, delivery window, item class, weight, volume, priority, and order age. Chilled/frozen items have a text badge, not colour alone.
- **Center — Route canvas:** tabbed vehicle trips, `Vehicle 12 · Trip 1`, with ordered stop cards and travel/arrival estimates. Drag orders onto a trip or use `Assign` from the drawer.
- **Right column — Vehicle inspector:** capability, refrigerated/ambient, weight and volume bars, weekly fuel quota remaining, operating status, route duration, and constraint validation.
- **Bottom impact tray:** orders not yet assigned, predicted deferrals, outlet impact, and route warnings.

## Key interactions

- Assignment is prevented when a hard constraint fails. Explain the cause and offer eligible vehicles: “This frozen order requires a refrigerated vehicle.”
- When a soft constraint is at risk (ETA/service time/fuel), allow assignment only after a clear warning and show the projected effect.
- Reordering stops recalculates estimated arrival time and reveals any breached delivery window immediately.
- `Auto-suggest` proposes a plan but marks all suggestions as reviewable; the dispatcher remains accountable for publishing.
- Publishing opens a confirmation sheet: routes/vehicles released, deferred orders, affected stores, and outbound notifications.

## Rationale

The three-column structure keeps the order pool, route decisions, and vehicle constraints visible at once. It minimizes spreadsheet-style context switching while making why a decision is valid explicit.

