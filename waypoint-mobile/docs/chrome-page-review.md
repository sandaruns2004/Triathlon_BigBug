# Flutter browser page review — 1 October 2026

## Follow-up fixes — 1 October 2026

Implemented B01–B05 after the user requested fixes. The original observations below are retained as historical evidence.

| Finding | Resolution | Verification |
|---|---|---|
| B01 | All eight fixture-only operational routes select `NativeWorkflowPreviewPage` before creating connected widgets. Clear explanation and Back to preview replace retry/sync actions. Connected route builders remain available in connected mode. | Two new widget regressions exercise all eight paths and return navigation with operational providers configured to throw if accessed; browser Proof, Updates and Store Sync guards rechecked. |
| B02 | Visible Store navigation label shortened to Updates, single line; full Notifications label retained for screen readers. | Existing 320/390/600-width and 1.0/1.8-text-scale tests pass; browser screenshot at measured 436 CSS pixels shows Updates on one line. |
| B03 | Replaced future-phase text with current fixture/native explanations. | Source scan and browser onboarding, Driver Today and Store Home/Orders inspection. |
| B04 | CTA renamed View sample orders, matching its list destination. | Click in running browser reaches Orders. |
| B05 | Waypoint title, app names, description and green theme replace template metadata. | Corrected preview tab title is Waypoint Flow; updated manifest inspected. |

The fresh Chrome launch additionally reproduced a blocked Google CDN download for CanvasKit/Roboto. Added local renderer configuration in [flutter_bootstrap.js](../web/flutter_bootstrap.js), documented `--no-web-resources-cdn`, and bundled Flutter SDK's Roboto fallback font with its license. Inter remains the UI font. Local bootstrap/renderer endpoints returned HTTP 200, Chrome reported application startup, and the corrected browser preview rendered without captured warning/error entries. This avoids those startup downloads; no claim is made that every possible language fallback or operational API works offline in a browser.

Corrected preview is running at **http://127.0.0.1:4182/**:

```powershell
flutter run -d chrome --dart-define-from-file=config/development.json --web-hostname=127.0.0.1 --web-port=4182 --no-web-resources-cdn --no-pub
```

Checks: `flutter analyze --no-pub` passed; `flutter test --flavor development --no-pub --reporter expanded` passed **50 tests**, including the two new route regressions; formatting passed. Browser interactions used the available in-app Chromium connection against this running build; external Chrome startup was checked through Flutter output. New Android APK/iOS compilation, native physical-device checks and hosted acceptance were not run for these browser fixes. The existing APK predates this follow-up.

Implemented source: [routing](../lib/app/router.dart), [preview pages/copy](../lib/features/foundation/foundation_pages.dart), [navigation](../lib/app/role_shell.dart), [route tests](../test/widgets/fixture_route_guard_test.dart), [web metadata](../web/index.html), [manifest](../web/manifest.json), [font declaration](../pubspec.yaml).

The post-asset test repeat initially failed before executing tests because Windows denied deletion of generated `build/unit_test_assets` and then `build/test_cache/flavor.txt`. Both generated directories were preserved under unique ignored `build/` backup names after verifying workspace containment; source, user evidence and existing APKs were retained. Tests were rerun with fresh caches.

## Execution and scope

Launched the actual Flutter source in Google Chrome, rather than the HTML mockup:

```powershell
flutter run -d chrome --dart-define-from-file=config/development.json --web-hostname=127.0.0.1 --web-port=4180 --no-pub
```

Compilation and Chrome debug-service startup succeeded. Preview URL: http://127.0.0.1:4180/. Chrome is not connected to the available browser inspection interface; page interactions, screenshots and console checks below were performed in the Codex in-app Chromium browser against that same running build. They are not a claim of automated interaction with the external Chrome window.

Reviewed fixture Driver/Store roles using actual controls, then directly opened the remaining routes declared in `lib/app/router.dart`, retaining the fixture session through hash navigation. Stop/order IDs came from the bundled fixture and visible sample order, not operational records. Measured CSS widths included 722 and 436 pixels. Browser zoom affected viewport overrides; a precise 390-pixel test is not claimed. Narrow Store navigation was visually inspected.

Also started a connected diagnostic preview on port 4181 with `flutter run -d web-server`, using an ignored `build/browser-review-config.json` copied from the demo emulator configuration with loopback host addresses. It contains synthetic public Firebase configuration only. Connected login rendered its storage warning and disabled Sign in as designed. No credential submission or operational mutation was performed in the browser.

## Page-by-page results

“Renders” means preview rendering/navigation checked, not connected API or device acceptance. “Error” means the route was opened and its error UI observed; its underlying workflow could not be exercised.

| Route | Observed result | Notes |
|---|---|---|
| `/welcome` | Renders | Both role buttons work; fixture label present. Connected variant on 4181 renders Email/Password and disabled Sign in with storage explanation. |
| `/driver/today` | Renders | Trip card/illustration and navigation render; View manifest opens Route. Old implementation-phase copy present. |
| `/driver/route` | Renders | Three stops visible; opened each manifest sheet, inspected lines and dismissed successfully. |
| `/driver/route/stop/FIXTURE-STOP-01` | Error | Generic “Could not complete this action. Saved work is retained.” with Try again; no POD form. |
| `/driver/activity` | Renders | Empty preview and Open Sync Centre work. |
| `/driver/activity/sync` | Renders | Disabled sync action and browser-storage message; stale Phase 1/4 wording. Back to Activity works. |
| `/driver/profile` | Renders | Driver identity, draft lab, catalogue and confirmed leave-account flow work. |
| `/driver/profile/updates` | Error | Generic retry error; Refresh updates leaves the error state. |
| `/store/home` | Renders | Sample card renders; View sample order navigates to Orders list, not a detail page. |
| `/store/orders` | Renders | Sample order summary visible; ordering disabled with old Phase 5 label. |
| `/store/orders/new` | Error | Generic retry error; composer not available. |
| `/store/orders/FIXTURE-ORDER-01` | Error | Generic retry error; detail/tracking not available. |
| `/store/orders/FIXTURE-ORDER-01/receipt` | Error | Generic retry error; receipt form not available. |
| `/store/orders/FIXTURE-ORDER-01/issue` | Error | Generic retry error; issue form not available. |
| `/store/orders/FIXTURE-ORDER-01/note` | Error | Generic retry error; delivery note not available. |
| `/store/notifications` | Renders | Explicit empty connected-updates preview. Narrow bottom label splits awkwardly. |
| `/store/profile` | Renders | Store identity, draft lab and confirmed leave-account flow checked. |
| `/store/profile/sync` | Error | Connected Sync Centre shell renders but list fails; Sync now produces the same generic error notice. |
| `/catalogue` | Renders | Quantity increase/decrease, confirmation/report sheets and close controls work. Try again is an intentional no-op in the labelled error example. |

**Coverage: all 19 route patterns opened; 11 preview routes render, 8 operational routes show error states in fixture mode.** Shared draft-lab dialogs were checked under both identities using fake notes; save reports unavailable browser durability, without claiming success. Manifest, confirmation, report and leave-account dialogs were checked. No browser console warning/error entries were captured during the inspected page interactions. The separate Chrome Flutter log emitted startup `flutter/lifecycle` ChannelBuffers warnings; no associated page failure was established.

## Errors and UI issues to fix

### B01 — P2: Unsupported operational routes look like recoverable failures

Reproduce: enter the Driver fixture, navigate to `#/driver/route/stop/FIXTURE-STOP-01` or `#/driver/profile/updates`. For Store, open new/detail/receipt/issue/note or profile/sync paths above. They enter connected widgets and display generic retry errors. Store Sync now remains enabled and repeats the error. These routes are not linked from the normal fixture pages, but can be opened by their defined addresses.

Source: [router](../lib/app/router.dart), [providers](../lib/app/providers.dart), [preview storage](../lib/core/storage/storage_runtime_preview.dart). Connected providers require native storage and an authentication repository; fixture startup deliberately supplies neither. This is a preview guarding/message issue, not evidence that the corresponding native workflow is broken.

Recommended change: route fixture users to a labelled native-only explanation or supported fixture screen, disable unsupported actions and provide a clear return link. Do not bypass authentication or add insecure proof storage just to make the preview interactive.

### B02 — P2: Store navigation breaks “Notifications” inside the word

Reproduce: open Store Home at the measured narrow 436-pixel CSS viewport. The bottom label breaks into “Notification” and a separate “s”. Controls remain clickable but the presentation is visibly poor.

Source: [role shell](../lib/app/role_shell.dart), equal-width navigation labels. Check shorter labels or a responsive layout that avoids splitting words. Recheck native phones and large text before claiming this is fixed across platforms.

### B03 — P3: Fixture text understates implemented native features

Driver Today says release/start checks arrive in Phase 3; manifest says POD/parked confirmation will be added later; Activity/Sync refer to Phase 1 and future Phase 4. Store ordering says “Ordering available in Phase 5.” These describe an old foundation milestone instead of explaining that current native features are intentionally unavailable in this browser preview.

Source: [foundation pages](../lib/features/foundation/foundation_pages.dart). Replace future-phase language with current preview/native distinctions; preserve the explicit fixture label and fixed fixture date.

### B04 — P3: “View sample order” does not open order details

Reproduce: Store Home → View sample order. It opens the Orders list, which contains a non-interactive summary. The detailed order/tracking/receipt/note journey cannot be explored from this CTA.

Source: [foundation pages](../lib/features/foundation/foundation_pages.dart). Rename it to match the list destination or provide a supported fixture detail view. The real connected detail page remains a native check.

### B05 — P3: Browser branding is still the Flutter template

Observed tab title: `waypoint_mobile`. Source [index](../web/index.html) and [manifest](../web/manifest.json) retain “A new Flutter project.”, template app names and blue theme colors. Use Waypoint names/description/theme if the preview is to be shared.

## Expected limitations, not defects

- Browser encrypted operational storage is deliberately unavailable; connected Sign in is disabled with a visible explanation. Do not treat this as a successful connected browser login.
- Fake draft save correctly returns the explicit native-storage warning. No proof is silently marked saved/uploaded.
- Fixture order/sync buttons are intentionally disabled, independent of misleading old copy.
- Static fixture date, sample identities, identical sample manifest lines and empty updates are labelled examples.
- Catalogue Try again is an explicitly labelled component example, not a failed API retry.

## Outstanding acceptance

The initial review recorded errors without changing app source or running new tests; the follow-up fixes and new checks are documented above. Prior 48 Flutter tests and Android native smoke results are in [review evidence](mobile-review-and-fixes.md). All native operational pages, including every POD stage and Store submission/receipt flow, still require their own connected device walkthrough. Phase 7 remains **In progress**; no native release gate is closed by this browser work.
