# Waypoint Flow — Flutter mobile implementation plan

Current execution: [phase work list](00__Work_List.md). Phases 2–6 software now exists in [waypoint-mobile](../waypoint-mobile/README.md), with shared web/backend services, actual local tests and an installed development APK. Phase 7 is in progress; required hosted/physical/signing gates remain pending.

Each phase includes a code starting point. Read [tricky implementation recipes](CODE_Implementation_Recipes.md) for storage, authentication, replay, conflicts and receipt details. [AGENTS.md](../AGENTS.md) requires progress/evidence updates during future agent work; [agend.md](agend.md) explains that automation.

Prepared 30 September; updated **1 October 2026** · Framework: **Flutter / Dart** · Android implementation plus iOS source/tooling in Phases 8–9; Apple compilation/device/signing verification remains pending. See [iOS setup](../waypoint-mobile/docs/ios-setup-and-release.md).

This plan converts the Driver and Store Manager experiences into an installed mobile app connected to the existing Waypoint Flow backend. It incorporates [the website implementation plan](../hackathon_implementation_plan.md), [the full hackathon report](../hackathon_full_report.md), both mobile HTML prototypes, the screen/challenge specifications and the actual `waypoint-flow` source. Connected identity, route/POD/sync, Store workflows and shared in-app updates are implemented. The fixture mode remains separately labelled.

The website is the starting point: retain Next.js, Firestore, private S3 evidence and the Dispatcher/Loader interfaces. Reuse shared server services and existing user profiles. The reports' completed-day labels do not certify native readiness: these gaps are now implemented and tested in the isolated environment; hosted and physical acceptance still need evidence. Read the [website alignment and backend readiness register](WEBSITE_Alignment_and_Backend_Readiness.md) before assigning implementation work.

## Updates from the website review

- Keep the existing web password source for the first release; use the implemented Firebase custom-token bridge for Flutter instead of requiring a website-wide password migration.
- Make assigned-route, media/POD and replay services explicit backend prerequisites; adapt the existing API rather than build a second logistics backend.
- Add driver trip closeout, breakdown/hold recovery and server-controlled Trip 2 eligibility.
- Add the Store digital delivery note and deterministic cross-role demo fixtures.
- Separate the implemented socket events from the report's target taxonomy, and verify deployed transport/process behavior.
- Add native/web compatibility checks, physical-device API setup, CI and signed-build/demo artifacts.

## Read and execute in this order

| Phase | Document | Result | Depends on |
|---|---|---|---|
| 0 | [Project review and scope](00_Project_Review_and_Scope.md) | Agreed requirements, prototype reconciliation and MVP boundary | None |
| 1 | [Flutter foundation and design system](01_Flutter_Foundation_and_Design_System.md) | Runnable native shell, shared widgets, local storage foundation | 0 |
| 2 | [Authentication and backend contracts](02_Authentication_and_Backend_Contracts.md) | Real sign-in, scoped APIs and mobile fixtures | 0; client integration uses 1 |
| 3 | [Driver route and trip workflow](03_Driver_Route_and_Trip_Workflow.md) | Real assigned route, cached manifest, safe stops, closeout/breakdown | 1–2; durable mutations use 4 |
| 4 | [Proof of delivery and offline sync](04_Proof_of_Delivery_and_Offline_Sync.md) | Durable evidence, actual upload, retry and conflict handling | 1–3 |
| 5 | [Store ordering, tracking and receipt](05_Store_Ordering_Tracking_and_Receipt.md) | Outlet-scoped order, tracking, receipt and delivery note | 1–2; queued mutations/evidence and receipt completion require 4 |
| 6 | [Cross-role integration and notifications](06_Cross_Role_Integration_and_Notifications.md) | Dispatcher/loader/driver/store handoffs and recoverable updates | 3–5 |
| 7 | [Testing, release and handoff](07_Testing_Release_and_Handoff.md) | Verified signed build, setup documentation and demo | All release-scope features |
| 8 | [iOS platform and compatibility](08_iOS_Platform_and_Compatibility.md) | Shared app with native Apple configuration/storage/camera support | 1–6 |
| 9 | [iPhone testing and release](09_iOS_Testing_and_Release.md) | Verified signed IPA and iPhone/TestFlight handoff | 7–8 plus hosted/signing prerequisites |

[Architecture and API reference](REFERENCE_Architecture_and_API.md) documents the implemented folder structure, native data model, endpoint contracts and state language used throughout these phases.

## How to work through the plan

Phase 7 covers existing shared/Android release gates. Phases 8–9 add iOS implementation and separate Apple compilation/device/signing acceptance without replacing those gates.

Each phase contains tasks, backend dependencies, acceptance checks and an exit gate. Open a phase, turn its checkboxes into issues, implement one complete user flow, and capture verification evidence before marking it done. Backend and Flutter work can proceed together once request/response fixtures are agreed. Store read screens/UI may proceed alongside Driver work, but queued store mutations and evidence reuse Phase 4's tested pipeline. QA starts in Phase 1; Phase 7 is the shared/Android release gate and Phase 9 adds iOS release acceptance.

Suggested workstreams are Flutter UI/domain, backend/auth/contracts, and integration/QA. These are responsibility areas, not assumptions about your team size. A solo developer follows the dependency order and keeps the first release smaller. Phase 6's identity/event/hosting contracts are agreed during Phase 2; Phase 6 tests the assembled handoffs. Do not wait until Phase 6 to discover where the backend will run.

The first three vertical milestones are: **existing account → scoped native route**, **offline POD → durable upload → web/store outcome**, then **native Store order → web planning/loading → native delivery → receipt/note**. Each milestone must pass with real data before marking its related phases integrated.

## Original planning estimate and short-deadline scope

Allow approximately **12–18 working days for a focused team** to complete the Android implementation and backend gaps described here. This is a planning estimate, not a delivery guarantee. Phase estimates overlap for separate workstreams; do not add them as a promised calendar schedule. A solo implementation, unfamiliar Flutter tooling, account provisioning or iOS work will take longer.

The repository records a hackathon target of **4 October 2026, 11:59 PM**. The website reports' Day 6–10 dates are not a new mobile delivery estimate. Use the dependency gates above for the full native build. If the original deadline still applies to mobile, use this smaller sequence:

| Date, Asia/Colombo | Priority | Gate |
|---|---|---|
| 30 September | Freeze scope; build Flutter shell; establish mobile identity/API spike | One real driver and store account can access only their own data |
| 1 October | Download assigned route; persist it; build parked-stop/POD draft flow | Cached route and draft survive an offline cold start |
| 2 October | Finish durable POD, media upload, idempotent sync, retry/conflict screen | Real offline completion and reconnect work without duplicate delivery |
| 3 October | Minimal Store home/order/tracking/receipt plus web role handoffs | One real order completes the full cross-role journey |
| 4 October | Fix failures, sign Android build, rehearse and record demo | Release checklist passes; incomplete features are explicitly recorded |

This is a high-risk compressed MVP. Keep Android, basic connected sign-in, cached route, POD, foreground/manual sync, simple store ordering/receipt and in-app updates. Schedule full invitation automation, push delivery, background jobs, advanced tracking, biometric unlock and iOS distribution after it. If identity or transactional sync is unfinished, deliver a labelled UI preview rather than presenting simulated actions as operational functionality.

## Completion definition

An installed app authenticates the existing users, displays their server-assigned data, saves a delivery with evidence while offline, survives process termination, reconnects without double counting, and exposes the resulting delivery/receipt/note to the correct store and dispatcher. Trip closeout and Trip 2 follow server eligibility. Deferrals, shortfalls and breakdowns remain explained and auditable. Use the [release checklist](07_Testing_Release_and_Handoff.md) to decide whether this definition is met.

## Current implementation and handoff

[Executed evidence and APK checksum](../waypoint-mobile/docs/phase-2-7-verification.md), [actual API contracts](../waypoint-mobile/docs/api-contracts.md), [offline recovery](../waypoint-mobile/docs/offline-recovery.md), [demo setup](../waypoint-mobile/docs/demo-walkthrough.md) and [remaining release checklist](../waypoint-mobile/docs/release-checklist.md) supersede original proposed helper/endpoint descriptions. Software completion does not waive hosted, physical-phone, privacy-policy or production signing gates.
