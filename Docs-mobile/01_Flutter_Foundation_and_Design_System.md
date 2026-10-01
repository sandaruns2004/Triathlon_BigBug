# Phase 1 — Flutter foundation and design system

## Browser review — 1 October 2026

- [x] Compare the current preview with both HTML mobile references; [visual review](REVIEW_UI_Visual.md) records usable basics and remaining illustration/Profile/Home polish gaps.
- [x] Improve Store illustration framing/Home summary/activity and fixture/connected Profile hierarchy; 50 tests/clean analysis and browser visual recheck recorded in [UI evidence](../waypoint-mobile/docs/ui-polish-verification.md).
- [ ] Complete native degradation-screen visual acceptance; progress recorded separately in the UI evidence.

- [x] Inspect shared fixture navigation, manifest/dialogs, draft warning and design catalogue in the running Flutter browser preview; [page-by-page evidence](../waypoint-mobile/docs/chrome-page-review.md).
- [x] Fix preview findings B01–B05: fixture workflow guards, single-line Updates navigation, current copy, correctly named list CTA and Waypoint metadata; verify with 50 tests/clean analysis and browser recheck.
- [x] Bundle local web renderer configuration and licensed fallback font after reproducing blocked CDN startup; corrected preview renders without captured console errors.

Status remains **Implemented — verification pending**. The browser review does not certify native operational storage or phone acceptance.

**Execution status (30 September 2026): Implemented — verification pending.** Flutter shell, repositories, encrypted payload/media storage, migrations, sync lease and CI added. Native/device acceptance evidence is tracked separately.
Progress is maintained in [00__Work_List.md](00__Work_List.md) under [the repository rule](../AGENTS.md).

## Tricky code starting point

### Review update — 1 October 2026

Status remains **Implemented — verification pending**. [Executed review evidence](../waypoint-mobile/docs/mobile-review-and-fixes.md).

- [x] Block new/restored connected sessions when durable storage cannot open, with an explicit sign-in error.
- [x] Capture form repositories before disposal, retaining draft saves without reading a disposed provider reference.
- [x] Verify storage-unavailable sign-in and draft/navigation teardown through regression tests.
- [ ] Complete the existing physical-device storage/upgrade acceptance gate.

Implemented repository contract in [local_store.dart](../waypoint-mobile/lib/core/storage/local_store.dart):
```dart
abstract interface class DraftRepository {
  Future<LocalDraft?> loadDraft(String userId, String id);
  Future<void> saveDraft(String userId, LocalDraft draft);
}
```
Every read/write needs the stable current user. Success follows durable transaction/file completion. See the [storage tests](../waypoint-mobile/test/storage/local_store_test.dart) and [verification record](../waypoint-mobile/docs/phase-0-1-verification.md).

More implementation details and failure cases: [code recipes](CODE_Implementation_Recipes.md).


**Outcome:** an installed Flutter shell with reusable UI, repositories and durable local storage primitives.  
**Dependencies:** Phase 0. **Estimate:** 1–2 working days. **Owner:** Flutter developer.

## Project setup

iOS source/environment schemes, camera/Keychain/file protection and Mac CI were added on 1 October in [Phase 8](08_iOS_Platform_and_Compatibility.md). [iOS evidence](../waypoint-mobile/docs/ios-verification.md) records shared tests; physical/Apple native acceptance remains pending.

- [x] Create `waypoint-mobile/` beside `waypoint-flow/`; use Dart null safety, analysis rules and a committed dependency lockfile.
- [x] Set development/staging/production environments and separate API base URLs, Firebase projects and app identifiers.
- [x] Record separate HTTP/socket endpoints and paths. A phone's `localhost` points to the phone; document the reachable emulator/device development address, server bind/firewall setup and release HTTPS endpoint. Permit development HTTP only in a debug-specific configuration where needed.
- [x] Record the tested Flutter/Dart versions in the future app README. Add dependencies only after checking SDK/platform compatibility.
- [ ] Build and install an Android development build on a physical device immediately. Confirm camera and persistent storage support before writing the full feature set.
- [x] Use the feature folders and repository boundaries in [the reference](REFERENCE_Architecture_and_API.md). Keep HTTP, DB and platform calls out of widgets.
- [x] Create typed fixtures and a mock repository for UI development. Connected builds use API repositories; a visible demo label identifies fixture builds.
- [x] Add Flutter CI for format verification, analysis and meaningful unit/widget tests. Keep the website's existing CI checks alongside it; build an Android artifact in the release workflow.

Proposed choices: Riverpod for state/dependency composition, go_router for guarded navigation, Dio for HTTP, Drift/SQLite for local data, app-owned files for media and secure storage for small secrets. These are project choices, not mandatory Flutter architecture requirements. Flutter’s guidance separates views/state from repositories/services; use that separation for testable Waypoint features. See [Flutter architecture](https://docs.flutter.dev/app-architecture/guide).

## Design system and native layout

| Token | Value / rule |
|---|---|
| Deep/action green | `#146B45` / `#1F8A5B` |
| Pale green | `#EAF6EF` |
| Ink / muted | `#17221D` / `#63716A` |
| Border / canvas | `#DCE5DF` / `#F6F8F7` |
| Attention / blocked | Amber with text/icon; red for blocked/failed work |
| Body / controls | 16 logical px minimum body; 48 logical px minimum touch targets |
| Cards | 10–14 logical px radii; restrained borders and shadows |

- [x] Add theme extensions for tokens, spacing, typography, semantic statuses and consistent quantity/time formatting.
- [x] Bundle Inter font assets and one Lucide-compatible outline icon set for offline rendering. Map the report's React-only icon/camera/signature libraries to native widgets/adapters and document these departures; avoid mixing unrelated icon styles.
- [x] Build `StatusChip`, `ConnectionBanner`, `TripCard`, `StopCard`, `QuantityStepper`, `PrimaryButton`, `EvidenceThumbnail`, `EmptyState`, `ErrorState` and confirm/report sheets.
- [x] Copy only needed assets from `Docs-ui/items/generated-assets/brand` and `/mobile` into the Flutter asset directory, preserving source attribution. Bundle them for offline use.
- [x] Preserve the medium illustration on the right side of the green trip card, slightly below center, as requested in the existing prototype. Test wrapped titles and text scaling.
- [x] Build Driver tabs: Today, Route, Activity, Profile. Sync Centre is reachable from the connection banner and Activity; retain four primary tabs from the main UI spec.
- [x] Build Store tabs: Home, Orders, Notifications, Profile. Maintain independent navigation state and role guards.
- [x] Handle safe areas, keyboard insets, Android Back, modal focus, screen readers and non-colour status cues. The desktop introduction/phone frame is preview presentation, not a native app screen.

## Local foundations before feature implementation

- [x] Add schema-versioned tables for cached routes, manifests, drafts, evidence metadata, outbox, activity and sync checkpoints.
- [x] Scope every record by stable authenticated user ID. Drafts also include trip/stop or outlet/order identifiers.
- [x] Implement app-owned persistent media paths; never rely on a camera temporary path surviving process termination.
- [x] Define transaction helpers for draft save and local completion/outbox creation. Add a single-worker sync lock interface now, even before networking is connected.
- [x] Create storage failure results that the UI can display; do not show a successful save after disk/database failure.
- [ ] Validate a local data protection approach on target devices. Secure storage alone does not encrypt SQLite or photos. Decide DB/file encryption and backup exclusions before using real proof or personal information.
- [x] Add migration/recovery tests so an app upgrade retains unsynced records. Do not use destructive database recreation as a migration strategy.

## Validation and deliverables

Deliver the runnable shell, theme/widget catalogue, repository interfaces, fixture data, local schema v1 and environment template.

Acceptance checks:

1. Role shells render at 320, 390 and wider logical widths without horizontal clipping; large text does not hide the primary action.
2. A fake draft saved through the repository survives process kill/relaunch.
3. A forced database/file failure produces a recoverable message and retains the previous draft.
4. Switching test identities never exposes another identity’s cached data.
5. `dart format`, `flutter analyze` and relevant unit/widget tests pass.

**Exit gate:** developers can implement screens against repositories, and durable local data handling works independently of server availability.
