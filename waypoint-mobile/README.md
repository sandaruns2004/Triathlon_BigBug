# Waypoint Flow mobile

Installed Flutter companion for Driver and Store Manager, connected to the shared Next.js/Firestore backend. Dispatcher/Loader remain in waypoint-flow. Phases 2–6 software is implemented; [verification](docs/phase-2-7-verification.md) and [release checklist](docs/release-checklist.md) distinguish local results from pending production acceptance.

## Run

### Connected Chrome build (9 October 2026)

Chrome connected support now uses encrypted browser SQLite/WASM storage. The
fixture configuration remains a sample-data preview. For the isolated local
database, start Auth/Firestore and the API as in [demo setup](docs/demo-walkthrough.md),
using `npm run dev -- --hostname 127.0.0.1 --port 3000` for Next.js (the custom
`server.js` launcher produced a redirect loop in this review).

From `waypoint-mobile`:

```powershell
flutter build web --debug --dart-define-from-file=config/chrome-emulator.json --no-web-resources-cdn --no-pub --no-wasm-dry-run
node scripts/serve-chrome.mjs
```

Open [the mobile app in Chrome](http://localhost:4183). This configuration connects
to **demo-waypoint-mobile**, not your operational database. Use the synthetic
accounts from the demo setup. Keep the browser origin/port stable to retain saved
records; clearing site data removes browser evidence. Browser keys do not provide
native Keystore/Keychain protection. Driver/Store login, route guards, session
restoration and draft reload passed in the in-app Chromium browser. Camera/quota
and external Chrome-specific acceptance remain pending; see [current evidence](docs/connection-role-verification.md).

For the actual website database, copy the Chrome JSON to an ignored local config,
remove `AUTH_EMULATOR_HOST`/`AUTH_EMULATOR_PORT`, and supply the Firebase **Web client**
app ID, API key, sender ID and project ID matching the website's server project.
Keep `API_BASE_URL=http://localhost:4183/api/mobile/v1/` for this local proxy and set
`WAYPOINT_API_ORIGIN` to the verified website origin before starting the server.
Rebuild using that file with `--debug`. Hosted deployment uses HTTPS and its own
same-origin proxy configuration. Never copy Admin/private/signing keys into JSON.
The real website URL and client settings have not yet been supplied or verified.

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

`config/development.json` selects `APP_MODE=fixture`: it shows the labelled design preview and sample-role buttons rather than authenticating. For local Android login, use `config/emulator.json` with the demo backend/Auth emulators running, as shown above. Chrome uses `config/chrome-emulator.json` and the local proxy above. For your real phone, use a connected configuration for the verified reachable backend and Firebase project.

In connected mode a valid saved session opens your role's home screen automatically. Use **Profile → Sign out** to return to login; saved evidence remains on the device. Do not clear app data just to display login. An expired or rejected session returns to login. The browser HTML mockup does not control the Flutter app's authentication.

Copy staging/production example JSON into ignored config files and fill verified PUBLIC Firebase client configuration/API URLs. Never include Admin/AWS/signing secrets. Production refuses fixture/emulator/HTTP settings. Native SDK handles custom-token exchange/ID-token refresh.

## Features

Driver: assigned loading/ready/active route, approved manifest cache, parked gates/navigation, explicit delivery outcomes/evidence/drafts, breakdown/stop issues, server closeout/next-trip gates, Sync Centre and scoped updates.

Store: own catalogue/date/cut-off/units, durable reviewed orders/corrections, tracking/D3 deferral/restoration history, actual receipt/affected-line issues and confirmed digital note/scoped photos.

Shared backend enforces current account/assignment/outlet, immutable replay and finalized private evidence. Sign-out/expiry retains and locks per-user data. Foreground/resume/manual sync is guaranteed entry behavior; no background/push/continuous tracking claim.

Fixture browser preview remains available through development.json and does not enable operational saves. Connected Chrome uses its own durable browser storage adapter; native device acceptance remains separate.

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
# Connect Chrome to the website's Firebase project

The mobile `.env` contains public Firebase Web client settings only. The website
keeps Firebase Admin, AWS, NextAuth and seed credentials in `waypoint-flow/.env`.
Flutter does not load `.env` automatically. With Node 24, generate its defines:

```powershell
cd waypoint-mobile
node scripts/configure-connected.mjs
flutter build web --debug --dart-define-from-file=config/chrome-connected.local.json --output=build/web-connected --no-web-resources-cdn --no-pub --no-wasm-dry-run
```

The generator rejects different website/mobile projects or API keys, missing
Web app IDs and unsafe endpoints. Its output excludes all server credentials and
emulator settings. Local environment files and generated configuration are ignored
by Git. Use separate registered Android/Apple app configuration for native builds.

Start the real website backend in a separate terminal, without emulator variables:

```powershell
cd waypoint-flow
$env:PORT='3001'
$env:HOSTNAME='127.0.0.1'
$env:NEXTAUTH_URL='http://127.0.0.1:3001'
node --use-system-ca server.js
```

Then serve Chrome in a third terminal:

```powershell
cd waypoint-mobile
$env:WAYPOINT_API_ORIGIN='http://127.0.0.1:3001'
$env:WAYPOINT_WEB_BUILD='web-connected'
node scripts/serve-chrome.mjs
```

Open http://localhost:4183 and use the existing website Driver or Store account.
Dispatcher and Loader continue using the website. The proxy forwards mobile API
requests to the website backend; mobile does not connect directly to Firestore.
Keep the Windows clock synchronized: a skewed clock prevents Google from accepting
server credentials. `--use-system-ca` uses the Windows certificate trust store and
keeps TLS certificate checks enabled.
