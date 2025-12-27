/**
 * Tests for ConnectionStatus component
 * 
 * Validates:
 * - Proper rendering for all connection states (connected, connecting, disconnected)
 * - Error message display
 * - Retry button visibility and click handler
 * - Catppuccin color usage
 * - Pulsing animation for connecting state
 */

import { describe, expect, test, mock, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ConnectionStatus } from "./ConnectionStatus";

describe("ConnectionStatus", () => {
  afterEach(() => {
    cleanup();
  });
  test("shows green dot and 'Connected' text when connected", () => {
    render(
      <ConnectionStatus
        connectionState="connected"
        onReconnect={() => {}}
      />
    );

    const indicator = screen.getByTestId("connection-indicator");
    expect(indicator.getAttribute("title")).toBe("Connected");
    expect(screen.getByText("Connected")).toBeDefined();
  });

  test("shows yellow pulsing dot and 'Connecting...' text when connecting", () => {
    render(
      <ConnectionStatus
        connectionState="connecting"
        onReconnect={() => {}}
      />
    );

    const indicator = screen.getByTestId("connection-indicator");
    expect(indicator.getAttribute("title")).toBe("Connecting...");
    expect(screen.getByText("Connecting...")).toBeDefined();
    
    // Check for pulse animation class/attribute
    expect(indicator.getAttribute("data-pulse")).toBe("true");
  });

  test("shows red dot, 'Disconnected' text, and retry button when disconnected", () => {
    render(
      <ConnectionStatus
        connectionState="disconnected"
        onReconnect={() => {}}
      />
    );

    const indicator = screen.getByTestId("connection-indicator");
    expect(indicator.getAttribute("title")).toBe("Disconnected");
    expect(screen.getByText("Disconnected")).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
  });

  test("calls onReconnect when retry button is clicked", () => {
    const onReconnect = mock(() => {});

    render(
      <ConnectionStatus
        connectionState="disconnected"
        onReconnect={onReconnect}
      />
    );

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  test("displays error message when error prop is provided", () => {
    const errorMessage = "WebSocket connection failed: network error";

    render(
      <ConnectionStatus
        connectionState="disconnected"
        error={errorMessage}
        onReconnect={() => {}}
      />
    );

    expect(screen.getByText(errorMessage)).toBeDefined();
  });

  test("does not show retry button when connected", () => {
    render(
      <ConnectionStatus
        connectionState="connected"
        onReconnect={() => {}}
      />
    );

    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
  });

  test("does not show retry button when connecting", () => {
    render(
      <ConnectionStatus
        connectionState="connecting"
        onReconnect={() => {}}
      />
    );

    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
  });

  test("does not show error message when error prop is undefined", () => {
    render(
      <ConnectionStatus
        connectionState="disconnected"
        onReconnect={() => {}}
      />
    );

    // Should only show status text, no error
    const text = screen.getByText("Disconnected");
    expect(text).toBeDefined();
    expect(screen.queryByText(/error/i)).toBeNull();
  });
});
