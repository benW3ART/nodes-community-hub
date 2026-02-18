# Genius Team v10.0 — Codex CLI Mode

> ⚠️ **MANDATORY**: Read `GENIUS_GUARD.md` before ANY action.
> This project uses Genius Team. You MUST use the skills, not work standalone.

> Your AI product team. From idea to production. Powered by Agent Teams.

**Mode:** Codex CLI
**Config:** `.agents/` directory (Codex equivalent of `.claude/`)

---

## Quick Start

**First time?** Run `$genius-start` to initialize your environment.

**Returning?** Just say what you want to do — your BRIEFING.md has the context.

---

## 🚨 ANTI-DRIFT RULES

These rules are **NON-NEGOTIABLE**. Violating them breaks the entire workflow.

1. **NEVER code directly** — always use `genius-dev` subagent
2. **NEVER skip a skill** — follow the flow in order
3. **NEVER skip playground generation** — every feature needs a playground
4. **ALWAYS check `state.json`** before acting
5. **ALWAYS validate checkpoints** before transitioning to next phase

> If you catch yourself coding, STOP. Spawn genius-dev instead.

---

## Codex CLI Mode Features

- **Skill invocation**: Use `$skill-name` syntax to invoke skills
- **Planning**: Use `/plan` before complex tasks to outline approach
- **Context management**: Use `/compact` when context gets large
- **Memory manual load**: Read `.genius/memory/BRIEFING.md` at session start

### Key Differences from Claude Code CLI

| Claude Code | Codex CLI | Notes |
|-------------|-----------|-------|
| Shift+Tab delegate | Spawn subagent manually | Describe task clearly |
| SessionStart hook | Manual read of BRIEFING.md | Do this at session start |
| PreCompact hook | Run memory extract manually | Before `/compact` |
| PostToolUse logging | Manual activity logging | Use `.genius/activity.log` |
| `.claude/` directory | `.agents/` directory | Same structure |
| `.claude/plan.md` | `.agents/plan.md` | Task list location |

### Agent Teams in Codex

In Codex CLI mode, spawn subagents by clearly describing the task:

```
Spawn genius-dev to implement auth flow.
Context: Read .genius/memory/BRIEFING.md first.
Task: Implement the authentication flow with JWT tokens.
Files: src/auth/*, src/middleware/auth.ts
```

### Resuming After Interruption

**On resume, follow this EXACT sequence:**

1. **FIRST**: Read `GENIUS_GUARD.md` (mandatory anti-drift rules)
2. **THEN**: Run `$guard-check` to validate current state
3. **IF issues**: Run `$guard-recover` to restore last valid state
4. **FINALLY**: Run `$continue` to pick up where you left off

The Lead reads `plan.md` + `BRIEFING.md` + `state.json` to reconstruct state.

---

## Agent Teams Protocol

Genius Team v10.0 uses subagent delegation for parallel work.

- **Lead** (you, the main session) coordinates — never codes directly
- **Subagents** are spawned with clear task descriptions
- Each subagent gets: task description, file ownership, BRIEFING.md context
- Shared task list via `.agents/plan.md`

### Subagents

| Subagent | Purpose |
|----------|---------|
| genius-dev | Code implementation |
| genius-qa-micro | Quick 30s quality check |
| genius-debugger | Fix errors |
| genius-reviewer | Quality score (read-only) |

---

## 🔄 Dual Mode — Working with Claude

Genius Team supports **Dual Mode** where Codex and Claude Code work together on the same project.

### How It Works

1. **Shared state files** in `.genius/` are the single source of truth
2. **Dual communication** happens via `.genius/dual-*.md` files
3. Either agent can read/write these files to coordinate

### Dual Communication Files

| File | Purpose |
|------|---------|
| `.genius/dual-handoff.md` | Task handoff between agents |
| `.genius/dual-status.md` | Current status from each agent |
| `.genius/dual-questions.md` | Questions for the other agent |

### Dual Mode Protocol

**When receiving work from Claude:**
1. Read `.genius/dual-handoff.md` for context and task
2. Check `.genius/state.json` for current project state
3. Do your work
4. Update `.genius/dual-status.md` with completion status
5. If handing back to Claude, update `.genius/dual-handoff.md`

**When handing off to Claude:**
1. Write task details to `.genius/dual-handoff.md`
2. Include: task description, context, expected output, relevant files
3. Update `.genius/dual-status.md` with "Handed to Claude"

### Example Handoff File

```markdown
# Dual Handoff — Codex → Claude

**From:** Codex
**To:** Claude
**Timestamp:** 2026-02-17T18:00:00Z

## Task
Implement the payment processing feature.

## Context
- Specs are in `.genius/specs/payment.md`
- Use Stripe API (key in env)
- Follow patterns in `src/payments/`

## Expected Output
- `src/payments/processor.ts` — main logic
- `src/payments/types.ts` — TypeScript types
- Tests in `tests/payments/`

## Files to Read First
- `.genius/memory/BRIEFING.md`
- `.genius/specs/payment.md`
- `src/payments/existing-example.ts`
```

---

## Memory System (File-Based)

No external dependencies. All memory is file-based in `.genius/memory/`:

| File | Purpose |
|------|---------|
| `BRIEFING.md` | ~150 line project summary (read at session start) |
| `decisions.json` | Key decisions with rationale and timestamps |
| `patterns.json` | Code/project patterns and conventions |
| `progress.json` | Task progress (7-day rolling window) |
| `errors.json` | Resolved errors and their solutions |
| `session-logs/` | Compressed session logs (30-day retention) |

### Memory Protocol (Manual in Codex)

- **Session start**: Manually read `.genius/memory/BRIEFING.md`
- **On decisions**: Append to `.genius/memory/decisions.json`
- **On errors resolved**: Append to `.genius/memory/errors.json`
- **On patterns found**: Append to `.genius/memory/patterns.json`
- **Before compaction**: Run `scripts/memory-extract.sh` manually
- **BRIEFING.md regenerated** via `scripts/memory-briefing.sh`

### Context to Load at Session Start

Read these files at the start of every session:
- `GENIUS_GUARD.md`
- `.genius/state.json`
- `.genius/memory/BRIEFING.md`
- `.agents/plan.md`

### Memory Triggers

| Say This | Effect |
|----------|--------|
| "Remember that..." | Append to decisions.json |
| "We decided..." | Append to decisions.json |
| "This broke because..." | Append to errors.json |
| "Pattern: ..." | Append to patterns.json |

---

## QA Loop (Mandatory)

After EVERY task, `genius-qa-micro` runs. A task is NOT complete until QA passes:

```
Dev → QA-micro → Fix (if needed) → Re-QA → ✅
```

---

## Two Phases

> ⚠️ **Each phase generates MANDATORY artifacts. Do NOT skip them.**

### Phase 1: IDEATION (Conversational)
Skills ASK questions. User input expected at checkpoints.

```
$genius-interviewer → $genius-product-market-analyst → $genius-specs
                                                       ↓
                                             [CHECKPOINT: Approve specs]
                                                       ↓
                                             $genius-designer
                                                       ↓
                                             [CHECKPOINT: Choose design]
                                                       ↓
            $genius-marketer → $genius-copywriter → $genius-integration-guide
                                                       ↓
                                             $genius-architect
                                                       ↓
                                             [CHECKPOINT: Approve architecture]
```

### Phase 2: EXECUTION (Autonomous)
Agent Teams EXECUTE without stopping. No questions asked.

```
$genius-orchestrator (Lead, coordinates):
├── genius-dev (subagent, implements)
├── genius-qa-micro (subagent, validates)
├── genius-debugger (subagent, fixes)
└── genius-reviewer (subagent, scores)

Then: $genius-qa (full audit) → $genius-security → $genius-deployer
```

---

## Commands (Codex Syntax)

| Command | What It Does |
|---------|-------------|
| `$genius-start` | Initialize environment, load memory, show status |
| `$status` | Show current progress |
| `$continue` | Resume from last point |
| `$reset` | Start over (with backup) |
| `$hydrate-tasks` | Reload tasks from plan.md |
| `/plan` | Create execution plan before complex tasks |
| `/compact` | Compact context when it gets too large |
| `STOP` / `PAUSE` | Halt autonomous execution |

---

## Recovery Commands

| Command | What It Does |
|---------|-------------|
| `$guard-check` | Validate current state against GENIUS_GUARD rules |
| `$guard-recover` | Force recovery to last valid state |
| `$continue` | Resume from where you left off |

**Usage:**
- Run `$guard-check` at session start to detect drift
- If issues found, run `$guard-recover` before continuing
- Use `$continue` only after state is validated

---

## Key Files

| File | Purpose |
|------|---------|
| `.agents/plan.md` | **Single source of truth** for task list |
| `.genius/state.json` | Project state tracking |
| `.genius/config.json` | Team configuration (models, memory settings) |
| `.genius/memory/BRIEFING.md` | Auto-generated project context |
| `PROGRESS.md` | Real-time execution status |

---

## Checkpoints (User Input Required)

1. **After Specs**: "Specifications complete. Ready for design phase?"
2. **After Designer**: "Which design option do you prefer?"
3. **After Architect**: "Architecture complete. Ready to start building?"

All other transitions happen automatically.

---

## Important Rules

1. **IDEATION Phase**: Ask questions, validate understanding, get approval at checkpoints
2. **EXECUTION Phase**: Never stop, handle errors, keep going until ALL tasks complete
3. **Always update** PROGRESS.md and plan.md after each task
4. **Memory**: Read BRIEFING.md at session start, update JSON files during work
5. **QA Loop**: Every task must pass genius-qa-micro before completion
6. **Agent Teams**: Lead coordinates, subagents execute — never mix roles
7. **Dual Mode**: Check `.genius/dual-*.md` files if working alongside Claude

---

## Codex-Specific Tips

### Use /plan for Complex Tasks
Before implementing anything complex, use `/plan` to outline your approach:
```
/plan Implement the payment processing feature with Stripe integration
```

### Context Management
Codex context can fill up. Use `/compact` proactively when:
- You've done many file operations
- Context feels slow or degraded
- Before starting a new major task

### Manual Memory Maintenance
Unlike Claude Code, Codex doesn't have hooks. Remember to:
1. Read BRIEFING.md at session start (every time!)
2. Run `scripts/memory-extract.sh` before compacting
3. Update decision/error/pattern JSONs manually when relevant
