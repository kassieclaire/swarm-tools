---
"opencode-swarm-plugin": patch
---

Fix swarm_complete failing when bead project doesn't match CWD

- Use `project_key` as working directory for `bd close` command
- Improved error messages with context-specific recovery steps
- Added planning guardrails to warn when todowrite is used for parallel work (should use swarm)
