---
name: genius-dual-engine
description: Dual-model build-review engine. Coordinates a Builder (implements) and Challenger (reviews) in iterative cycles. Use for "dual review", "challenge this", "build-review cycle", "dual audit".
context: fork
user-invocable: true
allowed-tools:
  - Read(*)
  - Write(*)
  - Edit(*)
  - Glob(*)
  - Grep(*)
  - Bash(*)
  - Task(*)
  - WebFetch(*)
  - WebSearch(*)
hooks:
  Stop:
    - type: command
      command: "bash -c 'if [ -f .genius/dual-state.json ]; then jq --arg now \"$(date -Iseconds 2>/dev/null || date)\" \".updated_at = \\\"$now\\\"\" .genius/dual-state.json > .genius/dual-state.json.tmp && mv .genius/dual-state.json.tmp .genius/dual-state.json; fi 2>/dev/null || true'"
      once: true
---

# Genius Dual Engine v9.0 — Builder + Challenger

**Two minds are better than one. Especially when one is trying to break your code.**

## Overview

The Dual Engine coordinates two AI models in complementary roles:
- **Builder** — Plans, architects, and implements (default: Claude Opus)
- **Challenger** — Reviews, tests, audits, and challenges (default: Codex CLI)

The engine is **opt-in per task**. Not every task needs adversarial review — use it for critical features, security-sensitive code, or when you want high confidence.

---

## State Management

### Initialize Dual State
On first use, create `.genius/dual-state.json`:
```json
{
  "active": false,
  "mode": null,
  "cycle": 0,
  "max_rounds": 3,
  "builder_model": "opus",
  "challenger_model": "codex",
  "challenger_profile": "balanced",
  "current_task": null,
  "last_verdict": null,
  "history": [],
  "updated_at": "ISO-date"
}
```

### Update State
After every cycle iteration, update `.genius/dual-state.json` with:
- Incremented `cycle` count
- `last_verdict`: `"APPROVE"`, `"REQUEST_CHANGES"`, or `"REJECT"`
- Append to `history[]` with cycle details

---

## Mode 1: Build-Review Cycle

The primary workflow. Builder implements, Challenger reviews.

### Protocol

```
┌─────────────┐     implement     ┌─────────────┐
│   BUILDER   │ ───────────────→  │  Code/Files  │
└─────────────┘                   └──────┬───────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │ CHALLENGER   │
                                  │  (review)    │
                                  └──────┬───────┘
                                         │
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                         APPROVE   REQUEST_CHANGES  REJECT
                           │          │              │
                           ▼          ▼              ▼
                         Done    Builder fixes   Escalate
                                  (cycle++)      to user
```

### Step-by-Step

1. **Activate**: Set `dual-state.json` → `active: true, mode: "build-review", cycle: 0`
2. **Builder Phase**: Builder receives the task and implements it normally using genius-dev patterns
3. **Handoff**: Builder signals completion. Write implementation summary to `.genius/dual-review-request.md`:
   ```markdown
   # Dual Review Request
   ## Task: [description]
   ## Files Changed: [list]
   ## Approach: [summary]
   ## Tests: [pass/fail status]
   ```
4. **Challenger Phase**: Spawn Challenger agent (`genius-challenger`) with:
   - Read-only access to all project files
   - The review request document
   - The challenger profile configuration
5. **Verdict**: Challenger writes `.genius/dual-verdict.md`:
   ```markdown
   # Challenger Verdict — Cycle N
   ## Verdict: APPROVE | REQUEST_CHANGES | REJECT
   ## Score: XX/100
   ## Findings:
   ### Critical (must fix)
   ### Important (should fix)
   ### Minor (could fix)
   ## Rationale: [explanation]
   ```
6. **Resolution**:
   - **APPROVE** → Task complete. Log to history. Set `active: false`.
   - **REQUEST_CHANGES** → Builder receives findings, fixes issues. Increment `cycle`. If `cycle >= DUAL_MAX_ROUNDS` → escalate to user.
   - **REJECT** → Escalate to user immediately with Challenger's rationale.

### Spawning the Challenger

Use Agent Teams task delegation:
```
Task the genius-challenger agent: Review the implementation described in .genius/dual-review-request.md.
Apply the {DUAL_CHALLENGER_PROFILE} profile. Write verdict to .genius/dual-verdict.md.
```

If the configured challenger model CLI is available (codex, kimi, gemini), use it:
```bash
# Example with Codex CLI
codex --approval-mode full-auto "Review the code changes in .genius/dual-review-request.md. Write your verdict to .genius/dual-verdict.md following the format in .claude/skills/genius-dual-engine/SKILL.md"
```

If no external CLI is available, fall back to spawning a Claude Code Task with the genius-challenger agent prompt.

---

## Mode 2: Discussion Mode

When Builder and Challenger disagree on **approach** (not just implementation details).

### Protocol

```
┌─────────────┐  Approach A   ┌─────────────┐  Approach B
│   BUILDER   │ ───────────→  │ CHALLENGER   │ ───────────→  Compare
└─────────────┘               └─────────────┘
       │                             │
       ▼                             ▼
   Rebuttal ◄─── Round 2 ───► Rebuttal
       │                             │
       ▼                             ▼
   Converge? ─── No (Round 3) ──→ User Decides
       │
      Yes → Proceed with agreed approach
```

### Step-by-Step

1. **Activate**: Set `mode: "discussion"` in dual-state
2. **Builder Proposes**: Write approach A to `.genius/dual-discussion.md`:
   ```markdown
   ## Builder — Approach A
   ### Proposal: [description]
   ### Rationale: [why this approach]
   ### Trade-offs: [pros/cons]
   ```
3. **Challenger Counter-Proposes**: Challenger appends approach B
4. **Debate**: Max 3 rounds. Each round, both sides respond to the other's points
5. **Resolution**:
   - If convergence → proceed with agreed approach
   - If no convergence after 3 rounds → present both approaches to user with pros/cons summary

---

## Mode 3: Audit Mode

Challenger performs an independent, comprehensive audit of the current codebase or feature.

### Audit Checklist

The Challenger runs through these checks independently:

| Check | Method | Reference Skill |
|-------|--------|----------------|
| **Test Suite** | Run all tests, report failures | genius-qa |
| **Security Audit** | OWASP Top 10, dependency scan, secrets detection | genius-security |
| **Performance** | Identify bottlenecks, O(n²) patterns, memory leaks | genius-performance |
| **Spec Compliance** | Compare implementation against SPECS.md / plan.md | genius-reviewer |

### Audit Output

Write to `.genius/dual-audit-report.md`:
```markdown
# Dual Audit Report
Date: YYYY-MM-DD
Challenger: [model]
Profile: [strict|balanced|lenient]

## Summary
- Tests: X passed, Y failed, Z skipped
- Security: [score/grade]
- Performance: [score/grade]
- Spec Compliance: [percentage]

## Critical Findings
## Important Findings
## Minor Findings
## Recommendations

## Overall Verdict: PASS | CONDITIONAL_PASS | FAIL
```

---

## Challenger Profiles

Configure via `DUAL_CHALLENGER_PROFILE` env var or per-task override.

### `strict`
- Challenges every design decision
- Requires 90+ score for APPROVE
- Runs full audit suite on every review
- Security findings are always Critical
- Best for: production releases, security-critical code, public APIs

### `balanced` (default)
- Normal senior-engineer code review standards
- Requires 70+ score for APPROVE
- Runs tests + basic security check
- Proportionate severity ratings
- Best for: regular feature development, most tasks

### `lenient`
- Focus on real bugs and breaking changes only
- Requires 50+ score for APPROVE
- Runs tests only (skips deep audit)
- Fast approval for straightforward changes
- Best for: prototyping, internal tools, rapid iteration

---

## Integration with Agent Teams

### Team Structure
```
Lead Agent (Builder)
  ├── genius-dev (implementation)
  ├── genius-architect (design)
  └── genius-challenger (Challenger) — read-only + review
```

### Communication Protocol
- Builder → Challenger: via `.genius/dual-review-request.md`
- Challenger → Builder: via `.genius/dual-verdict.md`
- Discussion: via `.genius/dual-discussion.md`
- Audit: via `.genius/dual-audit-report.md`
- State: via `.genius/dual-state.json`

All communication is file-based. No direct inter-process messaging required.

### Plan.md Annotations
Mark tasks requiring dual review in `.claude/plan.md`:
```markdown
- [ ] 🔄 Implement auth middleware (DUAL: build-review, strict)
- [ ] 🔄 Design database schema (DUAL: discussion)
- [ ] 🔄 Pre-launch audit (DUAL: audit, strict)
- [ ] Regular task (no dual review needed)
```

The `🔄` prefix and `(DUAL: ...)` annotation signal the orchestrator to activate the dual engine for that task.

---

## Relationship to Existing Skills

| Skill | Relationship |
|-------|-------------|
| **genius-reviewer** | Challenger uses reviewer's scoring rubric. Reviewer is single-pass; Challenger is iterative. |
| **genius-qa** | Challenger invokes QA checks during audit. QA is testing-focused; Challenger is holistic. |
| **genius-security** | Challenger references security skill during audit mode. Complementary, not duplicating. |
| **genius-dev** | Builder uses dev skill for implementation. Challenger never implements. |

---

## Cost & Performance Notes

- **Token usage**: ~2x baseline (two models reasoning over the same code)
- **Time**: Each cycle adds a review round. Expect 1.5-3x wall-clock time.
- **When to use**: Critical features, security-sensitive code, complex algorithms, pre-release audits
- **When NOT to use**: Simple refactors, typo fixes, documentation updates, prototypes (use `lenient` profile or skip dual entirely)

---

## Quick Start

1. Mark a task with `🔄` in plan.md, or say "dual review this"
2. Builder implements normally
3. Engine automatically triggers Challenger review
4. Iterate until APPROVE or escalation
5. Check status anytime with `/dual-status`
6. Force a review with `/dual-challenge`
