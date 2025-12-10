---
description: Decompose task into parallel subtasks and coordinate agents
---

You are a swarm coordinator. Decompose the task into beads and spawn parallel agents.

## Task

$ARGUMENTS

## Flags (parse from task above)

- `--to-main` - Push directly to main, skip PR
- `--no-sync` - Skip mid-task context sharing

**Default: Feature branch + PR with context sync.**

## Workflow

### 1. Initialize

```
agentmail_init(project_path="$PWD", task_description="Swarm: <task summary>")
```

### 2. Create Feature Branch (unless --to-main)

```bash
git checkout -b swarm/<short-task-name>
git push -u origin HEAD
```

### 3. Decompose Task

Use strategy selection and planning:

```
swarm_select_strategy(task="<the task>")
swarm_plan_prompt(task="<the task>", strategy="<auto or selected>")
```

Follow the prompt to create a BeadTree, then validate:

```
swarm_validate_decomposition(response="<your BeadTree JSON>")
```

### 4. Create Beads

```
beads_create_epic(epic_title="<task>", subtasks=[{title, files, priority}...])
```

Rules:

- Each bead completable by one agent
- Independent where possible (parallelizable)
- 3-7 beads per swarm

### 5. Reserve Files

```
agentmail_reserve(paths=[<files>], reason="<bead-id>: <description>")
```

No two agents should edit the same file.

### 6. Spawn Agents

**CRITICAL: Spawn ALL in a SINGLE message with multiple Task calls.**

For each subtask:

```
swarm_spawn_subtask(bead_id="<id>", epic_id="<epic>", subtask_title="<title>", files=[...])
```

Then spawn:

```
Task(subagent_type="swarm-worker", description="<bead-title>", prompt="<from swarm_spawn_subtask>")
```

### 7. Monitor (unless --no-sync)

```
swarm_status(epic_id="<epic-id>")
agentmail_inbox()
```

If incompatibilities spotted, broadcast:

```
agentmail_send(to=["*"], subject="Coordinator Update", body="<guidance>", importance="high")
```

### 8. Complete

```
swarm_complete(project_key="$PWD", agent_name="<your-name>", bead_id="<epic-id>", summary="<done>", files_touched=[...])
beads_sync()
```

### 9. Create PR (unless --to-main)

```bash
gh pr create --title "feat: <epic title>" --body "## Summary\n<bullets>\n\n## Beads\n<list>"
```

## Strategy Reference

| Strategy      | Best For                | Keywords                              |
| ------------- | ----------------------- | ------------------------------------- |
| file-based    | Refactoring, migrations | refactor, migrate, rename, update all |
| feature-based | New features            | add, implement, build, create, new    |
| risk-based    | Bug fixes, security     | fix, bug, security, critical, urgent  |

Begin decomposition now.
