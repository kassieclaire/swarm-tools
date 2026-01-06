/**
 * UBS (Ultimate Bug Scanner)
 *
 * Multi-language bug scanner for catching issues before they ship.
 * Inspired by Chainlink's post-edit-check.py stub detection.
 *
 * Credit: Chainlink project (https://github.com/dollspace-gay/chainlink)
 * for the stub pattern catalog.
 *
 * @example
 * ```typescript
 * import { scanFile, formatFindings } from "./tools/ubs";
 *
 * const code = `
 *   function example() {
 *     // TODO: implement this
 *     return null;
 *   }
 * `;
 *
 * const findings = scanFile(code, "example.ts");
 * console.log(formatFindings(findings));
 * ```
 */

// Types
export type { Finding, ScanResult, Severity, Category } from "./types";

// Scanner
export {
  scanFile,
  scanFiles,
  formatFindings,
  type ScanConfig,
} from "./scanner";

// Pattern detectors
export { detectStubs, STUB_PATTERNS, type StubPattern } from "./patterns/stub-patterns";
