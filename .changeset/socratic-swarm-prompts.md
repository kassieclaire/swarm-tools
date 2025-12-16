---
"opencode-swarm-plugin": minor
---

Add Socratic planning phase and improved worker prompts to swarm setup

**SWARM_COMMAND template:**
- Added Phase 0: Socratic Planning - asks clarifying questions before decomposing
- Supports `--fast`, `--auto`, `--confirm-only` flags to skip questions
- ONE question at a time with concrete options and recommendations

**Worker agent template:**
- Reinforces the 9-step survival checklist from SUBTASK_PROMPT_V2
- Explicitly lists all steps with emphasis on non-negotiables
- Explains WHY skipping steps causes problems (lost work, conflicts, etc.)

**Agent path consolidation:**
- Now creates nested paths: `~/.config/opencode/agent/swarm/worker.md`
- Matches `Task(subagent_type="swarm/worker")` format
- Cleans up legacy flat files (`swarm-worker.md`) on reinstall

To get the new prompts, run `swarm setup` and choose "Reinstall everything".
