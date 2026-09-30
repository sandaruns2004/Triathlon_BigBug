# Website alignment and mobile backend readiness

Updated 30 September 2026. The original website/report audit below is historical baseline evidence. Phases 2–6 code and local verification now exist; use the execution table here to determine remaining readiness.

## Current execution of B01–B12

| ID | Implemented / tested | Remaining gate |
|---|---|---|
| B01 | Shared verifier, bridge/version/revocation/current principal; native SDK and four-role real HTTP tests | Hosted phone identity/config and policy approval |
| B02 | Stable assignment, explicit linked manifests/units/revisions/Asia-Colombo date | Target-phone route/cache rehearsal |
| B03 | Shared shortfall/release/publication/start guards and replay tests | Physical travel/parked workflow |
| B04 | Authorized private S3 lifecycle code; local real adapter finalize/view/hash/scope tests | Hosted private S3 URL/outage/expiry test |
| B05 | Atomic line POD/proof/outbox, native DB reopen/lost-response replay, separate stop tokens | Physical camera/force-stop/airplane/low storage |
| B06 | Closeout, breakdown/hold, reassignment review and audited amendment tested | Complete physical/operations UI recovery rehearsal |
| B07 | Catalogue/service options/server totals/idempotent Store create; native and browser adapters tested | Full future-service-date allocation UI rehearsal |
| B08 | Actual receipts/issues/scoped digital note/photos and duplicate guards tested | Hosted media + phone receipt/correction rehearsal |
| B09 | Atomic events, deterministic recipient records/sequence/cursor, publish retry and API refresh | Hosted publisher/supervisor verification |
| B10 | Anonymous forwarding removed; authenticated REST refresh is implemented MVP baseline | Socket/push channels deferred; do not claim realtime room support |
| B11 | Credential-free production compilation, Docker exclusions/runtime listener, protected signing workflow, installed debug APK | Hosted runtime, release key/certificate, signed fresh-phone acceptance |
| B12 | Strict demo-only deterministic scopes/units/current business date/reset, domain/HTTP/native tests | Fixture timing/scheduler certification and full physical multi-role rehearsal |

[Actual verification](../waypoint-mobile/docs/phase-2-7-verification.md), [API/source](REFERENCE_Architecture_and_API.md), [demo fixture/reset](../waypoint-mobile/docs/demo-walkthrough.md) and [release gate](../waypoint-mobile/docs/release-checklist.md).

## Historical audit before Phases 2–7

## Evidence and scope

Read the root reports as the intended website workflow plus reported progress. Read source for what exists, then run integration/device tests for what works. A checked box or installed package is not an API/persistence test. Recheck this register after backend changes rather than assuming these findings remain current indefinitely.

| Area | Website/report baseline | Native decision |
|---|---|---|
| Roles | Dispatcher, Loader, Driver, Store Manager | Driver + Store Manager in Flutter; Dispatcher/Loader remain web/tablet |
| Server | Next.js API routes + Firebase Admin | Retain and harden shared services; native JSON/auth adapters call the same logic |
| Data | Firestore is the actual stack correction | Keep Firestore authoritative; SQLite is the device cache/outbox, not a database migration |
| Accounts | NextAuth credentials over Firestore bcrypt | Proposed custom-token bridge over the same verifier; retain one password source |
| Evidence | AWS S3 signing helper | Private evidence lifecycle and durable native files; no silent base64 fallback |
| Offline | Report describes PWA/service worker/IndexedDB | Build native SQLite/file/sync worker; share validated server replay services |
| Realtime | Report lists a full event taxonomy | Implement scoped server-owned signals incrementally; API refresh is MVP recovery |
| UI | Inter, Lucide, green design tokens, HTML/MD M1–M7 | Native widgets/adapters preserve visual language and accessibility |
| Planning | Nine server constraints and deferral priority | Display approved results; do not port allocation or loader scanning to native |
| Navigation/location | External navigation; report describes simulated live positions | Keep external navigation; foreground real location optional, background GPS later |
| Hosting | Vercel intent plus inconsistent older Docker/Render examples | Verify the selected HTTP/socket/worker topology with an early phone spike |

## Report claims that need reconciliation

| Report statement | Current source evidence | Planning implication |
|---|---|---|
| Foundation/auth complete; Firebase email/password setup instructed | `lib/auth/nextauth.ts` verifies Firestore bcrypt; no native login/bearer resolver | Shared credential bridge and resource authorization are Phase 2 work |
| Driver M1–M4/offline complete | Stop page calls missing stop GET and posts placeholder signature; queue calls missing `/api/deliveries/sync`; `next.config.mjs` has no PWA setup | Treat the website as scaffolding; build real route/POD/replay and native storage |
| Deferral/publish notify stores | Corresponding handlers update Firestore without durable notification publication | Add transaction event outbox plus recipient-scoped recovery |
| Full Socket.IO taxonomy complete | `server.js` forwards location/order/shortfall messages in depot/vehicle rooms without authenticated scope | Map actual aliases, add authorized subscriptions and commit-derived events |
| Prisma schema and Postgres Docker examples | Report's opening correction and source use Firestore; no Prisma dependency | Do not use these historical examples for native setup or backend migration |
| Seed uses tomorrow, VEH006, 30 orders and five deferrals | Actual `app/api/seed/route.ts` creates four demo trips/six sample orders on UTC today with WP-prefixed IDs; CSV reference data is separate | Produce an explicit, constraint-valid fixture manifest and verify its links |
| Production can run the documented seed command | `package.json` has no `seed:firebase`; current seed entry point is `POST /api/seed` | Check executable setup and authorized test seeding, not copied report commands |

Source paths above are relative to `waypoint-flow/`. Reports are useful requirements; none of the differences should remove their required failure handling from the native implementation.

## Backend work register

The table below is the original issue register, preserved for traceability. Current implementation/remaining gates are in the execution table above. Owners are responsibility roles; assign team members in Phase 0. Proposed native paths and models are in [the API reference](REFERENCE_Architecture_and_API.md).

| ID | Work / source evidence | Owner | Required before | Verification |
|---|---|---|---|---|
| B01 | Shared credential verifier, native custom-token exchange bound to sign-in version, current profile/session checks; current auth is browser-only | Backend/auth | Phase 2 exit | Same account works web/native; disabled/stale sessions and delayed pre-reset token exchange rejected; generic rate-limited login |
| B02 | Stable driver assignment, complete order/line manifest, service date and revisions; current lookup uses name and allocator creates Unassigned drivers | Backend/operations | Phase 3 integration | Real driver receives only assigned waiting/ready/active work, with complete linked lines |
| B03 | Shared release/start guard; current start is role-only and reported shortfall can count toward readiness | Backend/operations | Phase 3 exit | Wrong assignment and unresolved shortfall blocked by server; duplicate start applies once |
| B04 | Private media authorize/upload/finalize/view; existing S3 code is a helper | Backend/storage | Phase 4 proof acceptance | Required evidence verified and scoped; expiry/outage retry preserves files |
| B05 | Line-level POD/outcomes and transactional replay; current deliver increments count and queue sync target is absent | Backend + Flutter | Phase 4 exit | Offline kill/relaunch + lost-response replay produces one proof/business effect; multi-stop replay has no false progress-version conflict |
| B06 | Revision/historical proof review, trip closeout and breakdown/hold resolution | Backend/operations | Phase 4/6 exit | Reassigned proof retained; closeout/Trip 2 controlled by server; breakdown recovery audited |
| B07 | Catalogue/service options and validated idempotent orders; current create trusts totals/forces tomorrow | Backend/catalogue | Phase 5 submit | Forged totals/date/outlet rejected; one canonical order after uncertain retry |
| B08 | Receipt/issue services and readable digital note | Backend + Flutter | Phase 5 exit | Actual delivered/accepted quantities and issue references agree across roles |
| B09 | Durable scoped notifications and event publication; current deferral/publish writes do not publish a recoverable event | Backend/events | Phase 6 exit | Publisher crash recovers once; wrong outlet cannot fetch events |
| B10 | Socket auth, event aliases, endpoint/transport and missed-event recovery | Backend/events | Any enabled realtime | Reconnect refreshes canonical state; client payload cannot claim completed delivery |
| B11 | Hosted API/worker/process, release configuration and secret-safe build; dev/start/Docker paths differ | Backend/release | Hosted Phase 2 spike; final Phase 7 | Phone hits HTTPS API; chosen socket/worker path tested; no credentials in images/artifacts |
| B12 | Deterministic constraint-valid fixtures and isolated reset; source/report seed IDs/dates differ | QA + backend | Phase 2 fixtures; each acceptance run | IDs, units, date, ownership, manifests and all scenario branches verified |

B01–B05 are the critical path for a usable native Driver app. B07–B08 enable the complete native Store journey. UI development may use labelled fixtures in parallel; dependent connected features remain unfinished until their backend gates pass. B06/B09–B12 are required for the declared recovery/integration/release scope, not polish to waive at the end.

## Shared demo fixture manifest

Create this manifest in the future app's test/docs area and have both client/backend tests consume it. The values are agreed fixture data, not hard-coded screen constants.

- Explicit business date in `Asia/Colombo`, clock/observed timestamps and any simulated-time policy.
- Application user IDs and linked provider UIDs for four scoped roles, plus a second driver/outlet for negative authorization tests. Keep secrets outside fixture files.
- Canonical outlet/vehicle/trip/stop/order/line/product IDs, valid brand/district/depot/access/temperature combinations, quantities and units, assignment/release/revision history.
- Separate normal/partial receipt, capacity deferral, held shortfall, closed outlet, offline proof, reassignment/conflict and breakdown cases.
- Correct/wrong barcode values for web Loader testing, expected exception owner and release decision.
- Expected order/stop/trip/receipt/note/event results, including locally pending vs server-accepted states.
- Authorized seed/reset command, returned IDs and cleanup steps for isolated test data. Preserve unsynced device evidence; do not reseed operational data automatically.

The existing sample `WP-001-T1` includes stops already delivered and mixed brand/district examples. It is useful UI data, not evidence of a valid allocation fixture. Reconcile it before recording a full new order-to-receipt journey.

## Execution checkpoints

1. **Baseline:** record the reports' intentions, source gaps, owners and fixture date. Keep Flutter/Android and Driver/Store scope.
2. **Connected slice:** existing account → native token → scoped route on a physical phone and hosted API.
3. **Recovery slice:** approved route → airplane-mode POD → process restart → verified media/replay → web/store outcome.
4. **Business slice:** native Store order → web allocation/shortfall resolution → native delivery/closeout → receipt/digital note; separate D3 and breakdown cases.
5. **Release:** browser compatibility, failure matrix, signed artifact, configuration/install instructions and demonstrated scope.

Record each checkpoint with build/backend version, fixture IDs, tested device, timestamp and evidence of the result. Keep the original hackathon deadline as historical/submission context unless it is still the chosen mobile deadline; completion depends on these gates.
