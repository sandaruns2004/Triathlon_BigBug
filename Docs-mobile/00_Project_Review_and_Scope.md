# Phase 0 — Project review and scope

**Execution status (30 September 2026): In progress.** Review, scoped implementation defaults and deterministic fixture recorded. Physical-device selection and backend contract agreement remain pending.
Progress is maintained in [00__Work_List.md](00__Work_List.md) under [the repository rule](../AGENTS.md).

## Tricky code starting point

Implemented linkage example from [the fixture](../waypoint-mobile/assets/fixtures/route.json):
```json
{ "tripId": "FIXTURE-VEH001-T1", "stopId": "FIXTURE-STOP-01",
  "orderId": "FIXTURE-ORDER-01", "outletId": "OUT005",
  "lineId": "FIXTURE-LINE-1-A", "quantity": 12, "unit": "case" }
```
Keep these IDs through proof/receipt; never use array indices as record IDs. This is a synthetic fixture, not a connected cross-role order.

More implementation details and failure cases: [code recipes](CODE_Implementation_Recipes.md).


**Outcome:** one agreed Flutter product scope and one canonical data/behavior specification.  
**Estimate:** 0.5–1 working day. **Owner:** product lead with Flutter/backend developers.

## Project understanding

Waypoint Flow coordinates Fresh, Style and Tech deliveries across Peliyagoda and Kandy. The project describes 120 outlets and 60 vehicles, including refrigerated capacity, outlet access limits, delivery windows and at most two trips per vehicle. Allocation and deferral decisions belong to the server and dispatcher. The mobile app serves **Driver** and **Store Manager**; Dispatcher and Loader continue using the web/tablet application.

Fresh has a pre-dawn service window ending at 08:00 in the challenge context. Do not turn later sample times from the HTML into business rules. Fetch receiving windows, cut-offs and eligible service dates from the server, including non-operating-day rules.

## Sources reviewed

| Source | What to carry forward |
|---|---|
| [Website implementation plan](../hackathon_implementation_plan.md) | Existing Next.js/Firestore foundation, web role handoff, remaining deployment/auth tasks; completion claims need source/runtime evidence |
| [Full hackathon report](../hackathon_full_report.md) | Four-role lifecycle, nine constraints, M1–M7, event intentions, demo and submission requirements; old Prisma/PWA snippets need reconciliation |
| [Main mobile prototype](../Docs-ui/mobile/mobile_index.html) | Driver Today/Route/POD, Store home/order/receipt, profile, navigation and visual layout |
| [Mobile degradation prototype](../Docs-ui/mobile/degradation_mobile.html) | Saved route, signature capture, queue, retry, conflict comparison and fresh-demo controls |
| [Mobile UI system](../Docs-ui/mobile/00_Mobile_UI_System.md) and [screen specifications](../Docs-ui/mobile/) | M1–M7 requirements, safety, accessibility, evidence and state wording |
| [Mobile frontend notes](../Docs-ui/mobile/FRONTEND.md) | Explicit prototype limitations: local storage, simulated auth/sync, no connected backend |
| [Capacity deferral](../Docs-ui/pc/03_Dispatcher_Deferral_Impact.md), [loading shortfall](../Docs-ui/pc/05_Loader_Loading_Shortfall.md), [store receipt](../Docs-ui/pc/07_Store_Order_Tracking_and_Receipt.md) | Mobile consequences of web decisions and role handoffs |
| [Challenge overview](../docs/01_challenge_overview.md), [data dictionary](../docs/05_data_dictionary.md), [hackathon plan](../docs/09_hackathon_plan.md), [design overview](../Docs-ui/Tech-Triathlon_2026_Designathon_Overview.md) | Logistics rules, data, overall system intent and documented milestones |
| [Visual audit](../Docs-ui/items/Phase_1_Project_Audit_and_Visual_Direction.md) and [asset inventory](../Docs-ui/items/generated-assets/README.md) | Calm operational clarity and supplied identity/illustrations |
| [Current architecture](../waypoint-flow/docs/architecture.md), [data model](../waypoint-flow/docs/data-model.md), [source](../waypoint-flow/) | Existing integration surface and actual implementation gaps |

The root README and Parts 7/10 of the full report still contain PostgreSQL/Prisma material. The report's correction block, current application source and architecture use **Firestore**. Plan against the code that exists. Documentation descriptions of offline/realtime behavior are targets, not proof those features work. Source review is not a connected runtime test either: each integration gate must be exercised.

Use the [readiness register](WEBSITE_Alignment_and_Backend_Readiness.md) to distinguish **reported complete**, **present in source**, **requires backend work** and **verified by testing**. Preserve working web pages and services; implement the native surface and harden shared behavior. Flutter replaces browser-specific UI/storage libraries, not the allocation engine or cloud database.

## Website rules the native app must respect

The reports describe nine allocation constraints: depot match, refrigeration, van-only access, weight, volume, trip-time budget, Fresh completion by 08:00, at most two trips, and one brand/district per trip. Their allocator prioritizes previously deferred orders, longer service wait and smaller volume. These remain server/dispatcher rules. Mobile displays approved manifests, handling/window warnings and deferral explanations; it cannot override allocation or recreate it locally. Phase 0 reconciles constraint details with challenge data before creating test fixtures.

## Prototype reconciliation required

| Finding | Implementation decision |
|---|---|
| HTML files use separate `waypoint-mobile-demo-v1` and `waypoint-degradation-mobile-v1` localStorage datasets | Create one user-scoped native database. Retain HTML as references; no automatic browser-data migration |
| Main prototype has identical 26-pack stop manifests; degradation uses 24/18/12 crates | Use loader-approved line items with explicit product IDs, quantities and units; never equate crates and packs implicitly |
| Main POD has no signature; degradation requires drawn or typed signature; MD spec makes evidence policy-dependent | Server returns an evidence policy. Support signatures, but require them only where that policy says so |
| Photo size limits differ: 2 MB and 1 MB | Agree a single server-enforced size/count/MIME policy and client compression target |
| Array stop indices and demo order IDs represent records | Use stable trip/stop/order IDs, UUID operation IDs and server revisions |
| Failed/skipped stops can appear as delivery recorded | Keep full/partial/failed/refused/skipped outcomes distinct in Activity, route and server records |
| Store tracking uses one static delivered order | Track real outlet orders and all lifecycle branches, especially deferral and partial delivery |
| Main sync marks all records synced locally; degradation simulates uploads and conflicts | Only show `Synced` after the server acknowledges the exact operation and required evidence |
| Main auth accepts a valid-looking form and allows demo role switching | Use provisioned identities and server-controlled roles; isolate demo mode from connected builds |

## Screen traceability

| Screen | Flutter feature | Phase | Critical gate |
|---|---|---|---|
| M1 Driver Today | Today, loading readiness, no assignment, next trip | 3 | No departure before release/assignment eligibility |
| M2 Route & Stop | Cached route, manifest, navigation, parked mode, issue reporting | 3–4 | Route stays usable offline; proof controls require parked mode |
| M3 Proof of Delivery | Quantities → evidence → review → complete | 4 | Local save is durable before moving to next stop |
| M4 Offline & Sync | Queue, retries, partial success, conflict comparison | 4 | Replay does not duplicate delivery or erase proof |
| M5 Store Home | Incoming delivery, quick actions, actionable updates | 5 | Displays only the authenticated outlet’s data |
| M6 Store Order/Tracking/Receipt | Catalogue, draft, review, timeline, receipt, issues | 5 | Server validates quantities, dates and receipt eligibility |
| M7 Authentication | Sign-in, activation, recovery, expiry, offline unlock | 2 | No protected data exposed before authorized access |
| D3 consequence | Store deferral reason, revised date, acknowledgment/impact | 5–6 | A delay always has an explanation |
| D5 consequence | Updated driver manifest; store update after resolution | 3, 6 | Unresolved shortfall never releases the trip |

## Freeze before coding

- [x] Record Android-first implementation and the user-authorized iOS extension on 1 October; iOS source/tooling is tracked in Phases 8–9.
- [ ] Identify real Android/iPhone test devices and record which verified platform builds enter the first release; physical acceptance is not implied by scope authorization.
- [x] Adopt Flutter/Dart and the proposed stack in the [architecture reference](REFERENCE_Architecture_and_API.md); compatible versions are pinned in [pubspec.lock](../waypoint-mobile/pubspec.lock).
- [x] Record MVP and later features using the README schedule and [scope decisions](../waypoint-mobile/docs/scope-decisions.md). Fleet allocation, loader scanning and dispatcher planning stay on the web.
- [ ] Agree IDs, business date (`Asia/Colombo`), units, state transitions and evidence requirements.
- [ ] Agree offline access duration, shared-device behavior, retention, logout handling and proof protection.
- [ ] Choose one fixture order that can be followed from Store creation through all web/mobile roles.
- [x] Record the synthetic fixture's exact user, outlet, vehicle, trip, stop, order and line IDs, quantities/units and business date in [route.json](../waypoint-mobile/assets/fixtures/route.json). It is explicitly separate from the report's `VEH006`/tomorrow and website seed's `WP-001-T1`/UTC-date data; connected cross-role fixture provisioning remains Phase 2 work.
- [ ] Freeze identity, shared API/domain services, deployment topology and event aliases with the backend owner. Track B01–B12 in the readiness register before marking dependent work integrated.
- [x] Record backend gaps B01–B12 with responsibility owners, phase deadlines and verification in [the readiness register](WEBSITE_Alignment_and_Backend_Readiness.md). This is a repository issue register; external issue tickets/human assignment have not been created.

**Exit gate:** the screen matrix, policies, integration owners and first-release feature list are agreed. Any unresolved policy has an owner and a decision deadline before its dependent phase.
