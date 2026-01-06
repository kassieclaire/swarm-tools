/**
 * UBS (Ultimate Bug Scanner) Type Definitions
 *
 * Core types for bug detection and reporting.
 */

/**
 * Severity levels for findings
 */
export type Severity = "low" | "medium" | "high" | "critical";

/**
 * Category of finding
 */
export type Category =
  | "null-safety"
  | "security"
  | "async-await"
  | "memory-leak"
  | "type-coercion"
  | "stub" // Incomplete/placeholder code (inspired by Chainlink)
  | "other";

/**
 * A detected issue in code
 */
export interface Finding {
  /** Category of the issue */
  category: Category;

  /** Human-readable description */
  message: string;

  /** File path where issue was found */
  file: string;

  /** Line number (1-based) */
  line: number;

  /** Column number (1-based), if available */
  column?: number;

  /** Severity of the issue */
  severity: Severity;

  /** Suggested fix, if available */
  suggestion?: string;
}

/**
 * Result of a scan operation
 */
export interface ScanResult {
  /** All findings */
  findings: Finding[];

  /** Files scanned */
  filesScanned: number;

  /** Timestamp of scan */
  timestamp: string;

  /** Exit code (0 = no issues, 1 = issues found) */
  exitCode: number;
}
