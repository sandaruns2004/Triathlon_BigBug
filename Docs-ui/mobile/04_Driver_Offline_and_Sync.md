# Mobile — Offline Delivery & Sync

## Failure scenario: connectivity drops during delivery

## Why it matters

Driver work cannot stop just because coverage does. Proof, delivery outcomes, and exception details must remain trustworthy and must reconcile cleanly when the connection returns.

## Offline banner

A persistent amber-but-calm banner says: `You’re offline. Your route and delivery records are available on this phone.` It shows queued item count and `Last synced 07:42`. It never blocks the basic route, parked-stop, or proof flow.

## Sync centre layout

- **Status:** connection state, last sync, queued records, and storage/security reassurance.
- **Queued actions list:** each record displays stop, action type, local timestamp, evidence count, and `Saved on this phone`.
- **Sync controls:** automatic retry when online; `Sync now` only when a connection exists. A failed record exposes a readable issue and `Retry`.
- **Conflict resolution:** where the dispatcher has changed the route/order while the driver was offline, preserve both records, show the difference, and instruct the driver to contact operations rather than silently overwriting proof.

## Reconnection behaviour

On successful sync, show `4 records synced` with a link to activity. If a partial failure occurs, clearly identify the unsynced item; do not show a misleading all-clear success message.

