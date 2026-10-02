# iOS implementation and verification

Recorded 1 October 2026, Windows workspace. Native iOS source and release tooling are implemented; no signed IPA or Apple runtime acceptance is claimed.

## Implemented changes

- Flutter 3.41.5-generated Swift/UIScene Runner and Xcode workspace; CocoaPods project map and iOS 15 minimum based on locked Firebase Core/Auth podspecs.
- Three shared schemes and nine native configurations, distinct bundle IDs/display names/URL schemes, debug-development-only local ATS and camera/photo purpose strings.
- Platform/flavor-aware Firebase validation and iosBundleId; separate simulator/demo/staging/production client examples.
- Shared identity/role guarded native links; device-bound unlocked-only Keychain settings.
- Swift app-owned directory validation, backup exclusion and complete file protection before SQLite opens; fail-closed startup.
- iOS-safe interrupted camera handling, denied-camera form retention and visible recovery message.
- Existing brand SVG rendered into opaque AppIcon sizes and launch images; app privacy manifest with app-container file-metadata reason.
- Portable project/signing-validator checks, macOS simulator/build CI and protected owner-supplied IPA export workflow.
- Phases 8/9, setup/release guide, code recipes and tracker updates.

## Executed local checks

| Check | Result | Limit |
|---|---|---|
| Flutter regression suite | PASS, 40 tests | Prior 35 plus five iOS compatibility cases; Windows tests, not Apple runtime |
| flutter analyze in waypoint-mobile | PASS | Shared Dart code only; does not compile Swift |
| Dart formatting | PASS, 47 files | Final verification records any later formatting below |
| Python iOS project configuration check | PASS | Parses Xcode project/plists/schemes; checks ATS isolation, permissions, IDs, Keychain, privacy resource and opaque PNG dimensions |
| Python signing validators | PASS, 5 tests | Synthetic profile/client data; no real certificate or signed build |
| iOS workflow YAML and embedded Python | PASS | Parsed both workflow structures and Python syntax; no Mac jobs were run |
| Documentation/ignore rules | PASS | Local Markdown links/fences resolve; private config/signing paths are ignored; no private signing files were created |
| Xcode/CocoaPods/native iOS compilation | NOT RUN | This host is Windows; macOS/Xcode unavailable |
| Mac GitHub workflows/simulator integration | NOT RUN | Workflow code exists; no remote run was dispatched |
| Actual Firebase Apple project/iPhone/private S3 | NOT VERIFIED | Intended client configuration and phone not supplied |
| Signed IPA/TestFlight/physical failure matrix | NOT RUN | Authorized signing material, Apple account and Mac/phone required |

The five Dart cases verify rejection of Android/wrong-bundle/wrong-flavor configuration, native-link normalization, device-bound Keychain options, camera-denied form retention and interrupted iOS capture without Android recovery. The existing widget route test now exercises the development native URL through sign-in/role guards. These are behavioral checks of shared code, not camera/Keychain hardware certification.

The portable checker resolves actual project configuration references and checks all nine scheme/config/Podfile mappings, selected Info.plist transport policy, privacy resource membership, entitlement bundle scope and app icon dimensions/opacity. It is not an Xcode compiler. Validator tests exercise unsafe configuration, wildcard/non-App-Store/expired/mismatched profile and wrong Keychain group rejection with synthetic bytes. Final shared regression after the recovery-message change passed all 40 tests; final formatting had zero changes and scoped analysis reported no issues.

## Local tooling notes

A temporary Flutter template was generated under build/ios-bootstrap and only its ios/ platform files copied into the real app. Its example widget test initially interfered with analysis under the real package name. Only that verified generated build subtree was removed; app source and operational device data were retained. A separate root-level analysis invocation also picked up unrelated Firebase CLI dependency templates. Final analysis is correctly scoped to waypoint-mobile.

The old 30 September Android APK remains the artifact of that earlier commit state; this task does not claim it contains the new iOS/shared changes. Backend domain/HTTP results from that date remain historical and were not rerun because no backend code was changed.

## Reproduce

From waypoint-mobile:

```bash
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test --flavor development
python3 scripts/check_ios_configuration.py
python3 -m unittest discover -s scripts/tests -p 'test_*.py'
```

On an authorized Mac, follow [iOS setup](ios-setup-and-release.md) and execute both unsigned compilation/simulator checks and the appropriate signed release/physical-device matrix. Phases 8 and 9 remain open until those gates actually pass; [Phase 7](../../Docs-mobile/07_Testing_Release_and_Handoff.md) retains its existing Android/shared requirements.
