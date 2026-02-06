---
"opencode-swarm-plugin": patch
"claude-code-swarm-plugin": patch
---

fix(hooks): restore swarm claude subcommand tree deleted by 86fab13

Commit 86fab13 ("support multiple OpenCode installation methods") accidentally
deleted ~2,070 lines from bin/swarm.ts via a bad rebase, nuking the entire
`swarm claude` subcommand tree. Every Claude Code hook invocation has been
hitting "Unknown subcommand" since, most visibly `agent-stop` on every response.

**Restored from 70d47d5:**
- `case "claude"` in main CLI switch
- ClaudeHookInput interface + 3 helper functions (readHookInput,
  resolveClaudeProjectPath, writeClaudeHookOutput)
- 10 handler functions: session-start, user-prompt, pre-compact, session-end,
  pre-edit, pre-complete, post-complete, track-tool, compliance, skill-reload
- Claude admin commands: path, install, uninstall, init
- Required imports: createMemoryAdapter, invalidateSkillsCache, discoverSkills

**New stub handlers for ed31f5c hooks:**
- coordinator-start, worker-start (SubagentStart)
- subagent-stop (SubagentStop), agent-stop (Stop)
- track-task (PreToolUse:TaskCreate|TaskUpdate)
- post-task-update (PostToolUse:TaskUpdate)

**Synced hooks.json** in opencode-swarm-plugin/claude-plugin to include
SubagentStart, SubagentStop, Stop, and task tracking hooks matching
the claude-code-swarm-plugin version.

> "Design fragility: the tendency of software to break in multiple places
> when a single change is made, often in seemingly unrelated areas."
