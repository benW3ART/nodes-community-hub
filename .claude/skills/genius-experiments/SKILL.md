---
name: genius-experiments
description: >-
  Autonomous optimization loop inspired by Karpathy's autoresearch. Iteratively
  modifies code, runs evaluation, keeps improvements, discards regressions.
  Designed for overnight runs. Define experiments in experiment.md — the agent
  handles the rest. Use when user says "run experiments", "optimize overnight",
  "autonomous optimization", "A/B test implementations", "find the best approach".
  Do NOT use for regular feature implementation — use genius-dev skills instead.
context: fork
agent: genius-experiments
user-invocable: true
allowed-tools:
  - Read(*)
  - Write(*)
  - Edit(*)
  - Glob(*)
  - Grep(*)
  - Bash(npm *)
  - Bash(npx *)
  - Bash(node *)
  - Bash(git diff*)
  - Bash(git status*)
  - Bash(git stash*)
  - Bash(git checkout*)
hooks:
  PostToolUse:
    - type: command
      command: "bash -c 'echo \"[$(date +%H:%M:%S)] EXPERIMENTS: $TOOL_NAME\" >> .genius/experiments.log 2>/dev/null || true'"
  Stop:
    - type: command
      command: "bash -c 'echo \"EXPERIMENTS COMPLETE: $(date)\" >> .genius/experiments.log 2>/dev/null || true'"
      once: true
---

# Genius Experiments v17 — Autonomous Optimizer

**Define the goal. Let the agent find the best path. Review the results in the morning.**

Inspired by Andrej Karpathy's autoresearch approach: autonomous iteration over a well-defined metric, keeping improvements and discarding regressions.

---

## Core Principles

1. **Metric-driven**: Every experiment must have a measurable success criterion
2. **Safe iteration**: Always stash/branch before changes — never corrupt production code
3. **Automatic rollback**: If a run makes things worse, revert immediately
4. **Logged everything**: Every run is logged with metric before/after and changes made
5. **Stop conditions**: Never run indefinitely — set time limits and iteration caps

---

## `experiment.md` Format

Create this file in your project root before running:

```markdown
# Experiment: [Name]

## Objective
[What are you trying to improve? Be specific.]
Example: "Reduce API response time for the /api/users/search endpoint"

## Success Metric
- **Command**: `npm run benchmark`
- **Metric key**: `p95_ms` (from benchmark output JSON)
- **Baseline**: 450ms (measured before experiment)
- **Target**: < 200ms
- **Higher is better**: false

## Experiment Scope
- **Files allowed to modify**: `src/api/users.ts`, `src/db/queries/users.ts`
- **Files NEVER touch**: `prisma/schema.prisma`, `*.test.ts`, `package.json`
- **Max changes per run**: 1 file, max 50 lines changed

## Constraints
- **Max runs**: 20
- **Max time**: 4 hours
- **Max consecutive regressions**: 3 (stop if 3 in a row make it worse)

## Ideas to Try
1. Add database index on `users.name` column
2. Cache frequent searches in Redis (5 min TTL)
3. Use full-text search instead of LIKE query
4. Implement cursor pagination instead of offset

## Evaluation Command
\`\`\`bash
npm run benchmark -- --endpoint /api/users/search --runs 100 --output json
\`\`\`
```

---

## Experiment Loop Protocol

```
READ experiment.md
  ↓
EXTRACT baseline metric (run evaluation once)
  ↓
LOOP (until stop condition):
  1. Choose next idea from experiment.md (or generate new variant)
  2. git stash (save current state)
  3. Implement change
  4. Run evaluation command
  5. Extract metric from output
  6. Compare metric to best-so-far:
     ├── IMPROVED → git stash drop (keep change), update best, log ✅
     └── REGRESSED → git stash pop (revert change), log ❌
  7. Check stop conditions
  8. Log run summary
  ↓
WRITE final report to .genius/experiments/report-{date}.md
```

---

## Implementation

### Phase 1: Setup

```bash
# Read experiment definition
cat experiment.md

# Create experiment branch (safe)
git checkout -b experiment/$(date +%Y%m%d-%H%M%S)

# Run baseline evaluation
BASELINE=$(npm run benchmark -- --output json 2>/dev/null | jq '.p95_ms')
echo "Baseline: ${BASELINE}ms"

# Initialize run log
mkdir -p .genius/experiments
RUN_LOG=".genius/experiments/runs-$(date +%Y%m%d-%H%M%S).jsonl"
echo "Run log: $RUN_LOG"
```

### Phase 2: Experiment Loop

For each iteration:

```bash
RUN_NUMBER=$((RUN_NUMBER + 1))
echo "=== Run $RUN_NUMBER ==="

# 1. Save state
git stash --include-untracked

# 2. Implement change (the AI-generated modification)
# [Apply the code change here]

# 3. Evaluate
RESULT=$(npm run benchmark -- --output json 2>/dev/null | jq '.p95_ms')
echo "Result: ${RESULT}ms (baseline: ${BASELINE}ms)"

# 4. Compare
if [ $(echo "$RESULT < $BEST_METRIC" | bc -l) -eq 1 ]; then
  echo "✅ IMPROVED: $BEST_METRIC → $RESULT"
  git stash drop  # Keep the change
  BEST_METRIC=$RESULT
  git add -A && git commit -m "experiment: run $RUN_NUMBER — ${RESULT}ms"
else
  echo "❌ REGRESSED: $RESULT >= $BEST_METRIC"
  git stash pop   # Revert the change
  CONSECUTIVE_REGRESSIONS=$((CONSECUTIVE_REGRESSIONS + 1))
fi

# 5. Log run
echo "{\"run\": $RUN_NUMBER, \"metric\": $RESULT, \"improved\": $([ $RESULT < $BEST_METRIC ] && echo true || echo false), \"timestamp\": \"$(date -Iseconds)\"}" >> $RUN_LOG
```

### Phase 3: Stop Conditions

Stop when any configured limit is hit: max runs, max time, max consecutive regressions, or target metric reached.

---

## Final Report Format

Written to `.genius/experiments/report-{date}.md`:

```markdown
# Experiment Report: [Name]
**Date**: [date]
**Duration**: Xh Ym
**Runs completed**: N / MAX

## Results Summary

| Metric | Value |
|--------|-------|
| Baseline | 450ms |
| Best achieved | 187ms |
| Improvement | 58% |
| Target | 200ms |
| Target met | ✅ Yes |

## Winning Changes (kept)

### Run 7 — Redis cache layer (+263ms improvement)
- **File modified**: `src/api/users.ts`
- **Change**: Added Redis cache with 5-min TTL for search queries
- **Metric**: 450ms → 187ms
- **Code diff**: [inline diff]

## Discarded Attempts

| Run | Change Tried | Result | Reason |
|-----|-------------|--------|--------|
| 1 | Add DB index | 380ms (+70ms) | Kept — see winning changes |
| 3 | Increase page size | 520ms (-70ms) | Discarded — regression |
| 5 | Parallel queries | 430ms (+20ms) | Discarded — minimal gain |

## Recommendations

1. **Keep**: Highest-impact winning change
2. **Test next**: One untried improvement
3. **Avoid**: Regressions that clearly worsened the metric
```

---

## Running Overnight (CLI Mode)

```bash
# Use tmux for persistent background session
tmux new-session -d -s experiments 'claude --skill genius-experiments'

# Or with screen
screen -dmS experiments claude --skill genius-experiments

# Monitor progress
tail -f .genius/experiments.log
tail -f .genius/experiments/runs-*.jsonl | jq

# Check in the morning
cat .genius/experiments/report-*.md | tail -100
```

---

## Parallel Experiments (Dual/Codex Mode)

In Dual mode with Codex, parallelize experiments across multiple threads:

```
Thread A: Test caching strategies  (Redis, Memcached, in-memory)
Thread B: Test query optimizations (indexes, query rewrites, pagination)
Thread C: Test architecture changes (async queues, batch processing)
```

Each thread runs its own loop against the same metric. Merge winning changes from all threads at the end.

---

## Safety Rules

1. **Never experiment on**: `main`, `production`, or `staging` branches
2. **Never modify**: test files, package.json, prisma schema, environment files
3. **Always**: Create a dedicated experiment branch
4. **Always**: Keep a git stash/commit trail — every change is reversible
5. **Emergency stop**: `git stash; git checkout main` to instantly abandon experiment

---

## Output

Update `.genius/outputs/state.json` on completion:

```bash
jq --arg ts "$(date -Iseconds)" '.skill = "genius-experiments" | .status = "complete" | .updatedAt = $ts' .genius/outputs/state.json > .genius/outputs/state.json.tmp && mv .genius/outputs/state.json.tmp .genius/outputs/state.json 2>/dev/null || true
```

---

## Handoff

- → **genius-qa-micro**: Validate that winning changes don't break tests
- → **genius-reviewer**: Code review winning changes before merging to main
- → **genius-deployer**: Deploy winning changes after validation

## Definition of Done

- [ ] Hypothesis, metric, and experiment scope are stated before changes land
- [ ] Each experiment branch or commit is traceable and reversible
- [ ] Results identify a winner, loser, or inconclusive outcome
- [ ] Risk of polluting protected branches is avoided
- [ ] Winning changes are ready for QA handoff
