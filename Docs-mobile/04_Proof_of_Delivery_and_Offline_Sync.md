# Phase 4 — Proof of delivery and offline sync

**Execution status (30 September 2026): Implemented — verification pending.** Native POD, persistent encrypted media, immutable outbox, finalized uploads, idempotent replay and audited conflict resolution are implemented. Physical camera/process-kill/storage-failure and hosted private-S3 checks remain unchecked.
Progress is maintained in [00__Work_List.md](00__Work_List.md) under [the repository rule](../AGENTS.md).

## Implemented tricky code

Implemented entry points: [POD](../waypoint-mobile/lib/features/connected/proof_page.dart), [sync worker](../waypoint-mobile/lib/core/sync/sync_worker.dart), [shared server transaction](../waypoint-flow/lib/mobile/service.ts).
~~~dart
await repo.complete(principal, proofId, payload, operation);
final summary = await worker.run(manual: true);
// Only an exact accepted/already_applied receipt sets that operation synced.
~~~
Proof and outbox commit atomically after encrypted files are durable. Retrying keeps the original UUID, payload, evidence and concurrency. Operations review can retain, request follow-up or approve a separate audited amendment; it never edits the original proof.

See [code recipes](CODE_Implementation_Recipes.md), [verification evidence](../waypoint-mobile/docs/phase-2-7-verification.md) and [the remaining release checklist](../waypoint-mobile/docs/release-checklist.md). Checked tasks record implementation; acceptance conditions requiring physical or hosted environments remain open.

**Outcome:** complete proof survives unreliable connectivity, process death and retries, then updates the server exactly once at the business-effect level.  
**Dependencies:** Phases 1–3. **Estimate:** 3–4 working days. **Owners:** Flutter and backend developers; QA involved throughout.

This is the critical mobile phase. Build the real pipeline behind M3/M4; the HTML simulation is the interaction reference, not a sync implementation. Flutter’s [offline-first guidance](https://docs.flutter.dev/app-architecture/design-patterns/offline-first) supports separating local and remote data behind repositories. The transaction, conflict and acknowledgment rules below are Waypoint-specific requirements.

The website reports' PWA service-worker/IndexedDB examples do not provide a native persistence layer, and the current browser helper is not wired to a working replay endpoint. Reuse server contracts after hardening them; build and test SQLite/file persistence and the native worker separately. Cached-route expiry is not permission to delete unsynced proof.

## A. Proof of delivery flow / M3

Current policy supports a drawn signature; typed acknowledgment is deferred because operations has not authorized it. Camera compression/import/recovery is implemented, with actual camera permission/interruption acceptance still open on the target phone.

- [x] Step 1 — Compare loader-approved quantities with delivered quantities **per line**. Capture partial, missing, damaged and refused conditions with explicit units.
- [x] Require a reason for any quantity difference. Distinguish full, partial, failed and refused delivery; a skipped stop needs its own reason/event.
- [x] Step 2 — Recipient, policy-driven signature, photo capture/retake and note. Support drawn signature plus an accessible typed acknowledgment if operations permits it.
- [x] Show which evidence is required versus optional. Do not inherit mandatory signature behavior from the degradation demo without a policy decision.
- [x] Apply recipient/evidence rules by outcome. Closed, refused, failed or skipped stops may have no recipient; accept the authorized exception with a mandatory reason and applicable available evidence. Never require an invented name/signature or trap the driver behind successful-delivery evidence rules.
- [x] Copy/compress captured photos into persistent app-owned storage. Validate MIME, size and count against server policy. Handle denied camera permission and interrupted capture.
- [x] Persist drafts by `userId + tripId + stopId`; allow Back/Save for later without losing quantities or evidence.
- [x] Step 3 — Review outcome, quantities, discrepancies, recipient and thumbnails. Lock detailed entry behind the parked gate.
- [x] On Complete, commit immutable proof metadata and the outbox operation in one SQLite transaction. Show success/advance the stop only after that transaction and durable evidence writes succeed.

Photo capture may leave a temporary file or an interrupted result; implement recovery according to the [image_picker documentation](https://pub.dev/packages/image_picker). Do not label data as safe until it is in the app’s durable evidence store.

## B. Durable local outbox

| State | Meaning | User-facing label/action |
|---|---|---|
| `queued` | Committed locally, not accepted by server | Saved on this phone |
| `uploading_media` | Evidence transfer in progress | Uploading evidence |
| `submitting` | Mutation awaiting canonical acknowledgment | Syncing |
| `synced` | Exact operation and required evidence accepted | Synced + server acknowledgment time |
| `retryable_error` | Timeout, unavailable API or eligible transient failure | Saved on this phone · Retry |
| `auth_required` | Credentials cannot currently authorize upload | Sign in to sync; proof retained |
| `conflict` | Assignment/manifest/entity version changed | Review difference / Contact operations |
| `validation_error` | Server rejects business data | Needs correction/review; original proof retained |

- [x] Store operation UUID, actor, trip/stop/order IDs, typed concurrency tokens, payload schema version, full local timestamp, media references/checksums, attempt count, next retry time and server acknowledgment.
- [x] Keep business completion state separate from upload state. A locally completed stop can still be pending upload.
- [x] Maintain per-trip dependency order: trip start before delivery; media finalization before evidence-dependent POD submission; proof before dependent receipt updates.
- [x] Support `trip_issue` and `trip_closeout` as explicit operation types. Closeout depends on required stop outcomes/issues; one unresolved conflict must remain visible and cannot produce a false completed trip. Breakdown must retain already captured proof for replay/review.
- [x] Use one sync worker per user/device. Persist leases/recovery state; recover abandoned `uploading`/`submitting` operations after app termination.
- [x] Retry foreground reconnect, app resume/startup and manual Sync now. Use bounded exponential backoff with jitter; one failed record must not hide other independent successes.
- [x] Treat network connectivity as a hint. HTTP reachability/auth/server response decides whether an operation succeeded.
- [x] Background work is best effort under OS scheduling and battery restrictions. An installed app must still sync through foreground/manual paths when background work never runs.

## C. Server/evidence pipeline

Baseline before Phase 4: the deliver handler accepted only a signature and increments `stopsCompleted` on every call. The current browser queue posts to a missing `/api/deliveries/sync`. Replace these gaps with the versioned mobile pipeline in [the contract reference](REFERENCE_Architecture_and_API.md).

1. Request an authorized media upload session for an evidence ID, MIME, size and checksum.
2. Upload to private object storage using the temporary signed URL; persist progress/result. Re-sign expired URLs without changing the evidence/operation IDs.
3. Finalize evidence server-side after verifying the stored object and ownership. Client-supplied public URLs are not evidence verification.
4. Submit the POD operation with finalized evidence IDs, line quantities, outcome and original assignment/stop-manifest/delivery concurrency tokens.
5. In a server transaction, authorize the assignment, validate the transition/revision, record the operation result, apply delivery/order/trip updates once and create the durable downstream event/outbox entry.
6. Return the operation ID, proof ID, canonical state/revision and server timestamp. Mark the local operation synced only after matching this response.

For an S3 outage, retain the private evidence locally, display the upload failure and retry/re-sign through the same evidence ID. Do not adopt the website plan's base64-in-Firestore fallback as an automatic alternative or mark proof synced without required evidence. Store private object references/evidence IDs; issue bounded view URLs on demand.

A server commit followed by a lost response is a normal retry case. Replaying the same operation with the same payload returns the recorded result; a changed payload with the same operation ID is rejected. Concurrent submissions for the same stop need a separate uniqueness/transition guard, even if they use different operation IDs.

Do not validate every proof against one trip progress counter. As defined in the reference, another stop's accepted completion does not invalidate this stop's unchanged assignment/manifest. True manifest/reassignment changes still produce conflicts. Never rewrite an immutable queued payload's original concurrency tokens merely to make replay pass.

## D. Conflict handling / M4

- [x] Show local proof versus current server order/manifest. Preserve both; never overwrite original quantities or signature to make a retry pass.
- [x] Create a scoped operations-review record with its own operation ID. A review request acknowledgment does **not** mean the underlying delivery is synced.
- [x] Support restricted historical-assignment intake when the stop was reassigned after capture. Verify the original actor against server-held assignment/release history; accept review metadata/evidence without allowing a new delivery mutation or revealing the replacement driver's route.
- [x] Operations resolves the mismatch through an authorized server workflow. Record who resolved it and any approved mapping/correction as an auditable follow-up.
- [x] Resume only after receiving the canonical resolution; retain original proof and resulting acknowledgment.
- [x] Display per-record failure details, evidence counts, local times, last successful sync and exact successful/remaining counts. Never show an all-clear while a record remains unsynced.
- [x] Keep attached files until accepted proof is verified and retention rules permit cleanup. Do not purge media merely because an HTTP request was attempted.

## Acceptance tests / exit gate

- [ ] Save POD in airplane mode; kill/relaunch; quantities, recipient, signatures and photos remain intact.
- [ ] Kill the app between file write, DB commit, upload and acknowledgment; recover without missing references or duplicate server updates.
- [x] Drop the response after server commit, then retry; trip counts and store delivery are updated once. (Automated service/worker evidence; not a physical-device rehearsal.)
- [ ] Complete two stops and fail one upload; successful count and remaining queue are correct.
- [x] Capture multiple stops offline from one route snapshot, then sync in order. Stop 1's accepted progress update must not falsely conflict unchanged Stop 2; an actual Stop 2 manifest/reassignment edit must still be detected. (Automated service/worker evidence; not a physical-device rehearsal.)
- [ ] Expire credentials during sync; retain proof and resume as the same user after sign-in.
- [ ] Change/reassign the order while offline; show conflict and preserve local evidence through operations reconciliation.
- [ ] Fill device storage or remove an attachment; show recovery and do not advance/claim success incorrectly.
- [x] A second device submits the same stop; enforce the chosen transition/conflict policy. (Automated service/worker evidence; not a physical-device rehearsal.)
- [ ] Record a closed/refused/skipped stop offline with no recipient; retain its reason and available evidence, then sync it without fabricating a signature or marking it delivered.
- [ ] Close out a trip with full/partial/closed stops: required operations must be accepted before canonical completion/next-trip eligibility. Lost closeout responses must not repeat completion effects.
- [ ] Report a breakdown offline, then reconnect after reassignment. Preserve earlier POD and submit it through the correct normal or historical-review path.

**Deliverables:** M3, unified M4, local schema/migrations, evidence store, sync worker, idempotent server services and automated failure tests.  
**Exit gate:** a real offline delivery with evidence reaches the correct dispatcher/store after reconnect, without data loss, duplicate effects or false sync labels.

## Execution evidence and remaining gate

Software/test evidence is recorded in [phase-2-7-verification.md](../waypoint-mobile/docs/phase-2-7-verification.md). The code paths above replace the original proposed helpers. No production deployment, signing credential, physical camera acceptance or human policy approval is claimed. Keep this phase open until its applicable remaining release checks pass.
