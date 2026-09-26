# Waypoint Flow desktop prototype

Open `index.html` in a modern browser. No build, package installation, or internet connection is required. Keep the `Docs-ui/items/generated-assets` directory beside the HTML file at its existing relative location.

The interface follows `Docs-ui/pc` and uses the supplied SVG identity and PNG illustrations from `Docs-ui/items`. CSS and JavaScript are included in the HTML file.

## Included views

- Operations: sample metrics, schematic Colombo route map, depot and trip filters, exception queue, vehicle drawers, and CSV export.
- Planning: order assignment, weight/volume checks, reviewable suggestions, reasoned deferrals and restoration, publication review, and a loading handoff.
- Loading: reverse stop order, manual checks, shortage escalation, and departure blocking until checks and exceptions are resolved.
- Store: catalogue quantity controls, order review/submission, a locally saved draft, delivery timeline, receipt confirmation, and issue reporting.
- Supporting views: outlets, fleet, reports with session decisions, and illustrative sign-in/recovery/activation entry screens.

## Demo boundaries

The sample operating date is 21 April 2026. The overview metrics represent illustrative fleet totals; the table provides four detailed sample trips. The map is schematic, not live GPS or navigation. Planning validates the demonstrated capacity constraints; it is not a routing optimizer.

Changes stay in memory until refresh, except an explicitly saved order draft, which uses browser local storage. There is no backend, real authentication, email delivery, live ETA service, or real dispatch action. The workspace exposes all roles for demonstration. Production role permissions, full invitation/reset flows, persistent records, and external integrations are outside this frontend prototype.

## Verification

Checked JavaScript syntax and referenced asset paths. Browser checks covered planning navigation, publishing blocked by unassigned orders, capacity updates after auto-assignment, successful plan publication, loading handoff, departure blocked even after all checks when a shortage remains unresolved, order review/submission, and receipt confirmation. No browser console errors were reported during those flows.
