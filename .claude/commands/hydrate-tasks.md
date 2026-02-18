---
description: Hydrate tasks from plan.md for longer work loops
---

# /hydrate-tasks

Reload task status from `.claude/plan.md` into the current session.

## The Hydration Pattern

Claude Code Tasks are session-scoped — they disappear when you close your terminal. The hydration pattern solves this:

1. **Persistent files** (`.claude/plan.md`, `PROGRESS.md`) = Source of truth
2. **Session** = Ephemeral execution
3. **Hydration** = Load persistent state at session start
4. **Sync-back** = Write state back to files on changes

## Execution

### Step 1: Read Plan

```bash
if [ ! -f .claude/plan.md ]; then
  echo "⚠️ No plan.md found — run genius-architect first"
  exit 1
fi
cat .claude/plan.md
```

### Step 2: Parse & Display

```bash
total=$(grep -c "^- \[" .claude/plan.md 2>/dev/null || echo "0")
completed=$(grep -c "^- \[x\]" .claude/plan.md 2>/dev/null || echo "0")
in_progress=$(grep -c "^- \[~\]" .claude/plan.md 2>/dev/null || echo "0")
pending=$(grep -c "^- \[ \]" .claude/plan.md 2>/dev/null || echo "0")
blocked=$(grep -c "^- \[!\]" .claude/plan.md 2>/dev/null || echo "0")

echo "📋 Tasks Hydrated from .claude/plan.md"
echo "Total: $total | Done: $completed | In Progress: $in_progress | Pending: $pending | Blocked: $blocked"

next=$(grep -m1 "^- \[ \]" .claude/plan.md 2>/dev/null | sed 's/^- \[ \] //')
[ -n "$next" ] && echo "Next: $next"
```

### Step 3: Ready

```
Ready to continue execution. Say "go" or "continue" to proceed.
```
