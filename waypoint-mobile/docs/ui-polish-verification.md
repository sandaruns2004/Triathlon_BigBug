# UI polish verification — 1 October 2026

Implemented the follow-up to [visual review](../../Docs-mobile/REVIEW_UI_Visual.md).

## Changes

- Store fixture Home now has sample line/package totals, a working history action and a clearly labelled sample activity timeline. The illustration is framed at a larger visible scale using Flutter clipping; original artwork is retained.
- Fixture Profile now has an avatar/account card and grouped workspace/recovery information, with development tools under their own heading. Its Sync Centre action and existing tool/sign-out actions remain functional.
- Connected Profile uses the same account-card hierarchy with actual principal data; recovery remains operations-managed.
- Native Sync Centre summarizes its actual local operation rows and saved acknowledgments. Existing per-record evidence, conflict/review and retry behavior remains in place. Counts are not fixture successes.
- Genuine connection messages containing Offline use the existing amber connection-banner style.

Sources: [preview/account card](../lib/features/foundation/foundation_pages.dart), [connected Profile](../lib/features/connected/profile_notifications.dart), [Sync Centre](../lib/features/connected/sync_pages.dart), [connection banner selection](../lib/app/role_shell.dart).

## Executed checks

- [x] `dart format lib`: formatted changed files.
- [x] `flutter analyze --no-pub`: no issues.
- [x] `flutter test --flavor development --no-pub --reporter expanded`: **50 passed**, including 320/390/600-width and 1.0/1.8-text-scale Driver/Store shell checks and fixture operational guards.
- [x] Hot-restarted Chrome preview, reloaded the inspected browser and visually checked Store Home/Profile at narrow width; larger illustration/account hierarchy visible, summary/activity present, navigation intact.
- [x] `flutter build apk --debug --flavor development --dart-define-from-file=config/emulator.json --no-pub`: succeeded. Normal application APK installed with `adb install -r` and launched; connected login rendered.
- [ ] Native Sync Centre/offline visual acceptance remains pending. The visible emulator shut down during inspection; a headless restart displayed Android's “System UI isn't responding” dialog. Dismissing it restored the app login. This is an observed emulator limitation, not a passed native workflow check.

Updated debug artifact: [waypoint-0.1.0-ui-polish-20261001.apk](../build/releases/waypoint-0.1.0-ui-polish-20261001.apk), SHA-256 `08284CA06A498C66AEA83BB061CE3C7418E29E3728CAC75F36C06DDD71AF6BAD`. Uses isolated emulator API configuration and debug signing; it is not a production release.

No physical camera/process-kill/low-storage/upgrade or hosted media tests are claimed. No macOS/Xcode/iPhone test was run. Phase 1/4 remain **Implemented — verification pending** and Phase 7 **In progress**; these visual changes do not close release gates.
