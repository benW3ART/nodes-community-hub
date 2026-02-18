---
description: Resume Genius Team project from where it was left off
---

# /continue

Resume project from last known state.

## Execution

### Step 1: Load Context

```bash
cat .genius/state.json 2>/dev/null
cat .genius/memory/BRIEFING.md 2>/dev/null | head -40
cat PROGRESS.md 2>/dev/null | head -50
```

### Step 2: Determine Resume Point

Based on `.genius/state.json`:

| Phase | Action |
|-------|--------|
| NOT_STARTED | Start genius-interviewer |
| IDEATION + genius-interviewer | Resume interview |
| IDEATION + genius-specs | Check if awaiting approval |
| IDEATION + genius-designer | Check if awaiting choice |
| IDEATION + genius-architect | Check if awaiting approval |
| EXECUTION | Resume genius-orchestrator from plan.md |
| COMPLETE | Show completion summary |

### Step 3: Resume

**If IDEATION**: Load the appropriate skill and continue.

**If EXECUTION**: Read plan.md, find next `[ ]` or `[~]` task, invoke genius-orchestrator.

**If COMPLETE**: Offer next steps (deploy, QA, security audit, new feature).

### Step 4: Log Resume

Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "SESSION RESUMED: Phase=[phase] Skill=[skill]", "reason": "user requested /continue", "timestamp": "ISO-date", "tags": ["session", "resume"]}
```
