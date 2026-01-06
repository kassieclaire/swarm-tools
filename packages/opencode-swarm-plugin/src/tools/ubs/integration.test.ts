/**
 * Integration tests for UBS - demonstrates full workflow
 */

import { describe, test, expect } from "bun:test";
import { scanFiles, formatFindings } from "./scanner";

describe("UBS Integration", () => {
  test("end-to-end: scan codebase with stubs", () => {
    // Simulate a small codebase with various stub patterns
    const codebase = new Map([
      [
        "src/auth.ts",
        `
export function authenticate(token: string) {
  // TODO: implement JWT validation
  return true;
}

export function refreshToken() {
  // FIXME: this doesn't handle expired tokens
  return null; // stub
}
`,
      ],
      [
        "src/api.rs",
        `
fn fetch_data() {
    unimplemented!()
}

fn process() {
    // XXX: temporary hack
    todo!()
}
`,
      ],
      [
        "src/utils.py",
        `
def helper():
    pass

def another():
    raise NotImplementedError()
`,
      ],
      [
        "src/clean.ts",
        `
export function working() {
  return 42;
}
`,
      ],
    ]);

    // Scan all files
    const result = scanFiles(codebase);

    // Verify scan completed
    expect(result.filesScanned).toBe(4);
    expect(result.exitCode).toBe(1); // Found issues

    // Verify findings
    expect(result.findings.length).toBeGreaterThan(0);

    // Verify findings include expected patterns
    const messages = result.findings.map((f) => f.message);
    expect(messages.some((m) => m.includes("TODO"))).toBe(true);
    expect(messages.some((m) => m.includes("FIXME"))).toBe(true);
    expect(messages.some((m) => m.includes("XXX"))).toBe(true);
    expect(messages.some((m) => m.includes("stub return"))).toBe(true);
    expect(messages.some((m) => m.includes("unimplemented"))).toBe(true);
    expect(messages.some((m) => m.includes("todo!"))).toBe(true);
    expect(messages.some((m) => m.includes("pass"))).toBe(true);
    expect(messages.some((m) => m.includes("NotImplementedError"))).toBe(true);

    // Format output
    const output = formatFindings(result.findings);
    expect(output).toContain("Found");
    expect(output).toContain("src/auth.ts");
    expect(output).toContain("src/api.rs");
    expect(output).toContain("src/utils.py");
    expect(output).not.toContain("src/clean.ts"); // Clean file shouldn't appear
  });

  test("filter by severity", () => {
    const codebase = new Map([
      ["test.ts", "// TODO: low severity item"],
    ]);

    // Scan with low minimum severity - should find stubs
    const withStubs = scanFiles(codebase, { minSeverity: "low" });
    expect(withStubs.findings.length).toBeGreaterThan(0);

    // Scan with high minimum severity - should skip stubs (they're low severity)
    const withoutStubs = scanFiles(codebase, { minSeverity: "high" });
    expect(withoutStubs.findings.length).toBe(0);
  });

  test("clean codebase returns success", () => {
    const codebase = new Map([
      ["src/math.ts", "export const add = (a: number, b: number) => a + b;"],
      ["src/format.ts", 'export const upper = (s: string) => s.toUpperCase();'],
    ]);

    const result = scanFiles(codebase);
    expect(result.exitCode).toBe(0);
    expect(formatFindings(result.findings)).toContain("✓ No issues found");
  });

  test("detects multiple stubs in single file", () => {
    const codebase = new Map([
      [
        "src/messy.ts",
        `
// TODO: refactor this
function a() {
  // FIXME: broken
  return null; // stub
}

// XXX: hack
function b() {
  // HACK: temporary
}
`,
      ],
    ]);

    const result = scanFiles(codebase);
    expect(result.findings.length).toBeGreaterThanOrEqual(5); // At least 5 stub patterns
  });
});
