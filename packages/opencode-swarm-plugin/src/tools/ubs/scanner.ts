/**
 * UBS (Ultimate Bug Scanner) - Main Scanner Module
 *
 * Coordinates pattern detection across multiple categories.
 * Currently supports:
 * - Stub detection (incomplete/placeholder code)
 *
 * Future categories:
 * - Null safety
 * - Security (XSS, injection)
 * - Async/await issues
 * - Memory leaks
 * - Type coercion
 */

import { detectStubs } from "./patterns/stub-patterns";
import type { Finding, ScanResult } from "./types";

/**
 * Scanner configuration
 */
export interface ScanConfig {
  /** Categories to scan (empty = all) */
  categories?: Array<"stub" | "null-safety" | "security">;

  /** Minimum severity to report */
  minSeverity?: "low" | "medium" | "high" | "critical";
}

/**
 * Scan a single file for issues
 *
 * @param code - Source code to scan
 * @param filePath - Path to file being scanned
 * @param config - Scanner configuration
 * @returns Array of findings
 */
export function scanFile(
  code: string,
  filePath: string,
  config: ScanConfig = {},
): Finding[] {
  const findings: Finding[] = [];
  const categories = config.categories || ["stub"]; // Default to stub detection only for now

  // Run category-specific detectors
  if (categories.includes("stub")) {
    findings.push(...detectStubs(code, filePath));
  }

  // Future: Add other detectors here
  // if (categories.includes("null-safety")) {
  //   findings.push(...detectNullSafety(code, filePath));
  // }

  // Filter by minimum severity if specified
  if (config.minSeverity) {
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const minLevel = severityOrder[config.minSeverity];
    return findings.filter(
      (f) => severityOrder[f.severity] >= minLevel,
    );
  }

  return findings;
}

/**
 * Scan multiple files
 *
 * @param files - Map of file path to file content
 * @param config - Scanner configuration
 * @returns Scan result with all findings
 */
export function scanFiles(
  files: Map<string, string>,
  config: ScanConfig = {},
): ScanResult {
  const allFindings: Finding[] = [];

  for (const [filePath, code] of files) {
    const findings = scanFile(code, filePath, config);
    allFindings.push(...findings);
  }

  return {
    findings: allFindings,
    filesScanned: files.size,
    timestamp: new Date().toISOString(),
    exitCode: allFindings.length > 0 ? 1 : 0,
  };
}

/**
 * Format findings for display
 *
 * @param findings - Findings to format
 * @returns Formatted string
 */
export function formatFindings(findings: Finding[]): string {
  if (findings.length === 0) {
    return "✓ No issues found";
  }

  const lines: string[] = [];
  lines.push(`Found ${findings.length} issue(s):\n`);

  for (const finding of findings) {
    const location = `${finding.file}:${finding.line}${finding.column ? `:${finding.column}` : ""}`;
    const severity = finding.severity.toUpperCase().padEnd(8);
    lines.push(`  [${severity}] ${location}`);
    lines.push(`    ${finding.message}`);
    if (finding.suggestion) {
      lines.push(`    💡 ${finding.suggestion}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
