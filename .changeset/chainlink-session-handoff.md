---
"opencode-swarm-plugin": minor
"swarm-mail": minor
---

## 🐝 Session Handoff: The Hive Remembers

```
    ┌─────────────────────────────────────────┐
    │  SESSION 1          SESSION 2           │
    │  ┌───────┐          ┌───────┐           │
    │  │ Agent │──notes──▶│ Agent │           │
    │  │  #1   │          │  #2   │           │
    │  └───────┘          └───────┘           │
    │      │                  │               │
    │      ▼                  ▼               │
    │  "Did X, next Y,    "Got it, doing Y,   │
    │   watch out for Z"   avoiding Z..."     │
    └─────────────────────────────────────────┘
```

> "A user's session resides in memory on an application server. When that server 
> goes down, the next request from the user will be directed to another server. 
> Obviously, we would like that transition to be as seamless as possible."
> — Michael Nygard, *Release It!*

Agents are ephemeral. Context is not. Session handoff ensures the next agent picks up where you left off.

**New Tools:**
- `hive_session_start` - Start session, receive previous handoff notes
- `hive_session_end` - End session with notes for the next agent

**New CLI Commands:**
- `swarm session start` - Start a session
- `swarm session end` - End with handoff notes
- `swarm session status` - Check current session
- `swarm session history` - List recent sessions

**Schema:** Migration v9 adds `sessions` table with handoff_notes, timestamps, and cell linkage.

**Usage:**
```typescript
// At session start
const { previous_handoff } = await hive_session_start({ active_cell_id: "bd-123" });
// previous_handoff: "Completed auth flow. Next: add tests. Watch out for token refresh race condition."

// At session end
await hive_session_end({ 
  handoff_notes: "Added 12 tests. All passing. Next: wire into CI. The mock server needs HTTPS." 
});
```

**Credit:** Chainlink session management pattern by [@dollspace-gay](https://github.com/dollspace-gay/chainlink)
