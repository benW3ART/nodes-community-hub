---
name: genius-team-optimizer
description: >-
  Self-improvement skill that analyzes team performance and suggests optimizations. Use when user
  says "optimize the team", "improve workflow", "team retrospective", "how can we be more
  efficient". Typically runs after project completion.
  Do NOT use for project debugging (use genius-debugger).
  Do NOT use for code review (use genius-reviewer or genius-code-review).
---

# Genius Team Optimizer v17.0 — Self-Evolution Engine

**The skill that makes all other skills better.**

## Memory Integration

### On Optimization Start
Read `@.genius/memory/BRIEFING.md` for optimization history and skill performance.

### On Improvement Found
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "OPTIMIZATION: [skill] [type] — [impact]", "reason": "[what was found]", "timestamp": "ISO-date", "tags": ["optimization", "improvement"]}
```

### On Applied
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "APPLIED: [optimization] to [skill]", "reason": "user approved", "timestamp": "ISO-date", "tags": ["optimization", "applied"]}
```

---

## Optimization Cycle

1. **DISCOVER** — Check Claude Code releases, Anthropic announcements, community best practices
2. **ANALYZE** — Compare current vs optimal patterns, identify skill gaps
3. **PROPOSE** — Generate improvement plan, estimate impact, present for approval
4. **IMPLEMENT** — Apply approved changes, update skill files
5. **VALIDATE** — Test updated skills, gather feedback

---

## What to Check (Optimization Checklist)

### Skill Health
- Every invocable skill has specific trigger phrases in its description
- Every skill has negative triggers (what NOT to use it for)
- Skills that produce output have "Definition of Done" or "Output Quality" section
- Skills that chain have "## Next Step" section
- The genius-team router's intent table includes all skills

### Session Durability
- `postCompactionSections` in all 4 configs reference existing CLAUDE.md headers
- PostCompact hook fires to reinject anti-drift rules
- PreCompact hook saves current state, BRIEFING.md, and plan status
- GENIUS_GUARD.md is up to date with current skill list

### Playground Health
- All playgrounds link to `design-tokens.css`
- No orphan playground files (must be in templates/)
- Playgrounds update from state.json (real data, not mock)

### Config Health
- All 4 configs have same core structure
- `ANTHROPIC_MODEL` set correctly
- `CLAUDE_CODE_EFFORT_LEVEL` set to high
- `compaction.postCompactionSections` headers exist in CLAUDE.md

Run: `bash scripts/verify.sh` to check 43+ skills are present and correctly configured.

---

## Auto-Optimization (No approval needed)

- Updating deprecated syntax
- Fixing broken references
- Updating version numbers
- Adding missing documentation

## Requires Approval

- Changing trigger patterns
- Modifying handoff protocols
- Adding new dependencies
- Significant workflow changes

---

## Handoffs

### To genius-dev (for skill updates)
Provides: Skill to update, approved changes, implementation details

### To All Skills (broadcast)
Provides: New capability information, updated patterns
