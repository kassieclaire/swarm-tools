/**
 * Daemon lifecycle management tests
 *
 * These tests verify PID file management and process lifecycle functions.
 * Actual daemon spawning is not tested here (requires pglite-server installed).
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync } from "node:fs";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  getPidFilePath,
  isDaemonRunning,
  startDaemon,
  stopDaemon,
} from "./daemon";

describe("daemon lifecycle", () => {
  const testProjectPath = join(process.cwd(), ".test-daemon");

  beforeEach(async () => {
    // Clean up test directory
    if (existsSync(testProjectPath)) {
      await rm(testProjectPath, { recursive: true });
    }
    await mkdir(testProjectPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testProjectPath)) {
      await rm(testProjectPath, { recursive: true });
    }
  });

  describe("getPidFilePath", () => {
    test("returns project-local path when projectPath provided", () => {
      const pidPath = getPidFilePath(testProjectPath);
      expect(pidPath).toBe(join(testProjectPath, ".opencode", "pglite-server.pid"));
      expect(existsSync(join(testProjectPath, ".opencode"))).toBe(true);
    });

    test("returns global path when no projectPath", () => {
      const pidPath = getPidFilePath();
      expect(pidPath).toContain(".opencode/pglite-server.pid");
      const homeDir = process.env.HOME || process.env.USERPROFILE || "";
      expect(pidPath).toContain(homeDir);
    });
  });

  describe("isDaemonRunning", () => {
    test("returns false when no PID file exists", async () => {
      const running = await isDaemonRunning(testProjectPath);
      expect(running).toBe(false);
    });

    test("returns false when PID file points to dead process", async () => {
      // Write PID of a process that doesn't exist (999999 is unlikely to be a real PID)
      const pidPath = getPidFilePath(testProjectPath);
      await Bun.write(pidPath, "999999");

      const running = await isDaemonRunning(testProjectPath);
      expect(running).toBe(false);
    });

    test("returns true when PID file points to alive process", async () => {
      // Write current process PID
      const pidPath = getPidFilePath(testProjectPath);
      await Bun.write(pidPath, process.pid.toString());

      const running = await isDaemonRunning(testProjectPath);
      expect(running).toBe(true);
    });
  });

  describe("startDaemon error handling", () => {
    test("throws error if daemon already running", async () => {
      // Write current process PID to simulate running daemon
      const pidPath = getPidFilePath(testProjectPath);
      await Bun.write(pidPath, process.pid.toString());

      // Should not throw - returns existing daemon info
      const result = await startDaemon({ projectPath: testProjectPath });
      expect(result.pid).toBe(process.pid);
    });
  });

  describe("stopDaemon", () => {
    test("is no-op when no PID file exists", async () => {
      // Should not throw
      await expect(stopDaemon(testProjectPath)).resolves.toBeUndefined();
    });

    test("cleans up PID file for dead process", async () => {
      // Write PID of dead process
      const pidPath = getPidFilePath(testProjectPath);
      await Bun.write(pidPath, "999999");
      expect(existsSync(pidPath)).toBe(true);

      await stopDaemon(testProjectPath);

      // PID file should be removed
      expect(existsSync(pidPath)).toBe(false);
    });
  });
});
