---
description: Resume Genius Team v21.0 project from where it was left off
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

### Step 1b: Session Recovery

If state seems stale or inconsistent, try session recovery:
```bash
bash scripts/session-recover.sh 2>/dev/null || true
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

---

## Step 5: Playground Update Suggestion

After resuming, check if a playground update would be valuable:

```bash
# Check last playground update
last_pg=$(cat .genius/playground.log 2>/dev/null | tail -1 | grep -oE "[0-9]{4}-[0-9]{2}-[0-9]{2}" || echo "never")
phase=$(cat .genius/state.json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('currentPhase',''))" 2>/dev/null || echo "")
```

**Show this suggestion if** the project is past Interview phase AND at least one of these files exists:
`SPECIFICATIONS.xml`, `MARKET-ANALYSIS.xml`, `ARCHITECTURE.md`, `.claude/plan.md`, `.genius/seo-report.md`

```
🎮 Your playgrounds may be out of date.
   Run /playground-update to sync templates with your current project data,
   and discover which new playgrounds would be most useful right now.
```
