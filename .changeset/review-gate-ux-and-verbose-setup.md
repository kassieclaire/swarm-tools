---
"opencode-swarm-plugin": patch
---

## 🚦 Review Gate UX Fix + Verbose Setup

> *"A common mistake that people make when trying to design something completely foolproof is to underestimate the ingenuity of complete fools."*
> — Douglas Adams, *Mostly Harmless*

Two UX improvements that make swarm coordination feel less like shouting into the void.

### What Changed

**Review Gate Response Fix:**
- `swarm_complete` no longer returns `success: false` when code review is pending
- Now returns `success: true` with `status: "pending_review"` or `status: "needs_changes"`
- **Why it matters**: The old format made review checkpoints look like errors. Agents would retry unnecessarily or report failures when the workflow was actually working as designed. Review gates are a feature, not a bug.

**Setup Command Verbosity:**
- Added `p.log.step()` and `p.log.success()` throughout swarm setup
- Users can now see exactly what's happening: dependency checks, git init, swarm-mail connection
- **Why it matters**: Silent setup commands feel broken. Explicit progress logs build trust and make debugging easier when setup actually does fail.

### Why It Matters

**For Agents:**
- No more false-negative responses from review gates
- Clear workflow state (pending vs. needs changes vs. complete)
- Reduced retry loops and error noise

**For Users:**
- Setup command shows its work (not a black box)
- Review process is transparent in logs
- Easier to diagnose when things actually break

**Backward compatible:** Yes. Existing agents checking for `success: false` will still work, they just won't see false errors anymore.
