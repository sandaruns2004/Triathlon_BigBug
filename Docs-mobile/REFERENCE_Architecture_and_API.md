# Implemented architecture and API reference

Updated 30 September 2026. Phases 2–6 now have source and executable tests. [API contracts](../waypoint-mobile/docs/api-contracts.md) document the actual v1 fields/routes/errors; [verification](../waypoint-mobile/docs/phase-2-7-verification.md) records their local execution.

## Ownership

The same lib/ workflows now target Android and iOS. Apple-specific schemes/config/permissions, platform-safe camera recovery and Keychain/file protection are described in [Phase 8](08_iOS_Platform_and_Compatibility.md) and [iOS setup](../waypoint-mobile/docs/ios-setup-and-release.md); no parallel iOS backend is introduced.

Flutter Driver/Store -> Firebase SDK ID token -> Next mobile adapter -> current account/scope -> shared logistics services -> Firestore transaction + domain event.

Browser Dispatcher/Loader/Driver/Store -> NextAuth session/public-origin check -> current account/scope -> the same logistics services. Browser and native mutation rules are shared.

SQLite/encrypted app files are the owner's cache, drafts, evidence and outbox; Firestore is canonical. Private S3 objects finalize before proof acceptance. No client operational Firestore writes are enabled.

## Actual source layout

~~~text
waypoint-mobile/lib/
  main.dart                    configuration/storage/SDK bootstrap
  app/                         environment, providers, role shell, guarded router/lifecycle
  domain/models.dart           typed principal/route/line/immutable operation
  core/auth/                   shared-credential Firebase SDK bridge and offline restore
  core/network/                bearer + original-account bounded refresh
  core/data/                   authorized reads, cache/forms/notification checkpoints
  core/storage/                schema 2, payload cipher, per-user keys, persistent media
  core/media/                  camera context and interrupted capture recovery
  core/sync/                   owner lease, dependencies, upload/finalize/replay
  core/theme/                  bundled design tokens, Inter, business formatting
  core/widgets/                shared accessible widgets/signature pad
  features/connected/          actual Driver, POD, sync, Store, note/photo/profile/updates
  features/foundation/         separately labelled fixture preview/catalogue

waypoint-flow/lib/
  auth/credentials.ts           verifier, rate limit, current principal, native bridge
  mobile/domain.ts             strict schema/units/date/evidence/transition policy
  mobile/service.ts            transactional business effects, idempotency, notifications
  mobile/operations.ts         assignment, load/shortfall, deferral/restore/hold/review
  mobile/media.ts              authorized private media sessions/finalize/view
  mobile/http.ts               native JSON adapter
  mobile/web.ts                session/public-origin wrapper
  mobile/browser.ts            browser envelope/replay/media helpers
~~~

## Hard invariants

- Provisioned stable user/Firebase identity; role/depot/outlet resolved from the current enabled profile. SDK credentials are not duplicated in SQLite.
- Current authVersion checks invalidate both web/native old sessions. Pre-reset custom token exchanged after reset still fails the API.
- Previously verified offline profile has a bounded 12-hour fresh-credential lease. Lock on expiry; retain pending proof. Unreachable server revocation is a documented limitation.
- Owner-scoped encrypted JSON/photos with contextual AES-GCM; plaintext SQLite metadata remains. Missing key fails closed. Android backups excluded.
- Route saved label follows successful local transaction. Explicit 401/403/404 does not silently return cached protected data.
- Operation UUID, payload, evidence and original concurrency remain immutable. Native operation includes original scope; identity/scope cannot switch during sync.
- Separate assignment/release, route/stop manifest/delivery, fulfillment and receipt versions. Ordinary progress of Stop 1 does not invalidate unchanged Stop 2.
- Media size/MIME signature/hash/owner checked before accepted proof. Object hosts never receive app bearer credentials.
- Actor+UUID hash/receipt and canonical effect/event commit together. Additional proof/stop/receipt uniqueness guards prevent a different UUID repeating the effect.
- Parked entry gate, canonical publication/loading release and previous-trip closeout. Local counts cannot unlock Trip 2.
- Historical review does not grant the replacement route. Approved amendment creates a distinct audited canonical proof; original remains unchanged and unsynced for audit.
- Store reads/mutations/note/photos are outlet-scoped. A Store view never exposes a full multi-outlet trip.
- Committed events become deterministic recipient notifications with numeric sequence checkpoints. Socket/push is not a business acknowledgment.

## Operational state and UI

Driver: waiting/loading -> published/released ready -> on_route -> returning -> completed, with explicit holds and server decisions.

Stop: full -> delivered; partial remains partial; failed/refused/skipped require zero quantities and reason. Resolved and successfully delivered counts differ. Upload state is independent.

Store: pending planning -> planned/loading -> on_route -> delivered/partial -> receipt_confirmed; D3 deferred/restored history and issues remain explicit. Requested date is not guaranteed capacity or ETA.

Outbox: queued/uploading/submitting/retryableError/authRequired/conflict/rejected/awaitingOperations/retainedForAudit/synced. Only exact accepted/already_applied operation receipt sets Synced.

See [offline recovery](../waypoint-mobile/docs/offline-recovery.md) and [implementation recipes](CODE_Implementation_Recipes.md).

## Environment and deployment

Development config can use the isolated demo emulators. Staging/production require HTTPS and verified public Firebase client identifiers; production refuses fixtures/emulators and needs protected signing. Server Admin/AWS/NextAuth credentials are runtime-only.

Production compilation no longer requires server Firebase keys in the build context: Admin resolves lazily at request time. Docker excludes environment files/keys/test artifacts and sets a production process/listener. Docker/hosted deployment has not been executed in this environment.

Anonymous Socket.IO forwarding was removed. MVP uses scoped API polling/resume/manual refresh. A supervised event publisher or repeated one-shot job must be verified on the selected host; API notification reads recover pending publication as a fallback.

Push, continuous GPS, guaranteed background transfer, socket rooms, iOS, full invitation automation and PDF export are deferred. Do not advertise live tracking from estimated ETA/last saved map points.

## Evidence and remaining gate

[Domain tests](../waypoint-flow/tests/mobile-service.test.ts), [HTTP tests](../waypoint-flow/tests/mobile-http.test.ts), [Android integration](../waypoint-mobile/integration_test/connected_journey_test.dart) and [test runner](../waypoint-flow/scripts/run-mobile-checks.mjs) are executable.

[Backend readiness](WEBSITE_Alignment_and_Backend_Readiness.md) separates original website gaps from current implementation. [Release checklist](../waypoint-mobile/docs/release-checklist.md) retains hosted/physical/S3/policy/signing gates. No local fixture or document certifies a production release.
