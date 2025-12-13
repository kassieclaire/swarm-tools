---
name: swarm-coordination
description: Multi-agent coordination patterns for OpenCode swarm workflows. Use when working on complex tasks that benefit from parallelization, when coordinating multiple agents, or when managing task decomposition. Do NOT use for simple single-agent tasks.
tags:
  - swarm
  - multi-agent
  - coordination
tools:
  - swarm_plan_prompt
  - swarm_decompose
  - swarm_validate_decomposition
  - swarm_spawn_subtask
  - swarm_complete
  - swarm_status
  - swarm_progress
  - beads_create_epic
  - beads_query
  - swarmmail_init
  - swarmmail_send
  - swarmmail_inbox
  - swarmmail_read_message
  - swarmmail_reserve
  - swarmmail_release
  - swarmmail_health
  - semantic-memory_find
  - cass_search
  - pdf-brain_search
  - skills_list
references:
  - references/strategies.md
  - references/coordinator-patterns.md
---

# Swarm Coordination

Multi-agent orchestration for parallel task execution. The coordinator breaks work into subtasks, spawns worker agents, monitors progress, and aggregates results.

## MANDATORY: Swarm Mail

**ALL coordination MUST use `swarmmail_*` tools.** This is non-negotiable.

Swarm Mail is embedded (no external server needed) and provides:

- File reservations to prevent conflicts
- Message passing between agents
- Thread-based coordination tied to beads

## When to Swarm

**DO swarm when:**

- Task touches 3+ files
- Natural parallel boundaries exist (frontend/backend/tests)
- Different specializations needed
- Time-to-completion matters

**DON'T swarm when:**

- Task is 1-2 files
- Heavy sequential dependencies
- Coordination overhead > benefit
- Tight feedback loop needed

**Heuristic:** If you can describe the task in one sentence without "and", don't swarm.

## Coordinator Workflow

### Phase 1: Initialize Swarm Mail (FIRST)

```typescript
// ALWAYS initialize first - registers you as coordinator
await swarmmail_init({
  project_path: "$PWD",
  task_description: "Swarm: <task summary>",
});
```

### Phase 2: Knowledge Gathering (MANDATORY)

Before decomposing, query ALL knowledge sources:

```typescript
// 1. Past learnings from this project
semantic_memory_find({ query: "<task keywords>", limit: 5 });

// 2. How similar tasks were solved before
cass_search({ query: "<task description>", limit: 5 });

// 3. Design patterns and prior art
pdf_brain_search({ query: "<domain concepts>", limit: 5 });

// 4. Available skills to inject into workers
skills_list();
```

Synthesize findings into `shared_context` for workers.

### Phase 3: Decomposition

```typescript
// Auto-select strategy and generate decomposition prompt
const plan = await swarm_plan_prompt({
  task: "Add user authentication with OAuth",
  max_subtasks: 5,
  query_cass: true, // searches history
  include_skills: true, // lists relevant skills
});

// Agent responds with BeadTree JSON, then validate
const validation = await swarm_validate_decomposition({
  response: agentResponse,
});

// Create epic + subtasks atomically
await beads_create_epic({
  epic_title: "Add OAuth Authentication",
  epic_description: "...",
  subtasks: validation.subtasks,
});
```

### Phase 4: Reserve Files (via Swarm Mail)

```typescript
// Reserve files for each subtask BEFORE spawning workers
await swarmmail_reserve({
  paths: ["src/auth/**"],
  reason: "bd-123: Auth service implementation",
  ttl_seconds: 3600,
  exclusive: true,
});
```

**Rules:**

- No file overlap between subtasks
- Coordinator mediates conflicts
- `swarm_complete` auto-releases

### Phase 5: Spawn Workers

```typescript
for (const subtask of subtasks) {
  const prompt = await swarm_spawn_subtask({
    bead_id: subtask.id,
    epic_id: epic.id,
    subtask_title: subtask.title,
    subtask_description: subtask.description,
    files: subtask.files,
    shared_context: synthesizedContext,
  });

  // Spawn via Task tool
  Task({
    subagent_type: "swarm/worker",
    prompt: prompt.worker_prompt,
  });
}
```

### Phase 6: Monitor & Intervene

```typescript
// Check progress
const status = await swarm_status({ epic_id, project_key });

// Check for messages from workers
const inbox = await swarmmail_inbox({ limit: 5 });

// Read specific message if needed
const message = await swarmmail_read_message({ message_id: N });

// Intervene if needed (see Intervention Patterns)
```

### Phase 7: Aggregate & Complete

- Verify all subtasks completed
- Run final verification (typecheck, tests)
- Close epic with summary
- Release any remaining reservations
- Record outcomes for learning

```typescript
await swarm_complete({
  project_key: "$PWD",
  agent_name: "coordinator",
  bead_id: epic_id,
  summary: "All subtasks complete",
  files_touched: [...],
});
await swarmmail_release(); // Release any remaining reservations
await beads_sync();
```

## Decomposition Strategies

Four strategies, auto-selected by task keywords:

| Strategy           | Best For                      | Keywords                              |
| ------------------ | ----------------------------- | ------------------------------------- |
| **file-based**     | Refactoring, migrations       | refactor, migrate, rename, update all |
| **feature-based**  | New features, vertical slices | add, implement, build, create         |
| **risk-based**     | Bug fixes, security           | fix, bug, security, critical          |
| **research-based** | Investigation, discovery      | research, investigate, explore        |

See `references/strategies.md` for full details.

## Communication Protocol

Workers communicate via Swarm Mail with epic ID as thread:

```typescript
// Progress update
swarmmail_send({
  to: ["coordinator"],
  subject: "Auth API complete",
  body: "Endpoints ready at /api/auth/*",
  thread_id: epic_id,
});

// Blocker
swarmmail_send({
  to: ["coordinator"],
  subject: "BLOCKED: Need DB schema",
  body: "Can't proceed without users table",
  thread_id: epic_id,
  importance: "urgent",
});
```

**Coordinator checks inbox regularly** - don't let workers spin.

## Intervention Patterns

| Signal                  | Action                               |
| ----------------------- | ------------------------------------ |
| Worker blocked >5 min   | Check inbox, offer guidance          |
| File conflict           | Mediate, reassign files              |
| Worker asking questions | Answer directly                      |
| Scope creep             | Redirect, create new bead for extras |
| Repeated failures       | Take over or reassign                |

## Failure Recovery

### Incompatible Outputs

Two workers produce conflicting results.

**Fix:** Pick one approach, re-run other with constraint.

### Worker Drift

Worker implements something different than asked.

**Fix:** Revert, re-run with explicit instructions.

### Cascade Failure

One blocker affects multiple subtasks.

**Fix:** Unblock manually, reassign dependent work, accept partial completion.

## Anti-Patterns

| Anti-Pattern         | Symptom                          | Fix                           |
| -------------------- | -------------------------------- | ----------------------------- |
| **Mega-Coordinator** | Coordinator editing files        | Coordinator only orchestrates |
| **Silent Swarm**     | No communication, late conflicts | Require updates, check inbox  |
| **Over-Decomposed**  | 10 subtasks for 20 lines         | 2-5 subtasks max              |
| **Under-Specified**  | "Implement backend"              | Clear goal, files, criteria   |

## Shared Context Template

```markdown
## Project Context

- Repository: {repo}
- Stack: {tech stack}
- Patterns: {from pdf-brain}

## Task Context

- Epic: {title}
- Goal: {success criteria}
- Constraints: {scope, time}

## Prior Art

- Similar tasks: {from CASS}
- Learnings: {from semantic-memory}

## Coordination

- Active subtasks: {list}
- Reserved files: {list}
- Thread: {epic_id}
```

## Swarm Mail Quick Reference

| Tool                     | Purpose                             |
| ------------------------ | ----------------------------------- |
| `swarmmail_init`         | Initialize session (REQUIRED FIRST) |
| `swarmmail_send`         | Send message to agents              |
| `swarmmail_inbox`        | Check inbox (max 5, no bodies)      |
| `swarmmail_read_message` | Read specific message body          |
| `swarmmail_reserve`      | Reserve files for exclusive editing |
| `swarmmail_release`      | Release file reservations           |
| `swarmmail_ack`          | Acknowledge message                 |
| `swarmmail_health`       | Check database health               |

## Full Swarm Flow

```typescript
// 1. Initialize Swarm Mail FIRST
swarmmail_init({ project_path: "$PWD", task_description: "..." });

// 2. Gather knowledge
semantic_memory_find({ query });
cass_search({ query });
pdf_brain_search({ query });
skills_list();

// 3. Decompose
swarm_plan_prompt({ task });
swarm_validate_decomposition();
beads_create_epic();

// 4. Reserve files
swarmmail_reserve({ paths, reason, ttl_seconds });

// 5. Spawn workers (loop)
swarm_spawn_subtask();

// 6. Monitor
swarm_status();
swarmmail_inbox();
swarmmail_read_message({ message_id });

// 7. Complete
swarm_complete();
swarmmail_release();
beads_sync();
```

See `references/coordinator-patterns.md` for detailed patterns.
