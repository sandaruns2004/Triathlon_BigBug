# UI visual review — 1 October 2026

**Follow-up:** illustration framing, Store sample summary/activity, fixture/connected Profile hierarchy and real Sync Centre summary/offline-banner styling are now implemented. See [verification and remaining device checks](../waypoint-mobile/docs/ui-polish-verification.md). The observations below describe the initial review.

Compared the running Flutter fixture preview on port 4182 with `Docs-ui/mobile/mobile_index.html` and `Docs-ui/mobile/degradation_mobile.html`. Read both sources; inspected the HTML Driver/Store/Profile views and degradation reference in the browser. Inspected Flutter Store Home and Profile visually and their accessibility controls. This is a visual review, not connected-device acceptance.

**Verdict:** readable and usable as a fixture preview, but not yet as polished or complete visually as the HTML references.

## Looks good

- Waypoint green, pale backgrounds, clear headings, rounded cards and legible text are consistent with the reference direction.
- Main navigation remains readable; the visible Store label is Updates without the earlier word split. Its accessibility label remains Notifications.
- Actions are understandable, fixture identity is clearly marked, and the observed preview interactions produced no captured browser console errors.

## Remaining design gaps

1. **Store illustration scale:** visible artwork is small relative to its large white card. Reduce excess space around the asset or adjust artwork framing/scale so it balances the heading and paragraph. This is a visual polish issue, not a loading failure.
2. **Profile hierarchy:** the fixture Profile consists mostly of Local storage lab, Design catalogue and Leave fixture account, with substantial unused space. The HTML reference has an avatar/account card and grouped workspace/support actions. Separate demo tools from a polished account layout when designing the user-facing screen; do not add nonfunctional support actions simply to fill space.
3. **Store Home density:** the reference uses a prominent delivery summary, order/history actions and recent activity. The Flutter fixture has a simpler sample-order card and explanatory illustration. This is a preview design gap; it does not prove the connected native Store Home is missing its operational data.
4. **Degradation parity remains unverified:** the HTML M4 reference shows an amber offline banner, saved-record count, per-record status/evidence and clear reconnect behavior. The browser fixture intentionally cannot execute native protected storage/sync workflows. Compare the actual native offline, failure and conflict screens on a connected emulator/phone before approving visual parity. Do not fabricate sync success for the preview.

No app or HTML source was changed during this review. No new automated test run, physical-device acceptance or iOS verification is claimed. Existing [browser fixes/evidence](../waypoint-mobile/docs/chrome-page-review.md) remain separate. Phase 1 is **Implemented — verification pending** and Phase 7 is **In progress**.
