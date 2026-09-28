# Designathon Readiness Report
## Team BigBug · Waypoint Flow — What's Done, What's Missing, What to Do

> **Deadline:** 29 September 2026 · 11:59 PM  
> **Analysis date:** 27 September 2026 · 04:00 AM  
> **Reference:** `Docs-ui/` folder + `designathon_full_report.md`

---

## SECTION 1 — COMPLETE INVENTORY OF `Docs-ui/`

```
Docs-ui/
├── Tech-Triathlon_2026_Designathon_Overview.md   ← Official brief summary
│
├── items/
│   ├── Phase_1_Project_Audit_and_Visual_Direction.md  ← Visual direction document
│   ├── Phase_3_Visual_Assets_Mobile_and_Icon_System.md ← All asset prompts + icon spec
│   └── generated-assets/
│       ├── README.md                              ← Asset map
│       ├── brand/
│       │   ├── waypoint-flow-mark.svg             ✅ W-route logo mark SVG
│       │   ├── waypoint-flow-horizontal.svg       ✅ Horizontal wordmark SVG
│       │   ├── route-line-background.svg          ✅ CTA background SVG
│       │   └── route-update-micrographic.svg      ✅ Route update status SVG
│       ├── web/
│       │   ├── connected-delivery-hero-v2.png     ✅ Hero illustration (USE this one)
│       │   ├── connected-delivery-hero.png        ⚠ Old v1 — do NOT use
│       │   ├── auth-route-motif.png               ✅ Desktop auth side panel art
│       │   ├── planning-intelligence.png          ✅ Plan Builder feature art
│       │   ├── connected-handoff-chain.png        ✅ 4-role workflow diagram art
│       │   ├── no-active-route.png                ✅ Empty state — no route
│       │   ├── no-orders-yet.png                  ✅ Empty state — no orders
│       │   ├── delivery-complete.png              ✅ Success state art
│       │   ├── offline-records-safe.png           ✅ Offline/sync state art
│       │   └── capacity-constraint.png            ✅ Deferral/shortfall art
│       └── mobile/
│           ├── splash-route.png                   ✅ App splash screen art
│           ├── driver-onboarding-route-ready.png  ✅ Driver first-use art
│           ├── store-onboarding-order-receipt.png ✅ Store Manager first-use art
│           ├── login-route-accent.png             ✅ Mobile login background art
│           ├── no-assigned-trip.png               ✅ Driver Today empty state art
│           ├── offline-records-safe.png           ✅ Mobile offline art
│           └── delivery-received.png              ✅ Mobile receipt success art
│
├── mobile/
│   ├── README.md                                  ✅ Full project overview (outdated — use docs/)
│   ├── 00_Mobile_UI_System.md                     ✅ Mobile design system + screen list
│   ├── 01_Driver_Today.md                         ✅ Screen spec
│   ├── 02_Driver_Route_and_Stop.md                ✅ Screen spec
│   ├── 03_Driver_Proof_of_Delivery.md             ✅ Screen spec
│   ├── 04_Driver_Offline_and_Sync.md              ✅ Screen spec (degradation)
│   ├── 05_Store_Mobile_Home.md                    ✅ Screen spec
│   ├── 06_Store_Mobile_Order_and_Tracking.md      ✅ Screen spec
│   ├── 07_Authentication.md                       ✅ Screen spec
│   └── prompt-mob/
│       └── Google_Stitch_Mobile_Prompts.txt       ✅ AI UI generation prompts (mobile)
│
└── pc/
    ├── 00_Desktop_UI_System.md                    ✅ Desktop design system + screen list
    ├── 01_Dispatcher_Operations_Overview.md        ✅ Screen spec
    ├── 02_Dispatcher_Plan_Builder.md               ✅ Screen spec
    ├── 03_Dispatcher_Deferral_Impact.md            ✅ Screen spec (primary degradation)
    ├── 04_Loader_Load_Board.md                     ✅ Screen spec
    ├── 05_Loader_Loading_Shortfall.md              ✅ Screen spec (secondary degradation)
    ├── 06_Store_Order_Composer.md                  ✅ Screen spec
    ├── 07_Store_Order_Tracking_and_Receipt.md      ✅ Screen spec
    ├── 08_Authentication.md                        ✅ Screen spec
    └── prompt-pc/
        └── Google_Stitch_Web_Prompts.txt           ✅ AI UI generation prompts (desktop)
```

**Total files:** 35+ documents + 20 assets

---

## SECTION 2 — WHAT IS ALREADY DONE ✅

### 2.1 Design System — COMPLETE

The visual system is **fully specified** and ready to apply in Figma. Nothing here needs to be invented.

| Component | Status | Source |
|---|---|---|
| Color tokens | ✅ Complete | `pc/00_Desktop_UI_System.md`, `Phase_3_Visual_Assets_Mobile_and_Icon_System.md` |
| Typography scale | ✅ Complete | `pc/00_Desktop_UI_System.md` |
| Corner radius / shadow | ✅ Complete | `pc/00_Desktop_UI_System.md` |
| Icon library | ✅ Complete | Lucide Icons — full semantic mapping in Phase 3 doc |
| Status language | ✅ Complete | 9 states defined: Needs planning → Deferred |
| Interaction rules | ✅ Complete | Desktop + mobile rules in both system docs |
| Mobile foundation | ✅ Complete | `mobile/00_Mobile_UI_System.md` |

**Colors to paste into Figma immediately:**
```
Waypoint Green (deep): #146B45
Action Green:          #1F8A5B
Pale Green:            #EAF6EF
Success:               #168050
Ink:                   #17221D
Muted text:            #63716A
Border:                #DCE5DF
Canvas:                #F6F8F7
```

---

### 2.2 Screen Specifications — COMPLETE (15 screens)

Every screen has a full written spec ready to implement in Figma. No screen needs to be invented from scratch.

#### Desktop Screens (8)

| # | Screen | Role | File | Degradation? |
|---|---|---|---|---|
| D1 | Dispatcher Operations Overview | Dispatcher | `pc/01_Dispatcher_Operations_Overview.md` | — |
| D2 | Dispatcher Plan Builder | Dispatcher | `pc/02_Dispatcher_Plan_Builder.md` | — |
| **D3** | **Capacity Deferral & Impact** | Dispatcher | `pc/03_Dispatcher_Deferral_Impact.md` | ⭐ PRIMARY |
| D4 | Loader Load Board | Loader | `pc/04_Loader_Load_Board.md` | — |
| **D5** | **Loading Shortfall** | Loader | `pc/05_Loader_Loading_Shortfall.md` | ⭐ SECONDARY |
| D6 | Store Order Composer | Store Manager | `pc/06_Store_Order_Composer.md` | — |
| D7 | Store Order Tracking & Receipt | Store Manager | `pc/07_Store_Order_Tracking_and_Receipt.md` | — |
| D8 | Desktop Authentication | All | `pc/08_Authentication.md` | — |

#### Mobile Screens (7)

| # | Screen | Role | File | Degradation? |
|---|---|---|---|---|
| M1 | Driver Today | Driver | `mobile/01_Driver_Today.md` | — |
| M2 | Driver Route & Stop | Driver | `mobile/02_Driver_Route_and_Stop.md` | — |
| M3 | Proof of Delivery | Driver | `mobile/03_Driver_Proof_of_Delivery.md` | — |
| **M4** | **Offline & Sync** | Driver | `mobile/04_Driver_Offline_and_Sync.md` | ⭐ MOBILE |
| M5 | Store Manager Home | Store Manager | `mobile/05_Store_Mobile_Home.md` | — |
| M6 | Store Order, Tracking & Receipt | Store Manager | `mobile/06_Store_Mobile_Order_and_Tracking.md` | — |
| M7 | Mobile Authentication | All | `mobile/07_Authentication.md` | — |

---

### 2.3 Visual Assets — GENERATED (20 assets)

Ready to use directly in Figma. Do NOT regenerate — these are the final approved versions.

#### Brand SVGs (4 — scalable, deterministic)

| File | Use in Figma |
|---|---|
| `brand/waypoint-flow-mark.svg` | Logo mark — nav rail, app icon, auth panel |
| `brand/waypoint-flow-horizontal.svg` | Horizontal wordmark — auth page, cover slide |
| `brand/route-line-background.svg` | CTA background pattern (W11) |
| `brand/route-update-micrographic.svg` | Route update status card (M09) |

#### Web/Desktop Illustrations (10 PNGs)

| File | Screen | Use in Figma |
|---|---|---|
| `web/connected-delivery-hero-v2.png` | Cover / landing hero | Page 1 cover + Figma landing art |
| `web/auth-route-motif.png` | D8 Authentication | Left panel art on desktop sign-in |
| `web/planning-intelligence.png` | D2 Plan Builder | Feature art / rationale visual |
| `web/connected-handoff-chain.png` | Page 2 Workflow Diagram | 4-role workflow diagram page |
| `web/no-active-route.png` | D1 Operations | Empty state before plan is published |
| `web/no-orders-yet.png` | D6 Store Order Composer | Empty order list |
| `web/delivery-complete.png` | D7 Store Tracking | Success state after receipt confirmed |
| `web/offline-records-safe.png` | D5 Loading Shortfall | Degradation explanation art |
| `web/capacity-constraint.png` | D3 Capacity Deferral | Deferral explanation art |

#### Mobile Illustrations (7 PNGs)

| File | Screen | Use in Figma |
|---|---|---|
| `mobile/splash-route.png` | M7 Mobile Auth | App splash / launch background |
| `mobile/login-route-accent.png` | M7 Mobile Auth | Sign-in background accent |
| `mobile/driver-onboarding-route-ready.png` | M1 Driver Today | Driver first-use / onboarding card |
| `mobile/store-onboarding-order-receipt.png` | M5 Store Home | Store first-use onboarding |
| `mobile/no-assigned-trip.png` | M1 Driver Today | Driver Today empty state |
| `mobile/offline-records-safe.png` | M4 Offline & Sync | Offline sync centre art |
| `mobile/delivery-received.png` | M6 Store Receipt | Mobile receipt confirmation |

---

### 2.4 Google Stitch UI Prompts — AVAILABLE

Detailed AI prompts exist for generating the actual screen UI in Google Stitch:

| File | Contains |
|---|---|
| `pc/prompt-pc/Google_Stitch_Web_Prompts.txt` | 8 desktop screen prompts (Design System, D1–D8) |
| `mobile/prompt-mob/Google_Stitch_Mobile_Prompts.txt` | Mobile screen prompts (M1–M7) |

These can be used to generate screen designs in Google Stitch, which can then be exported/referenced for Figma. If you're designing directly in Figma, use the screen specs (`.md` files) as your source of truth instead.

---

## SECTION 3 — WHAT IS NOT DONE ❌

These are the **actual deliverables** that must be created before submission. The Docs-ui folder gives you everything you need to create them — but the deliverables themselves do not exist yet.

| Deliverable | Required? | Status | Notes |
|---|---|---|---|
| **Figma file** | ✅ REQUIRED | ❌ NOT STARTED | The big one — 15 screens + design system |
| **4 Personas** (in Figma) | ✅ REQUIRED | ❌ NOT IN FIGMA | Persona content exists in `docs/08_designathon_plan.md` |
| **Workflow diagram** (in Figma) | ✅ REQUIRED | ❌ NOT IN FIGMA | `connected-handoff-chain.png` asset is ready to place |
| **Screen rationale paragraphs** | ✅ REQUIRED | ✅ WRITTEN | In `docs/08_designathon_plan.md` — just needs to go in Figma |
| **Prototype links** (Figma interactions) | ✅ REQUIRED | ❌ NOT CREATED | Need screens first |
| **Demo video 3–5 min** | ✅ REQUIRED | ❌ NOT RECORDED | Record after prototype is done |
| **AI Tool Disclosure** (in Figma) | ✅ REQUIRED | ✅ CONTENT READY | Written in `docs/08_designathon_plan.md` — needs a Figma page |
| **Style guide** (in Figma) | ⭕ Optional | ✅ SPECIFIED | Design system fully written; needs one Figma page |
| **Core tradeoff explanation** | ⭕ Optional | ✅ WRITTEN | In `docs/08_designathon_plan.md` — needs a Figma page |
| **ZIP file** `BigBug_Designathon.zip` | ✅ REQUIRED | ❌ NOT PACKAGED | Needs Figma source + PDF export |
| **YouTube video** | ✅ REQUIRED | ❌ NOT UPLOADED | Record → upload → get URL |

---

## SECTION 4 — ARE THE DOCS-UI FILES ENOUGH?

### Short answer: YES — for design specification. But you still need to BUILD it in Figma.

Here's the exact breakdown:

| Design need | From Docs-ui? | Complete? |
|---|---|---|
| What screens to design | ✅ Yes — 15 screen specs | ✅ Complete |
| What goes on each screen | ✅ Yes — layout, interactions, states, rationale | ✅ Complete |
| Colors, fonts, spacing | ✅ Yes — full design system | ✅ Complete |
| Icon library | ✅ Yes — Lucide, full mapping | ✅ Complete |
| Visual assets / illustrations | ✅ Yes — 20 generated assets ready | ✅ Complete |
| Status language | ✅ Yes — 9 states | ✅ Complete |
| Degradation scenarios | ✅ Yes — D3, D5, M4 | ✅ Complete |
| Persona content | ✅ Yes — in `docs/08_designathon_plan.md` | ✅ Written, not in Figma |
| Screen rationale text | ✅ Yes — in `docs/08_designathon_plan.md` | ✅ Written, not in Figma |
| Prototype interactions | ❌ No — must be created in Figma | ❌ Not done |
| Actual visual designs | ❌ No — Figma screens don't exist | ❌ Not done |
| Demo video | ❌ No | ❌ Not done |

**What Docs-ui gives you:** A complete blueprint and all raw materials.  
**What it doesn't give you:** The actual Figma file, prototype, and video.

---

## SECTION 5 — FULL SCREEN-BY-SCREEN DESIGN GUIDE

Use this as a checklist when building in Figma. Every item below is already specified in the `.md` files.

### Desktop Screens

---

#### D1 — Dispatcher Operations Overview
**Figma page:** Desktop — Dispatcher (D1)  
**Asset to use:** `web/no-active-route.png` (empty state variant)  
**Key elements to design:**
- [ ] Global shell: left rail + top bar + page header
- [ ] Morning health strip (5 clickable metrics)
- [ ] Live route map (⅔ width) with vehicle dots, outlet markers, legend
- [ ] Exception queue (⅓ width) with urgency-ordered rows + Resolve actions
- [ ] Trips table with all columns + saved filters
- [ ] Right-side detail drawer (click a queue item)
- [ ] Status: empty-before-planning variant
- [ ] At-risk amber signals with explicit *why* labels

**From Stitch prompt:** Prompt 2 in `Google_Stitch_Web_Prompts.txt`

---

#### D2 — Dispatcher Plan Builder
**Figma page:** Desktop — Dispatcher (D2)  
**Asset to use:** `web/planning-intelligence.png` (feature art / rationale panel)  
**Key elements to design:**
- [ ] Top planning bar: date, depot, Auto-suggest, Save draft, Publish plan
- [ ] Plan quality indicator: "2 blockers · 4 warnings"
- [ ] Left column: Unassigned orders queue with chilled text badges
- [ ] Centre: Route canvas with tabbed vehicle trips + stop cards
- [ ] Right: Vehicle inspector — reefer badge, weight/volume bars, fuel quota
- [ ] Bottom impact tray: unassigned, deferrals, outlet impact
- [ ] Hard constraint modal: "This frozen order requires a refrigerated vehicle"
- [ ] Soft warning state with projected effect
- [ ] Publish confirmation sheet

**From Stitch prompt:** Prompt 3 in `Google_Stitch_Web_Prompts.txt`

---

#### D3 — Capacity Deferral & Impact ⭐ PRIMARY DEGRADATION
**Figma page:** Desktop — Dispatcher D3 (Deferral — DEGRADATION)  
**Asset to use:** `web/capacity-constraint.png`  
**Key elements to design:**
- [ ] Header: "Review order deferral" + order details
- [ ] Left: Decision context — alternatives, vehicle availability, shortfall explanation
- [ ] Centre: Store impact card + vertical timeline (Submitted → Notified)
- [ ] Right: Reason selector + note + revised date + notification preview
- [ ] Footer: Keep unassigned (secondary) | Confirm deferral & notify store (primary)
- [ ] Alternate state: "Restore to planning" (capacity recovered)
- [ ] Deferred state on store's order timeline: distinct branch with reason

**From Stitch prompt:** Prompt 4 in `Google_Stitch_Web_Prompts.txt`

---

#### D4 — Loader Load Board
**Figma page:** Desktop — Loader (D4)  
**Key elements to design:**
- [ ] Header: depot + dock/shift + time + "3 vehicles loading · 1 attention needed"
- [ ] Vehicle lane board: 5 status columns with vehicle cards
- [ ] Selected trip panel: stop sequence in unloading order + "Load Stop 6 first → Stop 1 last"
- [ ] Expandable stop rows: quantities + handling type + scan/check status
- [ ] Right checklist: 5 checks + final dispatch confirmation
- [ ] Barcode scan control + large "Mark checked" fallback
- [ ] Blocking state: red unresolved item → "Ready to depart" disabled
- [ ] Completed state: green "Ready to depart" active

**From Stitch prompt:** Prompt 5 in `Google_Stitch_Web_Prompts.txt`

---

#### D5 — Loading Shortfall ⭐ SECONDARY DEGRADATION
**Figma page:** Desktop — Loader D5 (Shortfall — DEGRADATION)  
**Key elements to design:**
- [ ] Load board dimmed in background
- [ ] Focused side panel: order/outlet + item + expected vs available
- [ ] Category selector: Missing / Damaged / Temperature concern / Other
- [ ] Impact panel: "This outlet will receive a partial delivery" + dispatcher deadline
- [ ] Actions: Save and continue loading (secondary) | Escalate to dispatcher (primary)
- [ ] Loader resumes exact checklist position after resolution

**From Stitch prompt:** Prompt 6 in `Google_Stitch_Web_Prompts.txt`

---

#### D6 — Store Order Composer
**Figma page:** Desktop — Store Manager (D6)  
**Asset to use:** `web/no-orders-yet.png` (empty order state)  
**Key elements to design:**
- [ ] Header: outlet identity + delivery date/window + cut-off countdown
- [ ] Two-pane body: catalogue (left) + persistent order summary (right)
- [ ] Order row: SKU, name, pack/unit, quantity stepper, availability, handling class
- [ ] Summary: weight/volume estimate, chilled callout, validation messages
- [ ] Footer: Save draft | Review order
- [ ] Review screen: submission disclaimer + `Submit order`
- [ ] Cut-off and invalid dates blocked before selection (not after submit)
- [ ] Status after submit: "Submitted — awaiting plan" (no ETA promise)

**From Stitch prompt:** Prompt 7 in `Google_Stitch_Web_Prompts.txt`

---

#### D7 — Store Order Tracking & Receipt
**Figma page:** Desktop — Store Manager (D7)  
**Asset to use:** `web/delivery-complete.png` (receipt confirmed state)  
**Key elements to design:**
- [ ] Order header: status badge + order number + ETA + Contact operations
- [ ] Progress timeline: Submitted → Planned → Loading → On route → Delivered → Receipt confirmed
- [ ] **Deferred branch:** visually distinct, with reason + revised date
- [ ] Delivery card: ETA window + driver-arrival state (no unnecessary personal data)
- [ ] Line-item receipt table: ordered / delivered / accepted / discrepancy / notes
- [ ] Action panel: Confirm receipt | Report issue (equally prominent — not hidden)
- [ ] Report issue: line selection + category + note + optional photo

**From Stitch prompt:** Prompt 8 in `Google_Stitch_Web_Prompts.txt`

---

#### D8 — Desktop Authentication
**Figma page:** Desktop — Authentication (D8)  
**Asset to use:** `web/auth-route-motif.png` (left panel art), `brand/waypoint-flow-horizontal.svg` (logo)  
**Key elements to design:**
- [ ] Wide layout: pale-green left panel (illustration + mark + tagline) + white right form (440 px max)
- [ ] Sign in: "Welcome back" + email + password (show/hide) + Keep me signed in checkbox + links
- [ ] Account activation: 4-step flow (invitation → password → profile → success)
- [ ] Forgot password: neutral confirmation text
- [ ] Accessibility: visible labels, keyboard focus, error text beside field, generic error messages

---

### Mobile Screens

All mobile screens use:
- 375 px frame width (phone portrait)
- Bottom navigation bar
- 48×48 dp minimum touch targets
- 16 px minimum body text
- Full-width primary buttons near thumb zone

---

#### M1 — Driver Today
**Figma frame:** 375 × 812 px (iPhone safe area)  
**Asset to use:** `mobile/no-assigned-trip.png` (empty state), `mobile/driver-onboarding-route-ready.png` (onboarding)  
**Key elements:**
- [ ] Top bar: greeting + connection pill (`Synced` or `Offline — 2 actions queued`) + profile
- [ ] Primary trip card: vehicle + trip number + departure status + stop count + temp badge + Start trip (disabled until loader releases)
- [ ] Stops preview: numbered list, only current/next expanded
- [ ] Preparation card: readiness acknowledgements + manifest link
- [ ] Second trip card: visually quieter + "Available after Trip 1 completion"
- [ ] State: "Waiting for loading confirmation" (before loader release)
- [ ] State: empty/no assignment (not a false empty dashboard)

---

#### M2 — Driver Route & Stop
**Figma frame:** 375 × 812 px  
**Key elements:**
- [ ] In-transit view: outlet name + ETA + window + compact map + "Open navigation" + "I'm parked"
- [ ] Parked stop sheet: stop # + outlet/contact + items/quantities + "Complete delivery" + "Report a problem"
- [ ] Route drawer: all stops with current/completed/skipped/future status
- [ ] Amber prompt for outside-window arrival: continue / contact operations / report access issue
- [ ] "Route updated" card: highlighted, requires acknowledgement

---

#### M3 — Driver Proof of Delivery
**Figma frame:** 375 × 812 px  
**Key elements:**
- [ ] Step 1: Confirm quantities (defaults from loader manifest; mark partial/missing/damaged/refused)
- [ ] Step 2: Capture proof (recipient name, signature, photo, delivery note)
- [ ] Step 3: Review outcome (Delivered in full / Partial / Failed / Refused)
- [ ] Step indicator: "1 of 3" + Back + "Save for later"
- [ ] Camera: one large button, retake option, thumbnail confirmation
- [ ] Offline state: "Saved locally — not yet delivered to others"

---

#### M4 — Driver Offline & Sync ⭐ MOBILE DEGRADATION
**Figma frame:** 375 × 812 px  
**Asset to use:** `mobile/offline-records-safe.png`  
**Key elements:**
- [ ] Offline banner: amber, non-blocking, persistent — "You're offline. Your route and delivery records are available on this phone." + queued count + "Last synced 07:42"
- [ ] Sync centre: connection state + last sync + queued records + storage assurance
- [ ] Queued actions list: each record shows stop + action type + local timestamp + evidence count + "Saved on this phone"
- [ ] Sync controls: automatic retry; "Sync now" only when connected; "Retry" for failed record
- [ ] Conflict: preserve both records, show difference, instruct to contact operations
- [ ] Reconnection: "4 records synced" + link to activity (no false all-clear)

---

#### M5 — Store Manager Mobile Home
**Figma frame:** 375 × 812 px  
**Asset to use:** `mobile/store-onboarding-order-receipt.png` (onboarding), `mobile/delivery-received.png` (receipt state)  
**Key elements:**
- [ ] Header: outlet name + date + notification bell
- [ ] Hero delivery card: status + arrival window + key change + "Track delivery"
- [ ] Deferred order card: distinct visual, revised date + reason summary
- [ ] Quick actions: New order / Order history / Confirm receipt / Report issue
- [ ] Recent activity timeline: compact, 5 event types
- [ ] Attention section: only actionable notices
- [ ] No-delivery state: "Plan your next delivery" + next eligible date

---

#### M6 — Store Mobile Order, Tracking & Receipt
**Figma frame:** 375 × 812 px  
**Key elements:**
- [ ] New order: 4-step flow (Choose delivery → Add goods → Review → Submitted)
- [ ] Cart: persists between sessions; chilled/frozen explicit label
- [ ] Tracking timeline: mirrors desktop statuses
- [ ] Receipt: line-item compare + "Confirm receipt" / "Report issue" (equally easy to find)
- [ ] Deferred state: reason + revised date + "Contact operations"
- [ ] Every status change: plain-language explanation + time

---

#### M7 — Mobile Authentication
**Figma frame:** 375 × 812 px  
**Asset to use:** `mobile/login-route-accent.png` (background), `mobile/splash-route.png` (splash)  
**Key elements:**
- [ ] Splash screen: logo mark centered + very subtle route background
- [ ] Sign in: "Welcome to Waypoint Flow" + email + password + "Sign in"
- [ ] Offline state: "Connect to the internet to sign in. Previously signed-in users can continue offline."
- [ ] Account activation: 4-step (invitation → password → profile → Account activated)
- [ ] Session expired: clear message, retain queued delivery evidence per org policy
- [ ] No false success on no connection

---

## SECTION 6 — FIGMA FILE BUILD PLAN

Build these Figma pages **in order** — design system first, then screens.

| Order | Figma Page | Time estimate | Notes |
|---|---|---|---|
| 1 | **Design System** | 1.5 hrs | Paste colors, set up type styles, create status chips, button variants, capacity bar component |
| 2 | **Cover + Problem Framing** | 30 min | Use `connected-delivery-hero-v2.png` + headline + brief framing |
| 3 | **Workflow Diagram (4 roles)** | 30 min | Use `connected-handoff-chain.png` + annotate the 5-step chain |
| 4 | **Personas × 4** | 1 hr | Use persona content from `docs/08_designathon_plan.md` — one card per persona |
| 5 | **D2 Plan Builder** | 2 hrs | Most complex desktop screen — 3-column layout |
| 6 | **D3 Capacity Deferral** | 1.5 hrs | PRIMARY degradation — 3-column + timeline + reason form |
| 7 | **D1 Operations Overview** | 2 hrs | Map + exception queue + trips table |
| 8 | **D4 Load Board + D5 Shortfall** | 2 hrs | Loader screens — large targets, scan control |
| 9 | **D6 Order Composer + D7 Tracking** | 1.5 hrs | Store desktop screens |
| 10 | **D8 Desktop Auth** | 1 hr | Split layout + activation flow |
| 11 | **M1 Driver Today + M2 Route** | 1.5 hrs | Driver mobile screens |
| 12 | **M3 POD + M4 Offline** | 1.5 hrs | M4 is mobile degradation — include offline banner |
| 13 | **M5 Store Home + M6 Order/Receipt** | 1.5 hrs | Store mobile screens |
| 14 | **M7 Mobile Auth** | 45 min | Login + splash |
| 15 | **AI Disclosure** | 30 min | Copy from `docs/08_designathon_plan.md` into Figma |
| 16 | **Core Tradeoff** | 30 min | Optional — copy from `docs/08_designathon_plan.md` |
| 17 | **Prototype links** | 1 hr | Connect all screens with Figma prototype interactions |
| **TOTAL** | | **~18 hours** | Spread across Day 3 (design) + Day 4 (polish + prototype) |

---

## SECTION 7 — 3-DAY SPRINT PLAN (Days 3–5)

You are now on **Day 3** (27 Sep). Here's what needs to happen:

### Day 3 — 27 September (Design day) — ~8 hrs

**Morning (0–4 hrs):**
- [ ] Create Figma file: `BigBug_Designathon.fig`
- [ ] Set up design system page: colors, type, status chips, button variants, capacity bar
- [ ] Import all assets from `Docs-ui/items/generated-assets/` into Figma
- [ ] Build Cover + Problem Framing page
- [ ] Build Workflow Diagram page (use `connected-handoff-chain.png`)

**Afternoon (4–8 hrs):**
- [ ] Build Personas page (4 cards — content from `docs/08_designathon_plan.md`)
- [ ] Build D2 Plan Builder (start with this — most complex, most weight)
- [ ] Build D3 Capacity Deferral (degradation — 25% of judging in problem framing + degradation)

### Day 4 — 28 September (Hi-fi + prototype day) — ~8 hrs

**Morning (0–4 hrs):**
- [ ] Build D1 Operations Overview
- [ ] Build D4 Load Board + D5 Loading Shortfall
- [ ] Build D6 Store Order Composer + D7 Store Tracking

**Afternoon (4–6 hrs):**
- [ ] Build D8 Desktop Auth
- [ ] Build M1 Driver Today + M2 Route & Stop
- [ ] Build M3 Proof of Delivery + M4 Offline & Sync
- [ ] Build M5 Store Home + M6 Store Order/Receipt + M7 Mobile Auth

**Evening (6–8 hrs):**
- [ ] Add AI Disclosure page
- [ ] Add Core Tradeoff page (optional)
- [ ] Add prototype interactions
- [ ] Export all pages to PDF

### Day 5 — 29 September (Submit day)

**Morning:**
- [ ] Record 3–5 min demo video (walkthrough through prototype)
- [ ] Upload to YouTube as Unlisted → copy URL

**Afternoon:**
- [ ] Export Figma to PDF: `BigBug_Designathon.pdf`
- [ ] Create ZIP: `BigBug_Designathon.zip`
- [ ] Write `README_submission.txt` (Figma URL + YouTube URL)
- [ ] Submit to form before **11:59 PM**

---

## SECTION 8 — SUBMISSION CHECKLIST

| # | Item | Ready? | Notes |
|---|---|---|---|
| 1 | `BigBug_Designathon.zip` | ❌ | Package after all below are done |
| 2 | `BigBug_Designathon.pdf` | ❌ | Export from Figma |
| 3 | `BigBug_Designathon.fig` | ❌ | The Figma source file |
| 4 | Figma prototype shareable link | ❌ | Set "Anyone with link can view" |
| 5 | YouTube demo video URL (3–5 min, unlisted) | ❌ | Record after prototype |
| 6 | Persona × 4 (Figma page 3) | ❌ | Content ready in `docs/08_designathon_plan.md` |
| 7 | D1–D8 desktop screens in Figma | ❌ | Specs ready in `Docs-ui/pc/` |
| 8 | M1–M7 mobile screens in Figma | ❌ | Specs ready in `Docs-ui/mobile/` |
| 9 | ≥1 degradation screen (D3, D5, M4) | ❌ | All 3 degradations fully specified |
| 10 | AI Tool Disclosure page in Figma | ❌ | Content ready — just needs Figma page |
| 11 | Rationale paragraph per screen | ✅ | Written in `docs/08_designathon_plan.md` — add as Figma annotations |

---

## SECTION 9 — WHAT IS NOT NEEDED FOR DESIGNATHON

To avoid scope creep, do **NOT** design these (they are Hackathon work, not Designathon):

| Item | Why not needed now |
|---|---|
| Code / HTML / CSS | Hackathon deliverable |
| Backend / database | Hackathon deliverable |
| Working prototype (code) | Only Figma prototype needed for Day 5 |
| Native mobile app | Web PWA is sufficient per brief |
| Admin/reporting screens | Out of scope — brief says 4 roles only |
| Marketing landing page | Not required by brief |
| Dark mode | "Defer deliberately" per Phase 1 audit |

---

## SECTION 10 — JUDGING CRITERIA — HOW CURRENT ASSETS MAP

| Criterion | Weight | What You Have | Gap |
|---|---|---|---|
| **Problem framing** | 25% | Workflow diagram art ready + specs | Must be in Figma with written framing |
| **Understanding of user context** | 20% | 4 full personas written | Must be in Figma with working conditions grounded |
| **Degradation screen quality** | 15% | 3 degradation screens fully specified | Must be designed in Figma + rationale written |
| **Domain accuracy** | 10% | Constraints from booklet in all specs | Must reflect in every screen (reefer badges, van-only, etc.) |
| **Scope and prioritization** | 15% | 15 screens (not bloated) + tradeoff written | Must explain what you DID NOT design and why |
| **Visual & interaction design** | 15% | Full design system ready + 20 assets | Must be consistent across all 15 Figma screens |

---

## SECTION 11 — KEY WARNINGS

> [!CAUTION]
> **Do NOT design more screens than specified.** Judges penalize over-scope. 15 screens is the right amount.

> [!IMPORTANT]
> **D3 Capacity Deferral is your most important screen.** It covers Problem Framing (25%) AND Degradation Screen Quality (15%) = 40% of your score in one screen. Spend the most time here.

> [!WARNING]
> **Never use `web/connected-delivery-hero.png` (v1).** Only use `web/connected-delivery-hero-v2.png`. The v1 is kept only as an iteration record.

> [!NOTE]
> **The Google Stitch prompts exist but are optional.** If you're designing in Figma, use the `.md` screen specs directly. Stitch prompts are for teams generating screens with AI — they produce starting points, not final designs.

> [!TIP]
> **Put rationale text as Figma annotations alongside each screen** (not on a separate page). Judges should be able to read *why* while looking at the screen.
