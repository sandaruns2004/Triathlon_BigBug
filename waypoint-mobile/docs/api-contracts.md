# Implemented mobile API contracts

Updated 30 September 2026. API version v1, operation schema 1, local database schema 2. Source and executable tests take precedence over examples. Hosted deployment is not certified by these local results.

## Shared boundaries

Flutter calls /api/mobile/v1 with a Firebase SDK ID token. Browser callers use /api/web/v1 and their existing NextAuth session plus the configured public Origin. Both adapters call the same domain/services; no native operational Firestore writes are permitted. Operational client Firestore rules deny direct access.

- [Credential verifier and current principal](../../waypoint-flow/lib/auth/credentials.ts)
- [Native adapter](../../waypoint-flow/lib/mobile/http.ts)
- [Executable schemas/policies](../../waypoint-flow/lib/mobile/domain.ts)
- [Atomic business services](../../waypoint-flow/lib/mobile/service.ts)
- [Dispatcher/Loader decisions](../../waypoint-flow/lib/mobile/operations.ts)
- [Private media lifecycle](../../waypoint-flow/lib/mobile/media.ts)

No Admin credentials, AWS keys, passwords or refresh tokens belong in app assets. Firebase client identifiers are configuration, not server authority.

## Identity

POST auth/login accepts only email and password; returns customToken. The SDK exchanges it through signInWithCustomToken. The custom token is not an API bearer credential. GET me verifies the ID token with revocation checks, then the current enabled account, stable Firebase UID and authVersion.

Application roles are driver, store_manager, dispatcher and loader. Native login allows only Driver/Store. Scope is current depot or outlet, not a client role picker. The profile includes userId, firebaseUid, name, role, depot, outletId and authVersion.

me also supplies offlineAccess.issuedAt/expiresAt/maxHours (default 12 hours from fresh credential verification). Refreshing a token or repeatedly reading me does not extend that credential context. The app locks protected data when the lease ends while retaining evidence.

[Account management CLI](../../waypoint-flow/scripts/manage-mobile-account.ts) can activate, reset or disable an existing provisioned account under server IAM. It advances authVersion and revokes native refresh sessions. There is no public invitation/password-reset UI in this MVP; the app directs recovery to operations. Role/outlet/depot remain assigned by operations.

## Read routes

Paths below are relative to /api/mobile/v1/.

| Method/path | Returned state and scope |
|---|---|
| GET me | Current Driver/Store profile and offline lease |
| GET driver/trips?serviceDate=YYYY-MM-DD | Own depot assignment; Asia/Colombo date default, ordered trips |
| GET driver/trips/:tripId | Own trip, release/hold/start eligibility, full active ordered stops/manifest |
| GET store/catalogue | Own outlet/brand products, revision, units, limits, handling, weights/volumes and service options |
| GET store/orders | Own outlet orders, newest first |
| GET store/orders/:orderId | Own order, approved/delivered lines, receipt and deferral/history; only relevant trip status/ETA, no other outlets' stops |
| GET store/orders/:orderId/delivery-note | Confirmed receipt, stable DN reference, four quantity stages, linked issue, authorized proof evidence IDs |
| GET sync/operations/:operationId | This actor's recorded operation receipt |
| GET conflicts/:operationId | This actor's original review and original-stop comparison; no replacement-driver route |
| GET notifications?after=N | Recipient-scoped sequence page, cursor and hasMore |
| POST notifications/:id/read | Idempotent read-state update and new recipient sequence |

Route snapshots contain tripId, vehicleId, driverId, serviceDate, tripNumber, depot, district, status, released, held, startEligible, handling, routeRevision, assignmentVersion, releaseVersion and evidencePolicy. Each stop contains stable stopId/orderId/outletId, stopOrder, address/coordinates if available, receiving window/instruction, loadingState/shortfallOpen, stopManifestRevision, stopDeliveryVersion, orderFulfillmentVersion and explicit lineId/productId/quantity/unit rows.

startEligible is a read-side snapshot. The mutation rechecks publication/loading/assignment/prior-trip requirements transactionally. A refreshed or cached screen cannot override that guard.

## Immutable operation envelope

POST sync/operations accepts one to twenty operations. Example identifiers below are placeholders, not fixture credentials.

~~~json
{
  "operations": [{
    "operationId": "<persisted UUID>",
    "schemaVersion": 1,
    "type": "delivery_recorded",
    "tripId": "<trip ID>",
    "stopId": "<stop ID>",
    "orderId": "<order ID>",
    "observedAt": "<UTC ISO instant>",
    "dependencyIds": ["<accepted departure operation UUID>"],
    "concurrency": {
      "ownerScope": {"role": "driver", "depot": "Peliyagoda", "outletId": null},
      "assignmentVersion": 1,
      "stopManifestRevision": 2,
      "stopDeliveryVersion": 0,
      "orderFulfillmentVersions": {"<order ID>": 1}
    },
    "payload": {
      "proofId": "<persisted proof UUID>",
      "outcome": "partial",
      "parkedAcknowledged": true,
      "recipientName": "<recipient>",
      "reason": "One damaged case",
      "note": "",
      "evidenceIds": ["<finalized photo UUID>"],
      "lines": [
        {"lineId": "<approved line ID>", "unit": "case", "deliveredQty": 11, "reason": "One damaged case"}
      ]
    }
  }]
}
~~~

The native queue stamps immutable ownerScope into concurrency. The server checks it against the current role/depot/outlet, including before returning an old receipt. Earlier unscoped local records are held for recovery, not silently rebound to a changed account.

| Type | Payload and required tokens |
|---|---|
| trip_start | parkedAcknowledged; assignmentVersion + releaseVersion; published plan, approved load and canonical earlier-trip closeout |
| delivery_recorded | proofId, outcome, all line units/deliveredQty/reasons, recipient/evidence policy; assignment, stop manifest/delivery and linked order fulfillment tokens |
| delivery_issue | closed/access/refused/other reason, parkedAcknowledged, trip/stop IDs and assignmentVersion; does not itself resolve the stop |
| trip_issue | breakdown/delay/other reason, parkedAcknowledged, assignmentVersion; breakdown applies a hold |
| trip_closeout | returnedToDepot + parkedAcknowledged, dependencyIds; all active canonical stop outcomes accepted and no hold |
| store_order_created | requestedDate, catalogueRevision, serviceOptionsVersion, product IDs/positive integer quantities/units, note; server calculates totals |
| receipt_recorded | every delivered line's receivedQty/unit/reason, note/evidenceIds; receiptVersion + proofVersion, own confirmed full/partial delivery |
| store_issue | category, reason, affected lineIds, evidenceIds; own order, lines mandatory for missing/quantity/damaged/temperature |
| update_acknowledged | empty payload; routeRevision for Driver or updateVersion for Store |

Full means every approved quantity delivered. Partial means some delivered goods plus an explained difference. Failed/refused/skipped require zero delivered quantities and a reason, with no invented recipient. Full/partial need recipient and at least one photo by default. Signature is optional; if supplied it must be a valid normalized drawn stroke. Typed acknowledgment is not authorized by the current policy.

Quantities use catalogue units without case/pack conversion. Order policy version 1 uses a 16:00 Asia/Colombo cutoff and seven eligible receiving dates. At/after cutoff, earliest service is day +2; before cutoff day +1. Queue replay revalidates eligibility and never silently chooses a new date.

## Receipts and errors

Batch HTTP 200 only means an envelope was processed. Inspect every result:

~~~json
{
  "results": [{
    "operationId": "<original UUID>",
    "status": "accepted",
    "entityId": "<canonical ID>",
    "versions": {},
    "serverReceivedAt": "<UTC instant>"
  }]
}
~~~

Accepted results include type-specific IDs/outcome/canonical state. Replay returns already_applied with the original result. Rejection includes operationId, status, httpStatus, code and message. A missing/mismatched UUID cannot set Synced.

Top-level API failures use error.code and error.message. Browser legacy wrappers may return an error string plus code.

| Status | App behavior |
|---|---|
| 401 | SDK refresh once under the original identity; then lock/pause and retain proof |
| 403/404 | Preserve unauthorized/missing-assignment work for review; no cache fallback on explicit denial |
| 409 | Retain immutable original and current authorized comparison; dependency_pending is a retry exception |
| 400/413/415/422 | Retain rejected record/evidence; explicit corrected copy after re-review |
| 429/5xx/no response | Same UUID, bounded backoff and manual retry |
| accepted/already_applied | Verify exact UUID, then save receipt and status atomically |

A transaction stores actor+UUID payload hash, receipt, canonical business mutation and durable domain event together. Changed payload with the same UUID is rejected. Separate stop/proof and receipt uniqueness guards prevent different UUIDs repeating an effect. Completing Stop 1 updates progress without invalidating unchanged Stop 2's manifest.

## Media and historical review

POST media/upload-sessions accepts evidenceId, mime, bytes, sha256 and authorized trip/stop or order scope. Production returns a five-minute private upload URL; the isolated emulator returns uploadPath. Upload bytes, then POST media/:id/finalize. Finalization verifies size, JPEG/PNG signature and SHA-256 before creating an immutable private final object. Object requests receive no API bearer credential.

GET media/:id/view checks owner/depot/accepted proof membership and issues a temporary view URL, or test-only bytes. Store access includes an approved historical amendment only when its canonical accepted proof references that evidence ID. An expired view URL does not invalidate the delivery note; reopen it to request fresh access.

POST conflicts/:operationId/reviews accepts the original operation and a mandatory reason. Current or recorded historical assignment authorizes intake, not a new delivery mutation. Review evidence can upload after authorized intake. Dispatcher decisions at /api/operations can retain_for_audit, request_followup or approve_review.

An approval creates a separate validated canonical amendment with new proofId, current manifest/outcome tokens, original Driver-owned finalized evidence, approver/reason and provenance. Original queued proof is unchanged and never falsely marked Synced. Repeating the same approved decision returns its receipt; a changed decision conflicts.

## Durable updates and deployment

Domain events publish to deterministic event/recipient notification IDs in Firestore transactions. Per-recipient numeric sequence cursors avoid timestamp gaps and cover read-state updates. Cache rows/checkpoint advance in one SQLite transaction.

MVP uses API refresh on foreground/resume/manual sync. Anonymous Socket.IO forwarding was removed; no push or continuous GPS is advertised. Run the event publisher as a supervised worker or repeated one-shot job. GET notifications also recovers pending publication; that fallback is not a substitute for hosted worker verification.

[Domain tests](../../waypoint-flow/tests/mobile-service.test.ts), [real HTTP tests](../../waypoint-flow/tests/mobile-http.test.ts) and [Android journey](../integration_test/connected_journey_test.dart) exercise these contracts in the isolated demo environment. See [actual evidence](phase-2-7-verification.md) and [release gates](release-checklist.md).
