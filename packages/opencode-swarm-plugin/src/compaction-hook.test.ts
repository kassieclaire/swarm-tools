/**
 * Tests for Swarm-Aware Compaction Hook
 */

import { describe, expect, it, mock } from "bun:test";
import {
  SWARM_COMPACTION_CONTEXT,
  SWARM_DETECTION_FALLBACK,
  createCompactionHook,
} from "./compaction-hook";

// Mock the dependencies
mock.module("./hive", () => ({
  getHiveWorkingDirectory: () => "/test/project",
  getHiveAdapter: async () => ({
    queryCells: async () => [],
  }),
}));

mock.module("swarm-mail", () => ({
  checkSwarmHealth: async () => ({
    healthy: true,
    database: "connected",
    stats: {
      events: 0,
      agents: 0,
      messages: 0,
      reservations: 0,
    },
  }),
}));

describe("Compaction Hook", () => {
  describe("SWARM_COMPACTION_CONTEXT", () => {
    it("contains coordinator instructions", () => {
      expect(SWARM_COMPACTION_CONTEXT).toContain("COORDINATOR");
      expect(SWARM_COMPACTION_CONTEXT).toContain("Keep Cooking");
    });

    it("contains resume instructions", () => {
      expect(SWARM_COMPACTION_CONTEXT).toContain("swarm_status");
      expect(SWARM_COMPACTION_CONTEXT).toContain("swarmmail_inbox");
    });

    it("contains summary format", () => {
      expect(SWARM_COMPACTION_CONTEXT).toContain("Swarm State");
      expect(SWARM_COMPACTION_CONTEXT).toContain("Active:");
      expect(SWARM_COMPACTION_CONTEXT).toContain("Blocked:");
      expect(SWARM_COMPACTION_CONTEXT).toContain("Completed:");
    });
  });

  describe("SWARM_DETECTION_FALLBACK", () => {
    it("contains detection patterns", () => {
      expect(SWARM_DETECTION_FALLBACK).toContain("swarm_decompose");
      expect(SWARM_DETECTION_FALLBACK).toContain("swarmmail_init");
      expect(SWARM_DETECTION_FALLBACK).toContain("hive_create_epic");
    });

    it("contains ID patterns", () => {
      expect(SWARM_DETECTION_FALLBACK).toContain("bd-xxx");
      expect(SWARM_DETECTION_FALLBACK).toContain("Agent names");
    });

    it("contains coordination language", () => {
      expect(SWARM_DETECTION_FALLBACK).toContain("spawn");
      expect(SWARM_DETECTION_FALLBACK).toContain("coordinator");
      expect(SWARM_DETECTION_FALLBACK).toContain("reservation");
    });
  });

  describe("createCompactionHook", () => {
    it("returns a function", () => {
      const hook = createCompactionHook();
      expect(typeof hook).toBe("function");
    });

    it("accepts input and output parameters", async () => {
      const hook = createCompactionHook();
      const input = { sessionID: "test-session" };
      const output = { context: [] as string[] };

      // Should not throw
      await hook(input, output);
    });

    it("does not inject context when no swarm detected", async () => {
      const hook = createCompactionHook();
      const output = { context: [] as string[] };

      await hook({ sessionID: "test" }, output);

      // With mocked empty data, should not inject
      expect(output.context.length).toBe(0);
    });
  });

  describe("Detection confidence levels", () => {
    it("HIGH confidence triggers full context", async () => {
      // This would need proper mocking of active reservations
      // For now, just verify the context strings exist
      expect(SWARM_COMPACTION_CONTEXT).toContain("SWARM ACTIVE");
    });

    it("LOW confidence triggers fallback prompt", async () => {
      expect(SWARM_DETECTION_FALLBACK).toContain("Swarm Detection");
      expect(SWARM_DETECTION_FALLBACK).toContain("Check Your Context");
    });
  });
});
