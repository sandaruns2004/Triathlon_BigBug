# Phase 1 — Project Audit & Proposed Visual Direction

**Status:** discovery only — no application code, business logic, or interface screens were changed.

## Executive finding

This repository is not yet a web or mobile application. It is a Tech-Triathlon project workspace containing challenge documentation, logistics datasets, one Python feasibility checker, and newly prepared UX specifications for the proposed product **Waypoint Flow**. There is no frontend/mobile source directory, `package.json`, app entry point, component library, stylesheet, design-token file, runtime dependency manifest, asset directory, or existing screen implementation to restyle.

Therefore, there is no current implemented visual identity to improve. The recommended direction below is based on the real logistics product described in the project and the existing UX specifications. It is a foundation for Phase 2 and later implementation—not a code redesign.

## What the product appears to be

**Waypoint Flow** is a connected delivery-planning system for a Sri Lankan retail group. It connects the operational chain:

`Store order → Dispatcher planning → Warehouse loading → Driver delivery → Store receipt / issue resolution`

It must support three delivery brands, two depots, 120 outlets, 60 vehicles, refrigerated deliveries, capacity limits, delivery windows, vehicle/route constraints, delivery proof, deferrals, and unreliable driver connectivity.

The challenge also includes a data/optimization track: predicting delivery service time and lateness, forecasting weekly volume, and allocating a constrained fleet on peak days.

## Target users and operating environments

| User | Environment | Primary need | Design implication |
|---|---|---|---|
| Dispatcher | Large, stable-connected office display | Build plans, monitor routes, resolve exceptions | Dense but calm desktop control tower; explain constraints and impact. |
| Loader | Shared warehouse terminal/tablet, possible gloves/scanner use | Load in correct stop order and flag shortages | Large targets, short checklists, high contrast, quick recovery. |
| Driver | Personal phone, intermittent connection, only while safely stopped | Follow route, complete proof of delivery, sync later | Mobile-first, field-readable, offline-transparent, safety-led. |
| Store manager | Browser or phone in a retail outlet | Order goods, track ETA, receive or report issues | Plain language, clear timing, simple actionable states. |

## Existing implementation audit

### Application code and architecture

- **No website implementation found.** There is no React, Next.js, Vue, Angular, HTML/CSS, or equivalent web source.
- **No mobile implementation found.** There is no React Native, Flutter, Android, iOS, Expo, or native application source.
- **No package/dependency manifest found.** No `package.json`, lock file, mobile build configuration, or declared UI/animation/icon dependency exists.
- **No theme support found.** There are no light/dark theme tokens or theme-switching implementations. A future build should launch with a polished light operational theme; dark mode should be designed deliberately later rather than mechanically inverted.
- The only executable code is [`check_allocation.py`](../../check_allocation.py), a Python validator for the Datathon’s fleet-allocation CSV output. It does not contain UI or design behavior.

### Current screens and UX documentation

No rendered screens exist. The design documentation defines the intended screen scope:

- Desktop: Dispatcher Operations Overview, Plan Builder, Capacity Deferral & Impact, Loader Load Board, Loading Shortfall, Store Order Composer, Store Tracking & Receipt, Authentication.
- Mobile: Driver Today, Route & Parked Stop, Proof of Delivery, Offline & Sync, Store Home, Store Ordering/Tracking/Receipt, Authentication.

These specifications are the best available functional source of truth and should guide future implementation rather than being replaced by arbitrary marketing-style screens.

### Current visual style, palette, typography, components, layouts, and assets

| Area | Current state | Consequence |
|---|---|---|
| Visual style | No implemented UI | No existing style needs preservation; visual consistency must be created before coding. |
| Color palette | UX docs propose white plus Waypoint greens | This is an appropriate starting point but not yet implemented as reusable tokens. |
| Typography | UX docs recommend Inter or a similar sans-serif | No font is configured or loaded. |
| Components | No code components | Build a small role-aware component foundation before individual screens. |
| Layout | Conceptual desktop rails/top bars and mobile bottom navigation only | Keep these patterns consistent; do not force planning tools onto a phone. |
| Images/icons/assets | No raster images, SVGs, icon library, logo, favicon, or illustration assets found | A deliberate minimal asset set is needed; stock imagery is not. |

## Current UI risks to avoid during implementation

1. **No shared source of truth yet.** Building individual screens before tokens, type, status patterns, and navigation will create visual drift.
2. **Operational complexity can become clutter.** Dispatcher pages need dense data, but metrics, maps, tables, and alerts must have a clear hierarchy.
3. **Status ambiguity can cause operational errors.** Every state must pair icon, text, timestamp, and owner—not only colour.
4. **Mobile can become a shrunken desktop.** Drivers need task-focused, parked-state flows and offline feedback; planners need desktop tooling.
5. **Generic logistics or AI-SaaS aesthetics would weaken trust.** Avoid neon gradients, glass panels, oversized decorative illustrations, and decorative analytics that hide actual information.
6. **Deferral and exception paths must be first-class.** Loading shortfalls, capacity constraints, delivery issues, and offline reconciliation are core product moments, not edge cases.

## Recommended visual direction

### Direction name: “Calm operational clarity”

Waypoint Flow should feel like a dependable operating system for retail distribution: precise enough for planners, fast enough for the dock, and understandable enough for an outlet manager. The character is **professional, premium, modern, clean, minimal, and trustworthy**—but warm enough to work for people coordinating real deliveries.

The visual language should use white space and well-structured information as its premium detail. Green signals movement, readiness, and successful progress; it should not fill every surface. A small amount of route-line geometry can reinforce the connected workflow, while real data remains the visual focus.

### Principles

- **Information first:** use tables, timelines, route lists, capacity bars, and status chips to communicate actual work.
- **Meaningful restraint:** a white canvas, thin neutral borders, and sparse shadows create premium clarity without looking sterile.
- **Green with purpose:** reserve strong green for primary actions, selected navigation, route progress, and successful completion.
- **Explain the why:** constraints, warnings, deferrals, and shortages need plain-language rationale and downstream impact.
- **One system across roles:** shared type, colours, states, and iconography; density and navigation adapt to each environment.
- **Field-safe mobile:** high contrast, large targets, predictable step flows, and explicit offline/sync state.
- **Accessible by default:** visible labels, keyboard focus, reduced-motion support, and no colour-only meaning.

### Preliminary brand expression (not the final Phase 2 token system)

- **Core cue:** a route segment becoming a check/forward motion, representing dependable flow from depot to outlet.
- **Color mood:** deep evergreen as the foundation, brighter functional green for progress/actions, pale mint surfaces for supportive emphasis, charcoal text, warm-neutral white canvas, amber exception states.
- **Typography mood:** an approachable neo-grotesk sans serif such as Inter, using tabular numerals for capacity, time, quantity, and route metrics.
- **Shape mood:** modestly rounded rectangles and precise linework; no glassmorphism, excessive pills, heavy gradients, floating blobs, or sci-fi effects.
- **Icon mood:** a single established outline icon family—Lucide is a strong candidate—using a consistent 1.75–2 px visual stroke and filled semantic status dots only where they improve scanning.
- **Illustration mood:** minimal route/network diagrams and simplified geometric delivery moments; do not use photorealistic stock trucking imagery as filler.

## Asset direction for later phases

The product does **not** need a large image library. The highest-value future asset categories are:

| Asset family | Why it is needed | Recommended approach |
|---|---|---|
| Logo suite | Establishes recognition in desktop rail, mobile app, auth, favicon | Custom SVG mark plus horizontal wordmark; remain legible at 16–32 px. |
| App icon | Recognizable driver/store phone entry point | Simplified SVG-derived mark on a deep-green field. |
| Route-line motif | Gives auth/onboarding and occasional empty states a branded, subtle visual cue | SVG, low visual weight, non-essential detail kept away from crop edges. |
| Operational empty states | Helps communicate no active route, no orders, no exceptions, synced queue | Small consistent vector illustrations; use only where a state needs explanation. |
| Status micro-graphics | Reinforces offline, syncing, success, and exception outcomes | CSS/SVG icons and motion, not heavy raster artwork. |
| Dashboard visuals | Supports understanding of route health and capacity | Data-driven charts/maps built in UI, not static decorative images. |

Landing-page photography, large dashboard hero art, and marketing feature illustrations should be deferred until the actual website scope is confirmed. The repository currently specifies a product application, not a public marketing site.

## Recommended Phase 2 decision

Proceed by defining the formal Waypoint Flow brand system and logo direction before implementation. The next artifact should include final named color tokens, type scale, spacing, radius, elevation, status semantics, responsive breakpoints, icon decision, logo construction rationale, and light/dark theme strategy.

## What is needed before Phase 4 implementation

1. Confirm the target technology for web and mobile (for example, React/Next.js plus React Native/Expo, or an alternative).
2. Confirm whether a public marketing/landing website is in scope in addition to the authenticated operations product.
3. Approve the proposed “Calm operational clarity” direction and Phase 2 brand/logo system.
4. Establish the frontend project structure and existing source files, after which visual-system integration can begin without changing business logic.

