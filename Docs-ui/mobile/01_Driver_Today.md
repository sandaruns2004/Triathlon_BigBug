# Mobile — Driver Today

## Purpose

Help the driver understand the day’s assigned work before departure, without exposing them to planning complexity.

## Layout

- **Top:** greeting, depot/shift, connection pill (`Synced` or `Offline — 2 actions queued`), and profile.
- **Primary trip card:** vehicle, trip number, departure status, stop count, estimated completion, temperature/handling badge, and a dominant `Start trip` button when the loader has released the route.
- **Stops preview:** numbered list with outlet, delivery window, special instruction, and status. Only the current/next stop is expanded by default.
- **Preparation card:** vehicle/trip readiness acknowledgements supplied by operations; link to manifest and loading notes.
- **Second-trip card:** visible but visually quieter, labelled “Available after Trip 1 completion.”

## States

- Before loader release: `Waiting for loading confirmation`; driver can review but cannot start.
- After departure: card transitions to `Continue to next stop`.
- No assignment: explain that no route is assigned and offer Refresh/sync, not a false empty dashboard.

## Safety

`Start trip` asks for a single parked-state acknowledgment. Detailed route actions are unavailable until the driver confirms they are safely stopped.

