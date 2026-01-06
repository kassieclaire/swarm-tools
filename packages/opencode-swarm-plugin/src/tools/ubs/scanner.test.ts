/**
 * Tests for UBS scanner integration
 */

import { describe, test, expect } from "bun:test";
import { scanFile, scanFiles, formatFindings } from "./scanner";

describe("scanFile", () => {
  test("detects stubs in a file", () => {
    const code = `
      function example() {
        // TODO: implement this
        return null;
      }
    `;

    const findings = scanFile(code, "test.ts");
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe("stub");
  });

  test("returns empty array for clean code", () => {
    const code = `
      function clean() {
        return 42;
      }
    `;

    const findings = scanFile(code, "test.ts");
    expect(findings.length).toBe(0);
  });

  test("filters by category", () => {
    const code = `// TODO: test`;

    const findings = scanFile(code, "test.ts", { categories: ["stub"] });
    expect(findings.length).toBeGreaterThan(0);

    // When other categories exist, they won't match
    const noFindings = scanFile(code, "test.ts", {
      categories: ["null-safety"],
    });
    expect(noFindings.length).toBe(0);
  });

  test("filters by minimum severity", () => {
    const code = `// TODO: low severity stub`;

    // Low severity - should include stub (severity: low)
    const lowFindings = scanFile(code, "test.ts", { minSeverity: "low" });
    expect(lowFindings.length).toBeGreaterThan(0);

    // Medium severity - should exclude stub
    const mediumFindings = scanFile(code, "test.ts", {
      minSeverity: "medium",
    });
    expect(mediumFindings.length).toBe(0);
  });
});

describe("scanFiles", () => {
  test("scans multiple files", () => {
    const files = new Map([
      ["file1.ts", "// TODO: file 1"],
      ["file2.ts", "// FIXME: file 2"],
      ["file3.ts", "function clean() { return 42; }"],
    ]);

    const result = scanFiles(files);
    expect(result.filesScanned).toBe(3);
    expect(result.findings.length).toBe(2);
    expect(result.exitCode).toBe(1); // Has findings
  });

  test("returns exit code 0 for clean code", () => {
    const files = new Map([
      ["file1.ts", "function clean() { return 42; }"],
      ["file2.ts", "const x = 1;"],
    ]);

    const result = scanFiles(files);
    expect(result.exitCode).toBe(0);
  });

  test("includes timestamp", () => {
    const files = new Map([["test.ts", "// TODO: test"]]);
    const result = scanFiles(files);
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
  });
});

describe("formatFindings", () => {
  test("formats findings for display", () => {
    const findings = [
      {
        category: "stub" as const,
        message: "TODO comment detected",
        file: "test.ts",
        line: 5,
        column: 10,
        severity: "low" as const,
        suggestion: "Complete the implementation",
      },
    ];

    const output = formatFindings(findings);
    expect(output).toContain("test.ts:5:10");
    expect(output).toContain("TODO comment detected");
    expect(output).toContain("Complete the implementation");
    expect(output).toContain("LOW");
  });

  test("handles findings without suggestions", () => {
    const findings = [
      {
        category: "stub" as const,
        message: "Issue detected",
        file: "test.ts",
        line: 1,
        severity: "medium" as const,
      },
    ];

    const output = formatFindings(findings);
    expect(output).toContain("test.ts:1");
    expect(output).not.toContain("💡");
  });

  test("shows success message for clean code", () => {
    const output = formatFindings([]);
    expect(output).toContain("✓ No issues found");
  });

  test("formats multiple findings", () => {
    const findings = [
      {
        category: "stub" as const,
        message: "Issue 1",
        file: "file1.ts",
        line: 1,
        severity: "low" as const,
      },
      {
        category: "stub" as const,
        message: "Issue 2",
        file: "file2.ts",
        line: 2,
        severity: "high" as const,
      },
    ];

    const output = formatFindings(findings);
    expect(output).toContain("Found 2 issue(s)");
    expect(output).toContain("file1.ts");
    expect(output).toContain("file2.ts");
  });
});
