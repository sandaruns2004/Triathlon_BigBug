# Waypoint Flow generated assets

## Contents

- `brand/`: deterministic SVG logo mark, horizontal logo, route CTA background, and route-update micrographic.
- `web/`: generated illustrations for hero, authentication, planning, handoff, empty states, success, offline, and capacity constraints.
- `mobile/`: vertical splash, driver/store onboarding, login accent, offline illustration, plus purpose-reused route/receipt state assets.

## Asset map

| Plan ID | Final asset |
|---|---|
| W01 | `web/connected-delivery-hero-v2.png` |
| W02 | `web/auth-route-motif.png` |
| W03 | `web/planning-intelligence.png` |
| W04 | `web/connected-handoff-chain.png` |
| W05 | Deferred: must be captured from the real Dispatcher UI after implementation. |
| W06 | `web/no-active-route.png` |
| W07 | `web/no-orders-yet.png` |
| W08 | `web/delivery-complete.png` |
| W09 | `web/offline-records-safe.png` |
| W10 | `web/capacity-constraint.png` |
| W11 | `brand/route-line-background.svg` |
| M01 | `brand/waypoint-flow-mark.svg` |
| M02 | `mobile/splash-route.png` |
| M03 | `mobile/driver-onboarding-route-ready.png` |
| M04 | `mobile/store-onboarding-order-receipt.png` |
| M05 | `mobile/login-route-accent.png` |
| M06 | `mobile/no-assigned-trip.png` |
| M07 | `mobile/offline-records-safe.png` |
| M08 | `mobile/delivery-received.png` |
| M09 | `brand/route-update-micrographic.svg` |

## Production notes

- Use `web/connected-delivery-hero-v2.png`; the unversioned first hero remains only as an iteration record and should not be used.
- `web/` and `mobile/` image assets are generated PNG drafts. Confirm visual quality in the target composition before app integration and optimize/compress them to WebP or AVIF where appropriate.
- The logo and decorative route assets are hand-authored SVGs because identity marks and simple backgrounds need deterministic scalable output rather than generated raster art.
- `mobile/no-assigned-trip.png` and `mobile/delivery-received.png` intentionally reuse the matching clean web state illustrations; the interactive mobile compositions (splash, onboarding, login, offline) are mobile-specific.
- No fake dashboard screenshot was generated: create that preview from the real implemented UI after the frontend exists.
