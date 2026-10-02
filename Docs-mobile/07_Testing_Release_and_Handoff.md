# Phase 7 — Testing, release and handoff

**Execution status (30 September 2026): In progress.** Automated mobile/domain/HTTP checks, connected Android verification, development artifact, protected release workflow and handoff documents are implemented. Production signing, hosted S3/API, fresh physical-device installation and the remaining failure matrix are required before release completion.
Progress is maintained in [00__Work_List.md](00__Work_List.md) under [the repository rule](../AGENTS.md).

**Plan reviewed: 1 October 2026.** The results below were executed on 30 September; this documentation review does not represent a new test run. Source, workflow and handoff references were checked. Phase 7 remains **In progress**.

## Implemented tricky code

### Review update — 1 October 2026

Status remains **In progress**. [Current review/build evidence](../waypoint-mobile/docs/mobile-review-and-fixes.md) supplements the historical results below.

- [x] Run 48 Flutter tests including eight recovery regressions; clean analysis.
- [x] Add native connected app startup/sign-in/route smoke coverage.
- [x] Build/install/launch the updated normal connected APK; verify native login rendering and record its SHA256.
- [x] Relaunch the installed connected app in a visible Android emulator window on the subsequent run request; confirm login controls and running local services (1 October).
- [x] Launch Flutter in Chrome and record the same-build browser review of all 19 route patterns; [errors/coverage](../waypoint-mobile/docs/chrome-page-review.md) distinguish 11 preview renders from 8 unsupported operational error states and the unavailable Chrome inspection connection.
- [x] Resolve browser findings B01–B05; 50 Flutter tests pass, clean analysis/format and corrected browser recheck recorded. Also resolve reproduced renderer/font CDN startup failure with local assets.
- [ ] Complete native operational/device gates separately; browser fixes do not update the installed APK or certify Apple/hosted behavior.
- [x] Pass the new native UI smoke test: real local sign-in, Driver home and Route navigation; 1 passed on retry with local services checked and a longer bounded wait. The initial failed attempt remains documented in the evidence.
- [ ] Retain physical-phone, hosted, Apple-toolchain and protected release gates.

**iOS scope update (1 October):** iOS code/tooling is implemented in [Phase 8](08_iOS_Platform_and_Compatibility.md), with Apple release acceptance in [Phase 9](09_iOS_Testing_and_Release.md). [New shared evidence](../waypoint-mobile/docs/ios-verification.md) records 40 Flutter tests. Older Android artifact/runtime results remain dated 30 September; no iOS compilation or phone release is claimed.

Implemented entry points: [verification](../waypoint-mobile/docs/phase-2-7-verification.md), [protected signing workflow](../.github/workflows/mobile-release.yml), [release checklist](../waypoint-mobile/docs/release-checklist.md).
~~~powershell
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test --flavor development
flutter test integration_test/connected_journey_test.dart -d emulator-5556 --flavor development --dart-define-from-file=config/emulator.json
flutter build apk --debug --flavor development --dart-define-from-file=config/emulator.json
~~~
A development APK is not a production release. Record real checksums and evidence; leave physical-phone, private-S3 and protected signing gates open until they actually pass.

See [code recipes](CODE_Implementation_Recipes.md), [verification evidence](../waypoint-mobile/docs/phase-2-7-verification.md) and [the remaining release checklist](../waypoint-mobile/docs/release-checklist.md). Checked tasks record implementation; acceptance conditions requiring physical or hosted environments remain open.

**Outcome:** a signed, installable build with verified functionality and clear operating instructions.  
**Dependencies:** all features included in the release. **Estimate:** 1–2 working days after continuous phase testing. **Owner:** QA/release lead with developers.

## Test layers

| Layer | Scope |
|---|---|
| Dart unit | Quantity/unit rules, state transitions, serialization, outbox dependencies/backoff, date handling, revision/conflict logic |
| Widget | Role shells, form validation, parked gate, keyboard/safe areas, loading/error/empty states, large text, accessible statuses |
| Flutter integration | Real auth, route download, draft restore, proof/media, reconnect, Store order/receipt and deep links |
| Server/API | Ownership, validation, idempotency, concurrent updates, finalized evidence and notification scoping |
| Cross-role | Web Dispatcher/Loader → Flutter Driver → Flutter Store using shared canonical IDs |

Use controlled fixtures and fault injection for destructive/error scenarios. Do not run fake proofs against production operational orders.

## Required failure matrix

| Scenario | Pass condition |
|---|---|
| First launch offline | No false login; clear connect-to-sign-in guidance |
| Prior sign-in, cached route, cold start offline | Authorized local route/drafts load under the offline-access policy |
| Process killed during draft/POD save | Last successful save survives; incomplete writes are detected/recovered |
| Camera permission denied/interrupted | Retain form; recovery path respects optional/required evidence policy |
| Storage full/missing attachment | Do not claim saved/synced; retain actionable error and prior data |
| Wi-Fi available, API unreachable | Show retryable connectivity/server state; queue remains intact |
| Response lost after server commit | Retry returns same result; no duplicate trip count/order/proof |
| One of several records fails | Exact success count and remaining errors shown; no false all-clear |
| Multiple offline stops share one downloaded route | Earlier completion does not invalidate unchanged later proof; real manifest/assignment changes still conflict |
| Token expiry/revocation during upload | Pause, preserve evidence, reauthenticate/lock according to policy |
| Shared device/account change | User B never sees or uploads User A’s route/proof |
| Order/manifest reassigned while offline | Preserve proof and expose conflict; operations resolution is auditable |
| Historical driver uploads proof after reassignment | Restricted review intake works; new driver's route/current mutations remain forbidden |
| Two devices complete the same stop | Server uniqueness/transition policy prevents duplicate effects |
| Unresolved loading shortfall | Server and mobile both block release/start |
| Trip closeout with pending/conflicted stop operations | Canonical completion is held; local counts cannot unlock Trip 2 |
| Closeout response lost, retried | One closeout result/event; server-derived counts and eligibility stay correct |
| Breakdown while earlier POD is queued | Hold/recovery updates reach correct roles; original proof survives reassignment |
| Store cut-off/date becomes invalid during queued submit | Server rejects with re-review path; no silent rescheduling |
| Delivered/partial/failed/refused/skipped | Each keeps correct labels, quantities and follow-up actions |
| Closed/refused/skipped stop without a recipient | Save/sync the reasoned event without inventing recipient proof or claiming delivery |
| Push/socket unavailable | API refresh/in-app updates recover; core flow remains usable |
| Business commit succeeds, notification publisher crashes | Durable event outbox recovers the missing update without duplicate business effects |
| Web/native reset or account disable | Shared credentials and current-account policy agree; old web/native sessions are rejected |
| Reset/disable after bridge-token issuance, before SDK exchange | API rejects the stale sign-in version even if provider exchange succeeds |
| Web and native race to record the same stop/receipt | Shared domain guard prevents duplicate business effects even with different operation IDs |
| Receipt accepted, note viewed after URL expiry | Correct scoped digital note remains available; evidence access can be renewed |

## Recorded coverage and remaining evidence

The failure matrix defines acceptance requirements; it is not a list of passed tests.

| Coverage group | Recorded evidence | Remaining acceptance |
|---|---|---|
| Immutable replay, acknowledgments, account/scope changes and expired lease | [Sync tests](../waypoint-mobile/test/sync/sync_worker_test.dart), [API tests](../waypoint-mobile/test/network/api_client_test.dart) | Physical network interruption and account changes during hosted upload |
| Draft retention, migration, key loss and persistent media | [Storage tests](../waypoint-mobile/test/storage/local_store_test.dart), [media tests](../waypoint-mobile/test/storage/media_store_test.dart) | OS force-stop, low storage, camera interruption and installed-version upgrade with pending proof |
| Loading hold, offline stops, uniqueness, closeout, review and notifications | [Domain tests](../waypoint-flow/tests/mobile-service.test.ts) | Full browser/native rehearsal and supervised hosted publisher recovery |
| Credentials, scoped access, Origin, replay and revoked sessions | [HTTP tests](../waypoint-flow/tests/mobile-http.test.ts) | Hosted HTTPS/Firebase identity and release-phone verification |
| SDK, database reopen, synthetic image, lost acknowledgment, Store creation and receipt/note | [Android journey](../waypoint-mobile/integration_test/connected_journey_test.dart) | Real camera, airplane mode and connected forms; database reopen is not OS process termination |
| Colombo date boundary and fixture width/text scaling | [Date test](../waypoint-mobile/test/formatters_test.dart), [shell tests](../waypoint-mobile/test/widgets/app_shell_test.dart) | Connected forms, keyboard, screen reader and target-phone visual review |

For remaining matrix runs, record scenario, date, commit/build ID, device/OS, backend environment, steps, expected/actual result, sanitized operation IDs and evidence location in [verification](../waypoint-mobile/docs/phase-2-7-verification.md). Mark passed only for the behavior and environment actually exercised. Exclude credentials, recipient signatures and private photos from public handoff evidence.

## Device and visual verification

- [ ] Test a real Android device in airplane mode, not just a demo toggle.
- [ ] Cover 320/390 logical widths, a larger phone, text scaling, rotation where supported, software keyboard and low-storage behavior.
- [ ] Check green trip-card illustration placement, contrast, evidence thumbnails, touch targets, Back behavior and screen-reader labels against the HTML/MD references.
- [ ] Test actual app termination and relaunch between each critical persistence/upload boundary.
- [ ] Verify all operational dates/windows use `Asia/Colombo`; include midnight/timezone edge cases.
- [ ] Confirm the selected plugin versions work in a release build, not only debug mode.

## Build and deployment checklist

- [x] Keep environment-specific endpoints/app identifiers separate; validation rejects fixture/emulator/HTTP production settings. Intended hosted project still requires acceptance.
- [ ] Provide HTTPS APIs, correct native identity configuration and a supported production HTTP server/event publisher. The MVP uses authorized API refresh; no realtime socket service is required.
- [ ] Verify the website alongside the app after shared-service changes: all four accounts, assigned starts, loading holds, orders, deferrals and receipts remain compatible. A Flutter feature passing does not certify the existing browser caller.
- [ ] Test the chosen production command/environment and any scheduler/publisher. Current `next start` and Docker/custom-server paths differ; configure `NODE_ENV=production`, listener/HTTPS proxy settings and a tested publisher lifecycle. Anonymous socket forwarding has been removed.
- [x] Exclude environment files, service-account credentials, signing keys and test artifacts from Docker contexts; lazy Admin initialization permits a key-free production compile. Actual container/hosted runtime remains unchecked.
- [x] Replace documentation-only seed commands with tested strict demo-only seed/prepare-device scripts and CI runner. The legacy seed route is guarded; never reset operational data on app startup.
- [x] Implement Android flavor IDs, version/build, permissions, protected signing workflow and missing-key production build guard. See [Gradle](../waypoint-mobile/android/app/build.gradle.kts) and [workflow](../.github/workflows/mobile-release.yml).
- [ ] Confirm production application ID/version and provision the authorized signing certificate in the protected environment; execute and verify the workflow.
- [ ] Produce an APK for direct internal demonstration and an AAB when store distribution is required. Follow [Flutter Android release guidance](https://docs.flutter.dev/deployment/android).
- [ ] Install the signed APK on a fresh device, then run the full shared-order and offline recovery tests.
- [x] Record development APK filename, checksum, application ID, version/build, emulator/OS and local API environment in [verification](../waypoint-mobile/docs/phase-2-7-verification.md), with [demo setup](../waypoint-mobile/docs/demo-walkthrough.md).
- [ ] Record equivalent metadata and fresh-device installation results for the signed production APK/AAB. Backend `docker compose up` does not install the native app.
- [x] Add iOS source/platform compatibility, Mac CI and protected IPA export tooling; track [Phase 8](08_iOS_Platform_and_Compatibility.md) and [Phase 9](09_iOS_Testing_and_Release.md).
- [ ] Allocate macOS/Xcode, authorized Apple signing, target iPhone and distribution access; execute Apple build/device gates separately. Follow [iOS setup](../waypoint-mobile/docs/ios-setup-and-release.md).
- [ ] Record backend/API compatibility and local schema migrations. Verify upgrade from the previous app version with queued proof present.
- [x] Add privacy/retention and recovery documentation, with no automatic purge of pending evidence. Operations approval/deletion policy remains a release prerequisite; logs exclude private proof and credentials.
- [ ] Add crash/error reporting only with redaction and controlled access. Record operation/request IDs for diagnostics.

## Demo fixtures and walkthrough

Use the implemented [demo walkthrough](../waypoint-mobile/docs/demo-walkthrough.md), [isolated seed](../waypoint-flow/scripts/seed-mobile-test.ts) and [Loader preparation](../waypoint-flow/scripts/prepare-mobile-device.ts). Connected fixtures use `TEST-TRIP-1/2`, `TEST-STOP-1/2/3`, `TEST-ORDER-1/2/3`, `TEST-DEFERRED`, Store `OUT005/OUT006` and vehicle `VEH001`. Reset uses the actual `Asia/Colombo` business date. The report's `OUT005 → VEH006 Trip 1` and fixed HTML/JSON examples are separate references; do not hard-code their IDs into production screens. Isolated fixtures exercise scope, units, cold-chain and capacity rules; they do not certify travel-time scheduling.

Required cases: one full/partial order with real receipt/note, one capacity deferral, one shortfall held until approved, one closed outlet, one offline POD with process kill/reconnect, and a separate breakdown/conflict fixture. Correct/wrong barcodes belong to the web Loader demo. Freeze an explicit business date; record any simulated clock/location clearly. Reset only isolated test data after checking no unsynced proof is being discarded.

Adapt Part 12 of the full report to **web Dispatcher/Loader + installed Flutter Driver/Store**. Insert dispatcher shortfall resolution before departure, and verify the native queue rather than using a browser offline toggle. Capture real canonical IDs, response acknowledgments and the resulting receipt/note.

For the hackathon submission, prepare the report's 5–8 minute walkthrough and an Unlisted video link, live web/backend URLs, four verified scoped demo accounts, the signed Android artifact and clear install/setup instructions. Record departures: Flutter/SQLite replaces PWA/IndexedDB, navigation stays an external handoff, and push/background GPS/iOS remain outside scope unless tested. Submission remains a separate action when requested.

## Implemented handoff documents

Implemented handoff documents inside `waypoint-mobile/` app:

- `README.md`: Flutter version, environment setup, emulator/physical-device API configuration, run/build commands and test accounts provisioned through the test environment.
- `docs/api-contracts.md`: implemented v1 contracts, executable schema/source links, error codes and operation/revision behavior. No approved OpenAPI artifact is claimed.
- `docs/offline-recovery.md`: outbox/media lifecycle, foreground/background guarantees, conflict and failed-save recovery.
- `docs/release-checklist.md`: tested devices/build IDs, signed artifact locations, known issues and rollback compatibility.
- `docs/demo-walkthrough.md`: real cross-role order, deferral, loading shortage, offline POD and reconnect sequence.
- `docs/ai-disclosure.md`: tools used for development, human review and actual limitations; do not claim runtime AI features that do not exist.

## Final release gate

Complete remaining work in this order:

1. Select the target phone and hosted API/Firebase/S3 configuration; obtain operations approval of offline/evidence/retention defaults.
2. Verify hosted identity/media/publisher and all four browser roles; rehearse a Store-created order on its actual service date through planning, loading, native delivery and receipt.
3. Execute physical-device failure, connected-form visual and installed-version upgrade checks; record sanitized evidence and fix failures.
4. Run repository CI and protected production signing; record checksums, install the APK on a fresh phone and verify the complete journey and release plugins.
5. Finalize the release manifest, recovery/rollback instructions and demo recording; update the phase/tracker to Complete only after applicable gates pass.

Push, sockets, continuous GPS and guaranteed background transfer remain deferred. iOS implementation was added in Phases 8–9 and its runtime/signing gates remain pending. Crash reporting is optional; if enabled, verify redaction/access control before release. AAB acceptance applies when selected for distribution.

- [ ] All release-scope phase exit gates and the failure matrix pass.
- [x] Fixture preview is explicitly labelled; connected acceptance uses real scoped APIs and exact operation receipts rather than a local success flag.
- [x] Current-principal assignment/outlet/depot guards are shared across native/browser adapters; negative ownership tests pass. No realtime subscription is enabled in the MVP.
- [x] POD, issues and receipt mutate the same canonical shared-service order shown to web operations; domain/native tests record IDs and outcomes.
- [ ] Unsynced evidence is retained through expiry, reconnect, upgrade and account lock.
- [ ] Signed build can be installed and demonstrated from documented instructions.
- [x] Deferred features are listed clearly in the release checklist: push, continuous GPS, background transfer/socket rooms, full invitations, typed acknowledgment and PDF export. iOS is now tracked separately in Phases 8–9.

**Exit gate:** the mobile app is demonstrably operational for its declared scope, with evidence of recovery under real device/network failures and a reproducible release procedure.

## Execution evidence and remaining gate

UI follow-up on 1 October: clean analysis, 50 passing Flutter tests, browser Home/Profile visual checks and a newly built/installed normal debug APK. Connected Android login rendered; native Sync Centre/offline visual acceptance remains pending after emulator instability. See [UI verification and checksum](../waypoint-mobile/docs/ui-polish-verification.md). Phase remains **In progress**; physical, hosted and signed-release gates remain open.

Software/test evidence is recorded in [phase-2-7-verification.md](../waypoint-mobile/docs/phase-2-7-verification.md). The code paths above replace the original proposed helpers. No production deployment, signing credential, physical camera acceptance or human policy approval is claimed. Keep this phase open until its applicable remaining release checks pass.
