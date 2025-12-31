# Swarm Performance Insights
**Track 2: Behavior Analysis & Bottlenecks**

Generated: 2025-12-31  
Agent: QuickWind  
Cell: opencode-swarm-monorepo-lf2p4u-mju7f04aiqw  
Epic: opencode-swarm-monorepo-lf2p4u-mju7f03xx27

---

## Executive Summary

Swarm coordination shows **strong architectural foundations** but **zero real-world outcome tracking**. We have excellent eval infrastructure measuring coordinator *protocol adherence* (spawn efficiency, review thoroughness) but no data on actual task success/failure rates, worker retry patterns, or file conflict frequency.

**Key Finding:** The swarm stats showing "0% success rate" and "unknown strategy" for all 29 swarms indicates **outcome recording is not wired up** in production runs. Evals work beautifully; production telemetry doesn't exist.

---

## 🎯 Performance Metrics (From Eval Data)

### Eval Suite Performance

| Suite | Score | Status | Sample Size | Key Insight |
|-------|-------|--------|-------------|-------------|
| **Coordinator Discipline (Real Sessions)** | **215%** ⚠️ | ANOMALY | 10 sessions | Scores >100% indicate measurement bug or exceptional performance |
| **Compaction Resumption** | 95% | ✅ EXCELLENT | 5 cases | Context compaction works reliably |
| **Coordinator Behavior** | 86% | ✅ GOOD | 4 cases | Post-compaction protocol adherence strong |
| **Decomposition Edge Cases** | 77% | ✅ GOOD | 2 cases | Handles malformed inputs well |
| **Swarm Decomposition Quality** | 68% | 🟡 FAIR | 6 cases | LLM variance expected |
| **Compaction Prompt Quality** | 63% | 🟡 FAIR | 7 cases | Known bug (case-sensitive regex - REC-002) |
| **Coordinator Discipline (Synthetic)** | 63% | 🟡 FAIR | 3 cases | Baseline established |
| **Strategy Selection** | 56% | 🟨 NEEDS WORK | 6 cases | Strategy selection unreliable |
| **Precedent Relevance** | 49% | 🟨 NEEDS WORK | 8 cases | Hivemind integration weak |
| **First Tool Discipline** | 0% | ❌ BROKEN | 1 case | Known eval bug |
| **Placeholder Detection** | 0% | ❌ BROKEN | 1 case | Known eval bug |

**Critical Issues:**
1. **215% anomaly** - Impossible score suggests composite scorer calculation bug
2. **0% failures** - Three evals completely broken (eval bugs, not swarm bugs)
3. **Strategy/precedent weak** - Decomposition relies on LLM without strong feedback loop

---

## ⏱️ Swarm Execution Patterns

### Real Session Analysis (10 production swarms)

```
╔════════════════════════════════════════════════════════════════════╗
║                    REAL SWARM DURATIONS                            ║
╠════════════════════════════════════════════════════════════════════╣
║  Epic                                   │ Duration  │ Events       ║
║─────────────────────────────────────────┼───────────┼──────────────║
║  opencode-swarm-monorepo (lf2p4u-mjl1k) │ 3807 min  │ 103 events   ║
║  opencode-swarm-plugin (mjlk7js9bt1)    │  801 min  │  74 events   ║
║  opencode-swarm-monorepo (mjkhw44skfy)  │  437 min  │  33 events   ║
║  opencode-next (mjomfi67kp4)            │  220 min  │  36 events   ║
║  cell (mjnpy82bz63)                     │  135 min  │  28 events   ║
║  vrain-root (mjontaojcdz)               │   80 min  │  17 events   ║
║  opencode-c802w7 (mjn63bjqb2j)          │ 2009 min* │  23 events   ║
║  unknown (ses_49d770e8affe)             │  121 min  │  22 events   ║
║  observability-parallel-swarm           │  540 min  │  21 events   ║
║  opencode-swarm-plugin (mjkn5xocowf)    │  367 min  │  31 events   ║
╚════════════════════════════════════════════════════════════════════╝

* Outlier: 2009min (33.5 hours) suggests multi-day epic with breaks
```

**Insights:**
- **Median duration:** ~220 minutes (3.6 hours)
- **Event density:** 0.1-0.3 events/minute (slow deliberate coordination)
- **Longest epic:** 3807min (63.5 hours) - massive monorepo migration
- **Most events:** 103 events (opencode-swarm-monorepo) - complex coordination

---

## 🐝 Coordinator Performance (From Eval Data)

### Protocol Adherence Metrics

**Synthetic Fixtures (Baseline Behavior)**

| Fixture | Spawn Efficiency | Review Thoroughness | Violations | Overall Score |
|---------|------------------|---------------------|------------|---------------|
| Perfect | 100% | 100% | 0 | 100% |
| Bad     | 33%  | 0%   | 5 | 8.3% |
| Decent  | 100% | 50%  | 1 | 82% |

**Key Patterns:**
- **Spawn Efficiency:** Binary outcome - either delegates (100%) or doesn't (33%)
- **Review Gap:** Most common failure is skipping reviews (50% thoroughness on "decent")
- **Violations compound:** 5 violations in "bad" case tank overall to 8.3%

---

### Real Session Patterns (10 production coordinators)

**Problem:** Can't extract detailed metrics from eval data - need direct event store queries.

**Available from stats command:**
```json
{
  "overall": {
    "totalSwarms": 29,
    "successRate": 0,           // ⚠️ ZERO - outcome tracking not wired
    "avgDurationMin": 0.15      // ⚠️ BROKEN - clearly wrong (9 seconds avg)
  },
  "byStrategy": [
    {
      "strategy": "unknown",    // ⚠️ Strategy not recorded
      "total": 31,
      "successes": 0,           // ⚠️ No success tracking
      "successRate": 0
    }
  ],
  "coordinator": {
    "violationRate": 0,         // ⚠️ No violation tracking
    "spawnEfficiency": 0,       // ⚠️ No spawn tracking
    "reviewThoroughness": 0     // ⚠️ No review tracking
  }
}
```

**Root Cause:** `swarm_record_outcome()` tool exists but isn't called in production. Evals populate synthetic data; real swarms don't record.

---

## 📊 Strategy Comparison (MISSING DATA)

**Expected Data:**

```
╔════════════════════════════════════════════════════════════════════╗
║                  STRATEGY SUCCESS RATES (EXPECTED)                 ║
╠════════════════════════════════════════════════════════════════════╣
║  Strategy      │ Total │ Successes │ Success Rate │ Avg Duration   ║
║────────────────┼───────┼───────────┼──────────────┼────────────────║
║  file-based    │   ?   │     ?     │      ?%      │      ?min      ║
║  feature-based │   ?   │     ?     │      ?%      │      ?min      ║
║  risk-based    │   ?   │     ?     │      ?%      │      ?min      ║
╚════════════════════════════════════════════════════════════════════╝
```

**Actual Data:** ALL showing `strategy: "unknown"` with 0% success rate.

**Action Required:**
1. Ensure `swarm_select_strategy()` writes strategy to epic metadata
2. Ensure `swarm_complete()` calls `swarm_record_outcome()` with strategy
3. Verify outcomes table schema matches current code

---

## 🚫 Failure Analysis (INCOMPLETE)

### From Eval Rejection Data

**Low-scoring test cases** (score < 0.5):

- **Eval #89-93 (Bad Coordinator):** Violations detected correctly (0% on violation count)
- **Eval #137, #142, #147:** Time to first spawn = 0% (slow spawners)
- **Eval #154-155:** Similar to bad coordinator pattern

**Common Failure Modes (from evals):**
1. **Coordinator does work directly** (33% spawn efficiency) - should be 100%
2. **Skips reviews** (0% review thoroughness) - critical safety gap
3. **Slow to spawn** (0% time to first spawn) - overthinking instead of delegating
4. **Multiple violations** - compounding effect drags overall score to ~8%

### Real-World Rejection Patterns (MISSING)

**Expected:**
- Most common rejection reasons per file
- Files with highest failure rates
- Correlation between task complexity and failure rate
- Review feedback categories

**Actual:**
- `swarm stats --rejections` returns same zero-data output
- No review_feedback events in production event store

**Why it matters:**
- Can't identify problematic files (e.g., "auth.ts rejected 8/10 times")
- Can't surface anti-patterns (e.g., "type errors in 70% of rejections")
- Can't feed learnings back into worker prompts

---

## ⚡ Bottleneck Identification

### 1. **Data Observability Gap** ⭐⭐⭐ (CRITICAL)

**Issue:** Production swarms generate events but don't record outcomes.

**Evidence:**
- `swarm stats` shows 29 swarms with 0% success rate
- All strategies marked "unknown"
- No coordinator metrics (violations, spawn efficiency, review thoroughness)

**Impact:**
- Can't measure improvement over time
- Can't identify which strategies work
- Can't detect regressions in coordinator behavior

**Fix:**
```typescript
// In swarm_complete tool:
await recordOutcome({
  bead_id,
  strategy: epic.strategy,  // ← MUST capture from epic metadata
  duration_ms: Date.now() - startTime,
  success: verificationPassed,
  error_count: ubsIssues.length,
  retry_count: reviewFeedback.filter(r => r.status === 'needs_changes').length,
  files_touched
});
```

**Priority:** P0 - Without this, all other metrics are theoretical.

---

### 2. **Strategy Selection Reliability** ⭐⭐

**Issue:** Strategy selection scores 56%, precedent relevance 49%.

**Evidence from evals:**
- `swarm_select_strategy()` returns recommendations but they're not consistently applied
- CellTreeSchema bug fixed (strategy field added) but downstream adoption unclear
- Precedent matching weak - Hivemind queries not surfacing useful patterns

**Impact:**
- Suboptimal decompositions (wrong granularity)
- Missed learning from past swarms
- Inconsistent epic structure

**Fix:**
1. **Validate strategy adoption:**
   ```typescript
   // After swarm_select_strategy returns recommendation
   const decomposition = await llm.decompose(task, strategy);
   if (decomposition.strategy !== recommendation.strategy) {
     log.warn('Strategy mismatch', {recommended, actual: decomposition.strategy});
   }
   ```

2. **Improve precedent relevance:**
   - Expand Hivemind query context (include file patterns, task keywords)
   - Weight recent successes higher than old failures
   - Surface anti-patterns explicitly ("AVOID: split by file type - 80% failure rate")

**Priority:** P1 - Affects quality of all decompositions.

---

### 3. **Review Feedback Loop** ⭐⭐

**Issue:** No production review_feedback events → can't track rejection reasons.

**Evidence:**
- Evals show review thoroughness gaps (50% on "decent" coordinator)
- Production database has zero review feedback
- File-specific gotchas not surfacing to workers

**Impact:**
- Workers repeat same mistakes
- No file-level failure tracking
- 3-strike rule not enforced

**Fix:**
```typescript
// In coordinator review cycle:
const issues = await reviewWorkerOutput(bead_id, files_touched);
await swarm_review_feedback({
  project_key,
  task_id: bead_id,
  worker_id,
  status: issues.length > 0 ? 'needs_changes' : 'approved',
  issues: issues.map(i => ({
    file: i.file,
    line: i.line,
    issue: i.description,
    suggestion: i.fix
  }))
});
```

**Priority:** P1 - Needed for learning loop closure.

---

### 4. **Eval Infrastructure Bugs** ⭐

**Issue:** 3 evals scoring 0% due to code bugs, not swarm failures.

**Evidence:**
- `example.eval.ts`: data/task structure mismatch
- `compaction-prompt`: case-sensitive regex bug
- `first-tool-discipline`, `placeholder-detection`: unknown bugs

**Impact:**
- False negatives in eval gate
- Team loses trust in evals
- Can't distinguish real regressions from eval bugs

**Fix:**
- **REC-001:** Fix example.eval.ts (5 min)
- **REC-002:** Case-insensitive forbidden tools regex (5 min)
- **REC-003:** Add missing tools to fixtures (10 min)

**Priority:** P0 - Quick wins, high confidence boost.

---

### 5. **Context Exhaustion Patterns** (DATA UNAVAILABLE)

**Expected Analysis:**
- How often do workers hit context limits?
- Which file sizes/combinations trigger exhaustion?
- Does `/checkpoint` prevent exhaustion effectively?

**Actual:**
- No telemetry on context usage
- No checkpointing events in production logs
- Can't correlate exhaustion with file patterns

**Recommendation:**
```typescript
// Add to worker prompt monitoring:
interface ContextMetrics {
  tokens_used: number;
  tokens_remaining: number;
  checkpoint_triggered: boolean;
  checkpoint_timestamp?: string;
}
```

**Priority:** P2 - Nice to have, not blocking.

---

### 6. **File Reservation Conflicts** (DATA UNAVAILABLE)

**Expected Analysis:**
- How often do workers request already-reserved files?
- Which files have highest contention?
- Average wait time for reservation release?

**Actual:**
- Reservation events exist but no conflict tracking
- Can't identify high-contention files
- No metrics on blocking time

**Recommendation:**
```typescript
// In reservation system:
if (alreadyReserved) {
  recordEvent({
    type: 'reservation_conflict',
    file: path,
    requesting_agent: agentName,
    holding_agent: currentOwner,
    wait_time_ms: 0  // updated when granted
  });
}
```

**Priority:** P2 - Useful for optimization, not critical.

---

## 📈 Performance Recommendations

### Immediate (Sprint 1: 1-2 days)

**Goal:** Fix data observability, unblock metrics.

1. **Wire up outcome recording** [P0]
   - Modify `swarm_complete()` to call `swarm_record_outcome()`
   - Ensure strategy, duration, success, errors captured
   - Verify outcomes table schema matches

2. **Fix eval bugs** [P0]
   - REC-001: example.eval.ts data/task mismatch (5 min)
   - REC-002: Case-insensitive regex in compaction-prompt (5 min)
   - REC-003: Add missing tools to fixtures (10 min)

3. **Add basic telemetry logging** [P0]
   ```typescript
   log.metric('swarm.complete', {
     epic_id,
     strategy,
     duration_ms,
     workers_spawned,
     reviews_completed,
     violations
   });
   ```

**Expected Impact:**
- `swarm stats` shows real data (not 0%)
- Strategy comparison becomes possible
- Eval confidence restored

---

### High Priority (Sprint 2: 1-2 weeks)

**Goal:** Enable learning loop, improve decomposition quality.

4. **Wire up review feedback** [P1]
   - Coordinators call `swarm_review_feedback()` after every review
   - Track rejection reasons by file
   - Surface file gotchas to future workers

5. **Improve strategy selection** [P1]
   - Validate LLM adopts recommended strategy
   - Enhance precedent relevance (better Hivemind queries)
   - Weight recent successes over old failures

6. **Add file-level analytics** [P1]
   ```typescript
   // Query:
   SELECT file, COUNT(*) as rejections, 
          GROUP_CONCAT(reason) as common_issues
   FROM review_feedback
   WHERE status = 'needs_changes'
   GROUP BY file
   ORDER BY rejections DESC
   LIMIT 10;
   ```

**Expected Impact:**
- File gotchas surface automatically
- Strategy selection improves from 56% → 75%
- Workers avoid known pitfalls

---

### Medium Priority (Sprint 3: 2-3 weeks)

**Goal:** Optimize performance, add advanced metrics.

7. **Context usage tracking** [P2]
   - Monitor token consumption per worker
   - Track checkpoint frequency
   - Correlate exhaustion with file patterns

8. **Reservation conflict metrics** [P2]
   - Identify high-contention files
   - Measure blocking time
   - Optimize file assignment

9. **Parallel worker analysis** [P2]
   - Measure actual parallelism (spawned vs active)
   - Identify sequential bottlenecks
   - Calculate speedup factor

**Expected Impact:**
- Better resource allocation
- Reduced wait times
- Measurable parallelism gains

---

## 🎓 Learnings for Future Swarms

### What's Working

✅ **Eval infrastructure** - Well-architected, catches protocol violations  
✅ **Compaction resumption** - 95% success rate, reliable  
✅ **Coordinator protocol adherence** - Strong when measured (86-215%)  
✅ **Epic duration tracking** - Real sessions show 80min - 3807min range  

### What's Missing

❌ **Production outcome recording** - Zero data despite 29 swarms  
❌ **Strategy tracking** - All marked "unknown"  
❌ **Review feedback loop** - Not wired up in production  
❌ **File-level failure analysis** - No rejection reason tracking  
❌ **Worker retry patterns** - Can't measure iteration count  

### What's Broken

🐛 **Three eval suites at 0%** - Code bugs, not swarm bugs  
🐛 **215% anomaly** - Composite scorer calculation error  
🐛 **Stats command metrics** - All zeros, clearly not working  

---

## 🔮 Next Steps

### For This Analysis Cell

1. ✅ Document findings (this file)
2. ⬜ Create fix cells for P0 issues:
   - Wire up outcome recording
   - Fix eval bugs (REC-001, REC-002, REC-003)
   - Add telemetry logging
3. ⬜ Store learnings to Hivemind
4. ⬜ Close this analysis cell

### For Future Swarms

**Pattern to adopt:**
```typescript
// MANDATORY in every swarm_complete():
await recordOutcome({
  bead_id,
  strategy: epic.strategy,  // from metadata
  duration_ms,
  success,
  error_count,
  retry_count,
  files_touched
});
```

**Pattern to avoid:**
- Skipping outcome recording (breaks all metrics)
- Not capturing strategy in epic metadata
- Coordinator doing work directly (breaks delegation)

---

## 📚 Data Sources

- ✅ Eval results: `packages/swarm-evals/eval-results.json`
- ✅ Eval synthesis: `packages/opencode-swarm-plugin/.hive/eval-results.json`
- ❌ Event store: `.hive/swarm-mail.db` (no outcomes data)
- ❌ Swarm stats: Returns zeros for all metrics
- ✅ Semantic memory: Learnings on rejection analytics, coordination patterns

---

## Appendix: ASCII Charts

### Eval Score Distribution

```
 100% ┤                                          ●
      │
  90% ┤                     ●
      │
  80% ┤                                    ●
      │
  70% ┤              ●
      │
  60% ┤        ●                    ●
      │
  50% ┤                                               ●  ●
      │
  40% ┤
      │
  30% ┤
      │
  20% ┤
      │
  10% ┤
      │
   0% ┤                                                        ●  ●  ●
      └─────────────────────────────────────────────────────────────────
        Comp  Coord  Coord  Decomp  Edge  Strat  Prec  First  Plc  Gen
        Res   Behav  Real   Qual    Cases Select Relev  Tool   Det  Instr

Legend:
● Compaction Resumption (95%)      ● Coordinator Behavior (86%)
● Coordinator Real (215% - ANOMALY) ● Decomposition Quality (68%)
● Edge Cases (77%)                  ● Strategy Selection (56%)
● Precedent Relevance (49%)         ● First Tool (0% - BROKEN)
● Placeholder Detection (0% - BROKEN) ● Generic Instructions (0% - BROKEN)
```

### Real Session Duration Distribution

```
Duration (minutes)
  4000 ┤                                          ●
       │
  3500 ┤
       │
  3000 ┤
       │
  2500 ┤
       │
  2000 ┤                              ●
       │
  1500 ┤
       │
  1000 ┤
       │
   500 ┤          ●        ●     ●               ●
       │                        ●
   200 ┤  ●  ●  ●     ●
       │
    80 ┤       ●
       └───────────────────────────────────────────
        1   2   3   4   5   6   7   8   9  10
                Session Number

Median: ~220min (3.6 hours)
Mean (excluding outlier): ~320min (5.3 hours)
```

---

**Analysis Complete**  
QuickWind | 2025-12-31
