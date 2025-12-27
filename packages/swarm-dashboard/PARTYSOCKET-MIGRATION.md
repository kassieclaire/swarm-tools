# PartySocket Migration Plan

## Status: PARTIAL (Blocked on useWebSocket.ts reservation)

**Cell**: mjnpk5iikxz
**Agent**: GoldWind
**Blocked by**: DarkCloud reservation on useWebSocket.ts

## What's Done ✅

1. **Created `src/hooks/useSwarmSocket.ts`**
   - Uses partysocket's `useWebSocket` hook from 'partysocket/react'
   - Wraps with our event parsing logic
   - Automatic reconnection with exponential backoff (1s min, 10s max)
   - Event deduplication by ID
   - React StrictMode safe (uses refs for mutable state)
   - Connection state tracking
   - ~165 lines

2. **Updated `src/hooks/index.ts`**
   - Exports new `useSwarmSocket` from `./useSwarmSocket`
   - Maintains backward compat with old `useWebSocket` export (TODO comment)
   - Type exports updated

3. **Verified**
   - TypeScript compiles without errors
   - No test failures (tests disabled per mjn8w18yudm)

## What's Blocked 🚫

1. **Update `src/hooks/useWebSocket.ts`**
   - Currently reserved by DarkCloud
   - Options when available:
     - **Option A**: Delete file (useSwarmSocket.ts replaces it)
     - **Option B**: Make it a simple re-export: `export { useSwarmSocket as useWebSocket } from "./useSwarmSocket"`
   - Recommended: **Option B** (maintains backward compatibility)

## Migration Steps (When Unblocked)

### Step 1: Update useWebSocket.ts

Replace current implementation with simple re-export:

```typescript
/**
 * Backward compatibility re-export
 * @deprecated Use useSwarmSocket instead
 */
export { useSwarmSocket, useSwarmSocket as useWebSocket } from "./useSwarmSocket";
export type { UseSwarmSocketOptions, WebSocketState } from "./useSwarmSocket";
```

### Step 2: Test Manually

```bash
cd packages/swarm-dashboard
bun run dev
```

Open browser console, verify:
- `[WS] Connecting to: ws://localhost:4483/ws`
- `[WS] OPEN - connected`
- `[WS] Sending subscribe...`
- `[WS] Server confirmed connection`
- `[WS] Event: <type> <agent>` (for first 10 events)

### Step 3: Verify State Flow

Check App.tsx receives events:
- `state` changes: connecting → connected
- `events` array grows as WebSocket receives events
- AgentsPane, EventsPane, CellsPane receive events prop and render

### Step 4: Test Reconnection

In browser console:
```js
// Close WebSocket manually
window.ws.close()
```

Verify:
- `[WS] CLOSE: ...`
- State changes to "reconnecting"
- Reconnects automatically within 1-10 seconds
- Events continue flowing after reconnect

## Benefits of PartySocket

**Before** (custom native WebSocket):
- ✅ Manual reconnection with fixed 2s delay
- ✅ Event deduplication
- ✅ React StrictMode handling
- ❌ No exponential backoff
- ❌ No message buffering
- ❌ ~163 lines of manual logic

**After** (partysocket wrapper):
- ✅ Automatic reconnection with exponential backoff
- ✅ Message buffering (send while disconnected, queue until reconnect)
- ✅ Configurable retry limits and delays
- ✅ Battle-tested library (used in production apps)
- ✅ Event deduplication (our logic)
- ✅ React StrictMode handling (our logic)
- ✅ ~165 lines (wrapper logic)

## Configuration Options

Current partysocket config in `useSwarmSocket.ts`:

```typescript
{
  startClosed: false,           // Connect immediately
  maxReconnectionDelay: 10000,  // 10s max between retries
  minReconnectionDelay: 1000,   // 1s min between retries
  reconnectionDelayGrowFactor: 1.3,  // Exponential backoff
  connectionTimeout: 4000,      // 4s before declaring connection failed
  maxRetries: Infinity,         // Never give up
  debug: false,                 // Set to true for verbose logging
}
```

To enable debug logging:
```diff
- debug: false,
+ debug: true,
```

## Rollback Plan

If partysocket causes issues:

1. Revert `src/hooks/index.ts` to export from `./useWebSocket`
2. Keep `useSwarmSocket.ts` (it's isolated)
3. Old `useWebSocket.ts` continues working

## Semantic Memory Learning

After successful migration, store:

```
semantic-memory_store(
  information="PartySocket migration for React WebSocket hooks: Replace native WebSocket with partysocket's useWebSocket from 'partysocket/react'. Key benefits: automatic reconnection with exponential backoff (1s-10s), message buffering, battle-tested library. Wrap with custom event parsing logic in useSwarmSocket.ts. Pattern: partysocket handles connection lifecycle, we handle app-specific message parsing and deduplication. Config: maxRetries=Infinity for persistent reconnection, connectionTimeout=4000ms to detect failures fast. React StrictMode: still need refs for mutable state (partysocket doesn't solve double-mount).",
  metadata="react, websocket, partysocket, reconnection, real-time"
)
```

## Contact

**Blocked on**: DarkCloud to release useWebSocket.ts
**Coordinator**: Notified via swarmmail (3 messages sent)
**Next agent**: Can complete Step 1-4 when file is available
