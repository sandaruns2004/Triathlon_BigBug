# Waypoint Flow mobile frontend

Open `mobile_index.html` directly in a modern browser, or serve the repository and visit `/Docs-ui/mobile/mobile_index.html`. No build step or external library is required. Keep the supplied assets in `../items/generated-assets/`.

On a phone, the app fills the viewport with a fixed bottom navigation and scrolling content. On wider screens, it appears in a phone frame beside the Driver / Store demo switch. On mobile, switch workspaces from Profile.

## Implemented flows

- Driver Today, loader-release and no-assignment preview states, trip-start acknowledgment, route overview, navigation handoff, and parked-state delivery entry.
- Three-step delivery recording with quantities, required discrepancy reasons, recipient, optional photo, review, and locally stored completion records.
- Persistent delivery drafts, cart, order drafts, receipt records, issue records, and a simulated offline/sync queue. Reloading restores saved data.
- Store home, searchable catalogue, quantity controls, order review/submission, tracking timeline, receipt confirmation, and issue reporting.
- Profile, onboarding using the supplied driver/store artwork, and illustrative sign-in, reset-request, and invitation-required activation screens.

## Prototype boundaries

All operational data is illustrative. The driver route has three sample stops with 26 packs per stop. The store receipt uses a separate delivered sample order. Driver and store records do not represent a connected backend.

Local persistence uses the browser's local storage. Evidence photos are limited to JPG, PNG, or WebP under 2 MB; larger combined records may hit browser quota limits. Save failures are shown instead of claiming success. Data is not encrypted or backed up; use sample information only. Direct-file storage behavior varies by browser.

The offline switch demonstrates loss of connectivity inside the app. There is no service worker or installable PWA, so offline cold starts of an HTTP-hosted page are not guaranteed. Open the downloaded HTML and its asset folder locally when no network is available. “Simulate sync” only changes local demo status; it never uploads records. Authentication and recovery do not contact a server.

Google Maps opens only when the user selects “Open navigation”; it searches the sample outlet address and requires an internet connection.

## Validation

Verified JavaScript syntax and asset loading. Browser checks covered the required parked acknowledgment, hidden delivery controls during travel, discrepancy reason validation, partial delivery review, delivery persistence after reload, disabled sync in offline mode, simulated queue completion, empty-cart validation, order submission, and receipt confirmation. Responsive overflow and bottom navigation were checked at phone widths.
