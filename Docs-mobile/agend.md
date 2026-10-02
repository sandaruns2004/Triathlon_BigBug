# Mobile progress update rule

The automatically discovered agent instruction file is [AGENTS.md](../AGENTS.md). This file retains the requested `agend.md` name as a reference; tools do not normally auto-load that filename.

After each mobile implementation task, the agent must update [00__Work_List.md](00__Work_List.md), the affected phase checkboxes/status and verification evidence. A phase shows **Complete** only after its exit gate passes. Code examples alone do not count as implementation.

This automation runs as part of future agent work in this repository. It does not run continuously, watch files or change progress while no agent task is running.
