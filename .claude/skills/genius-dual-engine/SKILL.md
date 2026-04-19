---
name: genius-dual-engine
description: >-
  Builder + Challenger adversarial workflow. One engine builds, another challenges with a critical review.
  Use when user says "dual review", "challenge mode", "builder challenger", "adversarial review",
  or when task is marked with 🔄. Requires --engine=dual or --engine=codex.
  Do NOT use for single-engine code review (use genius-reviewer or genius-code-review).
  Do NOT use for standard QA (use genius-qa or genius-qa-micro).
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

# Genius Dual Engine v17.0 — Builder + Challenger

**Two minds are better than one. Especially when one is trying to break your code.**

## True Simultaneous Dual — Bridge Architecture

Run Claude and Codex in separate terminals, both writing to `.genius/dual-bridge.json`. Use `/challenge` in either terminal to review the other engine's latest diff via `genius-code-review`. The shared bridge is refreshed by the `Stop` hook after each action.

---

## Overview

The Dual Engine coordinates two AI models in complementary roles:
- **Builder** — Plans, architects, and implements (default: Claude Opus)
- **Challenger** — Reviews, tests, audits, and challenges (default: Codex CLI)

The engine is **opt-in per task**. Not every task needs adversarial review — use it for critical features, security-sensitive code, or when you want high confidence.

---

## State Management

Initialize `.genius/dual-state.json` with mode, cycle, model, profile, current task, verdict, and history fields. After each round, increment `cycle`, update `last_verdict`, and append the result to `history[]`.

---

## Mode 1: Build-Review Cycle

Builder implements → Challenger reviews → APPROVE / REQUEST_CHANGES / REJECT.

**Flow:**
1. Set `dual-state.json` → `active: true, mode: "build-review", cycle: 0`
2. Builder implements using genius-dev patterns
3. Builder writes summary to `.genius/dual-review-request.md` (task, files changed, approach, test status)
4. Spawn Challenger (`genius-challenger`) with read-only access + review request + profile config
5. Challenger writes `.genius/dual-verdict.md` (verdict, score /100, findings by severity, rationale)
6. **APPROVE** → done, log history. **REQUEST_CHANGES** → builder fixes, cycle++, escalate if `>= DUAL_MAX_ROUNDS`. **REJECT** → escalate immediately.

**Spawning**: Use Agent Teams task delegation or external CLI (codex/kimi/gemini) if available, else Claude Code Task.

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

Challenger performs independent audit: tests (genius-qa), security/OWASP (genius-security), performance (genius-performance), spec compliance (genius-reviewer).
Output to `.genius/dual-audit-report.md` with Summary, Critical/Important/Minor Findings, Recommendations, and Verdict (PASS/CONDITIONAL_PASS/FAIL).

---

## Challenger Profiles

Set via `DUAL_CHALLENGER_PROFILE` env var or per-task override:
- **strict** (90+ to approve): full audit, every decision challenged. For production/security-critical.
- **balanced** (70+, default): standard code review. For regular development.
- **lenient** (50+): bugs/breaking changes only, tests only. For prototyping/internal tools.

---

## Integration with Agent Teams

Team: Lead Agent (Builder) + genius-dev + genius-architect + genius-challenger (read-only reviewer).
Communication is file-based: `.genius/dual-review-request.md`, `.genius/dual-verdict.md`, `.genius/dual-discussion.md`, `.genius/dual-audit-report.md`, `.genius/dual-state.json`.
In plan.md, prefix dual tasks with `🔄` and `(DUAL: mode, profile)` to signal the orchestrator.

---

## Relationship to Existing Skills

Challenger reuses reviewer's scoring rubric (iteratively, not single-pass), invokes QA/security checks during audit, and never implements (that's genius-dev's job).

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

---

## Switching to/from Dual Mode

To switch an existing project to dual mode:
```
/genius-switch-engine dual
```

To go back to Claude Code only:
```
/genius-switch-engine claude
```

To switch to Codex only:
```
/genius-switch-engine codex
```

This preserves all your project data (.genius/) and only reconfigures the engine files.

## Handoff

- → **genius-dev**: Builder implements the approved changes for the active cycle
- → **genius-reviewer / genius-code-review**: Challenger performs the critical review pass
- → **genius-qa / genius-security**: Audit mode escalates to full validation when needed

## Next Step

Advance the current dual cycle to a verdict, then either implement the requested changes or escalate the disagreement.

## Definition of Done

- [ ] Builder and Challenger roles are both exercised for the marked task
- [ ] Challenger feedback is concrete and either resolved or escalated
- [ ] Final status is one of `APPROVE`, `REVISE`, or `ESCALATE`
- [ ] Dual-mode status files reflect the latest outcome
- [ ] User can see the remaining next step without rereading the thread
