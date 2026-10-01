# Tricky implementation recipes — Waypoint mobile

Updated: **1 October 2026**. Read alongside the [work list](00__Work_List.md). These examples explain the hard parts of each phase; they do not replace its acceptance checks.

## Implemented fixture workflow guard

[Router builders](../waypoint-mobile/lib/app/router.dart) choose [NativeWorkflowPreviewPage](../waypoint-mobile/lib/features/foundation/foundation_pages.dart) before constructing an operational widget in fixture mode. The page explains the native requirement and returns to the appropriate preview root; it never fabricates a verified identity or initializes a sync worker. [Executed regressions](../waypoint-mobile/test/widgets/fixture_route_guard_test.dart) cover all eight affected route paths with operational providers set to throw on access. [Browser evidence](../waypoint-mobile/docs/chrome-page-review.md) records the recheck and local renderer/font setup.

**Implemented** means code exists in `waypoint-mobile/`; verification is recorded separately. Phase 2–6 snippets below now reference implemented source; contract placeholders illustrate IDs rather than runnable fixture requests. Acceptance evidence remains separate.

## Phase 0 — Canonical IDs, units and scope

The implemented fixture is [route.json](../waypoint-mobile/assets/fixtures/route.json). It is separate from the website seed. Use stable IDs throughout route → proof → receipt, never a stop's position in an array.

```json
{
  "serviceDate": "2026-09-30",
  "tripId": "FIXTURE-VEH001-T1",
  "stopId": "FIXTURE-STOP-01",
  "orderId": "FIXTURE-ORDER-01",
  "outletId": "OUT005",
  "line": {
    "lineId": "FIXTURE-LINE-1-A",
    "quantity": 12,
    "unit": "case"
  }
}
```

This is a linkage example; consult the checked-in fixture for the complete exact line/product IDs. A case, tray, crate and pack are different units. Preserve the server unit; any conversion needs a catalogue rule. Store UTC instants separately from date-only service dates. Display/business-date conversion is implemented in [formatters.dart](../waypoint-mobile/lib/core/theme/formatters.dart) and its [midnight test](../waypoint-mobile/test/formatters_test.dart).

Decisions and unresolved owners are recorded in [scope-decisions.md](../waypoint-mobile/docs/scope-decisions.md). Fixture constraints were reviewed against CSV data; this sample has not passed a full allocation/travel-time run.

## Phase 1 — Encryption, atomicity and retained data

Implemented sources: [database](../waypoint-mobile/lib/core/storage/local_database.dart), [cipher](../waypoint-mobile/lib/core/storage/payload_cipher.dart), [store](../waypoint-mobile/lib/core/storage/local_store.dart), [media](../waypoint-mobile/lib/core/storage/native_media_store.dart), [sync lease](../waypoint-mobile/lib/core/sync/sync_lock.dart).

Encryption binds a record to its identity and context. The cipher generates a new nonce for each encryption; do not reuse one or generate a key from a password/user ID.

```dart
// Excerpt from PayloadCipher.seal:
final box = await _algorithm.encrypt(
  bytes,
  secretKey: await vault.keyFor(userId, create: createKey),
  aad: utf8.encode('$userId|$context|1'),
);
// open() uses the same AAD and keyFor(create: false).
```

The envelope contains version, nonce, ciphertext and authentication tag. Payloads/photos are encrypted; SQLite identifiers/status/timestamps are plaintext. Secure storage protects per-user keys, not the entire database. Missing keys must fail closed; [tests](../waypoint-mobile/test/storage/local_store_test.dart) prove existing records cannot be overwritten by silently creating a replacement key.

```sql
-- Excerpt: read by both owner and record ID, always parameterized.
SELECT payload FROM drafts WHERE user_id = ? AND id = ?;

-- Proof and operation are INSERT-only inside ONE transaction.
-- Reused IDs fail rather than overwrite previously saved proof.
INSERT INTO proof_records
  (user_id,id,entity_id,status,payload,updated_at)
VALUES (?,?,?,?,?,?);
INSERT INTO outbox_operations
  (user_id,id,entity_id,status,payload,updated_at)
VALUES (?,?,?,?,?,?);
```

File storage and SQLite cannot share one transaction. Import/flush/rename encrypted app-owned files first, then commit their metadata with the proof/outbox. Return success only after both durable steps. A crash between them can leave an orphan file; Phase 4 needs reconciliation that never deletes a file referenced by pending proof.

```dart
// Existing media import sequence (simplified excerpt):
await temp.writeAsBytes(sealed, flush: true);
await temp.rename(path);
return EvidenceFile(id: id, path: path, bytes: length, mime: mime);
```

A camera cache path is never durable evidence. On key loss, retain encrypted files and report recovery; do not replace the key over existing media. See [media failure/key-loss tests](../waypoint-mobile/test/storage/media_store_test.dart).

Migrations are additive, transactional and tested against the old on-disk database. Never catch a migration error and recreate the DB. See [v1→v2 preservation test](../waypoint-mobile/test/storage/local_store_test.dart).

## Phase 2 — SDK identity, version and account-bound retries

Implemented: [auth repository](../waypoint-mobile/lib/core/auth/authentication_repository.dart), [API interceptor](../waypoint-mobile/lib/core/network/api_client.dart), [server verifier](../waypoint-flow/lib/auth/credentials.ts). Tests: [identity acquisition/refresh races](../waypoint-mobile/test/network/api_client_test.dart), [stale bridge and HTTP sessions](../waypoint-flow/tests/mobile-service.test.ts).

~~~dart
await firebase.signInWithCustomToken(bridge['customToken'] as String);
final principal = await revalidate(); // Current /me, not a client role choice.
~~~

The server verifies SDK ID tokens, stable UID/current profile and sign-in authVersion. Reset/disable advances the shared version and revokes native sessions. A pre-reset bridge token exchanged later cannot regain API access.

The interceptor captures expectedUserId before awaiting token acquisition and preserves it on the one allowed refresh. Sync transport explicitly supplies the original user. An account change cancels before sending the original operation under a new bearer identity.

Offline restore checks prior SDK UID, cached principal/lease and clock; explicit server denial never falls back to offline data. Lease expiry retains encrypted proof and locks screens.

## Phase 3 — Cache commits, published departure and independent revisions

Implemented: [repository/cache](../waypoint-mobile/lib/core/data/operational_repository.dart), [route repository](../waypoint-mobile/lib/features/driver_route/connected_route_repository.dart), [start guard](../waypoint-flow/lib/mobile/domain.ts), [shared transaction](../waypoint-flow/lib/mobile/service.ts).

~~~dart
final result = await repository.read(
  'driver/trips', 'driver-trips', principal,
  table: LocalTable.routeSnapshots,
);
~~~

read() checks current identity/scope, downloads, commits encrypted cache and then returns savedAt. No response/eligible server failure can return labelled cache; 401/403/404 cannot. Changed route revisions preserve before/after snapshots for comparison.

Start checks stable assignment/release, all active approved loads, published plan and prior canonical closeout. Next-trip readiness is not inferred from local completion.

Assignment/release, stopManifestRevision, stopDeliveryVersion and orderFulfillmentVersions are independent from trip progressVersion. Two offline stops from one snapshot are tested without false conflict after Stop 1.

## Phase 4 — Immutable proof, exact receipt and historical amendment

Implemented: [POD](../waypoint-mobile/lib/features/connected/proof_page.dart), [worker](../waypoint-mobile/lib/core/sync/sync_worker.dart), [local transaction](../waypoint-mobile/lib/core/storage/local_store.dart), [private media](../waypoint-flow/lib/mobile/media.ts).

~~~dart
await repo.complete(principal, proofId, payload, operation);
// Durable file writes precede the atomic INSERT-only proof/outbox transaction.
final summary = await worker.run(manual: true);
~~~

Operation IDs are generated once, never in retry loops. The native record includes immutable original scope; the server compares concurrency.ownerScope before any receipt replay. A user with changed outlet cannot accidentally submit an old order as the new outlet.

~~~text
owner lease -> dependency order -> encrypted media read
-> authorized upload session -> private PUT without bearer
-> finalize size/MIME signature/hash -> original mutation UUID
-> exact accepted/already_applied receipt -> atomic local acknowledgment
~~~

401 pauses; forbidden/missing/revision change preserves conflict; validation failure preserves rejected original; transient errors retry bounded backoff. Lease renewal and identity/scope checks occur around asynchronous steps. Wrong UUID/partial batch cannot show an all-clear.

Firestore transaction reads before writes, deduplicates actor+UUID payload hash and independently guards already-resolved stop/receipt. Canonical mutation, receipt and durable event commit together. S3 network transfer stays outside the transaction.

Historical reassignment intake verifies recorded assignment version and returns only the original stop comparison. Operations can retain for audit, request follow-up or approve a new validated proof with current manifest tokens, original-owned finalized evidence, approver and reason. Changed repeated approval conflicts. Original proof/request is never overwritten or falsely Synced.

See [sync failure tests](../waypoint-mobile/test/sync/sync_worker_test.dart) and [real Android lost-response/reopen journey](../waypoint-mobile/integration_test/connected_journey_test.dart).

## Phase 5 — Frozen orders and actual receipt quantities

**1 October recovery update:** [source/tests](../waypoint-mobile/test/recovery_regression_test.dart) cover retrying local receipt-write failures with the original UUID, closeout readiness holds, preserving terminal states on scope changes, and editing POD against its original approved-line snapshot. Forms capture the owner/repository before teardown rather than reading Riverpod in `dispose()`. Store drafts now persist unit snapshots and durable change notices for explicit re-review. See [executed evidence](../waypoint-mobile/docs/mobile-review-and-fixes.md).

Implemented: [Store UI](../waypoint-mobile/lib/features/connected/store_pages.dart), [server rules](../waypoint-flow/lib/mobile/service.ts), [evidence viewer](../waypoint-mobile/lib/features/connected/evidence_viewer.dart).

~~~json
{
  "type": "receipt_recorded",
  "operationId": "<persisted UUID>",
  "schemaVersion": 1,
  "orderId": "<canonical order>",
  "observedAt": "<UTC ISO instant>",
  "dependencyIds": [],
  "concurrency": {"receiptVersion": 0, "proofVersion": 1},
  "payload": {
    "lines": [{"lineId": "<delivered line>", "receivedQty": 10, "unit": "case", "reason": "Two damaged cases"}],
    "note": "",
    "evidenceIds": []
  }
}
~~~

The server validates every actual delivered line/unit/quantity and atomically creates one receipt/DN reference/event. Different UUID cannot receipt the same order twice. Notes show ordered, approved, delivered and accepted quantities; proof photo view remains authorized and renewable.

Store creation submits product/date/units; server computes weight/volume. Reconnect revalidates catalogue/cutoff/receiving day. Reject rather than silently choose a new date/product.

A definitive rejected request can create a new corrected copy after explicit date/unit/product review. An uncertain response retries the original UUID. Browser correction controls follow the same distinction.

## Phase 6 — Durable recipient sequence and publication recovery

Implemented: [event/notification transaction](../waypoint-flow/lib/mobile/service.ts), [publisher process](../waypoint-flow/scripts/publish-mobile-events.ts), [cached updates](../waypoint-mobile/lib/features/connected/profile_notifications.dart).

~~~text
business transaction creates domain_events(published=false)
publisher reads event -> authorized recipients
transaction creates deterministic notification(event, recipient)
and advances each recipient's sequence, then marks event published

client pages after sequence -> cache rows + checkpoint in one transaction
~~~

Crashing between business commit/publication retains the event; retry does not repeat the business mutation or recipient record. Read-state updates advance sequence, avoiding lost same-timestamp changes.

MVP uses API foreground/resume/manual refresh. Anonymous socket forwarding was removed; push/socket/background GPS are deferred. A deployed supervisor/scheduler still needs actual hosted verification.

## Phase 7 — Failure evidence, artifact and protected signing

[Verification](../waypoint-mobile/docs/phase-2-7-verification.md) records 35 Flutter tests, 4 domain tests, 1 real HTTP test, connected Android integration and the normal development APK/checksum. These are executed local results.

~~~powershell
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test --flavor development
flutter build apk --debug --flavor development --dart-define-from-file=config/emulator.json
~~~

[CI](../.github/workflows/mobile-api-ci.yml) runs isolated emulators/domain/live HTTP checks; [protected release](../.github/workflows/mobile-release.yml) builds production signed APK/AAB only with approved secrets. Neither workflow was executed on GitHub here.

Production compile resolves Firebase Admin lazily; server keys stay out of container context/client assets. A production Gradle task without protected signing properties fails instead of substituting debug signing.

Physical camera/airplane/process-kill/storage/upgrade, hosted private-S3/HTTPS and signed fresh-phone checks remain open in [release acceptance](../waypoint-mobile/docs/release-checklist.md). Database reopen is not an OS process-kill certificate.

## Phases 8–9 — iOS platform boundaries and signing

[iOS evidence](../waypoint-mobile/docs/ios-verification.md) records the 1 October shared regression results. Native Swift/Xcode compilation, simulator/phone behavior and signed IPA remain unverified. Use [iOS setup](../waypoint-mobile/docs/ios-setup-and-release.md).

[Keychain options](../waypoint-mobile/lib/core/storage/platform_secure_storage.dart) bind profile/encryption keys to this device:

```dart
const deviceSecureStorage = FlutterSecureStorage(
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.unlocked_this_device,
    synchronizable: false,
  ),
);
```

[Camera recovery](../waypoint-mobile/lib/core/media/evidence_capture.dart) checks the platform before calling Android-only retrieveLostData. iOS interrupted captures retain the saved form/earlier photos and require retaking an uncopied image. [Tests](../waypoint-mobile/test/platform/ios_compatibility_test.dart) verify that no Android recovery call occurs and account-isolated drafts survive.

[Native storage startup](../waypoint-mobile/lib/core/storage/storage_runtime_native.dart) calls the [Swift protection bridge](../waypoint-mobile/ios/Runner/AppDelegate.swift) before SQLite; protection failure has no unprotected fallback. Schemes include the matching Pods/Generated configuration, with ignored Signing.local.xcconfig last for authorized signing overrides.

[IPA preparation](../waypoint-mobile/scripts/prepare_ios_release.py) validates Apple client configuration, explicit production profile, team, expiry and matching certificate; [five validator tests](../waypoint-mobile/scripts/tests/test_ios_release.py) use synthetic inputs. The [protected workflow](../.github/workflows/mobile-ios-release.yml) exports artifacts and cleans temporary signing material; it does not publish to TestFlight/App Store.
# UI account hierarchy and sync summary — implemented

The reusable `AccountSummaryCard` and framed Store illustration are implemented in [foundation_pages.dart](../waypoint-mobile/lib/features/foundation/foundation_pages.dart). Connected Profile reuses that card in [profile_notifications.dart](../waypoint-mobile/lib/features/connected/profile_notifications.dart). [sync_pages.dart](../waypoint-mobile/lib/features/connected/sync_pages.dart) derives summary counts from actual operation rows while preserving individual review/retry actions. [Verification](../waypoint-mobile/docs/ui-polish-verification.md) records 50 passing tests and the remaining native visual gate.
