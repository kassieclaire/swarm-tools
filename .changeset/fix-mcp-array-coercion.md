---
"claude-code-swarm-plugin": patch
"opencode-swarm-plugin": patch
---

fix(mcp): coerce string→array params flattened by MCP protocol

The MCP protocol flattens all `type: "array"` JSON Schema params to `type: "string"`,
causing Claude to send JSON-encoded strings or pipe-delimited strings instead of actual
arrays. This broke `hive_create_epic` (subtasks), `swarmmail_reserve` (paths), and 8
other array params.

Adds `coerceArrayParams()` that handles JSON strings, pipe-delimited, comma-separated,
and single values. Relaxes Zod validation to accept both strings and arrays for these
params.

> "Coerce objects into the roles we need them to play. Guard the borders, not the
> hinterlands." — Avdi Grimm, Confident Ruby
