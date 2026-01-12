---
"opencode-swarm-plugin": patch
---

> "When you improve code, you have to test to verify that it still works." — Martin Fowler, *Refactoring*

## 🧩 MCP JS Entrypoint for Git Clone Installs

The Claude marketplace now launches a committed JS MCP entrypoint from `claude-plugin/bin`, so GitHub-cloned installs work without a build step.

**What changed**
- Bundled JS entrypoint committed at `claude-plugin/bin/swarm-mcp-server.js`
- Build script keeps the JS entrypoint in sync
- Tests updated to assert the manifest uses the JS entrypoint

**Why it matters**
- Fixes MCP startup when marketplace clones the repo (no `dist/`)

**Compatibility**
- No API changes; existing installs keep working
