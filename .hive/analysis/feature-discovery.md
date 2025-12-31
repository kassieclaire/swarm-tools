# Feature Discovery: Mining Data for Opportunities

**Analysis Date:** 2025-12-31  
**Epic:** opencode-swarm-monorepo-lf2p4u-mju7f03xx27  
**Cell:** opencode-swarm-monorepo-lf2p4u-mju7f04c4mi  
**Analyst:** CoolMountain

---

## Executive Summary

Analyzed **50 open cells**, **1565 hivemind memories**, **15 analysis docs**, and **777 commits** from the last 30 days to identify high-value feature opportunities.

**Key Findings:**
- **45 open cells** are part of ONE epic (CLI refactor) - massive WIP bottleneck
- Strategy selection heavily imbalanced (97% feature-based, 3% file-based, 0% risk-based)
- Rejection analytics exist but aren't surfaced in UX
- Testing infrastructure split between bun:test and vitest causing friction
- Anti-pattern knowledge exists but isn't consistently injected into worker prompts

**Top Priority:** Quick wins that improve daily workflow without blocking the massive CLI refactor epic.

---

## Data Sources

### Quantitative
- **Open Cells:** 50 (45 from mjst38kew93 CLI refactor epic)
- **Hivemind Memories:** 1565 learnings
- **Recent Commits:** 777 (last 30 days)
- **Codebase Size:** 337 TypeScript files (198 swarm-mail, 139 plugin)
- **Analysis Docs:** 15 research/planning docs in `.hive/analysis/`

### Qualitative Patterns from Hivemind
- Multi-issue root cause synthesis (mem-5143c96091ffe6a0)
- Swarm rejection analytics (mem-3253101ab056ed4b)
- Strategy selection bug fixes (mem-66c0c2b47a1f782e)
- Worker prompt anti-patterns (mem-0d826e66e338e636)
- Performance optimizations (mem-5cebef8d0df46dcd - Map vs Filter 10x speedup)

---

## Pattern Mining

### What Succeeds Consistently ✅

**1. File-specific history surfacing**
- `getFileFailureHistory()` implemented (mem-0d826e66e338e636)
- Queries review_feedback events, aggregates by file
- **Success signal:** Reduces repeat failures on problematic files

**2. Multi-issue synthesis**
- Pattern: When 3+ workers analyze same bug, synthesis creates unified model
- **Success signal:** Faster debugging, no duplicate work

**3. Performance pattern (Map > Filter)**
- Map-based joins (O(n+m)) 10x faster than filter-based (O(n*m))
- **Success signal:** Measurable performance gain, TDD-verified

**4. TDD workflow discipline**
- RED-GREEN-REFACTOR enforced
- Characterization tests for legacy code
- **Success signal:** ~1057 tests in swarm-mail alone

### What Fails Consistently ❌

**1. Strategy diversification**
- 97% feature-based, 3% file-based, 0% risk-based (mjp7z4tauwu)
- **Failure signal:** Underutilized decomposition strategies

**2. Compaction trigger rate**
- Only 4 detection_complete, 3 context_injected events (mjp7za3jtvn)
- **Failure signal:** Sessions may run too long without compaction

**3. Test runner fragmentation**
- bun:test + vitest causing "inject not found" errors (mjkx3uph7h4)
- Had to rename `index.test.ts` → `index.evalite-test.ts` as band-aid
- **Failure signal:** Test discovery conflicts, friction

**4. Dashboard tests disabled**
- act() warnings, server dependencies (mjn8e1qu2vh)
- **Failure signal:** No test coverage for visualization layer

### Manual Workarounds Detected 🔧

**1. Test file renaming to avoid discovery**
- `index.evalite-test.ts` workaround for bun/vitest conflict
- **Automation opportunity:** Unified test runner

**2. Manual rejection categorization**
- Rejection reasons stored but not auto-categorized (mjp7zhl4mns)
- **Automation opportunity:** Pattern matching for "missing tests", "type errors", etc.

**3. Strategy selection hints**
- Coordinators manually specify strategy in task descriptions
- **Automation opportunity:** Better keyword matching, confidence scoring

**4. File conflict detection**
- Manual coordination when multiple workers touch same files
- **Automation opportunity:** Already implemented via `swarmmail_reserve`, but needs better UX

---

## Gap Analysis

### Events We Should Capture But Don't

**1. Worker blocking events**
- Track how long workers wait for dependencies
- **Value:** Identify bottlenecks in task sequencing

**2. Context compaction effectiveness**
- Measure token reduction ratio, resumption success
- **Value:** Tune compaction thresholds (mjp7za3jtvn addresses this)

**3. Strategy override events**
- When coordinators ignore recommended strategy
- **Value:** Improve strategy recommendation accuracy

**4. Anti-pattern prevention hits**
- When UBS scan or validation prevents known bugs
- **Value:** Measure prevention pipeline effectiveness

### Metrics Missing

**1. First-time-right rate**
- % of subtasks approved on first review
- **Current:** Track rejections, but not success rate directly

**2. Time-to-first-spawn**
- How fast coordinators delegate vs do work themselves
- **Partial:** Violation detection exists, but no timing metric

**3. Rejection reason distribution**
- Top N reasons for review failures
- **Status:** mjp7zhl4mns proposes this, not implemented

**4. Strategy effectiveness by task type**
- Which strategies work for refactoring vs features vs bugs
- **Status:** Tracked but not aggregated/surfaced

### Integrations Missing

**1. GitHub PR workflow**
- Auto-create cells from PR comments (exists in pr-triage skill)
- Link cells to PRs for traceability
- **Gap:** Manual linking only

**2. Eval results → Hivemind**
- Store eval failures as learnings automatically
- **Gap:** Manual storage only

**3. UBS scan → Cell creation**
- Auto-create cells for critical bugs found by scanner
- **Gap:** UBS reports, but doesn't file issues

**4. Swarm dashboard → Cell updates**
- Click worker to see cell details, update status
- **Gap:** Read-only dashboard

### UX Friction Points

**1. CLI command discoverability**
- 20+ commands in one file, no `--help` subcommand structure
- **Fix in progress:** mjst38kew93 epic (45 subtasks)

**2. Rejection reason verbosity**
- Coordinators write prose, not structured feedback
- **Opportunity:** Structured schema for review feedback

**3. Strategy selection opacity**
- Coordinator gets recommendation but no confidence score
- **Opportunity:** Surface "file-based (85% confidence)" in prompt

**4. Test runner choice**
- Need to remember which package uses bun vs vitest
- **Fix pending:** mjkx3uph7h4 migration

---

## Prioritized Opportunities

### P0: Quick Wins (< 1 day effort) 🎯

**QW-1: Add rejection reason categorization to `swarm stats`**
- **Effort:** 2-3 hours
- **Impact:** HIGH - Identifies systemic prompt gaps
- **Cell:** mjp7zhl4mns (already defined)
- **Implementation:** Parse `issues` field from review_feedback events, categorize by regex patterns
- **Value:** Immediate visibility into what's breaking

**QW-2: Surface file failure history in worker prompts**
- **Effort:** 1-2 hours
- **Impact:** HIGH - Prevents repeat mistakes
- **Cell:** mjp7zo69r24 (already defined)
- **Status:** `getFileFailureHistory()` exists, just needs prompt integration
- **Value:** "src/auth.ts: 3 workers rejected for missing null checks"

**QW-3: Add strategy confidence scoring**
- **Effort:** 3-4 hours
- **Impact:** MEDIUM - Helps coordinators trust recommendations
- **Implementation:** Keyword match scores → confidence %
- **Value:** "file-based (85% confidence) - detected 'refactor' + '*.ts' patterns"

**QW-4: Auto-create cells from critical UBS findings**
- **Effort:** 2-3 hours
- **Impact:** MEDIUM - No manual triage for critical bugs
- **Implementation:** UBS scan → filter severity=critical → `hive_create(type="bug")`
- **Value:** Security/correctness bugs auto-tracked

### P1: High-Value Features (1-3 days) 🚀

**F-1: Unified test runner (vitest everywhere)**
- **Effort:** 2-3 hours mechanical + adjustment time
- **Impact:** HIGH - Eliminates test discovery conflicts
- **Cell:** mjkx3uph7h4 (already defined)
- **Blockers:** None (research complete)
- **Value:** One test command, no more inject errors

**F-2: Compaction effectiveness metrics**
- **Effort:** 1 day
- **Impact:** MEDIUM - Tune thresholds for better resumption
- **Cell:** mjp7za3jtvn (already defined)
- **Metrics:** Token reduction ratio, resumption success, session length before compaction
- **Value:** Data-driven tuning vs guessing

**F-3: Strategy diversification via keyword tuning**
- **Effort:** 1 day
- **Impact:** MEDIUM - Better strategy selection
- **Cell:** mjp7z4tauwu (already defined)
- **Implementation:** Tune regex patterns, add "refactor", "migrate", "security", "bug fix" triggers
- **Value:** Achieve 60/30/10 distribution (feature/file/risk)

**F-4: GitHub PR → Cell auto-creation**
- **Effort:** 2 days
- **Impact:** HIGH - Streamlines workflow
- **Implementation:** pr-triage skill already has patterns, formalize as tool
- **Value:** Zero-touch issue filing from PRs

**F-5: Interactive dashboard cell updates**
- **Effort:** 2-3 days
- **Impact:** MEDIUM - Better swarm monitoring UX
- **Implementation:** Add POST endpoints to dashboard server, update cell status/notes
- **Value:** Real-time coordination without CLI switching

### P2: Strategic Investments (> 1 week) 🏗️

**S-1: CLI refactor (Effect-TS modules)**
- **Effort:** 2-3 weeks
- **Impact:** CRITICAL - Maintainability, testability, extensibility
- **Cell:** mjst38kew93 (epic with 45 subtasks)
- **Status:** In progress
- **Value:** From 5176-line god file to focused command modules

**S-2: Event-sourced cells (JSONL → libSQL)**
- **Effort:** 1-2 weeks
- **Impact:** HIGH - Query performance, analytics, multi-agent coordination
- **Cells:** mjpz8pdxv9a, mjpz8pe56qt (migration tasks)
- **Status:** Schema designed, migration pending
- **Value:** SQL analytics, distributed writes

**S-3: Drizzle Kit migrations**
- **Effort:** 1 week
- **Impact:** MEDIUM - Schema versioning, rollbacks
- **Cell:** mjfznai9mco (already defined)
- **Status:** Deferred (current pattern works)
- **Value:** Multi-environment schema sync, version tracking

**S-4: Eval-driven optimization loop**
- **Effort:** 2-3 weeks
- **Impact:** HIGH - Systematic improvement pipeline
- **Implementation:** Eval failures → pattern extraction → prompt updates → re-eval
- **Value:** Continuous learning system

**S-5: OpenCode todo list integration**
- **Effort:** 1-2 weeks
- **Impact:** MEDIUM - Better compaction/resumption
- **Cell:** mjop56iftp1 (already defined)
- **Implementation:** Epic creation → populate todos, subtask completion → mark done
- **Value:** Structured continuation context

---

## Cross-References with Existing Cells

### CLI Refactor Epic (mjst38kew93)
**Subtasks:** 45 open cells  
**Status:** Massive WIP, blocks other improvements  
**Recommendation:** Focus on quick wins until CLI refactor completes

### Swarm Analytics Enhancements
- mjp7zhl4mns: Rejection reason analytics ✅ **QW-1**
- mjp7zo69r24: File failure history in prompts ✅ **QW-2**
- mjp7z4tauwu: Strategy diversification ✅ **F-3**
- mjp7za3jtvn: Compaction threshold tuning ✅ **F-2**

### Testing Infrastructure
- mjkx3uph7h4: Vitest migration ✅ **F-1**
- mjn8e1qu2vh: Dashboard test fixes (deferred, low priority)
- mjngo3gchip: Dashboard browser automation (deferred, nice-to-have)

### Database Migration
- mjpz8pdxv9a: Session JSONL → libSQL migration script ✅ **S-2**
- mjpz8pe56qt: Verify migration works ✅ **S-2**

### Documentation
- mjqme7dzs6i: Update AGENTS.md with inhouse CASS docs (quick fix)

---

## Dependencies Between Improvements

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPENDENCY GRAPH                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QW-1 (rejection analytics)                                 │
│    ├─> F-2 (compaction metrics) - share analytics infra    │
│    └─> F-3 (strategy tuning) - rejection data informs tuning│
│                                                             │
│  QW-2 (file history prompts)                                │
│    └─> [standalone]                                         │
│                                                             │
│  QW-3 (strategy confidence)                                 │
│    └─> F-3 (strategy tuning) - confidence scores inform    │
│                                                             │
│  QW-4 (UBS auto-cells)                                      │
│    └─> [standalone]                                         │
│                                                             │
│  F-1 (vitest migration)                                     │
│    ├─> [blocks] Dashboard test fixes (mjn8e1qu2vh)         │
│    └─> [enables] Better eval integration                   │
│                                                             │
│  F-4 (PR → Cell)                                            │
│    └─> [standalone]                                         │
│                                                             │
│  F-5 (dashboard updates)                                    │
│    └─> [requires] S-1 CLI refactor (clean API surface)     │
│                                                             │
│  S-1 (CLI refactor)                                         │
│    ├─> [blocks] Major CLI additions                        │
│    └─> [enables] Better command discoverability            │
│                                                             │
│  S-2 (event-sourced cells)                                  │
│    ├─> [enables] Better analytics (QW-1, F-2)              │
│    └─> [enables] Multi-agent writes                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight:** Quick wins (QW-1 through QW-4) are independent and can run in parallel. Strategic investments (S-1, S-2) unlock higher-level features but take weeks.

---

## Recommended Next Epic

### Option A: "Quick Wins Sprint" (P0 items)
**Duration:** 3-5 days  
**Value:** Immediate workflow improvements  
**Scope:**
1. QW-1: Rejection analytics in `swarm stats --rejections`
2. QW-2: File history in worker prompts
3. QW-3: Strategy confidence scoring
4. QW-4: UBS → auto-create critical bug cells

**Why now:** CLI refactor (S-1) is in flight, these don't conflict. Each improves daily workflow immediately.

### Option B: "Test Infrastructure Cleanup" (F-1 + test fixes)
**Duration:** 1 week  
**Value:** Eliminates test fragmentation pain  
**Scope:**
1. F-1: Migrate all packages to vitest
2. Fix dashboard tests (mjn8e1qu2vh)
3. Document testing patterns in AGENTS.md

**Why now:** Testing friction slows every other task. Fix the foundation.

### Option C: "Swarm Analytics Deep Dive" (F-2 + F-3 + QW-1)
**Duration:** 1 week  
**Value:** Data-driven swarm optimization  
**Scope:**
1. QW-1: Rejection reason analytics
2. F-2: Compaction effectiveness metrics
3. F-3: Strategy diversification tuning
4. Dashboard: Add analytics views

**Why now:** We have the data, we're not surfacing it. Analytics unlock optimization.

---

## Measurement Plan

### Success Metrics

**Quick Wins (QW-1 to QW-4):**
- QW-1: Rejection categories surface in `swarm stats`, inform prompt changes
- QW-2: File history warnings appear in ≥50% of worker prompts for repeat-fail files
- QW-3: Strategy confidence ≥80% correlates with task success
- QW-4: Critical UBS findings auto-create cells, zero manual triage

**High-Value Features (F-1 to F-5):**
- F-1: Zero test discovery conflicts, one `bun test` command across all packages
- F-2: Compaction threshold tuned to trigger at optimal session length
- F-3: Strategy distribution shifts to 60/30/10 (feature/file/risk)
- F-4: PR comments → cells in <5 seconds, zero manual entry
- F-5: Dashboard cell updates persist, visible in CLI

**Strategic Investments (S-1 to S-5):**
- S-1: CLI split into 20+ focused modules, each <200 lines
- S-2: libSQL migration complete, analytics queries <100ms
- S-4: Eval failure → prompt fix → re-eval loop automated
- S-5: Todo list sync on epic creation, compaction includes todos

### Leading Indicators (Weekly)
- Rejection reason distribution (are we improving?)
- Strategy selection diversity (hitting 60/30/10 target?)
- Worker prompt injection rate (file history showing up?)
- Test suite run time (vitest faster than bun?)

### Lagging Indicators (Monthly)
- First-time-right approval rate (going up?)
- Average retry count (going down?)
- Session length before compaction (optimal range?)
- CLI command usage distribution (discovery working?)

---

## Conclusion

**Top Recommendation:** Execute **Option A: Quick Wins Sprint** next.

**Rationale:**
1. **Non-blocking:** CLI refactor epic (45 cells) is already in flight
2. **High impact:** Each QW improves daily workflow immediately
3. **Independent:** Can parallelize across 2-3 agents
4. **Fast feedback:** 3-5 days to measurable improvement
5. **Builds momentum:** Quick wins while S-1 progresses

**After Quick Wins:** Reassess. If CLI refactor nearing completion, pivot to F-5 (dashboard updates). If analytics show strategy/compaction issues, pivot to Option C.

**Long-term:** S-1 (CLI refactor) and S-2 (event-sourced cells) are critical infrastructure. Don't let them stall.

---

## Appendix: Pattern Catalog

### Successful Patterns Worth Replicating
1. **File-specific failure history** (mem-0d826e66e338e636) - prevents repeat mistakes
2. **Multi-issue synthesis** (mem-5143c96091ffe6a0) - faster debugging
3. **Map > Filter for joins** (mem-5cebef8d0df46dcd) - 10x performance
4. **TDD discipline** - 1057 tests in swarm-mail alone

### Anti-Patterns to Avoid
1. **Strategy over-reliance** - 97% feature-based, need diversity
2. **Test runner fragmentation** - bun + vitest causing conflicts
3. **Manual categorization** - rejection reasons not auto-classified
4. **Silent compaction failures** - low trigger rate suggests tuning needed

### Questions Agents Ask Repeatedly
1. "How do I run tests?" (depends on package, runner differs)
2. "Why was this rejected?" (prose feedback, not structured)
3. "Which strategy should I use?" (recommendation exists, no confidence)
4. "What files can I touch?" (reservation logic exists, UX unclear)

### Automation Opportunities
1. **Rejection categorization** - regex patterns for "missing tests", "type errors"
2. **Strategy hints** - keyword matching with confidence scores
3. **UBS → cells** - critical findings auto-filed
4. **PR → cells** - comment triage already prototyped in skill

---

**Analysis Complete.** Ready for epic planning based on Option A, B, or C.
