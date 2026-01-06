/**
 * Stub Pattern Detection
 *
 * Detects incomplete/placeholder code patterns that AI (and humans) tend to leave behind.
 * Inspired by Chainlink's post-edit-check.py stub detection:
 * https://github.com/dollspace-gay/chainlink
 *
 * Credit: Chainlink project by @dollspace-gay for the stub pattern catalog
 *
 * These patterns catch "AI slop" - code that looks complete but isn't:
 * - TODO/FIXME/XXX/HACK comments
 * - Empty function bodies
 * - Placeholder returns (None, null with "stub" comment)
 * - Language-specific stub markers (pass, ..., unimplemented!(), todo!())
 */

import type { Finding } from "../types";

/**
 * Pattern definition for stub detection
 */
export interface StubPattern {
  /** Regex pattern to match */
  pattern: RegExp;

  /** Human-readable description */
  description: string;

  /** Optional suggestion for fix */
  suggestion?: string;
}

/**
 * Stub detection patterns adapted from Chainlink
 *
 * These patterns are language-agnostic where possible, but include
 * language-specific markers for Python, Rust, JavaScript/TypeScript.
 */
export const STUB_PATTERNS: StubPattern[] = [
  {
    pattern: /\bTODO\b/,
    description: "TODO comment - indicates incomplete work",
    suggestion: "Complete the implementation or remove the TODO comment",
  },
  {
    pattern: /\bFIXME\b/,
    description: "FIXME comment - indicates known issue",
    suggestion: "Fix the issue or document why it's acceptable",
  },
  {
    pattern: /\bXXX\b/,
    description: "XXX marker - indicates questionable code",
    suggestion: "Review and either fix or document the concern",
  },
  {
    pattern: /\bHACK\b/,
    description: "HACK marker - indicates temporary workaround",
    suggestion: "Replace with proper solution or document why hack is necessary",
  },
  {
    pattern: /^\s*pass\s*$/m,
    description: "bare pass statement (Python)",
    suggestion: "Implement the function body",
  },
  {
    pattern: /^\s*\.\.\.\s*$/m,
    description: "ellipsis placeholder",
    suggestion: "Replace with actual implementation",
  },
  {
    pattern: /\bunimplemented!\s*\(\s*\)/,
    description: "unimplemented!() macro (Rust)",
    suggestion: "Implement the functionality",
  },
  {
    pattern: /\btodo!\s*\(\s*\)/,
    description: "todo!() macro (Rust)",
    suggestion: "Implement the functionality",
  },
  {
    pattern: /\bpanic!\s*\(\s*["']not implemented/,
    description: 'panic!("not implemented") (Rust)',
    suggestion: "Implement the functionality instead of panicking",
  },
  {
    pattern: /raise\s+NotImplementedError\s*\(\s*\)/,
    description: "bare NotImplementedError (Python)",
    suggestion: "Implement the functionality",
  },
  {
    pattern: /#\s*implement\s*(later|this|here)/i,
    description: "implement later comment",
    suggestion: "Implement now or create a tracked issue",
  },
  {
    pattern: /\/\/\s*implement\s*(later|this|here)/i,
    description: "implement later comment",
    suggestion: "Implement now or create a tracked issue",
  },
  {
    pattern: /def\s+\w+\s*\([^)]*\)\s*:\s*(pass|\.\.\.)\s*$/m,
    description: "empty function (Python)",
    suggestion: "Implement the function body",
  },
  {
    pattern: /fn\s+\w+\s*\([^)]*\)\s*\{\s*\}/,
    description: "empty function body (Rust)",
    suggestion: "Implement the function body",
  },
  {
    pattern: /return\s+(None|null)\s*(;|$).*(#|\/\/).*stub/,
    description: "stub return with comment",
    suggestion: "Return actual value or implement proper logic",
  },
];

/**
 * Detect stub patterns in code
 *
 * @param code - Source code to scan
 * @param filePath - Path to file being scanned
 * @returns Array of findings
 */
export function detectStubs(code: string, filePath: string): Finding[] {
  const findings: Finding[] = [];
  const lines = code.split("\n");

  for (const pattern of STUB_PATTERNS) {
    // Search line by line for accurate line numbers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(pattern.pattern);

      if (match) {
        findings.push({
          category: "stub",
          message: `Stub detected: ${pattern.description}`,
          file: filePath,
          line: i + 1, // 1-based line numbers
          column: match.index ? match.index + 1 : undefined,
          severity: "low", // Stubs are low severity - they're incomplete, not bugs
          suggestion: pattern.suggestion,
        });
      }
    }
  }

  return findings;
}
