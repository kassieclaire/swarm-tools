---
"opencode-swarm-plugin": patch
---

## 🐝 Skills Directory Auto-Migration

OpenCode renamed `skills` → `skill` (singular). This patch handles the migration automatically.

```
   ~/.config/opencode/skills/     ~/.config/opencode/skill/
          ┌─────────┐                    ┌─────────┐
          │ BEFORE  │  ──swarm setup──►  │ AFTER   │
          └─────────┘                    └─────────┘
```

**What happens:**

- `swarm setup` detects old `skills` directory and renames to `skill`
- Claude compatibility preserved (`.claude/skills` stays plural)
- Plugin wrapper template now properly included in npm package

No manual migration needed - just run `swarm setup`.
