---
"opencode-swarm-plugin": minor
---

Add worker survival checklist and Socratic planning for swarm coordination

**Worker Survival Checklist (9-step mandatory flow):**
- Workers now follow a strict initialization sequence: swarmmail_init → semantic-memory_find → skills_use → swarmmail_reserve
- Workers reserve their own files (coordinators no longer reserve on behalf of workers)
- Auto-checkpoint at 25/50/75% progress milestones
- Workers store learnings via semantic-memory before completing

**Socratic Planning:**
- New `swarm_plan_interactive` tool with 4 modes: socratic (default), fast, auto, confirm-only
- Default mode asks clarifying questions before decomposition
- Escape hatches for experienced users: `--fast`, `--auto`, `--confirm-only` flags on /swarm command

**Updated Skills:**
- swarm-coordination skill now documents worker survival patterns and coordinator rules
