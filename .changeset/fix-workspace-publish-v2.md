---
"opencode-swarm-plugin": patch
---

fix(publish): bump bun to 1.3.8 and add workspace dep resolution safety net

Previous fix (0.63.1) still shipped with unresolved `workspace:*` because CI
was pinned to bun 1.3.4 via `packageManager`. Bumps to 1.3.8 and replaces the
inline one-liner with a proper publish script that verifies and resolves any
leaked `workspace:*` references before uploading to npm.
