# Phase 8 — iOS platform and compatibility

**Execution status (1 October 2026): Implemented — verification pending.** iOS native source, three shared schemes, permissions, platform-aware Firebase validation, camera recovery, Keychain/file protection, privacy declarations, branding and Mac CI are implemented. Xcode compilation and actual simulator/iPhone behavior have not been verified on this Windows host.

**Outcome:** the same Flutter Driver/Store workflows run on iOS, using the existing scoped backend and durable outbox. **Dependencies:** Phases 1–6. Track [progress](00__Work_List.md) and [executed evidence](../waypoint-mobile/docs/ios-verification.md).

## Implemented tasks

- [x] Add Flutter 3.41.5 Swift/UIScene Runner, Xcode workspace and CocoaPods integration.
- [x] Set iOS 15 minimum to match the locked Firebase Core/Auth pod specifications; leave Android API 26 unchanged.
- [x] Add shared development/staging/production schemes with Debug/Profile/Release configurations, separate display names, bundle IDs and URL schemes.
- [x] Keep local-network ATS allowance in Debug-development only; staging/production and all release configurations retain default ATS.
- [x] Add camera/photo purpose strings; no microphone/location/background-mode permission is requested.
- [x] Validate Firebase Apple app ID, bundle ID and native flavor; supply iosBundleId during SDK initialization.
- [x] Add Mac-hosted simulator demo configuration; retain the separate Android 10.0.2.2 configuration.
- [x] Normalize flavor-specific native links through existing identity/role guards; server ownership checks remain authoritative.
- [x] Use device-bound, unlocked-only Keychain items without iCloud synchronization; retain pending evidence on sign-out.
- [x] Add a native storage bridge that validates the app-owned path, excludes it from backup, applies complete file protection and fails closed on protection errors.
- [x] Avoid Android-only lost-camera APIs on iOS, preserve earlier draft/photos and expose a retry message after interrupted capture.
- [x] Render existing Waypoint SVG into opaque app icons and launch assets; include a privacy manifest.
- [x] Add portable configuration/release-validator checks and a macOS CI workflow for compilation and simulator storage persistence.

## Tricky implemented code

[Secure storage](../waypoint-mobile/lib/core/storage/platform_secure_storage.dart) deliberately binds encryption/profile keys to this device:

```dart
const deviceSecureStorage = FlutterSecureStorage(
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.unlocked_this_device,
    synchronizable: false,
  ),
);
```

[Evidence capture](../waypoint-mobile/lib/core/media/evidence_capture.dart) clears an interrupted iOS camera checkpoint while retaining the draft and existing photos. It does not call retrieveLostData outside Android. No successful capture/upload is fabricated.

[Storage startup](../waypoint-mobile/lib/core/storage/storage_runtime_native.dart) calls the [Swift bridge](../waypoint-mobile/ios/Runner/AppDelegate.swift) before opening SQLite. The native method accepts only this app's Application Support directory. Missing bridge/protection errors make durable storage unavailable, rather than opening an unprotected fallback.

Each flavor's [xcconfig](../waypoint-mobile/ios/Flutter/Release-production.xcconfig) includes the matching CocoaPods configuration and Generated.xcconfig. The optional ignored signing override is last, so protected manual signing can override automatic development signing.

## Acceptance still required

- [ ] Run [Mac CI](../.github/workflows/mobile-ios-ci.yml) and resolve any Xcode, CocoaPods, Swift, native-assets or plugin compatibility issues.
- [ ] Register the three Apple bundle IDs in the intended Firebase project(s); verify custom-token exchange and current-principal checks.
- [ ] Run connected Driver/Store workflows on an iOS simulator with actual local scoped APIs and synthetic records.
- [ ] Verify native Keychain, SQLite, backup exclusion and file protection on a passcode-protected iPhone, including locked/unlocked access and restart.
- [ ] Verify camera permission denial, camera interruption and saved-photo retention on the iPhone.
- [ ] Verify cold/warm native links, wrong-role/foreign-order rejection and sign-out/account switching.
- [ ] Check iPhone safe areas, keyboard, back gestures, Dynamic Type/VoiceOver and larger iPad layouts where supported.

**Exit gate:** iOS builds and the declared workflows operate on the selected simulator and real iPhone, with actual permission/storage/ownership evidence. Windows unit checks alone do not pass this gate.

Use the [iOS setup and release guide](../waypoint-mobile/docs/ios-setup-and-release.md), then [Phase 9](09_iOS_Testing_and_Release.md).
