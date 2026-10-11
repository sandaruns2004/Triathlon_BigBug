# Environment connection verification — 9 October 2026

Status: **Implemented — verification pending**. Live Firebase configuration and
database reads pass; hosted evidence storage and real-account UI acceptance remain open.

## Configuration changes

- Compared root `env`, website `.env` and mobile `.env` without printing secrets.
  Firebase project IDs, API keys and service-account project/email matched.
- Google initially rejected normal service-account authentication with
  `invalid_grant` because the PC UTC clock was 5 hours 30 minutes behind Google.
  A one-off verification using Google's timestamp confirmed the credentials.
  Windows subsequently synchronized its clock, and normal authentication passed.
  No clock workaround or TLS bypass was added to application code.
- Read the registered Firebase Web app configuration through the Firebase API;
  its project and public API key matched the website. Filled the missing mobile
  Web app ID and sender ID using those registered values.
- Replaced mobile `.env` with public client fields only. Server Firebase Admin,
  AWS, NextAuth and seed credentials remain in the website environment.
- Added [the configuration generator](../scripts/configure-connected.mjs) and
  [allowlist/mismatch tests](../scripts/configure-connected.test.mjs). Flutter
  receives generated defines rather than attempting to load `.env` at runtime.
- Ignored local environment files, root `env` and generated local JSON. Values
  are not included in this evidence record or the example environment file.
- Restored backend departure checks for assignment/release versions, release,
  holds, loading, shortfalls, prior assigned trip completion and plan publication.
- Fixed the custom Next server to pass Next's expected parsed request URL.
- Fixed the isolated restoration test to defer its freshly seeded pending order
  before restoring it; production restoration authorization was not relaxed.

## Executed checks

- `node scripts/configure-connected.mjs`: passed; generated connected public
  client configuration matching the website with no emulator settings.
- `node --test scripts/configure-connected.test.mjs`: **2 passed**.
- Normal Google service-account authentication: passed after Windows time sync.
- Live Firestore read-only profile audit: **4 profiles**, one each Dispatcher,
  Driver, Loader and Store Manager; Driver depot and Store outlet were present.
  No live operational record was seeded, rewritten or reset.
- Isolated `tsx --test tests/mobile-service.test.ts`: **5 passed**. The emulator
  started during the first test, so the run took 472.5 seconds and emitted an
  initial metadata lookup timeout warning; the final assertions all passed.
- Isolated `tsx --test tests/mobile-http.test.ts` against the repaired custom
  server on port 3002: **1 passed**, including web/native authentication, role
  scopes, origin guards, replay and revocation.
- `tsc --noEmit --incremental false`: passed.
- `flutter analyze --no-pub`: **no issues**.
- `dart format --output=none --set-exit-if-changed lib test`: 50 files, 0 changed.
- Initial web build into `build/web` failed with Windows access denied while
  replacing an existing image. Building into a separate output succeeded:
  `flutter build web --debug --dart-define-from-file=config/chrome-connected.local.json --output=build/web-connected --no-web-resources-cdn --no-pub --no-wasm-dry-run`.
- Audited compiled JavaScript: correct real project and registered Web app
  embedded; no PEM private key. HTTP served JavaScript matched that build.
- Live Chrome proxy to the real backend on port 3001: JavaScript **HTTP 200**;
  unauthenticated `/me` **HTTP 401**, JSON `unauthorized`, no redirect loop.
- Node syntax checks and `git diff --check`: passed.

## Unresolved acceptance

- **S3 object upload is blocked**: configured credentials returned HTTP 403
  `AccessDenied` for a synthetic `PutObject` under the same `incoming/` prefix
  used by mobile evidence. Nothing was uploaded. Read/list checks also returned
  AccessDenied. This is an AWS access-policy/bucket prerequisite, not a Flutter
  Firebase project mismatch. The backend needs private Put/Get access to
  `incoming/*` and `evidence/*`; browser uploads also need the correct bucket
  CORS configuration. No AWS permissions or bucket policy were changed.
- Real-account Driver/Store UI sign-in and restoration were not verified in this
  follow-up: account passwords were not supplied, and browser inventory exposed
  no enabled tabs. The app preview was queued in Codex. Previous synthetic
  emulator UI evidence remains separate from the real-project build.
- Native Android/iOS client registration, physical camera/offline acceptance,
  hosted HTTPS deployment, signed builds and the full four-role UI rehearsal
  remain open. This Chrome Web config must not be used as a native app ID.

See [the launch commands](../README.md) and
[earlier connection/role evidence](connection-role-verification.md).


## Connected role/UI follow-up — 9 October 2026

[Executed real-account browser checks, fixes, 57-test result and remaining gates](role-ui-verification.md). This supersedes earlier pending real-account browser checks; S3, physical-device, hosted and release acceptance remain open.
