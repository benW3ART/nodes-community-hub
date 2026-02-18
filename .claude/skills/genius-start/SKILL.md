# /genius-start

Initialize Genius Team environment, load memory, and **hydrate tasks** for longer work loops.

## The Hydration Pattern

Claude Code Tasks are session-scoped (disappear when you close terminal). Genius Team uses the **hydration pattern**:
- `.claude/plan.md` = Persistent task source of truth
- `PROGRESS.md` = Persistent progress tracking
- `.genius/memory/` = File-based memory (survives sessions)

## Execution

### Step 1: Load Memory

The SessionStart hook automatically:
1. Runs `scripts/memory-briefing.sh` to regenerate BRIEFING.md
2. Loads BRIEFING.md content
3. Checks Claude Code version for updates
4. Displays task status from plan.md

### Step 2: Check Project State

```bash
cat .genius/state.json 2>/dev/null || echo "No state yet"
cat .genius/memory/BRIEFING.md 2>/dev/null || echo "No memory yet"
ls DISCOVERY.xml SPECIFICATIONS.xml ARCHITECTURE.md .claude/plan.md 2>/dev/null
```

### Step 3: Initialize State if Needed

If `.genius/state.json` doesn't exist, create it and initialize memory files.
Run `bash scripts/setup.sh` if needed.

### Step 4: Display Status

```
╔════════════════════════════════════════════════════════════╗
║  🧠 Genius Team v9.0 — Environment Ready                   ║
╚════════════════════════════════════════════════════════════╝

Memory:
  • BRIEFING.md: {loaded / empty}
  • Decisions: {count}
  • Patterns: {count}
  • Errors: {count}

Project State:
  Phase: {phase}
  Current: {currentSkill or "Ready to start"}

Artifacts:
  {List of existing files}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready! What would you like to do?

  💡 "I want to build [idea]"     → Start new project
  📋 "/status"                    → See detailed progress
  ▶️  "continue"                  → Resume where we left off
  🔧 "/reset"                     → Start over
```

### Step 5: Hydrate Tasks (If Execution Phase)

If `.claude/plan.md` exists and phase is EXECUTION:

```
Tasks (from .claude/plan.md):
  ├── ✅ Completed: {completed}
  ├── 🔄 In Progress: {in_progress}
  ├── ⏳ Pending: {pending}
  └── ⚠️ Blocked: {blocked}

Next: {next_pending_task}
```

### Step 6: Wait for User Input

Route to appropriate skill based on response using genius-team router.
