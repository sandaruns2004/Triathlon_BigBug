# Phase 3 — Visual Assets, Mobile Adaptation & Icon System

## Scope and creative north star

This plan extends Waypoint Flow’s **Calm operational clarity** direction. Visuals exist to explain a product moment—connected deliveries, a state with no data, successful completion, or safe recovery—not to decorate every panel.

All image-generation prompts below belong to one illustrated world:

- **Brand character:** reliable, practical, precise, and quietly premium.
- **Visual language:** clean editorial vector illustration with geometric forms, simplified Sri Lankan retail/distribution context, fine route lines, restrained depth, and generous breathing room.
- **Palette:** white `#FFFFFF`, evergreen `#146B45`, action green `#1F8A5B`, pale green `#EAF6EF`, ink `#17221D`, muted grey `#63716A`, border grey `#DCE5DF`; amber only for attention or disruption.
- **Line and shape:** 2 px-equivalent rounded linework, 10–14 px-equivalent rounded geometry, subtle flat tonal layering. No photorealism is required.
- **Consistency rule:** use the same vehicle silhouette, outlet shape, route-line language, and perspective across every illustration. Prefer SVG/vector delivery; use a raster only when a photographic/complex texture is genuinely needed.
- **Do not use:** generic AI SaaS blob art, neon gradients, glassmorphism, sci-fi HUDs, stock delivery-driver photography, floating 3D emoji, illegible micro-labels, brand logos other than Waypoint Flow, or arbitrary colors.

## Website visual inventory

| ID | Asset | Purpose and placement | Recommended format | Dimensions / ratio | Priority |
|---|---|---|---|---|---|
| W01 | Connected delivery hero | Public landing-page hero, right of product statement | SVG or high-resolution transparent WebP | 3:2, 1440 × 960 | High if a marketing site is in scope |
| W02 | Auth route motif | Desktop authentication pale-green side panel | SVG | 4:5, 720 × 900 | High |
| W03 | Planning intelligence feature visual | Product/feature section explaining planning constraints | SVG | 4:3, 960 × 720 | Medium |
| W04 | Handoff chain visual | About/product-explanation section | SVG | 16:9, 1440 × 810 | Medium |
| W05 | Dispatcher dashboard preview | Landing/CTA proof of product capability | UI-rendered composition, not an AI illustration | 16:10, 1440 × 900 | High after UI exists |
| W06 | No active route | Driver/operations empty state | SVG | 1:1, 480 × 480 | High |
| W07 | No orders yet | Store order empty state | SVG | 1:1, 480 × 480 | Medium |
| W08 | Delivery complete | Success receipt/confirmation state | SVG | 1:1, 480 × 480 | High |
| W09 | Offline records safe | Driver offline/sync status state | SVG | 4:3, 720 × 540 | High |
| W10 | Capacity constraint | Deferral/loading shortfall explanatory panel | SVG | 4:3, 720 × 540 | High |
| W11 | CTA route-line background | Restrained final-call-to-action background | SVG/CSS pattern | 16:5, 1600 × 500 | Low |

## Website image-generation prompts

### W01 — Connected delivery hero

**Purpose / placement:** landing-page hero, placed on the right side of a split hero while headline, supporting text, and CTA sit on the left.

**Prompt:**

> Create a premium editorial vector illustration for “Waypoint Flow”, a Sri Lankan retail delivery-planning platform. Subject: one compact refrigerated delivery vehicle travelling along a clearly connected evergreen route from a depot to three simplified retail outlets, with a subtle planning layer that shows an order card, a capacity indicator, and a completed delivery check. Composition: landscape 3:2, vehicle and route network concentrated in the right two-thirds; preserve the entire left third as uncluttered white negative space for landing-page headline and buttons. Perspective: slightly elevated isometric/orthographic three-quarter view, not a dramatic camera angle. Art direction: clean geometric operations illustration, 2 px-equivalent rounded linework, precise soft shapes, minimal depth layers, quietly premium and human-centered. Lighting: soft diffuse daylight with no hard shadows. Palette: white background; evergreen #146B45, action green #1F8A5B, pale green #EAF6EF, ink #17221D, border grey #DCE5DF; one tiny amber status accent only if needed. Background: mostly white with one very faint pale-green route grid. Detail: medium; every object should remain understandable at half size, with no small readable text. Negative space: large clear left side and comfortable margins. Intended UI location: desktop marketing landing-page hero. Aspect ratio: 3:2. Avoid photorealism, stock-photo people, excessive maps, generic AI blobs, neon, purple/blue gradients, glass panels, floating 3D icons, dense data labels, and unrelated logos.

### W02 — Authentication route motif

**Purpose / placement:** subtle illustration on the pale-green left/side panel of desktop sign-in and activation pages. The form occupies the opposite side.

**Prompt:**

> Create a restrained vertical vector artwork for the Waypoint Flow desktop authentication panel. Subject: an abstract connected route beginning at a minimal depot mark, passing through small outlet nodes, and ending in a simple completion/check node. Composition: tall 4:5; route arcs gently from lower left to upper right with the visual weight in the centre-left, leaving the outer edges and lower section calm. Perspective: flat editorial diagram, no camera perspective. Art direction: refined geometric line illustration; the same rounded route line, outlet geometry, and vehicle cue used across the Waypoint Flow illustration family. Lighting: flat, no lighting effects. Palette: pale green #EAF6EF background; route and key nodes in deep green #146B45 with restrained action green #1F8A5B, very low-opacity ink details. Background: clean pale-green field with subtle grid/noise texture at extremely low opacity. Detail: low. Negative space: preserve broad calm areas for the logo and phrase “Connected delivery operations”. Intended UI location: left side of desktop authentication pages. Aspect ratio: 4:5. Avoid people, realistic maps, text, large vehicles, gradients, glassmorphism, decorative blob shapes, or any visual that competes with a login form.

### W03 — Planning intelligence feature illustration

**Purpose / placement:** feature section that explains valid vehicle allocation, route planning, temperature requirements, and capacity without showing a fake dashboard.

**Prompt:**

> Create a clean 4:3 editorial vector feature illustration for Waypoint Flow’s “Plan with confidence” section. Subject: a route-planning board concept with three vehicle cards, an assigned order route, a refrigerated-vehicle snowflake badge, weight and volume capacity bars, and one visible constraint resolved successfully. Composition: planning canvas is centred; leave a generous lower-right negative-space area for adjacent UI copy or caption. Perspective: near-flat three-quarter/isometric, with cards aligned to a precise grid. Art direction: modern logistics operations design, geometric and sparse, with 2 px-equivalent rounded strokes and no text smaller than a simple icon/line marker. Lighting: soft flat layers with a restrained shadow beneath major cards. Palette: white, #146B45, #1F8A5B, #EAF6EF, #17221D, #DCE5DF; a small amber warning converted to green resolution. Background: white with a faint route line, no scenery. Detail: medium-low; recognizable at small web size. Intended UI location: public website feature section. Aspect ratio: 4:3. Avoid fake analytics charts, overfilled UI, illegible words, blue/purple palettes, neon, human portraits, and generic SaaS illustrations.

### W04 — Connected handoff chain

**Purpose / placement:** product explanation/about section showing how all four roles use one connected system.

**Prompt:**

> Create a wide 16:9 vector diagram-style illustration for Waypoint Flow showing the connected delivery handoff: Store Manager places an order → Dispatcher plans a vehicle trip → Loader checks goods at a dock → Driver completes delivery → Store Manager confirms receipt. Composition: left-to-right horizontal sequence of five simple role/action vignettes connected by one continuous evergreen route line; preserve generous top and bottom white space and keep all elements centered within a safe area. Perspective: flat editorial with subtle three-quarter object angles; no detailed people faces. Art direction: premium, minimal logistics storytelling; repeated geometric shapes, consistent outlet, vehicle, parcel, and checkmark motifs. Lighting: flat soft tonal layering. Palette: white background, deep green #146B45, action green #1F8A5B, pale green #EAF6EF, ink #17221D, muted grey #63716A; amber only for a small exception branch that resolves. Detail: medium-low, with no readable text inside illustration. Intended UI location: desktop product explanation / about section. Aspect ratio: 16:9. Avoid isolated disconnected dashboards, thick gradients, random icons, photorealistic people, country maps, visual clutter, or a generic supply-chain infographic look.

### W05 — Dispatcher dashboard preview

**Purpose / placement:** high-trust product preview in marketing/CTA sections. This should be generated from the real implemented UI after Phase 4, not from an image model.

**Production direction:** render the actual Dispatcher Operations screen in a seeded demonstration state; crop it into a browser frame only if the surrounding page needs device context. Use vector/UI primitives, source data, and CSS—not an AI-generated mock dashboard. Show an operations health strip, a restrained route map, exception queue, and trips table. Keep text in HTML or the image source rather than asking an image model to generate legible text.

**Fallback concept prompt, only for an early non-production placeholder:**

> Create a clean desktop software-interface preview for Waypoint Flow, a delivery operations control tower. Subject: a 1440 px browser-like dashboard with a left navigation rail, “Today’s operations” title, a top health strip, a route map, exception queue, and trips table. Composition: balanced 16:10 interface view, nearly front-on, with no perspective distortion; include comfortable white margins around the browser frame. Art direction: highly realistic product UI visualization using Waypoint Flow’s white, evergreen #146B45, action green #1F8A5B, pale green #EAF6EF, ink #17221D, and border #DCE5DF system. Lighting: none; UI screenshot aesthetic. Background: white or pale green. Detail: medium, but do not depend on any generated text being readable. Intended UI location: landing-page product preview. Aspect ratio: 16:10. Avoid fake unreadable paragraphs, overstuffed analytics, dark mode, gradients, unrelated branding, or glossy 3D browser frames.

### W06 — No active route empty state

**Purpose / placement:** Driver Today no-assignment state and optional dispatcher no-published-routes state.

**Prompt:**

> Create a small 1:1 vector empty-state illustration for Waypoint Flow. Subject: a parked compact delivery vehicle at a depot beside a simple route line that gently fades into a dashed future path, with one small schedule card and a calm clock cue. Composition: centred subject with generous white space around all sides; no UI frame. Perspective: modest three-quarter/isometric. Art direction: minimal, reassuring operational vector illustration with rounded 2 px linework and the same vehicle/depot geometry as other Waypoint Flow assets. Lighting: flat soft layering. Palette: white, pale green #EAF6EF, deep green #146B45, action green #1F8A5B, muted grey #63716A. Background: transparent preferred, otherwise white. Detail: low. Negative space: all edges clear for nearby empty-state copy and a refresh action. Intended UI location: web/mobile no-active-route state. Aspect ratio: 1:1. Avoid sad characters, error-red emphasis, busy maps, text, gradients, or decorative objects.

### W07 — No orders yet empty state

**Purpose / placement:** Store order history or first-time order list state.

**Prompt:**

> Create a compact 1:1 vector empty-state illustration for Waypoint Flow’s store manager experience. Subject: a simple retail outlet counter/storefront with an empty reusable delivery crate, a small order document card, and a subtle plus symbol formed by the route-line system. Composition: centred with an intentionally open upper and lower margin. Perspective: flat to slight three-quarter view. Art direction: clean geometric editorial vector style; calm, practical, and consistent with Waypoint Flow’s delivery vehicle and outlet motifs. Lighting: flat, soft tonal layers only. Palette: transparent or white background, pale green #EAF6EF, deep green #146B45, action green #1F8A5B, ink #17221D, grey #DCE5DF. Detail: low. Negative space: leave broad clear area for “Create your first order” copy and button. Intended UI location: desktop/mobile store order empty state. Aspect ratio: 1:1. Avoid shopping-cart imagery, retail product photography, text, gradients, people, or generic ecommerce styling.

### W08 — Delivery complete success state

**Purpose / placement:** receipt confirmation, successful proof of delivery, or task completion.

**Prompt:**

> Create a polished 1:1 vector success-state illustration for Waypoint Flow. Subject: a delivery crate or document handoff arriving at a simplified outlet, connected by a continuous route line that ends in a confident geometric checkmark. Composition: the checkmark and received goods are central; keep clean edges and upper space for a success heading. Perspective: slight isometric/three-quarter editorial view. Art direction: premium minimal logistics vector illustration, precise rounded linework, no cartoon expression. Lighting: soft flat tonal layers with a tiny restrained green glow-free highlight. Palette: white/transparent background, deep green #146B45, action green #1F8A5B, pale green #EAF6EF, dark ink #17221D; no amber or red. Detail: low-medium. Intended UI location: receipt confirmation and proof-of-delivery success states. Aspect ratio: 1:1. Avoid confetti, trophies, oversized checkmarks, emoji style, gradients, or celebratory clutter.

### W09 — Offline records safe

**Purpose / placement:** Driver Sync Centre and explanatory offline state.

**Prompt:**

> Create a reassuring 4:3 vector status illustration for Waypoint Flow’s offline delivery workflow. Subject: a mobile phone containing a locally saved delivery record, linked by a dashed route line to a small cloud/sync symbol that is temporarily disconnected; include a shield/check cue showing records remain safe. Composition: phone positioned slightly left of centre, with clear right-side negative space for offline status text and a retry action. Perspective: front-facing phone with small flat three-quarter supporting objects. Art direction: minimal professional operations illustration, geometric, not a generic cybersecurity image. Lighting: flat soft layers. Palette: white background, pale green #EAF6EF, deep green #146B45, action green #1F8A5B, muted grey #63716A, one limited amber connection indicator. Detail: low-medium. Intended UI location: desktop help panel and mobile sync centre. Aspect ratio: 4:3. Avoid red danger imagery, padlock overload, blue cloud stock-illustration style, gradients, text, or panic-driven visuals.

### W10 — Capacity constraint / deferral

**Purpose / placement:** Deferral explanation or loading shortfall state, where a transparent decision must be made.

**Prompt:**

> Create a 4:3 editorial vector illustration for Waypoint Flow’s capacity-constraint explanation. Subject: a refrigerated vehicle capacity card that is nearly full, one unassigned order card, and two alternate route options represented by fine route lines; show a calm decision/impact cue rather than a failure explosion. Composition: vehicle capacity is central-left, order/decision card on right, with a lower-right clear area for an explanatory message and action. Perspective: near-flat three-quarter view. Art direction: precise, minimal logistics operations graphic; show that constraints are understandable and resolvable. Lighting: soft flat layers. Palette: white, pale green #EAF6EF, evergreen #146B45, ink #17221D, border grey #DCE5DF, a controlled amber accent for “needs decision”. Detail: medium-low. Intended UI location: deferral/shortfall education panel. Aspect ratio: 4:3. Avoid red alarm imagery, frustrated people, text, heavy charts, generic warning triangles, neon, or unconnected decorative elements.

### W11 — CTA route-line background

**Purpose / placement:** a final public-site CTA or section divider, never behind dense content.

**Prompt:**

> Create an extremely subtle wide 16:5 SVG-style background pattern for a Waypoint Flow call-to-action section. Subject: a continuous thin route line connecting a few abstract depot and outlet nodes, with occasional small arcs indicating movement. Composition: route flows horizontally along the lower third and outer edges, leaving the central top/middle completely calm for headline and button content. Perspective: flat. Art direction: refined technical editorial pattern, barely-there and premium. Lighting: none. Palette: very pale green #EAF6EF field, route line in #146B45 at 8–12% opacity, small #1F8A5B accents at 10–15% opacity. Background: pale green, no texture stronger than 2% noise. Detail: very low. Intended UI location: desktop responsive CTA background. Aspect ratio: 16:5. Avoid large objects, text, logos, visible gradients, blobs, grids that compete with copy, or animation baked into the asset.

## Mobile asset plan

Mobile artwork is composed for narrow vertical surfaces, fast recognition, and safe touch flows. It is not a crop of desktop artwork.

| ID | Asset | Purpose and placement | Format | Dimensions / ratio |
|---|---|---|---|---|
| M01 | Adaptive app icon | iOS/Android launcher icon | SVG source → platform PNG set | 1:1 master, 1024 × 1024 |
| M02 | Splash graphic | Launch state while session initializes | SVG/vector composition | 9:16, 1080 × 1920 |
| M03 | Driver onboarding: route ready | First-use driver education | SVG | 9:16 safe-area composition |
| M04 | Store onboarding: order to receipt | First-use store education | SVG | 9:16 safe-area composition |
| M05 | Mobile login route accent | Sign-in / activation background accent | SVG | 9:16, 1080 × 1920 |
| M06 | No assigned trip | Driver Today empty state | SVG | 1:1, 480 × 480 |
| M07 | Offline saved safely | Sync Centre visual | SVG | 4:5, 720 × 900 |
| M08 | Delivery received | Mobile receipt confirmation | SVG | 1:1, 480 × 480 |
| M09 | Route update / status micrographic | Non-blocking status card | SVG/Lottie optional | 1:1, 192 × 192 |

## Mobile prompts and recommendations

### M01 — Adaptive app icon

**Recommendation:** implement as a custom SVG master, then export platform-compliant PNG sizes. Preserve at least 20% optical safe margin; validate at 16 px, 32 px, and 60 px. Do not use an image-generated icon as the production source.

**Logo/app-icon concept:** an abstract **W-route mark**: one continuous rounded route line creates a compact angular “W”; its terminal dots represent depot and outlet, and the central forward segment suggests a check/progress path. It has a distinctive silhouette at tiny size and relates directly to the delivery handoff.

**Exploration prompt:**

> Create a minimal geometric app-icon concept for “Waypoint Flow”, a connected retail delivery-planning platform. Subject: an abstract W made from one continuous rounded route line, with two tiny terminal nodes and a subtle forward/check direction in the central valley. Composition: centred icon-only mark in a perfect square with generous optical safe margin; no wordmark. Perspective: flat vector. Art direction: precise, premium, simple enough to recognize at 16 px; consistent 2 px-equivalent line logic but with solid simplified shapes where needed for small-size legibility. Lighting: none. Palette: deep evergreen #146B45 background with pale green #EAF6EF or white mark; provide inverse white-background version with evergreen mark. Background: solid only. Detail: extremely low. Intended UI location: iOS/Android adaptive icon, favicon, notification badge. Aspect ratio: 1:1. Avoid trucks, maps, letterforms that look like generic Wi-Fi, 3D, gradients, drop shadows, tiny text, circles enclosing the mark, or generic location pins.

### M02 — Splash-screen graphic

**Purpose / placement:** app launch while securely restoring session or offline records. The native splash should remain lightweight; central logo must still work without illustration.

**Prompt:**

> Create a vertically composed, minimal splash-screen background for the Waypoint Flow mobile app. Subject: the abstract W-route mark centered in the upper-middle region, with one very subtle continuous route line travelling vertically from a depot node near the bottom to a destination node near the top. Composition: 9:16, reserve the central 35% for the logo and app name, with all route detail kept low contrast and away from Android/iOS status and gesture safe areas. Perspective: flat vector. Art direction: calm, premium, low-detail technical editorial design. Lighting: none. Palette: white background with pale green #EAF6EF route shapes, deep green #146B45 logo, one limited #1F8A5B accent. Background: white with optional 1–2% soft texture/noise. Detail: extremely low. Negative space: broad and central. Intended UI location: mobile splash screen, 1080 × 1920. Avoid loading-progress promises, text other than optional Waypoint Flow name, gradients, background imagery, objects, shadows, busy map lines, and any detail that may be cropped by device safe areas.

### M03 — Driver onboarding illustration

**Purpose / placement:** first-use driver onboarding, paired with copy such as “Your route, ready when you are.”

**Prompt:**

> Create a tall 9:16 mobile onboarding illustration for Waypoint Flow’s driver experience. Subject: a compact refrigerated delivery vehicle beginning a clear route from a depot toward a single outlet, with a simple readiness check and a small phone route cue. Composition: place the vehicle and route in the lower-middle half of the canvas; leave the upper third almost empty for onboarding headline and leave bottom-safe space for pagination and a button. Perspective: gentle three-quarter/isometric view, sized for a narrow phone screen. Art direction: same premium minimal geometric vector language as Waypoint Flow’s desktop hero; field-safe and practical, not playful. Lighting: soft flat layers. Palette: white background, deep green #146B45, action green #1F8A5B, pale green #EAF6EF, ink #17221D, muted grey #63716A. Detail: low-medium, with no tiny labels. Intended UI location: driver onboarding screen. Aspect ratio: 9:16. Avoid driver portraits, busy city maps, speed/racing cues, dark backgrounds, text in artwork, gradients, generic delivery-app imagery, or unsafe driving visuals.

### M04 — Store onboarding illustration

**Purpose / placement:** first-use store-manager onboarding, paired with copy such as “Know what is arriving and when.”

**Prompt:**

> Create a tall 9:16 mobile onboarding illustration for a Waypoint Flow store manager. Subject: a simplified retail outlet receiving a clearly tracked order: an order card transitions along a route line into a delivered crate and receipt check. Composition: show the central story in the lower-middle half, with very open top third for headline copy and safe bottom margin for controls. Perspective: flat to slight three-quarter editorial view adapted for a narrow phone screen. Art direction: clean, quiet, premium geometric vector illustration, consistent with Waypoint Flow’s vehicle, outlet, route, and checkmark motifs. Lighting: soft flat tonal layering. Palette: white, #146B45, #1F8A5B, #EAF6EF, #17221D, #DCE5DF. Detail: low-medium, no readable text. Intended UI location: store manager onboarding. Aspect ratio: 9:16. Avoid shopping bags, ecommerce cart imagery, photorealistic retail shelves, people, oversized mobile-device mockups, gradients, and visual clutter.

### M05 — Mobile login route accent

**Purpose / placement:** sign-in/activation background; may be reused with different crop/opacity but must stay secondary to fields.

**Prompt:**

> Create a subtle vertical mobile authentication background accent for Waypoint Flow. Subject: a thin continuous route line and sparse depot/outlet nodes tracing a graceful diagonal around, not through, the screen’s form area. Composition: 9:16; visual detail lives in the top-right and bottom-left corners, leaving the central 55% calm white for the logo, email and password fields, and sign-in action. Perspective: flat vector. Art direction: understated technical editorial pattern, same line geometry as the Waypoint Flow route mark. Lighting: none. Palette: white background, pale green #EAF6EF shapes, deep green #146B45 line at very low opacity, rare #1F8A5B node. Detail: very low. Intended UI location: mobile login and account-activation screens. Aspect ratio: 9:16. Avoid illustrations of people, lock icons, large map shapes, text, gradients, strong contrast, or anything that reduces form legibility.

### M06 — No assigned trip

**Purpose / placement:** Driver Today when a route has not been released.

**Prompt:**

> Create a small 1:1 empty-state illustration for Waypoint Flow’s driver app. Subject: a compact delivery vehicle waiting beside a depot lane, with a short dotted route that begins but has no assigned destination yet and a small calm schedule marker. Composition: vehicle centred slightly below middle; retain broad clear space for “No route assigned yet” and “Refresh” UI copy. Perspective: slight three-quarter geometric vector. Art direction: reassuring, minimal, field-ready, fully consistent with the Waypoint Flow route/vehicle family. Lighting: flat soft layers. Palette: transparent or white background, pale green #EAF6EF, deep green #146B45, action green #1F8A5B, muted grey #63716A. Detail: low. Intended UI location: mobile Driver Today empty state. Aspect ratio: 1:1. Avoid sad characters, red errors, dark scenes, text, heavy map detail, or noisy decorations.

### M07 — Offline records safe

**Purpose / placement:** mobile Sync Centre; this has a different vertical composition from W09.

**Prompt:**

> Create a tall 4:5 vector status illustration for Waypoint Flow’s mobile offline/sync centre. Subject: an upright phone securely holding two saved delivery records, a dotted route line that pauses before a small sync/cloud indicator, and a small shield-check showing records are protected. Composition: phone centered in the lower-middle, with open top space for “You’re offline” heading and open lower edge for queued-record count and retry button. Perspective: front-facing phone with minimal geometric supporting objects. Art direction: calm, trustworthy operations illustration; not generic cloud/security stock art. Lighting: flat soft layers. Palette: white background, pale green #EAF6EF, deep green #146B45, #1F8A5B, muted grey #63716A, one controlled amber disconnected marker. Detail: low-medium. Intended UI location: mobile Sync Centre. Aspect ratio: 4:5. Avoid panic/red visuals, blue gradients, text, padlock overload, 3D objects, or busy networking diagrams.

### M08 — Delivery received

**Purpose / placement:** Store mobile receipt confirmation and driver proof-of-delivery completion.

**Prompt:**

> Create a compact 1:1 mobile success illustration for Waypoint Flow. Subject: a delivered crate beside a simple outlet/receipt card with one route line resolving into a small precise checkmark. Composition: centred lower-middle visual; preserve clear top space for “Receipt confirmed” and lower space for “Done” action. Perspective: gentle three-quarter vector. Art direction: premium minimal logistics illustration, same outlet/crate/checkmark language as the full product. Lighting: soft flat tonal layering. Palette: transparent or white background, deep green #146B45, action green #1F8A5B, pale green #EAF6EF, ink #17221D. Detail: low. Intended UI location: mobile success/receipt state. Aspect ratio: 1:1. Avoid confetti, trophies, smiling mascot characters, giant check symbols, gradients, text, or visual noise.

### M09 — Route update/status micrographic

**Purpose / placement:** compact non-blocking driver card when operations change a future stop.

**Recommendation:** use an SVG/CSS animation or Lottie only if the app already supports it. Animation should move a short route segment once (200–300 ms), then rest. Respect `prefers-reduced-motion` by displaying the final static SVG.

**Prompt:**

> Create a tiny 1:1 vector micrographic for a Waypoint Flow mobile status card. Subject: two minimal route paths converging into a single updated path with a small forward arrow/check cue. Composition: centered, balanced, simple enough for 24–40 px display. Perspective: flat iconographic vector. Art direction: exact same rounded route-line geometry as Waypoint Flow’s app icon; crisp and geometric. Lighting: none. Palette: pale green #EAF6EF background or transparent; deep green #146B45 line; action green #1F8A5B updated path; muted grey old path. Detail: extremely low. Intended UI location: mobile “Route updated” information card. Aspect ratio: 1:1. Avoid text, maps, blinking effects, gradients, large arrows, generic notification bells, or multiple unrelated symbols.

## Icon system

### Recommendation

Use **Lucide Icons** as the single default icon library for web and mobile. It offers a broad, consistent outline set, works cleanly with React and React Native implementations, and fits the planned geometric, restrained brand language. Do not mix Lucide with Material, Font Awesome, emoji, or custom filled icons in the same navigation/control system.

### Core rules

- Use outline icons by default, with a **2 px stroke on desktop** and a visually equivalent **1.75–2 px stroke on mobile**.
- Use `round` line caps and joins where the library/component API permits; retain Lucide’s native proportions.
- Standard sizes: 16 px inside dense tables; 18 px standard inline; 20 px buttons/navigation; 24 px mobile navigation; 32–48 px empty states only.
- Pair an icon with a visible label for navigation, destructive actions, status changes, and non-obvious controls. Tooltips supplement labels; they do not replace accessibility labels.
- Use icon colour from semantic tokens: ink/muted by default, evergreen for selected/primary, amber for attention, red for blocking/error, success green for completed. Never use a colour change alone to express critical meaning.
- Do not use filled badges as a second unrelated icon style. A compact semantic dot, status chip, or a single solid custom logo mark is acceptable.
- Use the custom **W-route mark** only for identity (logo, app icon, favicon, loading brand moment), never as a substitute for standard action icons.

### Recommended semantic mapping

| Product need | Lucide icon | Usage note |
|---|---|---|
| Home / overview | `House` | Store home; not required for every desktop dashboard. |
| Planning | `Route` | Planning navigation, route detail. |
| Operations | `Radar` or `Activity` | Use one after visual testing; `Activity` is safer if radar implies tracking accuracy. |
| Orders | `ClipboardList` | Orders list and store ordering. |
| Outlets | `Store` | Outlet directory and store context. |
| Fleet / vehicle | `Truck` | Fleet status, trip rows. |
| Reports | `ChartNoAxesCombined` | Reporting only, not for operational health. |
| Search | `Search` | Global/table search. |
| Notifications | `Bell` | Notification center. |
| Settings | `Settings` | Profile/admin settings. |
| Current location | `MapPin` | Outlet or stop context; do not use as the brand logo. |
| Navigation handoff | `Navigation` | Open phone navigation. |
| Refrigerated | `Snowflake` | Always pair with “Refrigerated” text where important. |
| Capacity | `Package` / `Weight` | Pair with exact weight/volume values. |
| Proof of delivery | `Signature`, `Camera`, `FileCheck2` | Use the clearest specific action icon. |
| Scan | `ScanBarcode` | Loader scanning. |
| Offline / sync | `CloudOff`, `RefreshCw`, `CloudCheck` | Always accompanied by status text. |
| Warning | `TriangleAlert` | Attention/at-risk state; use sparingly. |
| Blocked error | `CircleX` | Blocking/failed state. |
| Success | `CircleCheck` | Completion/valid state. |
| Deferred | `Clock3` | Show reason and revised date alongside it. |
| Activity history | `History` | Audit trail. |
| Filter | `SlidersHorizontal` | Filtering controls. |
| More actions | `Ellipsis` | Only for non-critical overflow actions. |

### Custom icons that are justified

Only three custom SVG assets are justified:

1. **W-route logo mark** — brand identity and favicon/app icon only.
2. **Refrigerated-route composite badge** — only if `Snowflake` plus `Route` cannot communicate refrigerated assignment at table scale; otherwise use Lucide `Snowflake` plus label.
3. **Route update micrographic** — an optional non-interactive status asset, not a replacement for the Lucide action icon set.

Everything else should use Lucide. This reduces implementation time, supports accessibility, and prevents visual inconsistency.

## Implementation and optimization notes for a later build

- Maintain SVG source files in a design-assets directory; optimize with SVGO before shipping.
- Do not embed base64 artwork in application code. Import/serve SVGs as assets or components according to the chosen framework.
- Use `<picture>` / responsive sizes for any raster fallback; generate WebP/AVIF derivatives only where SVG cannot work.
- Provide meaningful alternative text when an illustration communicates state; use empty alt text when it is purely decorative.
- Keep decorative assets out of the critical rendering path. Route diagrams and status visuals should lazy-load below the fold when not essential.
- Test all assets with cropped mobile safe areas, low-end Android devices, reduced motion, 200% browser zoom, and high-contrast modes.

## Next decision

These prompts are ready for exploratory asset generation, but production assets should only be selected after Phase 2 finalizes the Waypoint Flow logo construction and exact brand tokens. The same approved mark, route-line geometry, and illustration style must then be applied across every asset.

