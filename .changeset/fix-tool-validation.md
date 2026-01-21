---
"opencode-swarm-plugin": patch
"claude-code-swarm-plugin": patch
---

fix: add defensive validation with helpful error hints to swarm tools

- Add null checks to swarm_complete, swarm_progress, swarm_decompose, swarm_validate_decomposition, hive_create_epic
- Return friendly error messages with examples when required params are missing
- Improve tool descriptions with workflow hints and required param lists
- Fix subprocess cleanup with try-finally patterns in hive.ts, skills.ts, storage.ts, tool-availability.ts
- Add 30s timeout to execSemanticMemory to prevent hanging
- Add error state tracking to FlushManager
