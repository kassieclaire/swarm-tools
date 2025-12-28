---
"opencode-swarm-plugin": patch
---

## `swarm capture` - The CLI Stays Dumb, The Plugin Stays Dumber

> "To conform to the principle of dependency inversion, we must isolate this abstraction from the details of the problem."
> — Robert C. Martin, Clean Code

```
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │   ~/.config/opencode/plugin/swarm.ts                        │
    │   ┌─────────────────────────────────────────────────────┐   │
    │   │                                                     │   │
    │   │   spawn("swarm", ["capture", "--session", ...])     │───┼──► swarm capture
    │   │                                                     │   │         │
    │   │   // No imports from opencode-swarm-plugin          │   │         │
    │   │   // Version always matches CLI                     │   │         ▼
    │   │   // Fire and forget                                │   │    captureCompactionEvent()
    │   │                                                     │   │
    │   └─────────────────────────────────────────────────────┘   │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

**The Problem:** Plugin wrapper was importing `captureCompactionEvent` directly from the npm package. When installed globally, this import could fail or use a stale version.

**The Fix:** Shell out to `swarm capture` CLI command instead. The CLI is always the installed version, so no version mismatch.

**New command:**
```bash
swarm capture --session <id> --epic <id> --type <type> [--payload <json>]

# Types: detection_complete, prompt_generated, context_injected, 
#        resumption_started, tool_call_tracked
```

**Design principle:** The plugin wrapper in `~/.config/opencode/plugin/swarm.ts` should be as dumb as possible. All logic lives in the CLI/npm package. Users never need to update their local plugin file for new features - just `npm update`.

**Files changed:**
- `bin/swarm.ts` - Added `capture` command
- `examples/plugin-wrapper-template.ts` - Uses CLI instead of import
