# Phase 0–1 verification record

## Environment

Flutter 3.41.5 stable, Dart 3.11.3; installed Android SDK 36.1.0 and Java 21.0.9. No physical Android device was connected during initial inspection. The available Medium_Phone emulator is a software test target only.

## Implemented

- Phase 0 scope/defaults/fixture/backend owners recorded in scope-decisions.md.
- Native role shells with guarded deep links and independent tab branches.
- Shared tokens, bundled Inter/Lucide/assets, sheets and widget catalogue.
- User-scoped encrypted SQLite payloads, persistent encrypted media, atomic draft/proof/outbox helpers and owner-bound sync lease.
- Development/staging/production configuration and Android application IDs.
- CI format/analyze/test and Android build/upload jobs.

## Verified on 30 September 2026

| Check | Actual result |
|---|---|
| `dart format lib test integration_test` | Completed; 28 files formatted |
| `flutter analyze` | Passed, no issues |
| `flutter test` | Passed, 24 unit/widget tests |
| Role layouts | Driver/Store at 320, 390 and 600 logical widths with text scale 1.0/1.8; guarded navigation covered |
| Storage faults and migration | On-disk reopening, failed update preservation, proof/outbox rollback, additive v1→v2 migration, account isolation, lease ownership/expiry and lost-key protection passed |
| Native integration | `flutter test integration_test/storage_runtime_test.dart -d emulator-5556 --flavor development --dart-define-from-file=config/development.json` passed (1 test): SQLite and platform secure-storage key reopened, other user could not load draft |
| Android debug build | `flutter build apk --debug --flavor development --dart-define-from-file=config/development.json` passed; normal app rebuilt after integration test |
| Documentation | Docs-mobile relative links resolve; code fences balanced |

Emulator: Medium_Phone, Android 16 / API 36, x86_64. This is software-target evidence, not physical camera/process-kill certification. APK path: `build/app/outputs/flutter-apk/app-development-debug.apk` (debug/internal, not signed production release). The integration command builds a test-entrypoint APK; rebuild the normal app before sharing it.

Local Java build required a short existing `jdk.net.unixdomain.tmpdir` and the Windows root trust store for this machine's TLS path. These were invocation-only `JAVA_TOOL_OPTIONS`; no global JDK settings or certificate checks were disabled. See [Oracle socket directory properties](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/doc-files/net-properties.html) and [JSSE trust-store configuration](https://docs.oracle.com/en/java/javase/21/security/java-secure-socket-extension-jsse-reference-guide.html).

## Physical-device checks pending

1. Connect an Android API 26+ test phone and note model/OS.
2. Install the development APK; open Driver → Profile → Local storage lab.
3. Save a fake draft, force-stop the app, relaunch and verify the exact note.
4. Enter Store fixture; the Driver draft must not appear.
5. Camera: capture a safe test image, deny/cancel once, and check durable storage after restart.
6. Test keystore/key restore failure, low-storage recovery and backup exclusions on the target OS.

No connected authentication, POD, order submission, live upload or production release is claimed by Phase 1.
