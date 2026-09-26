# Desktop — Dispatcher Operations Overview

## Purpose

The dispatcher’s landing page answers: *Is today’s plan deliverable, and what needs my attention now?* It is the control tower after planning begins.

## Layout

1. **Header:** “Today’s operations”, date, depot scope (`All depots` / Peliyagoda / Kandy), and `Open plan builder` primary button.
2. **Morning health strip:** orders planned, vehicles dispatched, on-time forecast, orders at risk, and unresolved exceptions. Each metric is clickable.
3. **Live route map (two-thirds width):** vehicle dots, route lines, depot pins, outlet status markers, and a compact legend. Selecting a vehicle highlights its next stop and route list.
4. **Exception queue (one-third width):** ordered by urgency: loading shortfall, delivery access issue, ETA breach, offline driver beyond threshold, unplanned order. Each item exposes an owner, elapsed time, and `Resolve` action.
5. **Trips table:** vehicle, depot, trip 1/2, route progress, next stop, capacity, temperature requirement, ETA risk, and status. Saved filters include Fresh-before-8AM, refrigerated, and at-risk.

## Key interactions

- Clicking a queue item opens a contextual drawer with facts, history, suggested options, and the appropriate action.
- `Resolve` on a late route can notify the affected store manager with revised ETA; the message is logged.
- Time-sensitive Fresh routes are pinned above general routes until their delivery window closes.
- Map and table selections stay synchronized; no critical action relies on map precision.

## States and safeguards

- Empty state before planning: explain that no routes are published and direct the user to Plan Builder.
- At-risk cards use amber, show *why* (window, service time, access, loading), and never imply certainty.
- Vehicle capacity reads both weight and volume, e.g., `2.8 / 3.5 t · 14 / 18 m³`; refrigerated capability uses a labelled snowflake badge.

## Handoff

Published routes transition to Loader Load Board. Driver delivery updates and store receipt/issues return here as live activity.

