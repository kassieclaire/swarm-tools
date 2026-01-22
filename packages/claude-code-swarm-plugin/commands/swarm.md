---
description: Decompose a task into parallel subtasks and coordinate execution
---

# /swarm:swarm

Use this command to kick off a multi-agent swarm.

If no task is provided, ask the user for the task description before proceeding.

## CRITICAL: Always Swarm When Invoked

**When the user invokes `/swarm`, ALWAYS create a swarm. No exceptions.**

Do NOT make judgment calls about task size or complexity. The user invoked `/swarm` because they want:
- **Context preservation** - spawning workers offloads work from coordinator context
- **Session resilience** - workers can continue if coordinator compacts
- **Parallel execution** - even 2-3 subtasks benefit from parallelization

If the task has only 1 subtask, create a single-worker swarm. If files overlap, make subtasks sequential via dependencies. But ALWAYS swarm.

**Forbidden excuses:**
- "This is too small for a swarm"
- "I'll handle it directly"
- "This is straightforward enough"
- "Only 2 files, no need to parallelize"

## Workflow
1. Clarify scope and success criteria if needed.
2. `swarmmail_init()` to register the session.
3. `hivemind_find()` to check for relevant prior learnings about this codebase/task.
4. `swarm_decompose()` → `swarm_validate_decomposition()` for a safe plan.
5. `hive_create_epic()` to create the epic + subtasks.
6. `swarm_spawn_subtask()` for each subtask (workers reserve files).
7. Monitor with `swarm_status()` and `swarmmail_inbox()`.
8. Review workers with `swarm_review()` + `swarm_review_feedback()`.
9. `hivemind_store()` to record learnings from this swarm (patterns discovered, gotchas, decisions).

## Memory Requirements

**Coordinators MUST:**
- Search hivemind before decomposition to leverage prior learnings
- Store learnings after swarm completion (what worked, what didn't, patterns discovered)

**Workers MUST:**
- Store discoveries, gotchas, and decisions as they work
- Tag memories with relevant context (file names, patterns, technologies)

## Usage
`/swarm:swarm <task>`

If `$ARGUMENTS` is empty, ask the user to provide the task before continuing.
