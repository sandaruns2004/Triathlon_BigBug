# Mobile — Driver Route & Stop

## Purpose

Guide the driver to the next planned stop and present a short, safe workflow once the vehicle is parked.

## Layout

- **In-transit view:** next outlet name, delivery window, ETA, compact route map, handling/access note, and one `Open navigation` action that hands off to the phone’s navigation tool. Below it: `I’m parked`.
- **Parked stop sheet:** stop number, outlet/contact instructions, expected items and quantities, plus `Complete delivery` primary action and `Report a problem` secondary action.
- **Route drawer:** all stops with current, completed, skipped, and future status; future route changes are highlighted with an explanation.

## Key interactions

- `I’m parked` changes the interface from driving mode to delivery mode; it does not claim GPS verification is perfect.
- If arrival is outside the delivery window, show an amber prompt with options to continue, contact operations, or report access issue.
- A skipped/failed stop requires a reason and routes the event to the dispatcher/store record.
- Drivers cannot reorder routes; approved dispatcher updates arrive as a clear “Route updated” card and must be acknowledged.

