---
"swarm-mail": minor
"opencode-swarm-plugin": minor
---

## 🐝 Cell IDs Now Wear Their Project Colors

> *"We may fantasize about being International Men of Mystery, but our code needs to be mundane and clear. One of the most important parts of clear code is good names."*
> — Martin Fowler, *Refactoring*

Cell IDs finally know where they came from. Instead of anonymous `bd-xxx` prefixes,
new cells proudly display their project name: `swarm-mail-lf2p4u-abc123`.

### What Changed

**swarm-mail:**
- `generateBeadId()` now reads `package.json` name field from project directory
- Added `slugifyProjectName()` for safe ID generation (lowercase, special chars → dashes)
- Falls back to `cell-` prefix if no package.json or no name field

**opencode-swarm-plugin:**
- Removed all `bd` CLI usage from `swarm-orchestrate.ts` - now uses HiveAdapter
- Improved compaction hook swarm detection with confidence levels (high/medium/low)
- Added fallback detection prompt for uncertain swarm states

### Examples

| Before | After |
|--------|-------|
| `bd-lf2p4u-mjbneh7mqah` | `swarm-mail-lf2p4u-mjbneh7mqah` |
| `bd-abc123-xyz` | `my-cool-app-abc123-xyz` |
| (no package.json) | `cell-abc123-xyz` |

### Why It Matters

- **Identifiable at a glance** - Know which project a cell belongs to without looking it up
- **Multi-project workspaces** - Filter/search cells by project prefix
- **Terminology cleanup** - Removes legacy "bead" (`bd-`) from user-facing IDs

### Backward Compatible

Existing `bd-*` IDs still work fine. No migration needed - only NEW cells get project prefixes.

### Compaction: Keeping the Swarm Alive

> *"Intelligent and structured group dynamics that emerge not from a leader, but from the local interactions of the elements themselves."*
> — Daniel Shiffman, *The Nature of Code*

The compaction hook now uses multi-signal detection to keep swarms cooking through context compression:

- **HIGH confidence:** Active reservations, in_progress cells → full swarm context
- **MEDIUM confidence:** Open subtasks, unclosed epics → full swarm context  
- **LOW confidence:** Any cells exist → fallback detection prompt

Philosophy: Err on the side of continuation. A false positive costs context space. A false negative loses the swarm.
