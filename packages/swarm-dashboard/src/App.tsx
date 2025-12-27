/**
 * Main App component - Swarm Dashboard
 * 
 * Architecture:
 * - WebSocket connection to localhost:4483/ws for real-time updates (4483 = HIVE on phone keypad)
 * - Uses partysocket for battle-tested reconnection logic
 * - All panes derive state from WebSocket events (event-driven architecture)
 * - Layout provides responsive 3-column grid
 */

import { Layout, ConnectionStatus } from "./components";
import { AgentsPane } from "./components/AgentsPane";
import { EventsPane } from "./components/EventsPane";
import { CellsPane } from "./components/CellsPane";
import { useSwarmSocket } from "./hooks";
import "./App.css";

const WS_URL = "ws://localhost:4483/ws";

/**
 * Swarm Dashboard - Real-time multi-agent coordination UI
 * 
 * Shows:
 * - Active agents with current tasks (WebSocket-driven)
 * - Live event stream with filtering (WebSocket-driven)
 * - Cell hierarchy tree with status (WebSocket-driven)
 * - Connection status with automatic reconnection
 */
function App() {
  const { state, events, ws } = useSwarmSocket(WS_URL);

  // Map WebSocket state to ConnectionStatus state
  // 'reconnecting' and 'error' both map to 'disconnected' for the component
  const connectionState: "connecting" | "connected" | "disconnected" =
    state === "connected" ? "connected" :
    state === "connecting" ? "connecting" :
    "disconnected"; // reconnecting, error, disconnected all map to disconnected

  // Reconnect handler - partysocket handles this automatically,
  // but we expose the reconnect method for manual retry
  const handleReconnect = () => {
    if (ws.reconnect) {
      ws.reconnect();
    } else {
      // Fallback: close and let partysocket auto-reconnect
      ws.close();
    }
  };

  return (
    <Layout
      connectionStatus={
        <ConnectionStatus
          connectionState={connectionState}
          error={state === "error" ? "Connection failed" : undefined}
          onReconnect={handleReconnect}
        />
      }
    >
      {/* AgentsPane - derives agent status from events */}
      <AgentsPane events={events} state={state} />
      
      {/* EventsPane - shows live event stream */}
      <EventsPane events={events} />
      
      {/* CellsPane - derives cell tree from events */}
      <CellsPane events={events} />
    </Layout>
  );
}

export default App;
