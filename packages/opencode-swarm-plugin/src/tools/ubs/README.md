# UBS (Ultimate Bug Scanner)

Multi-language bug scanner for catching issues before they ship.

## Features

### Stub Detection

Catches incomplete/placeholder code patterns that AI (and humans) leave behind:

- `TODO/FIXME/XXX/HACK` comments
- Empty function bodies
- Placeholder returns (`null` with "stub" comment)
- Language-specific stub markers:
  - Python: `pass`, `...`, `raise NotImplementedError()`
  - Rust: `unimplemented!()`, `todo!()`, `panic!("not implemented")`
  - Comment patterns: `# implement later`, `// implement this`

**Credit:** Stub pattern catalog inspired by [Chainlink](https://github.com/dollspace-gay/chainlink) by @dollspace-gay.

## Usage

```typescript
import { scanFile, scanFiles, formatFindings } from "./tools/ubs";

// Scan a single file
const code = `
  function example() {
    // TODO: implement this
    return null;
  }
`;

const findings = scanFile(code, "example.ts");
console.log(formatFindings(findings));

// Scan multiple files
const codebase = new Map([
  ["src/auth.ts", authCode],
  ["src/api.rs", apiCode],
  ["src/utils.py", utilsCode],
]);

const result = scanFiles(codebase);
console.log(`Scanned ${result.filesScanned} files`);
console.log(`Exit code: ${result.exitCode}`);
console.log(formatFindings(result.findings));
```

## Configuration

```typescript
// Filter by category
scanFile(code, "test.ts", { categories: ["stub"] });

// Filter by minimum severity
scanFile(code, "test.ts", { minSeverity: "medium" });
```

## Output Format

```
Found 3 issue(s):

  [LOW     ] src/auth.ts:5:10
    Stub detected: TODO comment - indicates incomplete work
    💡 Complete the implementation or remove the TODO comment

  [LOW     ] src/api.rs:12
    Stub detected: unimplemented!() macro (Rust)
    💡 Implement the functionality

  [LOW     ] src/utils.py:8
    Stub detected: bare pass statement (Python)
    💡 Implement the function body
```

## Exit Codes

- `0` - No issues found
- `1` - Issues found

## Future Categories

- Null safety
- Security (XSS, injection)
- Async/await issues
- Memory leaks
- Type coercion

## Architecture

```
ubs/
├── types.ts              # Core type definitions
├── scanner.ts            # Main scanner logic
├── patterns/
│   └── stub-patterns.ts  # Stub detection patterns
└── index.ts              # Public API
```

## Testing

```bash
# Run all tests
bun test src/tools/ubs/

# Run specific test file
bun test src/tools/ubs/patterns/stub-patterns.test.ts
```

## Design Principles

1. **TDD First** - All features developed test-first (RED → GREEN → REFACTOR)
2. **Pattern-based** - Regex patterns for language-agnostic detection
3. **Extensible** - Easy to add new categories and patterns
4. **Low Noise** - Stubs are low severity (incomplete, not bugs)
5. **Actionable** - Every finding includes a suggestion

## References

- [Chainlink](https://github.com/dollspace-gay/chainlink) - VDD methodology and stub detection patterns
- UBS integration in swarm plugin: `tool-availability.ts`
