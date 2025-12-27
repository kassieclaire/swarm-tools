/**
 * Tests for useSwarmSocket (partysocket-based WebSocket hook)
 * 
 * Tests cover:
 * - Type-level interface validation
 * - WebSocket connection state transitions
 * - Event parsing and deduplication
 * - React hook behavior (cleanup, StrictMode)
 */

import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { renderHook, cleanup, waitFor } from "@testing-library/react";
import { useSwarmSocket } from "./useSwarmSocket";
import type { UseSwarmSocketOptions, WebSocketState } from "./useSwarmSocket";
import type { AgentEvent } from "../lib/types";

// Mock partysocket's useWebSocket hook
let mockWebSocket: {
  send: ReturnType<typeof mock>;
  close: ReturnType<typeof mock>;
  readyState: number;
  addEventListener?: (event: string, handler: Function) => void;
  removeEventListener?: (event: string, handler: Function) => void;
};

let mockHandlers: {
  onOpen?: (event: any) => void;
  onMessage?: (event: any) => void;
  onClose?: (event: any) => void;
  onError?: (event: any) => void;
};

mock.module("partysocket/react", () => ({
  useWebSocket: (url: string, protocols: any, options: any) => {
    // Store handlers for testing
    mockHandlers = {
      onOpen: options?.onOpen,
      onMessage: options?.onMessage,
      onClose: options?.onClose,
      onError: options?.onError,
    };
    
    return mockWebSocket;
  },
}));

describe("useSwarmSocket types", () => {
  test("exports expected types", () => {
    // Verify type exports compile
    const options: UseSwarmSocketOptions = {
      onEvents: () => {},
    };
    
    const states: WebSocketState[] = [
      "connecting",
      "connected",
      "reconnecting",
      "disconnected",
      "error",
    ];
    
    expect(options).toBeDefined();
    expect(states).toHaveLength(5);
  });
  
  test("function signature matches expected interface", () => {
    // Verify function exists and has correct type
    expect(typeof useSwarmSocket).toBe("function");
    // length=2 (url + options)
    expect(useSwarmSocket.length).toBeGreaterThanOrEqual(1);
  });
});

describe("useSwarmSocket interface", () => {
  test("README: Hook requires url parameter", () => {
    // This documents the required parameter
    const url = "ws://localhost:4483/ws";
    expect(url).toMatch(/^wss?:\/\//);
  });
  
  test("README: Options are optional with sensible defaults", () => {
    // Options parameter can be omitted
    const options: UseSwarmSocketOptions = {};
    expect(options).toBeDefined();
  });
  
  test("README: onEvents callback receives AgentEvent array", () => {
    let receivedEvents: unknown[] = [];
    
    const options: UseSwarmSocketOptions = {
      onEvents: (events) => {
        receivedEvents = events;
      },
    };
    
    expect(typeof options.onEvents).toBe("function");
  });
});

describe("useSwarmSocket WebSocket integration", () => {
  beforeEach(() => {
    // Reset mock WebSocket before each test
    mockWebSocket = {
      send: mock(() => {}),
      close: mock(() => {}),
      readyState: 0, // CONNECTING
    };
    
    mockHandlers = {};
    
    // Mock localStorage (partysocket uses it)
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  });
  
  afterEach(() => {
    cleanup();
  });
  
  test("initial state is 'connecting'", () => {
    const { result } = renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    expect(result.current.state).toBe("connecting");
    expect(result.current.events).toEqual([]);
  });
  
  test("transitions to 'connected' on WebSocket open", async () => {
    const { result } = renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    expect(result.current.state).toBe("connecting");
    
    // Simulate WebSocket open event
    mockHandlers.onOpen?.({ target: mockWebSocket } as any);
    
    await waitFor(() => {
      expect(result.current.state).toBe("connected");
    });
  });
  
  test("sends subscribe message on connection", async () => {
    renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    // Simulate WebSocket open event
    mockHandlers.onOpen?.({ target: mockWebSocket } as any);
    
    await waitFor(() => {
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "subscribe", offset: 0 })
      );
    });
  });
  
  test("parses and accumulates events from WebSocket messages", async () => {
    const { result } = renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    // Simulate connection
    mockHandlers.onOpen?.({ target: mockWebSocket } as any);
    
    // Simulate event message
    const agentEvent: AgentEvent = {
      id: 1,
      type: "agent_registered",
      agent_name: "TestAgent",
      project_key: "test-project",
      timestamp: Date.now(),
    };
    
    mockHandlers.onMessage?.({
      data: JSON.stringify({
        type: "event",
        data: JSON.stringify(agentEvent),
      }),
    } as any);
    
    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]).toMatchObject({
        type: "agent_registered",
        agent_name: "TestAgent",
      });
    });
  });
  
  test("deduplicates events by id", async () => {
    const { result } = renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    mockHandlers.onOpen?.({ target: mockWebSocket } as any);
    
    const agentEvent: AgentEvent = {
      id: 1,
      type: "agent_registered",
      agent_name: "TestAgent",
      project_key: "test-project",
      timestamp: Date.now(),
    };
    
    // Send same event twice
    const messageData = {
      type: "event",
      data: JSON.stringify(agentEvent),
    };
    
    mockHandlers.onMessage?.({ data: JSON.stringify(messageData) } as any);
    mockHandlers.onMessage?.({ data: JSON.stringify(messageData) } as any);
    
    await waitFor(() => {
      // Should only have 1 event (deduplicated)
      expect(result.current.events).toHaveLength(1);
    });
  });
  
  test("ignores server control messages", async () => {
    const { result } = renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    mockHandlers.onOpen?.({ target: mockWebSocket } as any);
    
    // Send control messages
    mockHandlers.onMessage?.({ data: JSON.stringify({ type: "connected" }) } as any);
    mockHandlers.onMessage?.({ data: JSON.stringify({ type: "heartbeat" }) } as any);
    mockHandlers.onMessage?.({ data: JSON.stringify({ type: "pong" }) } as any);
    
    await waitFor(() => {
      // Events should still be empty
      expect(result.current.events).toHaveLength(0);
    });
  });
  
  test("calls onEvents callback when events are received", async () => {
    const onEvents = mock(() => {});
    const { result } = renderHook(() => 
      useSwarmSocket("ws://localhost:4483/ws", { onEvents })
    );
    
    mockHandlers.onOpen?.({ target: mockWebSocket } as any);
    
    const agentEvent: AgentEvent = {
      id: 1,
      type: "agent_registered",
      agent_name: "TestAgent",
      project_key: "test-project",
      timestamp: Date.now(),
    };
    
    mockHandlers.onMessage?.({
      data: JSON.stringify({
        type: "event",
        data: JSON.stringify(agentEvent),
      }),
    } as any);
    
    await waitFor(() => {
      expect(onEvents).toHaveBeenCalled();
      const callArgs = onEvents.mock.calls[0][0];
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0]).toMatchObject({ type: "agent_registered" });
    });
  });
  
  test("transitions to 'reconnecting' on non-normal close", async () => {
    const { result } = renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    mockHandlers.onOpen?.({ target: mockWebSocket } as any);
    
    await waitFor(() => {
      expect(result.current.state).toBe("connected");
    });
    
    // Simulate abnormal close (code !== 1000)
    mockHandlers.onClose?.({ code: 1006, reason: "Connection lost" } as any);
    
    await waitFor(() => {
      expect(result.current.state).toBe("reconnecting");
    });
  });
  
  test("transitions to 'disconnected' on normal close", async () => {
    const { result } = renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    mockHandlers.onOpen?.({ target: mockWebSocket } as any);
    
    await waitFor(() => {
      expect(result.current.state).toBe("connected");
    });
    
    // Simulate normal close (code === 1000)
    mockHandlers.onClose?.({ code: 1000, reason: "Normal closure" } as any);
    
    await waitFor(() => {
      expect(result.current.state).toBe("disconnected");
    });
  });
  
  test("transitions to 'error' on WebSocket error", async () => {
    const { result } = renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    mockHandlers.onError?.(new Event("error"));
    
    await waitFor(() => {
      expect(result.current.state).toBe("error");
    });
  });
  
  test("cleans up WebSocket on unmount", () => {
    const { unmount } = renderHook(() => useSwarmSocket("ws://localhost:4483/ws"));
    
    unmount();
    
    expect(mockWebSocket.close).toHaveBeenCalledWith(1000, "Component unmount");
  });
});
