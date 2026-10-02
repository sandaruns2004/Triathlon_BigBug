# iOS setup, connected demo and release

Updated 1 October 2026. iOS source/tooling is implemented; Xcode compilation, simulator execution and physical iPhone release acceptance remain unverified. Android and iOS share lib/, backend contracts and the immutable offline queue.

## Mac prerequisites

Install Flutter 3.41.5 / Dart 3.11.3, a compatible Xcode with iOS SDK/simulator and CocoaPods. Run flutter doctor -v and resolve iOS toolchain issues. Minimum deployment target is iOS 15.0, matching the locked Firebase Core/Auth podspecs. Windows cannot perform Xcode compilation/signing.

CI uses CocoaPods with Swift Package Manager disabled on its ephemeral runner. If your Mac has Flutter Swift Package Manager enabled, select the same CocoaPods mode for this project before building; note that flutter config changes the local Flutter preference. Existing app source does not require regeneration.

```bash
cd waypoint-mobile
flutter pub get
python3 scripts/check_ios_configuration.py
python3 -m unittest discover -s scripts/tests -p 'test_*.py'
flutter analyze
flutter test --flavor development
flutter build ios --simulator --debug --flavor development \
  --dart-define-from-file=config/ios-fixture.json
flutter devices
flutter run -d <IOS_SIMULATOR_ID> --flavor development \
  --dart-define-from-file=config/ios-fixture.json
```

The fixture is visibly labelled and cannot perform operational mutations. The [Mac CI workflow](../../.github/workflows/mobile-ios-ci.yml) compiles all three schemes and runs the native storage integration test. Its unsigned production/staging compilation uses example client configuration and does not authenticate to a hosted service. The uploaded simulator app is rebuilt with the normal main.dart entry point after integration tests.

## Schemes, bundle IDs and native links

| Scheme | Bundle ID | Native URL scheme |
|---|---|---|
| development | lk.waypoint.waypointMobile.dev | waypoint-dev |
| staging | lk.waypoint.waypointMobile.staging | waypoint-staging |
| production | lk.waypoint.waypointMobile | waypoint |

Every scheme maps Debug/Profile/Release to the matching flavor configuration. Only Debug-development selects Info-Development.plist with local-network ATS allowance. Other configurations use Info.plist and default secure ATS. Signing.local.xcconfig is ignored and included last.

Native examples: waypoint-dev:///driver/activity/sync and waypoint://store/orders/ORDER-ID/note. The router normalizes only known Driver/Store paths, retains identity/role guards and rejects the wrong environment's scheme. Custom schemes do not prove server ownership; entity APIs still verify scope. HTTPS Universal Links require a real owned domain/AASA/associated-domain entitlement and are not configured here.

## Connected local simulator demo

Run the isolated backend/Auth/Firestore emulators on the same Mac following [demo setup](demo-walkthrough.md). The iOS simulator uses localhost to reach that Mac; Android's 10.0.2.2 is inappropriate for iOS. The synthetic ios-emulator.json Apple app ID is only for this demo emulator project.

```bash
flutter run -d <IOS_SIMULATOR_ID> --flavor development \
  --dart-define-from-file=config/ios-emulator.json
flutter test integration_test/connected_journey_test.dart \
  -d <IOS_SIMULATOR_ID> --flavor development \
  --dart-define-from-file=config/ios-emulator.json
```

Prepare the synthetic route through the existing prepare-mobile-device script before the connected test; do not reset fixtures during a journey. Connected integration uses a synthetic image/database reopen, not actual camera capture or process termination. Simulator camera availability differs from a real iPhone.

If the backend remains on Windows or another host, localhost on the Mac/phone cannot reach it. Prefer verified HTTPS. For a LAN development setup, copy to ignored config/ios-development.local.json, use the actual reachable host for API/Auth, bind the emulator/server intentionally and verify routing/firewall/local-network permission. Local-network ATS is scoped to debug development; do not weaken production transport settings.

## Firebase and actual iPhone

Register each Apple bundle ID in its intended Firebase project. Copy ios-staging.example.json or ios-production.example.json to the matching ignored config file and use the actual Apple API key/app ID/sender/project/bundle values. Do not reuse an Android app ID. Firebase is initialized programmatically with FirebaseOptions including iosBundleId; no generated GoogleService-Info.plist is required for the current custom-token Auth path. Adding other Firebase services later requires their own setup review.

For a connected development iPhone build, use the development bundle ID and Apple client configuration in ignored ios-development.local.json. The emulator configuration is unsuitable for a physical phone unless its endpoints are explicitly replaced by a reachable test host.

Open ios/Runner.xcworkspace on the Mac. Select your authorized Apple team for device signing, or copy Flutter/Signing.example.xcconfig to ignored Flutter/Signing.local.xcconfig and set DEVELOPMENT_TEAM. Do not replace final bundle IDs without updating all scheme/Firebase/signing checks together.

```bash
flutter run -d <IPHONE_DEVICE_ID> --flavor development \
  --dart-define-from-file=config/ios-development.local.json
```

Camera and optional photo-library purpose strings are present; microphone/location/background permissions are absent. Navigation uses an external HTTPS Maps handoff. No push/continuous GPS/background transfer was added.

## Storage and recovery

Keychain encryption/profile items are unlocked-only, device-bound and not iCloud synchronized. The native bridge runs before SQLite opening, validates the app-owned Application Support root, excludes it from backup and sets complete protection on existing files/directories. Future file-protection inheritance and backup behavior require verification on the target iPhone. Protection failure prevents durable storage from opening.

Payload/photos remain AES-GCM encrypted; SQLite metadata is not whole-database encrypted. Sign-out retains per-user keys/proof. iOS Keychain items may survive reinstall, while app files do not; do not treat reinstall as recovery or as a guaranteed credential wipe. Never uninstall an operational app with unsynced evidence.

Android-only retrieveLostData is never called on iOS. An interrupted iOS capture retains the saved form/earlier photos, clears the pending camera marker and shows a request to take the missing photo again. A capture not yet copied into app storage is not guaranteed recoverable. Camera denial preserves the form and provides Settings/retry guidance.

## Protected signed IPA export

The [manual workflow](../../.github/workflows/mobile-ios-release.yml) uses protected environment mobile-ios-production. Configure environment access/review rules and these owner-supplied secrets in GitHub; no keys were generated here:

| Secret | Purpose |
|---|---|
| IOS_DISTRIBUTION_P12 | Base64 Apple distribution certificate/private-key export |
| IOS_DISTRIBUTION_P12_PASSWORD | P12 password |
| IOS_TEMP_KEYCHAIN_PASSWORD | Nonempty password for temporary runner keychain |
| IOS_PROVISIONING_PROFILE | Base64 explicit App Store production mobileprovision |
| IOS_TEAM_ID | Authorized Apple team ID |
| IOS_SIGNING_CERTIFICATE_SHA1 | SHA-1 identity fingerprint matching the profile and imported certificate |
| IOS_PRODUCTION_CONFIG | Production Apple public-client JSON; no server credentials |

The [preparation script](../scripts/prepare_ios_release.py) checks bundle/team/expiry/distribution certificate, rejects wildcard/development/ad-hoc profiles and confirms a valid imported identity. It creates ignored signing/config/export files. The job exports IPA/dSYMs/SHA-256 and removes temporary signing files/keychain/profile copies even after failure. Provisioning profiles include only the owner's intended entitlements; confirm Keychain capability on the real profile.

For local signed export, configure the authorized team/certificate/profile in Xcode or ignored Signing.local.xcconfig, provide actual ios-production.json and an export-options plist suitable for your distribution method:

```bash
flutter build ipa --release --flavor production \
  --dart-define-from-file=config/ios-production.json \
  --export-options-plist=ios/ExportOptions.local.plist
shasum -a 256 build/ios/ipa/*.ipa
```

This workflow exports an App Store IPA; it does not upload, publish or install it. Use authorized App Store Connect/TestFlight distribution when requested. Increment pubspec version/build before subsequent uploads. Direct registered-device distribution uses a different provisioning/export method and is not certified by this App Store workflow.

Review the merged SDK privacy report, App Store privacy answers/policy URL and export-compliance status before submission. The app manifest records no tracking, account identity, photos and other user content; file metadata accesses inside the app container use reason C617.1. It does not substitute for release-owner approval or an actual Xcode privacy report.

## Required acceptance

Complete [Phase 8](../../Docs-mobile/08_iOS_Platform_and_Compatibility.md) and [Phase 9](../../Docs-mobile/09_iOS_Testing_and_Release.md). Record simulator/phone model, OS/Xcode, commit/build, hosted backend/API, certificate, checksum and sanitized operation IDs. Include camera denial/interruption, airplane-mode cold start, force-stop/reconnect, locked/unlocked storage, upgrade with pending work, account isolation and the full cross-role order/receipt journey.

Current results: [iOS verification](ios-verification.md). Official references: [Flutter iOS setup](https://docs.flutter.dev/platform-integration/ios/setup), [flavor schemes](https://docs.flutter.dev/deployment/flavors-ios), [iOS release](https://docs.flutter.dev/deployment/ios), [Firebase Flutter setup](https://firebase.google.com/docs/flutter/setup), [Apple required-reason APIs](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype) and [GitHub signing setup](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications).
