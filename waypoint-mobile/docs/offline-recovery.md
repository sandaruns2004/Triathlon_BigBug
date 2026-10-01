# Offline recovery and retained evidence

Updated 30 September 2026. Driver/Store native storage is operational. Browser fixture preview is not a substitute for native storage.

## Capture and save

1. Download an authorized complete route. Cache transaction success precedes the saved timestamp.
2. Reconfirm parked before detailed delivery entry. Draft fields are owner-scoped, serialized and encrypted.
3. Camera context is saved before opening image_picker. Interrupted capture recovery binds results to that user/draft; no shared-device reassignment of evidence.
4. Images are constrained to JPEG/PNG, max 2 MB and three photos. The app imports them into persistent encrypted app-owned files using flush plus rename before referencing them.
5. Proof and outbox commit in one insert-only SQLite transaction. Save failure retains the prior draft and never claims completion.
6. Local completion is labelled Saved on this phone. It is separate from canonical stop outcome and Synced.

Signature remains in encrypted proof. SQLite IDs/status/timestamps are plaintext metadata; this is payload encryption, not whole-database encryption. App backup/device transfer is excluded.

## Worker guarantees

An owner-bound 90-second database lease with 25-second heartbeat prevents overlapping workers. Stable original UUID, observedAt, payload, versions and evidence IDs survive retry/reopen.

Departure dependencies precede POD. Finalized media precedes evidence-dependent submission. Closeout depends on the relevant accepted records; local stop counts cannot unlock another trip. Independent records can succeed when another fails.

Foreground timer (30 seconds), app resume/start and manual Sync now trigger work. There is no guaranteed background worker; closing the app pauses transfer. Reopen or use manual sync after reconnection.

HTTP reachability determines success. A Wi-Fi icon is not a server acknowledgment. Retryable errors use bounded exponential backoff; randomized jitter remains pending. Manual retry bypasses the waiting time but retains UUID/payload.

The transport passes the original user to the API interceptor. Token acquisition/401 refresh cannot switch a pending mutation to a different account. Local owner scope and server concurrency.ownerScope also prevent replay after role/depot/outlet changes.

## Failure actions

| State | Recovery |
|---|---|
| queued/uploading/submitting/retryableError | Keep files; reopen/connect and Sync now |
| authRequired | Sign in as the same account/scope; operations must approve recovery if role/outlet changed |
| conflict | Compare original and authorized server stop; request operations review |
| rejected | Review server reason; create a new corrected copy, preserving the original |
| awaitingOperations | Refresh review status; intake acknowledgment is not delivery success |
| retainedForAudit | Original remains unsynced audit evidence; view resolution/amendment rather than retrying it |
| synced | Exact accepted/already_applied receipt saved; still retain files until approved retention allows cleanup |

Do not change an immutable payload's revision to bypass a conflict. Operations can retain, request follow-up or approve a separate audited amendment. Only a follow-up/rejected correction may create a new reviewed UUID; uncertain response replay uses the original UUID.

A response can be lost after commit. Replaying the exact original returns already_applied; canonical stop/order/trip counts are not repeated. Two different UUIDs cannot complete an already-resolved stop.

## Account lock and missing data

Offline restore requires a prior connected SDK sign-in, matching cached provider/application identity, valid 12-hour credential lease and acceptable clock. First sign-in requires network. Expiry locks protected screens and retains proof. Server revocation cannot be discovered while unreachable; online current-profile checks enforce it when a response is available.

Sign-out warns about saved work, clears visible identity and locks data. It does not delete per-user keys or unsynced media. User B cannot view or replay User A's cache/proof. Navigation is recreated on account/scope change.

A missing secure-storage key fails closed. Do not generate a replacement over existing encrypted records. A missing/corrupt attachment is an actionable local failure, not Synced. Do not uninstall or clear app data on an operational phone with pending work.

No automatic accepted-media cleanup is enabled. Orphan or .pending files can remain after an interrupted file/DB boundary; preserve them until an approved recovery/retention process can prove they are unreferenced. The app does not silently purge them.

## Evidence versus remaining device checks

iOS support was added on 1 October. Android-only lost-camera recovery is skipped on iOS; interrupted capture preserves the saved form/earlier photos and asks the user to take the missing photo again. Camera denial retains the form. These branches have shared-code tests, but actual camera/OS termination behavior still requires iPhone acceptance. Keychain/file protection is described in [iOS setup](ios-setup-and-release.md); no background transfer guarantee was added.

Automated tests cover failed transactions, migration, key loss, account isolation, expired lease, double taps, dependency order, wrong acknowledgments and lost-response replay. Android integration closes/reopens actual SQLite and secure-storage files and syncs real test APIs.

These tests do not certify camera permission denial, actual force-stop at every boundary, airplane-mode cold start, OS keystore/backup restoration or device-full behavior. Follow the [release checklist](release-checklist.md) on the selected physical phone.
