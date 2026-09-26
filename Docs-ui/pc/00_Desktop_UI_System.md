# Waypoint Flow — Desktop UI System

## Product intent

Waypoint Flow is the shared delivery-planning workspace for Waypoint Fresh, Style, and Tech. Desktop is optimized for the dispatcher at a large planning-office screen, the loader on a shared warehouse tablet/terminal, and store managers who use a browser at the outlet.

The desktop product makes the operational chain visible: **order → planned trip → loading check → delivery outcome → receipt**. A status and timestamp should always reveal who owns the next action.

## Visual direction

- **Primary palette:** white surfaces, deep Waypoint green `#146B45`, action green `#1F8A5B`, pale green `#EAF6EF`, and success `#168050`.
- **Neutrals:** ink `#17221D`, muted text `#63716A`, border `#DCE5DF`, canvas `#F6F8F7`.
- **Semantic colors:** amber for attention/at-risk, red only for blocked or failed work, blue-grey for informational states. Never use colour alone; pair it with a label and icon.
- **Type:** a calm modern sans-serif such as Inter. Use 28–32 px page titles, 18–20 px section titles, 14–16 px body text, and tabular numerals for times, quantities, and capacity.
- **Shape:** 10 px corner radius for cards and controls; 14 px for large panels. Borders are subtle; shadows are sparse and soft.
- **Data density:** prioritize readable operational tables, compact filter chips, and generous whitespace. Avoid decorative illustration in time-critical views.

## Global shell

- Left rail: Waypoint Flow logo; Planning, Operations, Orders, Outlets, Fleet, Reports; role-aware navigation; bottom user/profile menu.
- Top bar: current operating date, depot selector, global search, notification bell, connection/system health.
- Page header: title, plain-language operational summary, date/route filters, and one primary action.
- Status language: `Needs planning`, `Planned`, `Loading`, `Ready to depart`, `On route`, `Delivered`, `Issue reported`, `Deferred`.

## Desktop interaction rules

- A click on any order, trip, vehicle, or outlet opens a right-side detail drawer before taking users away from their context.
- Destructive or operationally impactful actions (defer, remove from route, declare shortfall) require a reason and show downstream impact before confirmation.
- Tables support search, persistent filters, sortable columns, and a visible result count.
- Maps are supporting context, not the sole source of information; every map has a synchronized list/table view.
- Use activity history on records to preserve accountability across role handoffs.

## Required desktop pages

| File | Primary role | Job to be done |
|---|---|---|
| `01_Dispatcher_Operations_Overview.md` | Dispatcher | Monitor today and act on exceptions. |
| `02_Dispatcher_Plan_Builder.md` | Dispatcher | Allocate orders to valid vehicle trips. |
| `03_Dispatcher_Deferral_Impact.md` | Dispatcher | Record a justified capacity deferral. |
| `04_Loader_Load_Board.md` | Loader | Load by stop sequence and validate goods. |
| `05_Loader_Loading_Shortfall.md` | Loader | Escalate missing/damaged goods before departure. |
| `06_Store_Order_Composer.md` | Store Manager | Build, validate, and submit an order. |
| `07_Store_Order_Tracking_and_Receipt.md` | Store Manager | Track ETA, receive, and report issues. |
| `08_Authentication.md` | All roles | Sign in, activate an account, and recover access. |
