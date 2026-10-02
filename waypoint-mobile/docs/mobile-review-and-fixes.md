# Mobile review and fixes — 1 October 2026

Reviewed the Flutter app, Android/iOS configuration, authentication, storage,
sync, Driver/Store workflows, tests and release tooling. Website source was not changed.

## Issues fixed

| Issue | Change | Evidence |
|---|---|---|
| Local receipt write failure permanently rejected server-accepted work | Retry storage failures with the original UUID | Fault-injection test |
| Revised manifest discarded original delivered lines/units | Persist/edit/validate the draft's original approved-line snapshot; corrections use a new current snapshot | POD restoration widget test |
| Premature closeout became an unrecoverable conflict | Retry readiness holds, including recognizable older saved conflicts | Worker regression test |
| Depot changes rewrote synced records as authentication failures | Preserve terminal states before checking scope | Scope/receipt regression test |
| Restored cart quantities silently changed unit meaning | Save unit snapshots, retain change notices, require review/re-entry for changed or legacy units | Three cart widget tests |
| Form navigation crashed on a disposed Riverpod reference | Capture owner/repository while loading; save only initialized forms and handle autosave errors | Reproduced exception and POD/cart teardown tests |
| Unavailable storage allowed unusable sessions and prevented sign-out | Explain/block unavailable storage at sign-in/restoration; sign-out survives a failed queue count | Storage sign-in widget test and sign-out source review |

Sources: [sync](../lib/core/sync/sync_worker.dart), [POD](../lib/features/connected/proof_page.dart),
[Store](../lib/features/connected/store_pages.dart), [regressions](../test/recovery_regression_test.dart).

## Executed checks

- [x] Format changed Flutter source/tests.
- [x] `flutter analyze --no-pub`: no issues.
- [x] `flutter test --flavor development --no-pub --reporter expanded`: **48 passed**, including eight new regression tests.
- [x] `python scripts/check_ios_configuration.py`: portable iOS checks passed during review.
- [x] `python -m unittest discover -s scripts/tests -p 'test_*.py'`: **5 passed** during review.
- [x] Isolated demo Auth/Firestore and API started; synthetic released route prepared.
- [x] `flutter build apk --debug --flavor development --dart-define-from-file=config/emulator.json --no-pub`: passed. Normal `lib/main.dart` entry point, not the integration runner.
- [x] `adb install -r` and `am start`: succeeded. Native UI hierarchy and screenshot show the connected Welcome, Email, Password and enabled Sign in controls.
- [x] `flutter test integration_test/app_smoke_test.dart -d emulator-5556 --flavor development --dart-define-from-file=config/emulator.json --no-pub`: **1 passed**. Native app startup, actual login, released Driver home and Route navigation passed; no widget exception.

The first native smoke attempt did not find `Start route`. With the local login service checked and a longer bounded wait, the repeat passed in 13 seconds. No product authentication bypass was added. The normal APK was reinstalled/launched after the integration runner finished; the preserved artifact contains `lib/main.dart`.

## Login behavior and current artifact

On the subsequent run request (1 October), restarted Medium_Phone in visible-window mode, retained installed data, confirmed local API/Auth/Firestore listeners on 3000/9099/8085, and launched the normal app with `adb shell am start`. Native UI hierarchy confirmed Welcome and Sign in; Windows reported the `Android Emulator - Medium_Phone:5556` window. No rebuild or additional test run was necessary.

Fixture configuration intentionally selects the labelled preview, without real login. Connected configuration shows login with no session; a valid restored session redirects to the role home. Profile sign-out returns to login without deleting proof. See [run instructions](../README.md#why-login-may-not-appear).

Updated normal debug APK: [waypoint-0.1.0-development-20261001.apk](../build/releases/waypoint-0.1.0-development-20261001.apk).
SHA256: `6E3263DBBCB462B547DBB03EA93EDFDE6302395FC862F72C4E54914DC613DB5B`.
Configuration is connected to isolated local demo emulators over HTTP; it is not a hosted production build. The virtual device displayed an Android System UI ANR during the review; subsequent app login rendering was verified separately. No physical-device or Apple execution is claimed.

Flutter 3.41.5/Dart 3.11.3 tools were invoked through their installed snapshot
when the batch wrapper stalled. The first full run reproduced the disposal crash;
the final 48-test run passed after its fix. Generated hook cache was preserved
in an ignored build backup to resolve a cache file-access error.

## Limits

No Xcode/iPhone, physical camera/process-kill/low-storage/upgrade, hosted S3,
production signing or release acceptance is claimed. Phase gates remain open.
Retries currently use bounded exponential backoff; randomized jitter is still
an unchecked plan item.
