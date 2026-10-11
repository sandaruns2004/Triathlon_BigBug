# Connected login, role and UI verification — 9 October 2026

Status: **Implemented — verification pending** for Phases 1–6; Phase 7 remains **In progress**. This records actual connected browser checks, not physical-device or release certification.

## Connected browser results

The PC app ran at `http://127.0.0.1:3001` with its real configured Firebase database. Mobile ran at `http://localhost:4183` using the registered real Firebase Web client and a local API proxy to that PC server. Client settings contain public Firebase configuration only. Existing documented account credentials were checked against the configured profiles and used for login; no password reset or credential is included here.

| App / role | Actual checks and result |
|---|---|
| PC Dispatcher | Login, Operations and Planning views, wrong-role Store redirect and sign-out passed. No routes/orders were assigned or published. |
| PC Loader | Login, scoped loading view, wrong-role Dispatcher redirect and sign-out passed. No current loads were available. |
| PC Driver | Login, Today/Profile, wrong-role Store redirect and sign-out passed. Correct current date/depot and no-assignment state displayed. |
| PC Store | Login, scoped Home and catalogue, wrong-role Driver redirect passed. Quantity 1 saved as a local draft survived reload; test quantity restored to 0 afterward. |
| Mobile Driver | Connected login, Home/Route/Activity/Profile/Sync Centre, reload, wrong-role Store redirect and confirmed sign-out passed. |
| Mobile Store | Connected login, Home/catalogue/order review, reload and wrong-role Driver redirect passed. A local quantity/note draft survived reload; the test cart/note were restored afterward. |

Real Driver queries showed zero assigned trips for the Sri Lankan business date 2026-10-09. The app correctly reports this as no assigned route rather than all work completed. Store views use the actual outlet and shared catalogue; historical deliveries are no longer presented as today's arriving delivery.

No real order submission, load completion, trip start, delivery proof, receipt acknowledgment or publication was performed. Opening PC Planning invokes its normal get/create daily draft-plan endpoint; this was not a publish or assignment. Routine authentication may update its account binding/login metadata.

## Repairs

- PC login now catches connection failures and clears its loading state. Unknown roles receive a workspace error instead of arbitrary navigation. Mobile network login errors are actionable.
- Middleware redirects preserve the configured origin, including loopback hosts. Next middleware URL normalization is disabled so a `127.0.0.1` session is not redirected to a different cookie host.
- Database seeding now requires a same-origin, authenticated Dispatcher POST and an explicit configured seed secret. GET, anonymous callers, Store users and an incorrect secret are rejected. The real database was not seeded.
- PC Driver shows current Sri Lankan date, actual depot/trip metadata, distinguishes no assignment from completed trips, exposes route errors, and disables departure when the server says it is ineligible.
- PC Store shows the authenticated name/outlet, real loading/errors and accurate delivery status. Catalogue receiving window/time zone and product handling come from the server. Quantity fields are labelled and bounded.
- PC Save Draft now persists the cart by Firebase project, account, outlet and auth version. Submission persists its operation UUID before networking and retains the original envelope for uncertain-response retries. The submit button is explicitly labelled **Submit order request**. Browser reload of an unsubmitted draft was verified; an interrupted real submission was not exercised.
- Mobile dates and offline expiry use human-readable Sri Lankan dates/times. Connected empty-route copy is accurate.
- Mobile background refresh retains visible data only within the same account/role/depot/outlet/auth-version/Firebase UID scope. Switching workspace immediately hides the previous data. A widget test verifies refresh retention and scope-change isolation.

## Commands and actual results

| Check | Result |
|---|---|
| `dart format --output=none --set-exit-if-changed lib test` | PASS: 51 files, 0 changed |
| `flutter analyze --no-pub` | PASS: no issues |
| `flutter pub get --offline`, then `flutter test --no-pub` in a temporary source copy | PASS: 57 tests, including network error and refresh/scope isolation regression tests |
| `flutter build web --debug --dart-define-from-file=config/chrome-connected.local.json --output=build/web-ui-review --no-web-resources-cdn --no-pub --no-wasm-dry-run` | PASS; this build was served for final mobile checks |
| PC `npm run typecheck` | PASS |
| `npm run test:mobile:http` with `MOBILE_HTTP_ORIGIN=http://127.0.0.1:3002` and isolated demo Firebase emulators | PASS: 1 comprehensive HTTP test; four web roles, native identities, resource/origin guards, replay, revocation and seed rejection |

The ordinary workspace Flutter test runner failed opening a generated hook stdout file under the OneDrive checkout. Automatic approval review rejected removing that file as blocked by policy. Tests instead ran from a fresh temporary copy containing the same `lib`/`test` sources, bundled assets/platform sources and package lock, excluding `.env`, local config and generated build/cache files. An intermediate new-widget-test constructor error was repaired before the final 57-test pass. No failed invocation is counted as a pass.

Earlier environment verification separately passed 5 backend service tests and 2 configuration-generator tests; see [environment evidence](env-connection-verification.md). Those results do not certify S3 or native hardware.

## Remaining acceptance

- S3 `PutObject`/read checks return **403 AccessDenied**. Private incoming/evidence object permissions and browser CORS need operational correction before real photo delivery can pass.
- The real Driver has no assigned trip today, so current route start/load/proof/receipt workflow could not be rehearsed through the real UI. Isolated HTTP/domain journeys cover software gates separately.
- Physical Android/iPhone camera, offline/process-kill/quota recovery, hosted HTTPS and signed release acceptance remain open. No new native device or release build was run here.
- In-app Chromium was verified; this is not external Chrome or physical-phone certification.

Screenshots: [mobile Store](role-ui-mobile-store.jpg), [PC Store](role-ui-pc-store.jpg). No private proof or authentication secrets are included.

Final git diff --check: PASS. Phase worklist and implemented-code references were updated with these results; the completion count remains unchanged.
