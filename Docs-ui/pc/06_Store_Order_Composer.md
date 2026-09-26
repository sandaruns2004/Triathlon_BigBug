# Desktop — Store Order Composer

## Purpose

Let a store manager submit a confident order while understanding delivery eligibility and expected timing.

## Layout

- **Header:** outlet identity, selected delivery date/window, cut-off countdown, and `Order history` link.
- **Two-pane body:** left product/category catalogue with search and brand-aware categories; right persistent order summary.
- **Order rows:** SKU, item name, pack/unit, quantity stepper with keyboard entry, availability status, handling class, and line note.
- **Summary:** item count, weight/volume estimate, chilled/frozen callout, preferred delivery window, PO/reference, and validation messages.
- **Footer:** `Save draft` and `Review order`.

## Review and submit

The review screen summarizes quantities, requested delivery date/window, special handling, and the fact that submission is a request subject to fleet planning. `Submit order` creates a timestamped order and a visible status of `Submitted — awaiting plan`.

## Guardrails

- Show the cut-off and invalid delivery dates before selection, not after submit.
- Explain unavailable or restricted goods per line; keep a saved draft if the manager must resolve it later.
- Do not promise a vehicle or exact ETA before dispatch planning. Confirmed ETA appears only once a route is published.

