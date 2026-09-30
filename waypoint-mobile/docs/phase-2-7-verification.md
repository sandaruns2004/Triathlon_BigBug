# Phases 2–7 implementation and verification

Recorded 30 September 2026. These are executed local results, not a hosted deployment or physical-phone release certificate.

## Implemented scope

- Phase 2: shared bcrypt credential verification/rate limit; Firebase custom-token SDK bridge, current-profile/authVersion/revocation checks, account management CLI, owner-scoped v1 contracts, role/deep-link guards and bounded offline access.
- Phase 3: assigned complete approved manifests, atomic cache/timestamps, publication/loading/prior-trip start guards, parked entry/navigation/issue paths, route revision comparison, breakdown hold and canonical closeout/Trip 2.
- Phase 4: three-step line POD, encrypted persistent photos/drawn signature/drafts, immutable atomic proof/outbox, finalized private media, single worker/dependencies/backoff, exact acknowledgments and historical/audited review.
- Phase 5: own catalogue/service options, durable reviewed orders/corrections, real tracking/D3 history/restoration, actual receipt/affected-line issues and confirmed digital note/scoped photos.
- Phase 6: shared web/native services, hardened legacy adapters, Dispatcher decisions/Loader shortfalls, durable domain events, scoped sequence notifications and refresh recovery. Anonymous socket forwarding removed.
- Phase 7: automated tests, isolated fixture/CI runner, Android integration, installable development APK, protected production release workflow and handoff documents.

## Executed checks

| Check | Result | Evidence and limit |
|---|---|---|
| Dart formatting | PASS | 45 lib/test/integration files; final formatting has no further changes |
| flutter analyze | PASS | No issues found |
| flutter test --flavor development | PASS, 35 tests | Storage/migration/key loss/media, sync failures/lease/scope/account races, business date, guarded deep links and 12 fixture shell width/text-scale cases |
| tsx --test tests/mobile-service.test.ts | PASS, 4 tests | Real Firestore/Auth emulators; many positive/negative assertions per journey |
| tsx --test tests/mobile-http.test.ts | PASS, 1 test | Real Next server: all four browser credentials, native bridge, wrong role/outlet, origin guards, batch replay, publish replay/event and revoked sessions |
| node scripts/run-mobile-checks.mjs | PASS | Domain + live HTTP checks on its own port 3175/dist directory; supervised child stops afterward |
| TypeScript check, no incremental cache | PASS | npx tsc --noEmit --incremental false |
| npm run build | PASS | Production website/API compilation; server Firebase credential fields intentionally empty, lazy Admin resolution |
| Connected Android integration | PASS, 1 test | Real SDK, actual native encrypted SQLite/media, actual local API/upload adapter and replay |
| Development APK | PASS | Normal lib/main.dart entry point; installed and launched on emulator |
| GitHub CI / protected release run | NOT RUN | Workflow files exist; no production signing/environment was supplied |
| Physical Android / hosted HTTPS/S3 | NOT VERIFIED | No target phone, approved hosted configuration or signing credentials available |

The Android test signs in Driver, downloads released route, starts through the outbox, copies a synthetic PNG into encrypted app storage, deletes its temporary original, saves proof, closes/reopens SQLite, uploads/finalizes through the actual API, drops only the server acknowledgment after commit, retries to already_applied, signs in Store, proves Driver proof isolation, creates a canonical order with server totals and records actual receipt/note/notifications.

It uses a synthetic image and database reopen. It does not exercise camera permissions, actual Android process termination at every boundary or airplane mode. Native integration is not a full connected form/physical-device visual acceptance test.

Domain tests cover Loader hold/approved partial load, blocked/wrong-driver departure, unpublished plan guard, two offline stops sharing one snapshot, canonical progress, proof/receipt uniqueness, closeout replay/next trip, D3 reason/restoration history, durable publisher retry/deduplication, no-recipient unsuccessful outcomes, historical assignment intake, pre-reset token exchanged after reset, actual Store creation/server totals, current-manifest audited amendment/replay and accepted private photo ownership.

The created-order historical-amendment test uses controlled linked planning records. It does not certify the allocation engine's full travel-time schedule or the complete normal future-service-date web UI rehearsal.

## Reproduce

See [demo setup](demo-walkthrough.md). Service tests use only demo-waypoint-mobile with loopback Auth 9099 and Firestore 8085. Run resets/test suites serially; never reset fixtures while native integration is in flight.

~~~powershell
# waypoint-flow; demo emulator variables configured as in demo-walkthrough.md
npx tsx --test tests/mobile-service.test.ts
npx tsx --test tests/mobile-http.test.ts
# Alternative: own live API, no pre-existing port 3000 required
node scripts/run-mobile-checks.mjs
npx tsx scripts/prepare-mobile-device.ts
~~~

~~~powershell
# waypoint-mobile
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test --flavor development
flutter test integration_test/connected_journey_test.dart -d emulator-5556 --flavor development --dart-define-from-file=config/emulator.json --no-pub
flutter build apk --debug --flavor development --dart-define-from-file=config/emulator.json --no-pub
~~~

## Tested environment and artifact

- Flutter 3.41.5; Dart 3.11.3; Java 21.0.9; Android SDK 36.1.0.
- Medium_Phone, emulator-5556, Android 16/API 36 x86_64. No physical phone was connected.
- API v1; local SQLite schema 2; isolated local Firebase demo project only.
- Version 0.1.0+1; development version suffix -dev; application ID lk.waypoint.waypoint_mobile.dev.
- Stable normal-app artifact: [waypoint-0.1.0-development-20260930.apk](../build/releases/waypoint-0.1.0-development-20260930.apk).
- SHA-256: 4836263D1B4F9F93C0F17D46766BEDA1EBCD6DEB458DBF34B5A40B134BCDE0A2.
- Debug signing and emulator HTTP configuration; not a production signed artifact.
- adb install -r returned Success; launching the main activity succeeded.
- Installed-app visual smoke check: real synthetic Driver sign-in reached Today with server trip/release/cache timestamp, correct trip/handling/counts and the right-side illustration. Sign-in and Today screenshots were inspected; no clipping was observed in those states. Other connected forms and physical-device visual acceptance remain open.
- Generated build artifact is ignored by Git; rebuild from source for a different environment.

## Local tooling corrections

The test emulator initially treated Windows local time as UTC (+5.5 hours). Server correctly rejected future observedAt. Only that emulator's auto_time was disabled and cmd alarm set-time set to actual UTC. Keep accurate clock; do not bypass timestamp validation.

Clock rollback left stale Dart VM debug log entries; clearing only this emulator's logcat fixed test connection discovery. It is not a production data deletion.

Windows Gradle required a short Unix-domain socket directory and the Windows root trust store. Invocation-only JAVA_TOOL_OPTIONS pointed to workspace .jtmp and Windows-ROOT; certificate checking stayed enabled. Kotlin incremental was disabled per invocation for cross-drive SDK/pub-cache paths.

A later rebuild hit locked/duplicate generated PNG assets under build/app/intermediates/flutter. Verified only that generated subtree was removed and rebuilt with one Gradle worker/parallel disabled. Source assets, SDK settings and device database were retained. Final integration/build/install passed afterward.

The local test Next server uses .next-mobile-test, CI runner .next-mobile-ci, while production uses .next. This prevents simultaneous dev/production compilation corrupting each other's vendor output.

## Remaining acceptance

On 1 October 2026, Phase 7 was reviewed against the recorded checks, test source, Android Gradle configuration, protected signing workflow and handoff documents. The plan now links coverage to tests, uses the actual connected fixture IDs/business date, removes obsolete socket setup and approved-OpenAPI claims, and separates implemented build tooling/development metadata from production acceptance. This was a documentation review; no test suite was rerun and no additional runtime gate is certified.

[Release checklist](release-checklist.md) remains authoritative: hosted HTTPS/Firebase/private S3, approved policy defaults, physical camera/airplane/process-kill/storage/upgrade checks, full future-service-date creation-to-allocation UI rehearsal and protected production signing/AAB.

No complete release is claimed. Phases 2–6 record software implemented with verification gates pending; Phase 7 remains in progress. Original Phase 0/1 evidence is retained separately in [phase-0-1-verification.md](phase-0-1-verification.md).

## Re-run: 1 October 2026

Re-executed automated checks on 1 October 2026 at 01:42 IST (2026-09-30T20:12 UTC). No source changes were made; this confirms the recorded results remain reproducible from the existing codebase.

| Check | Result | Notes |
|---|---|---|
| `dart format --output=none --set-exit-if-changed lib test integration_test` | PASS | 45 files formatted, 0 changed |
| `flutter analyze` | PASS | No issues found (ran in 14.9 s) |
| `flutter test --flavor development` | PASS, 35 tests | All storage, sync, network, widget-shell and formatter tests pass |

No integration test, physical device, hosted API or signing run was performed in this re-run. Remaining acceptance gates from the release checklist are unchanged.
