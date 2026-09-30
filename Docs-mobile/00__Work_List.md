# Mobile phase work list

Last updated: **1 October 2026 (01:42 IST)**. Flutter/Dart, Android first. Driver/Store native; Dispatcher/Loader web. [Executed evidence](../waypoint-mobile/docs/phase-2-7-verification.md) and [development APK](../waypoint-mobile/build/releases/waypoint-0.1.0-development-20260930.apk).

## Phase progress

iOS source/tooling was added on 1 October. See [iOS evidence](../waypoint-mobile/docs/ios-verification.md); Apple compilation, signing and phone acceptance remain pending. The linked 30 September Android APK remains the earlier artifact.

| Phase | Name / plan | Status | Completed work / remaining gate |
|---|---|---|---|
| 0 | [Project review and scope](00_Project_Review_and_Scope.md) | In progress | Sources, scope, policies and IDs recorded; physical phone and operations policy/hosted environment approval pending |
| 1 | [Flutter foundation and design system](01_Flutter_Foundation_and_Design_System.md) | Implemented — verification pending | Native design/navigation, encrypted DB/media/migration and CI; physical-device acceptance pending |
| 2 | [Authentication and backend contracts](02_Authentication_and_Backend_Contracts.md) | Implemented — verification pending | Shared credentials, Firebase SDK bridge, current-profile/version/scoped APIs and account CLI tested; hosted phone identity/policy gate pending |
| 3 | [Driver route and trip workflow](03_Driver_Route_and_Trip_Workflow.md) | Implemented — verification pending | Real assigned cache/manifests, publication/loading/start, parked stops/navigation/issues, route comparison, breakdown/closeout/Trip 2; target-phone offline/navigation acceptance pending |
| 4 | [Proof of delivery and offline sync](04_Proof_of_Delivery_and_Offline_Sync.md) | Implemented — verification pending | Durable POD/photos/signature, immutable outbox, actual upload/finalize/replay and audited reviews tested; physical camera/process-kill/storage and hosted S3 pending |
| 5 | [Store ordering, tracking and receipt](05_Store_Ordering_Tracking_and_Receipt.md) | Implemented — verification pending | Real catalogue/drafts/orders, D3 restoration/history, receipts/issues and scoped digital note/photos; full future-date planning-to-receipt UI rehearsal pending |
| 6 | [Cross-role integration and notifications](06_Cross_Role_Integration_and_Notifications.md) | Implemented — verification pending | Shared web/native mutations, Dispatcher/Loader decisions, durable scoped sequence updates and refresh recovery tested; hosted worker/full UI rehearsal pending |
| 7 | [Testing, release and handoff](07_Testing_Release_and_Handoff.md) | In progress | 35 Flutter + 4 domain + 1 HTTP tests, connected Android integration, installed development APK, signing workflow and handoff; production signing/phone/hosted matrix pending |
| 8 | [iOS platform and compatibility](08_iOS_Platform_and_Compatibility.md) | Implemented — verification pending | Swift/Xcode schemes, Apple config, permissions, camera/Keychain/file protection, branding/privacy and Mac CI; 40 shared Flutter tests/portable checks pass; Xcode/simulator/iPhone gates pending |
| 9 | [iPhone testing and release](09_iOS_Testing_and_Release.md) | In progress | Protected IPA export, signing validation and handoff; 5 signing-validator tests pass; Mac CI, authorized signing, TestFlight and physical iPhone matrix pending |

**Fully complete phase exit gates: 0 / 10.** Software implementation for Phases 2–6 and iOS Phase 8 is present; the complete count includes physical/hosted/policy/Apple-toolchain gates. Phase 7's 35-test/Android artifact baseline is dated 30 September; 40 shared Flutter tests passed on 1 October without a new Android artifact or backend test run.

## Implemented for the Phases 2–7 request

- [x] Native sign-in/restoration, account/role/depot/outlet isolation, bounded offline lease and guarded deep links.
- [x] Shared current-principal browser/native API services and executable strict schemas.
- [x] Driver approved route/cache, safe entry, issue paths and canonical closeout.
- [x] Three-step POD, persistent encrypted evidence and exact-receipt sync.
- [x] Conflict intake, preserved original proof and authorized audited amendment/follow-up.
- [x] Store catalogue, durable reviewed order, tracking/deferrals/restoration, receipt/issue and digital note.
- [x] Dispatcher/Loader shared operations, release holds and durable recipient updates.
- [x] Failure tests, isolated reset/CI runner, protected release workflow and API/offline/privacy/demo handoff.
- [x] Normal connected development APK built, checksummed, installed and launched on Android emulator.
- [ ] Hosted HTTPS/Firebase/private S3 verification and operations approval of release defaults.
- [ ] Physical-phone camera/airplane/process-kill/low-storage/upgrade acceptance.
- [ ] Protected production keystore, signed APK/AAB, fresh-phone release install and full demo rehearsal.

Push, socket rooms, continuous GPS, guaranteed background transfer, full invitation/recovery UI, typed signature acknowledgment and PDF export remain deferred. iOS was added to the authorized scope on 1 October and is tracked in Phases 8–9; its Apple build/signing/device gates remain open.

## Implemented for the iOS request

- [x] Add iOS 15+ Swift/UIScene Runner, Xcode workspace, CocoaPods map and three environment schemes.
- [x] Add Apple Firebase/flavor validation, simulator config and guarded native links.
- [x] Add camera interruption handling, device-bound Keychain, backup/file protection bridge, existing-brand icons and privacy manifest.
- [x] Add Mac CI, protected owner-supplied IPA export, signing validators and setup/acceptance documents.
- [x] Run 40 shared Flutter tests, clean analysis/format and portable iOS configuration/5 signing-validator tests on Windows.
- [ ] Compile/run with macOS/Xcode and verify intended Firebase Apple/hosted APIs on simulator and real iPhone.
- [ ] Verify physical iPhone camera/offline/protection/upgrade and cross-role workflows.
- [ ] Export authorized signed IPA, complete TestFlight processing/install and record release acceptance.

## Verification and code references

- [Actual results and artifact checksum](../waypoint-mobile/docs/phase-2-7-verification.md)
- [Release checklist](../waypoint-mobile/docs/release-checklist.md)
- [Setup/run instructions](../waypoint-mobile/README.md)
- [Tricky code recipes](CODE_Implementation_Recipes.md)
- [Implemented architecture/API](REFERENCE_Architecture_and_API.md)
- [Backend readiness B01–B12](WEBSITE_Alignment_and_Backend_Readiness.md)

## Task-driven progress automation

[AGENTS.md](../AGENTS.md) requires future agents to update this table, the affected phase tasks/status and dated evidence in the same change. [agend.md](agend.md) explains the requested filename. No scheduler/background watcher is installed.

| Status | Meaning |
|---|---|
| Not started | Operational outcome has no implementation |
| In progress | Required implementation/decisions/release work remains |
| Implemented — verification pending | Software exists; remaining acceptance gates explicitly recorded |
| Complete | All applicable tasks, acceptance checks and phase exit gate passed |
| Blocked | Named external prerequisite prevents further meaningful work |

Only increment the complete count after the relevant remaining gate passes. Reopen a phase if a regression invalidates its evidence. Do not check optional deferred features as completed.

## Update history

| Date | Change | Evidence / limit |
|---|---|---|
| 2026-10-01 | Implemented iOS platform/shared compatibility and IPA tooling; added Phases 8–9 | [iOS evidence](../waypoint-mobile/docs/ios-verification.md): 40 Flutter + 5 signing-validator tests and portable checks; no Xcode/simulator/phone/signing run |
| 2026-10-01 | Re-ran automated checks (dart format, flutter analyze, flutter test --flavor development); all 35 tests pass; no source changes | Re-run only; no integration test, physical device or hosted API run; remaining gates unchanged |
| 2026-10-01 | Reviewed Phase 7 against source, workflows and handoff; linked coverage, corrected fixture/socket/OpenAPI references and split implemented tooling from release acceptance | Documentation review only; 30 September test results retained, no new test run or release claim; Phase 7 remains In progress |
| 2026-09-30 | Phase 0 review and Phase 1 foundation | [Original evidence](../waypoint-mobile/docs/phase-0-1-verification.md); device/policy gates open |
| 2026-09-30 | Phase 1 debug APK and native storage check; started Phases 2–7 | Original 24 tests and native storage test; superseded software count below |
| 2026-09-30 | Implemented Phases 2–6 and Phase 7 local verification/release handoff | 35 Flutter tests, 4 domain tests, 1 live HTTP test, 1 connected Android journey, clean analysis/typecheck/web build, normal installed development APK; physical/hosted/production signing gates remain |
