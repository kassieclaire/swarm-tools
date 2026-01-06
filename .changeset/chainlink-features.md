---
"opencode-swarm-plugin": minor
"swarm-mail": minor
---

## Standing on the Shoulders of Giants

> "If I have seen further, it is by standing on the shoulders of giants."
> — Sir Isaac Newton

```
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │     C H A I N L I N K   I N S P I R E D                     │
    │                                                             │
    │   Session Handoff • Stub Detection • Tree View • Adversary  │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
                    \
                     \   🐝
                      \  ╱╲
                       ╲╱  ╲
                        ╲  ╱
                         ╲╱
```

### Session Handoff Notes

Chainlink-inspired session management with handoff notes for context preservation across sessions.

**New CLI commands:**
- `swarm session start` - Start a new session with optional handoff notes
- `swarm session end` - End session with summary and handoff notes
- `swarm session status` - Show current session status
- `swarm session history` - List recent sessions

**New API:**
- `SessionAdapter` interface with 5 methods
- Schema migration v9 adds sessions table

### UBS Stub Detection

15 patterns adapted from Chainlink's `post-edit-check.py` for detecting incomplete code:

- TODO, FIXME, XXX, HACK comments
- Empty function bodies (`pass`, `...`)
- Language-specific stubs (`unimplemented!()`, `todo!()`)
- Placeholder returns with stub comments

### Tree View CLI

`swarm tree` command with ASCII visualization:

```
Feature Epic [epic] ○ P1
├── Subtask 1 [task] ◐ P2
├── Subtask 2 [task] ● P2
└── Subtask 3 [task] ⊘ P2
```

**Status indicators:** ○ open, ◐ in_progress, ● closed, ⊘ blocked

### Adversarial Reviewer (Sarcasmotron)

VDD-style hostile reviewer with zero tolerance for slop:

- **Fresh context per review** - prevents "relationship drift"
- **HALLUCINATING verdict** - when adversary invents issues, code is zero-slop
- **Hostile tone** - no participation trophies

**Credits:**
- [Chainlink](https://github.com/dollspace-gay/chainlink) by @dollspace-gay
- [VDD](https://github.com/Vomikron/VDD) by @Vomikron
