# Local connected demo and real-device rehearsal

Updated 30 September 2026. This is an isolated demonstration, not production seeding or a submission video.

## Exact local environment

Firebase project demo-waypoint-mobile; Auth 127.0.0.1:9099; Firestore 127.0.0.1:8085; API 127.0.0.1:3000. Android emulator uses 10.0.2.2 for the host.

The [seed](../../waypoint-flow/scripts/seed-mobile-test.ts) provisions synthetic Driver, second Driver, Store OUT005, second Store OUT006, Dispatcher and Loader identities. It documents emulator-only credentials in test source; no real account is implied.

Stable demo records: TEST-TRIP-1 with TEST-STOP-1/2 linked to TEST-ORDER-1/2; TEST-TRIP-2 with TEST-STOP-3/TEST-ORDER-3; TEST-DEFERRED; milk cases and yoghurt trays. Service date is the actual Asia/Colombo business date at reset. This differs from the fixed UI fixture in assets/fixtures/route.json.

The test fixture is valid for scope, unit, depot, cold-chain and capacity checks. It is not a certified travel-time/arrival-window schedule. Some addresses are deliberately synthetic and have no coordinates.

## Start/reset

Only the demo project and loopback emulators are allowed. Preserve operational device evidence; the integration test clears records only for its synthetic test-driver/test-store accounts.

From waypoint-flow:

~~~powershell
$env:MOBILE_TEST_MODE='emulator'
$env:FIREBASE_PROJECT_ID='demo-waypoint-mobile'
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8085'
$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'
npx firebase emulators:start --only auth,firestore --project demo-waypoint-mobile --config firebase.mobile.json
~~~

In another shell with the same variables and an ephemeral local NEXTAUTH_SECRET, set NEXTAUTH_URL to the exact public browser origin, HOSTNAME=127.0.0.1 and PORT=3000; run npm run dev. Server credentials are unnecessary in this isolated emulator mode.

~~~powershell
npx tsx scripts/seed-mobile-test.ts
# Or seed AND load both stops through shared Loader services:
npx tsx scripts/prepare-mobile-device.ts
~~~

The prepare command intentionally skips manual D5 reporting; use the raw seed to rehearse shortfall/hold first. Do not execute both reset commands while a journey is running.

From waypoint-mobile:

~~~powershell
flutter run -d emulator-5556 --flavor development --dart-define-from-file=config/emulator.json
~~~

## Rehearsal

1. Sign in with provisioned synthetic accounts. Browser Dispatcher/Loader remain at the shared website; native Driver/Store use their own role homes.
2. Native Store creates a product/date/unit request. Observe the canonical order ID once. New requests target eligible future service dates; they enter planning on their service date, not automatically in today's fixed test trip.
3. For the released demo route, Loader reports a damaged line and optional photo. Driver start stays blocked. Dispatcher opens Operations control, selects approved quantities and reason; revised manifest is released only when all active stops are approved/loaded.
4. Dispatcher must assign and publish generated plans. Assignment/publication are separate from loading release.
5. Driver downloads the complete route. Start/stop forms require a new parked acknowledgment. Explain cached timestamp and actual status.
6. Disconnect the phone. Capture actual line quantities, recipient/photo and optional signature. Save locally; Sync Centre must show Saved on this phone rather than Synced.
7. Force-stop/relaunch on the target phone, verify retained draft/proof/media, reconnect and Sync now. Observe exact accepted/replayed UUID and canonical Store delivery.
8. Store confirms actual accepted quantities or reports affected-line discrepancy/photo. Open the stable DN note, four quantity stages and scoped proof image.
9. Dispatcher defers TEST-DEFERRED with reason and proposed date. Store reads/acknowledges it. Restore through Operations with a reason; history remains.
10. Finish actual stop outcomes and return/close out the trip. Trip 2 follows canonical completion/loading/publication. A failed/refused/skipped stop resolves differently from successful delivery.
11. In a separate isolated fixture, report breakdown, reassign after preserving proof and request historical review. Original Driver cannot use the replacement route. Operations may retain, request follow-up or approve a separate audited amendment.

API/domain tests automate these business/replay checks. Android integration uses a synthetic PNG and database reopen, not a real camera or physical force-stop. Label that difference when recording a demo.

## Hosted demonstration

Use verified HTTPS/client configuration and the chosen physical phone, keystore and private S3 bucket. Run the [release checklist](release-checklist.md) before claiming engineering acceptance. Record service date, account scopes, build checksum and canonical operation/order/proof/receipt IDs without exposing credentials.

Navigation is an external handoff. ETA and map points are last saved/estimated data; there is no continuous tracking. Optional push/background sync/iOS are deferred. Submission/publishing is a separate user-authorized action.
