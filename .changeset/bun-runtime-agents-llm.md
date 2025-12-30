---
"opencode-swarm-plugin": minor
---

## 🐝 Bun Runtime Required + LLM-Powered AGENTS.md Updates

> "The best tool is the one that gets out of your way." — Every frustrated regex maintainer

### Breaking Change: Bun Runtime Required

The CLI now requires Bun runtime. The shebang changed from `#!/usr/bin/env node` to `#!/usr/bin/env bun`.

**Why?** The codebase uses Bun-specific APIs (`Bun.spawn`, `Bun.$`, `Bun.file`) throughout. Running under Node.js caused cryptic "Bun is not defined" errors.

**Install Bun:**
```bash
curl -fsSL https://bun.sh/install | bash
# or
brew install oven-sh/bun/bun
```

### New: `swarm doctor` Shows Bun Status

```
◇  Required dependencies:
│
◆  Bun v1.3.6
◆  OpenCode v0.0.0
```

### New: `swarm agents` Uses LLM for Updates

Instead of brittle regex replacements, `swarm agents` now calls `opencode run` to intelligently update your AGENTS.md:

- Renames tool references (cass_* → hivemind_*, semantic-memory_* → hivemind_*)
- Consolidates CASS + Semantic Memory sections into unified Hivemind section
- Updates prose to use Hivemind terminology
- Preserves existing structure

```bash
swarm agents        # Interactive
swarm agents --yes  # Non-interactive
```

### ADR-011: Hivemind Unification

All memory tools are now unified under the `hivemind_*` namespace:

| Old | New |
|-----|-----|
| `cass_search` | `hivemind_find` |
| `cass_view` | `hivemind_get` |
| `semantic-memory_store` | `hivemind_store` |
| `semantic-memory_find` | `hivemind_find` |
| `semantic-memory_validate` | `hivemind_validate` |

The hive remembers everything. 🐝
