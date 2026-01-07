---
"opencode-swarm-plugin": patch
---

## Fix: Correct global skills directory path

Fixes `swarm doctor` and `swarm config` to check the correct global skills directory path.

**Before:** `~/.config/opencode/skills` (plural - wrong)
**After:** `~/.config/opencode/skill` (singular - correct)

This aligns the CLI with the actual skills system implementation.

Thanks @JungHoonGhae for the fix! 🐝
