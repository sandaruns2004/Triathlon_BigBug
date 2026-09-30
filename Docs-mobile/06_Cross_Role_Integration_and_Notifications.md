# Phase 6 — Cross-role integration and notifications

**Execution status (30 September 2026): Implemented — verification pending.** Shared web/native services and durable recipient-scoped in-app updates are implemented and tested locally. MVP uses authenticated API refresh; sockets, push and background GPS are deferred. Verify deployed publisher/HTTPS operation and full UI rehearsal.
Progress is maintained in [00__Work_List.md](00__Work_List.md) under [the repository rule](../AGENTS.md).

## Implemented tricky code

Implemented entry points: [event publisher](../waypoint-flow/lib/mobile/service.ts), [publisher process](../waypoint-flow/scripts/publish-mobile-events.ts), [notifications](../waypoint-mobile/lib/features/connected/profile_notifications.dart).
~~~text
canonical transaction -> domain_events(published=false)
publisher transaction -> deterministic notification(event, recipient)
recipient sequence -> paginated API -> local cache + checkpoint transaction
~~~
Foreground/resume/manual refresh recovers missed updates. Anonymous socket forwarding was removed; core mutations do not depend on sockets. Optional push, socket rooms and continuous tracking are explicitly outside this MVP.

See [code recipes](CODE_Implementation_Recipes.md), [verification evidence](../waypoint-mobile/docs/phase-2-7-verification.md) and [the remaining release checklist](../waypoint-mobile/docs/release-checklist.md). Checked tasks record implementation; acceptance conditions requiring physical or hosted environments remain open.

**Outcome:** web operations and both native roles see coherent, recoverable updates from committed server state.  
**Dependencies:** Phases 3–5. **Estimate:** 1–2 working days. **Owners:** backend, Flutter and QA.

## Cross-role journeys

| Trigger | Native consequence | Required server work |
|---|---|---|
| Dispatcher publishes and assigns route | Driver gets the assigned route; Store sees planning confirmation | Stable assignment, revisioned route snapshot and scoped event |
| Loader reports a D5 shortfall | Driver remains waiting/on hold | Hold release until dispatcher resolution; do not treat report alone as approval |
| Dispatcher approves replacement/partial delivery | Updated approved driver manifest; appropriate store explanation | Resolution record, manifest revision and store update after decision |
| Dispatcher confirms D3 deferral | Store displays reason, proposed date and next action | Durable notification record; deliver only after transaction commits |
| Driver submits POD | Dispatcher sees real outcome; correct Store can receive | Transactional delivery/order updates and deduplicated notification |
| Store confirms receipt/reports issue | Driver/operations activity remains consistent; issue has an owner | Receipt/exception records and scoped timeline updates |
| Route changes while driver is offline | Comparison/conflict review preserves local proof | Revision conflict and operations reconciliation workflow |
| Driver reports breakdown/closed outlet | Operations gets an issue; Store gets an approved resolution | Exception validation and auditable response; no automatic silent deferral |
| Driver requests trip closeout | Trip summary reflects canonical state; next trip unlocks only when eligible | Accepted stop outcomes, closeout/return policy and deduplicated trip update |
| Store receipt is accepted | Store can open the digital delivery note | Stable scoped note/reference derived from proof and receipt |

## In-app updates first

- [x] Create durable notifications with event ID, recipient scope, entity ID, type, server time, read state and safe message text.
- [x] Write a domain event/outbox record in the same server transaction as the deferral, proof or receipt. A retrying publisher creates/delivers deduplicated recipient notifications after commit. Recover a crash between business commit and publication; do not rely on a one-time post-commit callback.
- [x] Fetch and cache notifications through the versioned API. Deep-link to the authorized order/trip/issue, including cold-start and signed-out cases.
- [x] Mark notifications read idempotently. Deduplicate repeated delivery/deferral events.
- [x] Poll or refresh on app resume and after mutations as the MVP recovery mechanism.

## Realtime channel — deferred from MVP

Baseline before Phase 6: the server accepted anonymous room joins and forwarded client-supplied events. This forwarding has been removed; the MVP exposes no socket rooms. Fix authentication, room authorization and server-owned event publication before exposing it to the mobile app.

- [ ] Verify native token/browser session at handshake and authorize depot, vehicle, outlet and user subscriptions from the server principal.
- [ ] Define versioned events containing entity ID/revision, event ID and server timestamp. Treat them as refresh signals; fetch authoritative state instead of trusting arbitrary client payloads.
- [ ] Rejoin authorized rooms after reconnect and refresh changes since the last checkpoint. Retain polling/manual refresh as fallback.
- [ ] Make deliveries/receipt/deferral changes durable through REST/server services; a socket emit is not proof of business completion.
- [ ] Resolve deployment topology: development uses the custom Socket.IO server, but the current production `start` script runs `next start`. The deployed process must intentionally serve the chosen realtime mechanism.

### Report-to-source event compatibility

The full report's Part 8 is a **target** taxonomy. The previous baseline `server.js` used `depot:{depot}` / `vehicle:{vehicleId}` and forwards only these client messages:

| Implemented input → output | Target contract / action |
|---|---|
| `driver:location` → `vehicle:location_update` | Map to versioned vehicle-position updates after assignment/coordinate/time validation |
| `store:new_order` → `dispatcher:order_placed` | Publish the signal from committed order creation, not an untrusted client claim |
| `loader:shortfall` → `dispatcher:shortfall_alert` | Publish from committed shortfall/hold service; resolve before release |
| No implemented full-lifecycle publication | Add server-owned start/POD/closeout, deferral, approved release/reassignment, breakdown/resolution and ETA signals as required |

Choose one versioned event vocabulary and document aliases for existing web consumers. Do not assume the report's `outlet:*`, `driver:*` and `loader:*` rooms already exist. Supply authenticated subscription scopes from the current principal. The current map uses same-origin `io()` and a hard-coded depot; both need environment/scope adapters if retained.

### Hosting decision agreed in Phase 2

For the MVP, HTTPS mutations plus API refresh/polling are the baseline. Choose and test realtime separately: a persistent Node socket service beside the Next.js API, or a supported function-based socket endpoint. Avoid rebuilding hosting just for a mobile demo.

The report's blanket Vercel incompatibility statement is outdated: current [Vercel WebSocket documentation](https://vercel.com/docs/functions/websockets) describes beta support, including Socket.IO with WebSocket transport, duration-bound connections and external shared state. This does not prove the existing custom `server.js` deployment works. Record the selected endpoint/path, compatible transport, authenticated reconnect and missed-event recovery in a hosted spike.

If scoped Firestore listeners are chosen, add an explicit read-model/security-rules design and tests; they are not present in the current client. Keep all operational writes behind validated server services. Schedule durable event publishing/ETA jobs through a tested worker or scheduler; do not depend on a request-local timer continuing after a function returns.

Socket.IO’s default delivery guarantees do not provide durable application event processing. Application acknowledgments, deduplication and missed-event recovery remain necessary. See [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/).

## Push and tracking — deferred after the MVP handoff

- [ ] Register device push tokens only after sign-in/permission, scope them to the user and remove/disassociate them on account change.
- [ ] Use push as a notification/refresh hint; maintain the in-app record even if push is denied or never delivered.
- [ ] Avoid sensitive proof/location details in lock-screen content. Validate deep links against the currently signed-in user.
- [ ] Add Firebase Cloud Messaging if included in release scope, following [Flutter client setup](https://firebase.google.com/docs/cloud-messaging/flutter/get-started).
- [ ] For initial tracking, use server ETA/last known status. Optional foreground driver location needs permission, assignment validation, freshness checks and a visible purpose.
- [ ] If replacing the report's simulated map positions, add a foreground location adapter with observed/server time and accuracy. Label real vs simulated/stale data, reject forged vehicle/depot IDs and expire stale positions. Do not claim continuous tracking from a last-known point.
- [ ] Defer continuous background GPS to a separate battery/privacy/platform review. Location failure must not block POD or offline route use.

## Integration test script

Run the same seeded order through these roles:

1. Store creates a real order; web Dispatcher sees it once.
2. Dispatcher plans/assigns; Loader finds the linked items in its checklist.
3. Loader reports damaged stock; start remains blocked until resolution.
4. Dispatcher approves adjusted quantities; Driver downloads the revised manifest.
5. Driver completes the parked stop in airplane mode; both web and store remain clear about not-yet-received proof.
6. Reconnect; the operation syncs once; Dispatcher and Store show the canonical outcome.
7. Store records receipt or issue; operations can identify the exact order/lines/evidence.
8. Repeat with a separate deferred order; Store receives the reason/revised date and restoration history.
9. Finish the driver trip; confirm canonical closeout and Trip 2 eligibility, then open the Store's digital delivery note.
10. In a separate fixture, report a breakdown; verify hold/affected-store updates and authorized recovery without losing already queued POD.

Also interrupt the socket connection and app process; updates must recover through API refresh without losing evidence or creating contradictory states.

Kill the notification publisher after a business transaction commits. On restart, its durable outbox must publish the missing update once, without repeating the delivery/deferral mutation.

**Exit gate:** cross-role updates are server-backed, scoped and replay-safe. Push/background tracking may be postponed, but in-app updates and recovery cannot be simulated in an operational release.

## Execution evidence and remaining gate

Software/test evidence is recorded in [phase-2-7-verification.md](../waypoint-mobile/docs/phase-2-7-verification.md). The code paths above replace the original proposed helpers. No production deployment, signing credential, physical camera acceptance or human policy approval is claimed. Keep this phase open until its applicable remaining release checks pass.
