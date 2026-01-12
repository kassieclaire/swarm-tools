---
"opencode-swarm-plugin": patch
---

> "The easiest and cheapest way to prevent bad neighborhoods from getting worse is to fix broken windows in abandoned buildings." — *Rails as She Is Spoke*

    \_/
   (o o)  "Entry point on disk."
   /|_|\

## 🐝 MCP Entrypoint Ships in Repo

Committed the built JavaScript MCP entrypoint so GitHub clone installs can run the MCP server without a build step.

**Why it matters:** prevents missing-file errors when OpenCode launches MCP tooling from a fresh clone.

**Impact:** smoother onboarding and reliable `swarm mcp` runs in local dev.

**Backward compatible:** existing npm installs and configs continue to work.
