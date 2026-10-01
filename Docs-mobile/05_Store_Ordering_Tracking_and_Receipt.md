# Phase 5 — Store ordering, tracking and receipt

**Execution status (30 September 2026): Implemented — verification pending.** Connected catalogue/order drafts, tracking/deferral/restoration, receipts/issues and scoped digital notes/photos are implemented. Complete the target-phone and hosted same-order planning-to-receipt rehearsal.
Progress is maintained in [00__Work_List.md](00__Work_List.md) under [the repository rule](../AGENTS.md).

## Implemented tricky code

### Review update — 1 October 2026

Status remains **Implemented — verification pending**. [Review evidence](../waypoint-mobile/docs/mobile-review-and-fixes.md).

- [x] Persist catalogue unit snapshots and change notices; require explicit review/re-entry for changed or unknown legacy-cart units.
- [x] Preserve unchanged cart quantities and safely save when leaving order/receipt forms.
- [x] Verify changed, unchanged and legacy cart restoration with widget tests.
- [ ] Complete the hosted/physical planning-to-receipt rehearsal.

Implemented entry points: [Store screens](../waypoint-mobile/lib/features/connected/store_pages.dart), [server order/receipt rules](../waypoint-flow/lib/mobile/service.ts), [private photo view](../waypoint-mobile/lib/features/connected/evidence_viewer.dart).
~~~text
receipt_recorded concurrency = receiptVersion + proofVersion
payload = all delivered line IDs/units + receivedQty + discrepancy reason
transaction = canonical receipt + stable DN reference + durable event
~~~
The server calculates order weight/volume and revalidates date/cut-off/catalogue. Rejected corrections receive a new reviewed UUID; uncertain responses retain the original UUID. Previously confirmed notes survive expiring photo URLs.

See [code recipes](CODE_Implementation_Recipes.md), [verification evidence](../waypoint-mobile/docs/phase-2-7-verification.md) and [the remaining release checklist](../waypoint-mobile/docs/release-checklist.md). Checked tasks record implementation; acceptance conditions requiring physical or hosted environments remain open.

**Outcome:** a Store Manager orders, tracks, receives and reports issues against the same server order used by operations.  
**Dependencies:** Phases 1–2; shared durable mutation pipeline from Phase 4; delivery acceptance testing needs Phase 4. **Estimate:** 2–3 working days.

## A. Store Home / M5

- [x] Read the authenticated outlet profile and its current/recent orders.
- [x] Select the most relevant incoming order rather than using static `ORD–2036`. Render planned, loading, on-route, delivered and deferred cards.
- [x] Provide New order, Order history, Confirm receipt and Report issue as discoverable actions.
- [x] Show actionable cut-off, awaiting-receipt and issue-response notices. Hide fleet-planning complexity.
- [x] Use no-delivery and empty-order states that explain the next step. Retain a labelled cached view when disconnected.
- [x] Add a timeline and unread notification count scoped to the outlet.

## B. Catalogue and order composer / M6

Baseline before Phase 5: the create-order API trusted client totals and assigns tomorrow automatically. Backend validation must be extended before the native composer is operational.

- [x] Add server catalogue data with product IDs, units, allowed quantities, brand, handling class, weights/volumes and availability revision.
- [x] Add eligible service dates/windows, current cut-off and non-operating-day rules. Apply `Asia/Colombo` business time consistently.
- [x] Build searchable catalogue, quantity steppers, cart badge, delivery date/window and note/reference entry.
- [x] Persist the draft by user/outlet; a restart or form interruption restores it. The cart is not a submitted order.
- [x] Review lines, units, handling, requested window and notes before submitting. Make the shortage/capacity disclaimer clear: ordering does not reserve fleet capacity.
- [x] Send product IDs/quantities/date/window and a stable operation ID. Server computes totals and validates brand/outlet/handling rules; reject forged weight or volume.
- [x] Handle duplicate taps and uncertain responses through idempotency. Display `Submitted · Awaiting plan` only after receiving the canonical order ID.
- [x] If submission is queued offline, show `Order request saved on this phone` until accepted. Freeze the reviewed payload; reconnect may require re-review if catalogue, cut-off or date eligibility changed.
- [x] Retain rejected drafts with a specific repair path. Do not silently substitute products, quantities or requested dates.

## C. Tracking and deferrals

| Server situation | Store-facing behavior |
|---|---|
| Pending planning | Submitted / Awaiting plan; requested date is not a confirmed ETA |
| Planned or loading | Route confirmation/handling update with timestamp |
| On route | ETA/window with freshness indicator, relevant arrival notice |
| Breakdown or delay | Timestamped explanation and ETA freshness; revised service date only after approved operations decision |
| Partial/full delivery | Actual delivery summary and line quantities; receipt action available according to server policy |
| Deferred | Reason category, permitted note, proposed revised date, acknowledge/contact/business-impact actions |
| Restored to planning | Explicit restoration update; distinguish proposal from confirmed service date |
| Issue reported | Issue reference, current owner/state and response history |

- [x] Implement one order-detail repository for Home, Orders, notification links and tracking.
- [x] Show real source timestamps and a stale-data indicator; avoid promising live GPS/ETA when the last update is old.
- [x] Make the D3 deferral branch prominent. Mobile consumes a dispatcher decision; the store does not independently defer an order or select a truck.
- [x] Persist timeline/notification read state on the server and cache it locally.

## D. Receipt and issue reporting

- [x] Add a receipt API with server eligibility checks, order revision, line-level ordered/delivered/accepted quantities, discrepancy reasons, actor/time and idempotency.
- [x] Compare against actual driver proof and loader adjustments, not the original order alone. Distinguish partial delivery from a receipt discrepancy.
- [x] Expose Confirm receipt and Report issue with equal visibility. Let users confirm accepted quantities and record an associated issue without erasing delivery history.
- [x] Add issue categories: missing, wrong quantity, damaged, temperature concern, other. Require affected lines and a note where appropriate; support optional photo.
- [x] Reuse the durable media/outbox pipeline. Offline receipts remain `Saved on this phone` and cannot appear server-confirmed.
- [x] Record manager identity from authentication, not an editable name field.
- [x] Create operations exceptions and notifications from server-committed mutations, retaining the original driver record.

## E. Digital delivery note

The full report promises a digital delivery note after receiving goods. Include a readable in-app record in the native scope; downloadable PDF/export can follow later.

- [x] Add a scoped delivery-note read contract derived from canonical POD/receipt records. Return its stable reference, order/outlet, trip, timestamps and receipt state.
- [x] Show ordered, loader-approved, driver-delivered and store-accepted quantities per line with units. Retain shortfall/partial-delivery explanations and linked issue references.
- [x] Link permitted proof/attachments through authenticated, temporary access. Never expose another outlet's evidence or treat an expired signed URL as a lost note.
- [x] Show `Receipt saved on this phone` while offline; display a server-confirmed note/reference only after receipt acknowledgment. Cache previously confirmed notes with their revision/time.
- [x] Preserve prior proof and amendments as history. A note can show a reported discrepancy without pretending it has been resolved.

## Acceptance checks

1. A Fresh store sees only its permitted catalogue/outlet records; attempts to submit another outlet ID fail server-side.
2. Invalid dates, non-operating days, passed cut-offs, quantities and forged totals are rejected with repair instructions.
3. Draft survives restart; uncertain submit/retry creates one order.
4. Dispatcher deferral reaches the matching order with reason/date, and restoration preserves its history.
5. Driver delivery of the fixture order enables a real Store receipt with the actual quantities.
6. Wrong quantity/photo issue reaches operations; the original proof remains intact.
7. A server update while a receipt draft is open requires re-review and does not erase the draft.
8. A confirmed receipt exposes the correct digital note/reference and four quantity stages; retry does not create duplicate notes or erase an open issue.

**Deliverables:** native Store tabs, catalogue/order draft, tracking/deferred screens, receipt/issue forms, delivery-note view and their server services.  
**Exit gate:** one canonical server order completes Store creation → Driver delivery → Store receipt/issue without static demonstration data.

## Execution evidence and remaining gate

Software/test evidence is recorded in [phase-2-7-verification.md](../waypoint-mobile/docs/phase-2-7-verification.md). The code paths above replace the original proposed helpers. No production deployment, signing credential, physical camera acceptance or human policy approval is claimed. Keep this phase open until its applicable remaining release checks pass.
