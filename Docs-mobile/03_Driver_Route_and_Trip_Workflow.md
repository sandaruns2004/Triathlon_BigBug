# Phase 3 — Driver route and trip workflow

**Execution status (30 September 2026): Implemented — verification pending.** Connected assignment/cache, loading/publication/start gates, safe stop forms, route comparison, breakdown, closeout and server-controlled next-trip eligibility are implemented. Airplane-mode cold starts and navigation on the target physical phone remain unchecked.
Progress is maintained in [00__Work_List.md](00__Work_List.md) under [the repository rule](../AGENTS.md).

## Implemented tricky code

### Review update — 1 October 2026

Status remains **Implemented — verification pending**. [Review evidence](../waypoint-mobile/docs/mobile-review-and-fixes.md).

- [x] Retry a closeout readiness hold with the original UUID after stops/holds resolve, including recognizable older conflict records.
- [x] Preserve original POD draft lines through a route/manifest change.
- [x] Add worker and form-restoration regression coverage.
- [ ] Rehearse closeout/Trip 2 and offline/navigation on a physical target phone.

Implemented entry points: [route repository](../waypoint-mobile/lib/features/driver_route/connected_route_repository.dart), [owner-scoped cache](../waypoint-mobile/lib/core/data/operational_repository.dart), [route UI](../waypoint-mobile/lib/features/connected/driver_route_page.dart).
~~~dart
final result = await repository.read(
  'driver/trips', 'driver-trips', principal,
  table: LocalTable.routeSnapshots,
);
~~~
The cache transaction precedes the saved label. Start eligibility includes publication, loading release and canonical prior-trip closeout. Next-trip counts cannot be advanced locally.

See [code recipes](CODE_Implementation_Recipes.md), [verification evidence](../waypoint-mobile/docs/phase-2-7-verification.md) and [the remaining release checklist](../waypoint-mobile/docs/release-checklist.md). Checked tasks record implementation; acceptance conditions requiring physical or hosted environments remain open.

**Outcome:** the driver sees an assigned, loader-approved route and can safely progress through real stops.  
**Dependencies:** Phases 1–2. **Estimate:** 1–2 working days. **Owner:** Flutter developer, with backend assignment/readiness support.

## Screens and states

| Feature | Required states |
|---|---|
| Today / M1 | Loading, ready to depart, on route, no assignment, route completed, second trip unavailable/available |
| Route / M2 | Current/next stop, cached route, manifest, late window, acknowledged route update |
| Stop sheet | In transit, parked, delivered/partial/failed/refused, problem recorded |
| Trip summary | Resolved vs delivered stops, outstanding proof, return/closeout status and next-trip eligibility |
| Breakdown | Issue saved locally, server-confirmed hold, operations response and approved recovery |
| Profile / Activity | Actual user/depot, secure sign-out, operation history and Sync Centre link |

## Server prerequisites

Baseline before Phase 3: the driver trip query selected by `driverName`, and generated trips may have `Unassigned` drivers. Replace that link with stable `driverId`. Return waiting/loading trips as well as released/on-route work, rather than presenting waiting drivers as having no assignment.

- [x] Publish ordered route snapshots with trip/vehicle IDs, release state, revision, assigned driver, stop IDs, explicit order IDs, addresses, coordinates where available, windows, contact instructions and line manifests.
- [x] Return loader-approved quantities, replacement/partial-delivery resolution notes and handling requirements. A reported but unresolved shortfall must block release.
- [x] Enforce trip start eligibility on the server: assignment, valid status, loading release, prior-trip requirements and operation idempotency.
- [x] Interpret service dates in `Asia/Colombo`; retain instants as UTC timestamps. Do not use `toISOString().split('T')[0]` as the business-day calculation.
- [x] Supply route revisions and an acknowledgment operation. Drivers cannot silently reorder or approve their own new manifest.
- [x] Include separate assignment/release versions, route/stop-manifest revisions and stop delivery/progress versions. Routine completion of one stop must not change another stop's proof-validation token.
- [x] Define trip closeout as a server transition with an idempotent request. Return resolved/delivered counts, unresolved stops, canonical returning/completed state and next-trip eligibility according to depot-return policy. Local stop counts cannot unlock Trip 2.
- [x] Add a trip-level breakdown service that records a scoped exception, holds affected work and exposes the authorized operations response. It is distinct from a delivery issue at one outlet.

## Flutter implementation tasks

- [x] Build Today from real repository data. Show greeting, shift/depot, queued count, current vehicle/trip, stop count, estimated finish and handling badge.
- [x] Represent loading readiness and no assignment separately. Refresh checks actual API availability and retains existing cached data on failure.
- [x] Download the complete current route and approved manifest into SQLite before departure. Show `Route saved on this phone` only after a successful local transaction.
- [x] Show the current/next stop prominently; keep the complete ordered route available through a list/drawer.
- [x] Display waiting second-trip information without an enabled start action. Unlock it only when server eligibility permits.
- [x] Require a parked acknowledgment before starting and before entering detailed delivery/problem forms. Reset the stop’s parked state when leaving for the next stop or resuming travel.
- [x] Open external navigation with validated coordinates/address through a navigation adapter. If no navigation app or network is available, retain address/instructions and offer recovery.
- [x] Detect arrival-window issues from server windows and display a warning, contact-operations action and access-issue option. Do not always display `On schedule`.
- [x] Implement a route-update comparison showing changed stops, windows and manifest lines. Require acknowledgment where policy demands it.
- [x] Build distinct issue paths: closed outlet, access blocked, refusal, vehicle breakdown and other. Collect reason/evidence safely; use Phase 4’s durable record pipeline.

## Trip closeout and breakdown

The full report's judge walkthrough includes a trip summary/submit action and breakdown recovery. Design these now; their durable mutation wiring and end-to-end tests complete in Phase 4.

- [x] Show total stops, full/partial deliveries, failed/refused/skipped stops, remaining unresolved work and unsynced operations separately. An outlet-closed event resolves a stop only according to server policy; it does not count as a successful delivery.
- [x] Queue `trip_closeout` through the shared outbox after its required stop/issue operations. Keep `Closeout saved on this phone` distinct from server-confirmed completion. Do not bypass an unresolved sync conflict to finish the trip.
- [x] Refresh the canonical closeout result and next-trip eligibility before enabling the next trip. Explain any return-to-depot, unresolved-stop or loading prerequisite.
- [x] Report `trip_issue`/breakdown with trip/vehicle IDs, reason, observed time and optional safe location/evidence. If offline, explain that operations has not received it yet and expose a contact fallback.
- [x] Preserve cached route, existing drafts and queued POD during a breakdown. Stop further affected delivery progression according to the approved hold policy; resume/reassign only after a server decision, with revision comparison.
- [x] Distinguish a delay/ETA risk from a formal deferral. Affected stores receive a safe, approved explanation; the driver cannot silently change promised dates or reassign orders.

## Offline trip behavior

Reads use the last approved cached route with a visible `Saved at`/revision indicator. If no route was downloaded, explain that a connection is required; do not show fabricated work.

An offline start may be saved as `Start saved on this phone` only if an assigned, released route and a valid offline-access authorization were cached. Queue the start operation before dependent delivery events. This is a local progression state until the server accepts it; do not show dispatcher-confirmed departure. If release/assignment is missing or uncertain, block start and request operations help.

On reconnect, a revoked/reassigned trip creates an explicit conflict; proof is preserved. A network icon is not evidence that the server accepted a start. Foreground, app-resume and manual refresh must all reconcile the route. Background refresh is supplementary.

## Acceptance checks

1. An unassigned driver sees no assignment; an assigned driver waiting on loading sees the waiting state.
2. An unresolved D5 shortfall blocks departure. Dispatcher resolution changes the displayed manifest before release.
3. Double-tapping Start creates one operation and one server departure event.
4. Cold-start in airplane mode after route download displays the same ordered stops and quantities.
5. Navigation failure does not trap the driver or remove the route.
6. Driver cannot open POD in travel mode; selecting the next stop does not reuse the previous stop’s parked acknowledgment.
7. A route update while a draft exists preserves that draft and requires explicit reconciliation.
8. A failed/refused stop remains labelled with its actual outcome, rather than becoming delivered.
9. After Phase 4 wiring, closeout replay applies once, failed/skipped counts stay distinct, and Trip 2 cannot unlock from local completion alone.
10. After Phase 4/6 wiring, a breakdown reaches web operations, holds affected work and preserves proof through approved recovery/reassignment.

**Deliverables:** Today, Route, stop sheet, manifest/loading notes, activity/profile, cached-route repository and trip state machine.  
**Exit gate:** a real driver can start eligible work, safely inspect a parked stop and retain the route without a connection. Delivery completion is added in Phase 4.

## Execution evidence and remaining gate

Software/test evidence is recorded in [phase-2-7-verification.md](../waypoint-mobile/docs/phase-2-7-verification.md). The code paths above replace the original proposed helpers. No production deployment, signing credential, physical camera acceptance or human policy approval is claimed. Keep this phase open until its applicable remaining release checks pass.
