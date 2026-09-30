# Waypoint Flow repository instructions

## Mobile work and progress tracking

For requests involving `waypoint-mobile/` or `Docs-mobile/`, read `Docs-mobile/00__Work_List.md` and the relevant phase plan before editing. Preserve the existing website unless shared-service work is explicitly within the task.

After implementation or verification changes, update the corresponding phase's status, task checkboxes and evidence, and update `Docs-mobile/00__Work_List.md` in the same change. This is an agent workflow rule, not a scheduled/background process.

Use these statuses consistently: **Not started**, **In progress**, **Implemented — verification pending**, **Complete**, **Blocked**. Mark **Complete** only when the phase's exit gate and applicable acceptance checks have passed. Documentation, fixture previews and passing unit tests do not certify connected APIs, real-device behavior or release readiness. Record unresolved prerequisites rather than checking them off. A blocked check does not erase completed work.

Keep tricky code examples in `Docs-mobile/CODE_Implementation_Recipes.md` and the phase documents aligned with actual source. Label future-phase snippets as proposed contracts or pseudocode and link implemented examples to source/tests. Never mark a phase complete solely because its Markdown exists. Never include credentials, tokens, private proof or signing keys in documentation.

For Flutter changes, run appropriate formatting, analysis and meaningful tests. Record actual commands/results and any unavailable device, build or backend checks in `waypoint-mobile/docs/phase-0-1-verification.md` (or the relevant later verification record). Do not invent passed checks or team approval.
