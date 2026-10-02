# Waypoint Flow mobile

Installed Flutter companion for Driver and Store Manager, connected to the shared Next.js/Firestore backend. Dispatcher/Loader remain in waypoint-flow. Phases 2–6 software is implemented; [verification](docs/phase-2-7-verification.md) and [release checklist](docs/release-checklist.md) distinguish local results from pending production acceptance.

## Run

iOS native source/tooling is included with separate environment schemes, permissions, Apple Firebase configuration, Keychain/file protection and Mac CI. Start with [iOS setup and release](docs/ios-setup-and-release.md). [iOS verification](docs/ios-verification.md) distinguishes 40 passing shared tests from pending Xcode/simulator/iPhone acceptance; no IPA has been built on this Windows host.

Flutter 3.41.5 / Dart 3.11.3; Android API 26+; tested SDK 36.1.0 / Java 21. Dependencies are pinned in pubspec.lock. Inter, Lucide and supplied illustrations are bundled offline.

~~~powershell
flutter pub get
# UI fixture preview: explicitly no operational identity/upload
flutter run --flavor development --dart-define-from-file=config/development.json
# Chrome fixture preview with local rendering assets:
flutter run -d chrome --dart-define-from-file=config/development.json --no-web-resources-cdn
# Connected local demo, after backend/emulator setup:
flutter run -d emulator-5556 --flavor development --dart-define-from-file=config/emulator.json
~~~

[Demo setup](docs/demo-walkthrough.md) contains isolated reset/actor/entity instructions. Emulator uses 10.0.2.2 to reach host API/Auth. A physical phone needs a reachable development host/intentional adb reverse mapping or verified HTTPS environment; phone localhost is the phone.

### Why login may not appear

`config/development.json` selects `APP_MODE=fixture`: it shows the labelled design preview and sample-role buttons rather than authenticating. For local Android login, use `config/emulator.json` with the demo backend/Auth emulators running, as shown above. For your real phone, use a connected configuration for the verified reachable backend and Firebase project.

In connected mode a valid saved session opens your role's home screen automatically. Use **Profile → Sign out** to return to login; saved evidence remains on the device. Do not clear app data just to display login. An expired or rejected session returns to login. The browser HTML mockup does not control the Flutter app's authentication.

Copy staging/production example JSON into ignored config files and fill verified PUBLIC Firebase client configuration/API URLs. Never include Admin/AWS/signing secrets. Production refuses fixture/emulator/HTTP settings. Native SDK handles custom-token exchange/ID-token refresh.

## Features

Driver: assigned loading/ready/active route, approved manifest cache, parked gates/navigation, explicit delivery outcomes/evidence/drafts, breakdown/stop issues, server closeout/next-trip gates, Sync Centre and scoped updates.

Store: own catalogue/date/cut-off/units, durable reviewed orders/corrections, tracking/D3 deferral/restoration history, actual receipt/affected-line issues and confirmed digital note/scoped photos.

Shared backend enforces current account/assignment/outlet, immutable replay and finalized private evidence. Sign-out/expiry retains and locks per-user data. Foreground/resume/manual sync is guaranteed entry behavior; no background/push/continuous tracking claim.

Fixture browser preview remains available through development.json; native secure storage is unavailable in that preview and operational saves are rejected.

## Verify and build

~~~powershell
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test --flavor development
flutter test integration_test/connected_journey_test.dart -d emulator-5556 --flavor development --dart-define-from-file=config/emulator.json --no-pub
flutter build apk --debug --flavor development --dart-define-from-file=config/emulator.json
~~~

The integration test requires a released isolated fixture, real local API and Auth/Firestore emulators. It clears only its synthetic test users' local records. Never point tests/reset at operational data.

Current normal development artifact: [waypoint-0.1.0-ui-polish-20261001.apk](build/releases/waypoint-0.1.0-ui-polish-20261001.apk). It includes the review and UI fixes, builds successfully and was installed/launched with connected login rendering verified on Android emulator. Checksum, browser checks and remaining native visual acceptance are recorded in [UI verification](docs/ui-polish-verification.md). Historical journey results are recorded in [verification](docs/phase-2-7-verification.md). Debug signing and emulator HTTP configuration are not production release signing.

Application IDs: development lk.waypoint.waypoint_mobile.dev; staging lk.waypoint.waypoint_mobile.staging; production lk.waypoint.waypoint_mobile. Version 0.1.0+1.

[Protected release workflow](../.github/workflows/mobile-release.yml) builds signed APK/AAB only with the release owner's approved environment/keystore. Physical-phone/hosted private-S3 tests remain required.

## Handoff

- [API contracts and shared services](docs/api-contracts.md)
- [Offline recovery](docs/offline-recovery.md)
- [Release acceptance/signing](docs/release-checklist.md)
- [Demo walkthrough](docs/demo-walkthrough.md)
- [Privacy and retention](docs/privacy-and-retention.md)
- [Development AI disclosure](docs/ai-disclosure.md)
- [Phase tracker](../Docs-mobile/00__Work_List.md) and [tricky code recipes](../Docs-mobile/CODE_Implementation_Recipes.md)
- [Original storage/foundation evidence](docs/phase-0-1-verification.md)

[AGENTS.md](../AGENTS.md) requires progress/evidence updates after mobile changes. [agend.md](../Docs-mobile/agend.md) documents that task-driven automation; no background watcher was installed.
