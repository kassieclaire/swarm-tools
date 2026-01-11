---
"swarm-mail": patch
---

> "When you improve code, you have to test to verify that it still works." — Martin Fowler, *Refactoring*

## 📦 Tarball Reliability Bump

We’re bumping `swarm-mail` to ship the tarball integrity checks and avoid stale package metadata.

**What changed**
- Tarball packaging checks added to catch version drift early

**Why it matters**
- Prevents publishing packages with mismatched metadata

**Compatibility**
- No API changes
