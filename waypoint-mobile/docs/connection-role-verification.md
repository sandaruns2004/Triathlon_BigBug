# Database connection and role review — 9 October 2026

## Findings and implementation

The website uses Firestore Admin on the server; mobile uses its `/api/mobile/v1/`
adapter, the shared bcrypt credential verifier, Firebase custom-token exchange and
current-profile authorization. Mobile has no separate remote business database.
Driver maps to `driver`; Store Manager maps to `store_manager`. Dispatcher and
Loader stay in the website. No website source or operational database was changed.

Only preview and isolated emulator configurations are present locally. No actual
website URL or matching public Firebase client configuration was supplied. Therefore
the user's live database connection is **not verified or configured**.

Implemented:

- Normalize the API base slash and reject website-root/query/fragment credentials
  URLs, unknown APP_MODE and demo Firebase without Auth emulator configuration.
- Explain mismatched Firebase client configuration, unreachable API and missing
  mobile routes in the sign-in screen instead of reporting every failure as credentials.
- On `/me` 401/403, remove the cached offline grant and sign out SDK identity while
  preserving proof/database/media. Token acquisition errors now finish the request.
  Retry binding preserves even an initially null account identity.
- Scope caches, notification cursors and saved forms to role/depot/outlet. Reject
  correction links into another scope. Unscoped legacy proof forms are retained
  for review; legacy outlet-keyed carts remain recoverable.
- Add Chrome-capable SQLite/WASM storage and encrypted database-backed images.
  In-memory/unsafe IndexedDB fallbacks block operational login. The local-only
  static host proxies only mobile API routes; it does not relax website CORS.

## Executed checks

- `flutter test --flavor development --no-pub`: **55 passed** (50 existing + 5 new).
- `flutter analyze --no-pub`: **No issues found**. Initial run found one style lint,
  corrected before this successful run.
- Final targeted rerun `flutter test test/network test/recovery_regression_test.dart --flavor development --no-pub`:
  **16 passed**; final analysis also clean.
- `dart format --output=none --set-exit-if-changed lib test integration_test`:
  **53 files, 0 changes**. `node --check scripts/serve-chrome.mjs` and `git diff --check` passed.
- `flutter build web --dart-define-from-file=config/chrome-emulator.json --no-web-resources-cdn --no-pub`:
  compiled successfully, but release mode intentionally rejects emulator runtime.
- `flutter build web --debug --dart-define-from-file=config/chrome-emulator.json --no-web-resources-cdn --no-pub --no-wasm-dry-run`:
  **passed**, suitable for the emulator runtime.
- Existing server `node node_modules/tsx/dist/cli.mjs --test tests/mobile-service.test.ts`:
  **3 passed, 2 failed**. The shortfall journey expected a thrown 409 but got no
  rejection; the restoration scenario uses TEST-DEFERRED, which the current seed
  creates as `pending`, so restoring it returns `restore_not_eligible`. These are
  existing website/test discrepancies, not a passing cross-role certification.
- Existing `tests/mobile-http.test.ts`: first attempt failed with a redirect loop
  under `server.js` (308 to a malformed `http:/...` URL). After switching to the
  standard Next.js CLI with the same isolated backend: **1 passed**. Verified web
  credentials for all four roles, native Driver sign-in/token/profile, forbidden
  cross-role/outlet reads, origin guards, replay and revocation. Website source was
  preserved, including undoing Next.js's automatic tsconfig include addition.
- Local browser host returned **200** for HTML, SQLite WASM (`application/wasm`)
  and worker JS. Proxied `/api/mobile/v1/me` returned **401 JSON** without a token
  after API compilation (initial compilation exceeded the proxy timeout).
- The first two Firestore emulator starts failed with Java's Windows Unix-domain
  socket error. Java 21 with `JAVA_TOOL_OPTIONS=-Djava.net.preferIPv4Stack=true -Djdk.net.unixdomain.tmpdir=C:/Windows/Temp`
  started the emulator successfully. No system Java settings were changed.

Initial Chrome/in-app automation attempts timed out. Later in-app Chromium
inspection succeeded against the final debug build:

- Driver sign-in rendered Test Driver / Peliyagoda and the released VEH001 route.
- Reload restored the Driver session; a Store deep link redirected to Driver home.
- Sign-out returned to login; Store sign-in rendered Test Store Manager / OUT005
  and its orders/updates. A Driver deep link redirected to Store home.
- A one-product Store cart and receiving note survived leaving the form and a
  browser reload. The draft was not submitted; no business order was created by
  this UI check. The synthetic draft is retained for inspection.
- Additional HTTP checks through port 4183 passed login, token exchange, `/me`
  and role-scoped reads for both Driver and Store. The first proxy login attempt
  returned 401 while the test driver was still disabled by the revocation test;
  after isolated fixture preparation finished, both passed.

The final debug web build passed again after the last source edits. Browser
camera/photo upload, quota, true offline cold-start and external Chrome-specific
acceptance remain pending. [Connected Store home](chrome-connected-home.jpg) and
[restored draft](chrome-connected-store.jpg) contain only synthetic test data.
Native APK/physical-device/iOS/private-S3/production signing were not rerun.

Phases 1, 2, 4, 5 and 6 stay **Implemented — verification pending**. Phase 7 stays
**In progress**. No release or fully working live connection is claimed.
