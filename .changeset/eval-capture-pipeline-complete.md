---
"opencode-swarm-plugin": minor
---

## 🔬 Eval Capture Pipeline: Complete

> "The purpose of computing is insight, not numbers." — Richard Hamming

Wire all eval-capture functions into the swarm execution path, enabling ground-truth collection from real swarm executions.

**What changed:**

| Function | Wired Into | Purpose |
|----------|------------|---------|
| `captureDecomposition()` | `swarm_validate_decomposition` | Records task → subtasks mapping |
| `captureSubtaskOutcome()` | `swarm_complete` | Records per-subtask execution data |
| `finalizeEvalRecord()` | `swarm_record_outcome` | Computes aggregate metrics |

**New npm scripts:**
```bash
bun run eval:run           # Run all evals
bun run eval:decomposition # Decomposition quality
bun run eval:coordinator   # Coordinator discipline
```

**Data flow:**
```
swarm_decompose → captureDecomposition → .opencode/eval-data.jsonl
       ↓
swarm_complete → captureSubtaskOutcome → updates record with outcomes
       ↓
swarm_record_outcome → finalizeEvalRecord → computes scope_accuracy, time_balance
       ↓
evalite → reads JSONL → scores decomposition quality
```

**Why it matters:**
- Enables data-driven decomposition strategy selection
- Tracks which strategies work for which task types
- Provides ground truth for Evalite evals
- Foundation for learning from swarm outcomes

**Key discovery:** New cell ID format doesn't follow `epicId.subtaskNum` pattern. Must use `cell.parent_id` to get epic ID for subtasks.
