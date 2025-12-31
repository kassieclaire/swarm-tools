---
"opencode-swarm-plugin": patch
"swarm-mail": patch
---

## swarm_complete now reports accurate reservation release status

```
    🐝 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🐝
    
         ╭──────────────────────────────────────────────╮
         │  RESERVATION RELEASE TRACKING IMPROVED       │
         │                                              │
         │  Before: reservations_released: true (lie)   │
         │  After:  reservations_released: false        │
         │          reservations_released_count: 0      │
         │          reservations_release_error: "..."   │
         ╰──────────────────────────────────────────────╯
    
    🐝 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🐝
```

**What changed:**

`swarm_complete` now accurately reports the reservation release outcome:

- `reservations_released`: boolean - whether release succeeded
- `reservations_released_count`: number - how many reservations were released
- `reservations_release_error`: string | undefined - error message if release failed

Previously, `reservations_released` was hardcoded to `true` even when the release failed silently.

**Why it matters:**

Coordinators and debugging tools can now see the actual state of file reservations after task completion. This helps diagnose coordination issues where files remain locked unexpectedly.

**Tests added:**

- Verify reservation release allows other agents to reserve the same files
- Verify "release all" pattern (no paths specified) works correctly - this is how `swarm_complete` calls `releaseSwarmFiles`

> "Make the implicit explicit." — Kent Beck
