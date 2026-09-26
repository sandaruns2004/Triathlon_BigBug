# Mobile — Store Order, Tracking & Receipt

## Purpose

Provide the essential desktop store workflow in a compact, interruption-friendly mobile flow.

## New order flow

1. **Choose delivery:** date/window options and visible cut-off; invalid dates cannot be selected.
2. **Add goods:** searchable catalogue, recent items, quantity steppers, and cart badge.
3. **Review:** items, handling class, notes/reference, requested window, and submission disclaimer.
4. **Submitted:** order ID, status `Awaiting plan`, and notification preference.

The cart persists between sessions. Chilled/frozen goods have an explicit handling label; the app does not claim fleet availability before the dispatcher publishes a route.

## Tracking and receipt screen

- Status header and timeline mirror desktop: Submitted → Planned → Loading → On route → Delivered → Receipt confirmed.
- When planned/on route, show ETA window and relevant arrival notice. When deferred, show reason, revised date, and `Contact operations` / `Report business impact`.
- After delivery, a simple line-item compare screen enables `Confirm receipt` or `Report issue`. Issues support line selection, category, note, and optional photo.

## Design rules

- Make `Confirm receipt` and `Report issue` equally easy to discover; do not treat problem reporting as a hidden overflow action.
- Every status change has a plain-language explanation and time, including partial deliveries and deferrals.
- User can leave and return to any form without losing entered data.

