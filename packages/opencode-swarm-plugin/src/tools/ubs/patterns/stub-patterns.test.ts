/**
 * Tests for stub pattern detection
 *
 * Inspired by Chainlink's post-edit-check.py stub detection:
 * https://github.com/dollspace-gay/chainlink
 *
 * Credit: Chainlink project for stub pattern catalog
 */

import { describe, test, expect } from "bun:test";
import { detectStubs, type StubPattern } from "./stub-patterns";

describe("detectStubs", () => {
  test("detects TODO comments", () => {
    const code = `
      function test() {
        // TODO: implement this
        return null;
      }
    `;

    const findings = detectStubs(code, "test.ts");
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe("stub");
    expect(findings[0].message).toContain("TODO");
  });

  test("detects FIXME comments", () => {
    const code = `
      function broken() {
        // FIXME: this breaks on edge cases
        return data.value;
      }
    `;

    const findings = detectStubs(code, "test.ts");
    expect(findings.some((f) => f.message.includes("FIXME"))).toBe(true);
  });

  test("detects XXX markers", () => {
    const code = `// XXX: hack for now`;
    const findings = detectStubs(code, "test.ts");
    expect(findings.some((f) => f.message.includes("XXX"))).toBe(true);
  });

  test("detects HACK markers", () => {
    const code = `// HACK: temporary workaround`;
    const findings = detectStubs(code, "test.ts");
    expect(findings.some((f) => f.message.includes("HACK"))).toBe(true);
  });

  test("detects bare pass statement (Python)", () => {
    const code = `
def example():
    pass
    `;
    const findings = detectStubs(code, "test.py");
    expect(findings.some((f) => f.message.includes("pass"))).toBe(true);
  });

  test("detects ellipsis placeholder", () => {
    const code = `
function stub() {
  ...
}
    `;
    const findings = detectStubs(code, "test.ts");
    expect(findings.some((f) => f.message.includes("ellipsis"))).toBe(true);
  });

  test("detects unimplemented! macro (Rust)", () => {
    const code = `
fn todo() {
    unimplemented!()
}
    `;
    const findings = detectStubs(code, "test.rs");
    expect(findings.some((f) => f.message.includes("unimplemented"))).toBe(
      true,
    );
  });

  test("detects todo! macro (Rust)", () => {
    const code = `
fn pending() {
    todo!()
}
    `;
    const findings = detectStubs(code, "test.rs");
    expect(findings.some((f) => f.message.includes("todo!"))).toBe(true);
  });

  test("detects NotImplementedError (Python)", () => {
    const code = `
def stub():
    raise NotImplementedError()
    `;
    const findings = detectStubs(code, "test.py");
    expect(findings.some((f) => f.message.includes("NotImplementedError"))).toBe(
      true,
    );
  });

  test("detects 'implement later' comments", () => {
    const code = `
      // implement this later
      function placeholder() {}
    `;
    const findings = detectStubs(code, "test.ts");
    expect(findings.some((f) => f.message.includes("implement later"))).toBe(
      true,
    );
  });

  test("detects empty function bodies (Rust)", () => {
    const code = `
fn empty() {}
    `;
    const findings = detectStubs(code, "test.rs");
    expect(findings.some((f) => f.message.includes("empty function"))).toBe(
      true,
    );
  });

  test("detects stub return comments", () => {
    const code = `
      function stub() {
        return null; // stub
      }
    `;
    const findings = detectStubs(code, "test.ts");
    expect(findings.some((f) => f.message.includes("stub return"))).toBe(true);
  });

  test("reports line numbers correctly", () => {
    const code = `line 1
line 2
// TODO: fix this
line 4`;

    const findings = detectStubs(code, "test.ts");
    const todoFinding = findings.find((f) => f.message.includes("TODO"));
    expect(todoFinding?.line).toBe(3);
  });

  test("includes file path in findings", () => {
    const code = `// TODO: test`;
    const findings = detectStubs(code, "src/auth.ts");
    expect(findings[0].file).toBe("src/auth.ts");
  });

  test("returns empty array for clean code", () => {
    const code = `
      function clean() {
        return 42;
      }
    `;
    const findings = detectStubs(code, "test.ts");
    expect(findings.length).toBe(0);
  });

  test("detects multiple stubs in one file", () => {
    const code = `
      // TODO: implement
      function a() {
        // FIXME: broken
        return null;
      }
      
      // XXX: hack
      function b() {}
    `;

    const findings = detectStubs(code, "test.ts");
    expect(findings.length).toBeGreaterThanOrEqual(3);
  });
});
