---
name: genius-team-optimizer
description: Self-improving skill that analyzes Claude Code releases and updates Genius Team skills to leverage new features. Monitors changelogs, proposes updates, and applies improvements with user approval. Use for "optimize skills", "update genius team", "check for improvements".
---

# Genius Team Optimizer v9.0 — Self-Evolution Engine

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
