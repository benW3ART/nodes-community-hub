---
name: genius-start
description: >-
  Session initialization skill. Loads memory, shows project status, and routes to next appropriate
  action. Use when user runs /genius-start or says "let's begin this session", "where were we",
  "resume", "what's the status". Runs at the start of every session.
  Do NOT use for new project creation (use genius-interviewer).
  Do NOT use for implementation (use genius-dev skills).
user-invocable: true
---

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
║  🧠 Genius Team v17.0 — Environment Ready                   ║
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

## Definition of Done

- [ ] Session context is loaded from state, briefing, and plan inputs
- [ ] Current status is summarized accurately for the user
- [ ] Missing artifacts or recovery conditions are surfaced early
- [ ] Next recommended action points to a concrete skill
- [ ] The user can resume work without additional context gathering

## Handoff

- → **genius-team**: Route the user's next request after initialization completes
- → **genius-orchestrator**: Resume execution when plan tasks are already active
- → **genius-memory**: Refresh or regenerate memory artifacts if state is stale

## Next Step

Route the user to the next concrete Genius skill based on current phase, plan status, and requested action.
