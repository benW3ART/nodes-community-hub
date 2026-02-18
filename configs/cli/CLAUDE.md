# Genius Team v9.0 — CLI Mode

> Your AI product team. From idea to production. Powered by Agent Teams.

**Mode:** CLI (Terminal)
**Settings:** `configs/cli/settings.json` → `.claude/settings.json`

---

## Quick Start

**First time?** Run `/genius-start` to initialize your environment.

**Returning?** Just say what you want to do — your BRIEFING.md has the context.

---

## CLI Mode Features

- **Full hook system**: SessionStart, PreCompact, Stop, PostToolUse
- **PostToolUse logging**: Every file write/edit is tracked in `.genius/activity.log`
- **Agent Teams via Shift+Tab**: Spawn teammates directly from terminal
- **Memory auto-loaded** at every session start via SessionStart hook

### Agent Teams in CLI

In CLI mode, Agent Teams are accessed via **Shift+Tab** (delegate mode):

1. Press **Shift+Tab** to open the delegate prompt
2. Describe the task and specify the subagent type
3. The teammate works in an isolated git worktree
4. Results merge back when complete

```
Task(
  description: "Implement auth flow",
  prompt: "Read @.genius/memory/BRIEFING.md for context. Then implement...",
  subagent_type: "genius-dev"
)
```

### Resuming After Interruption

On resume, the Lead reads `plan.md` + `BRIEFING.md` to reconstruct state. Run `/continue` to pick up where you left off.

---

## Agent Teams Protocol

Genius Team v9.0 uses Claude Code Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).

- **Lead** (you, the main session) coordinates — never codes directly
- **Teammates** are spawned via delegate mode (Shift+Tab) with natural language prompts
- Each teammate gets: task description, file ownership, BRIEFING.md context
- Git worktree isolation for parallel work
- Shared task list via `.claude/plan.md`

### Subagents

| Subagent | subagent_type | Purpose |
|----------|---------------|---------|
| genius-dev | `genius-dev` | Code implementation |
| genius-qa-micro | `genius-qa-micro` | Quick 30s quality check |
| genius-debugger | `genius-debugger` | Fix errors |
| genius-reviewer | `genius-reviewer` | Quality score (read-only) |

---

## Memory System (File-Based)

No external MCPs required. All memory is file-based in `.genius/memory/`:

| File | Purpose |
|------|---------|
| `BRIEFING.md` | Auto-generated ~150 line project summary (loaded at session start) |
| `decisions.json` | Key decisions with rationale and timestamps |
| `patterns.json` | Code/project patterns and conventions |
| `progress.json` | Task progress (7-day rolling window) |
| `errors.json` | Resolved errors and their solutions |
| `session-logs/` | Compressed session logs (30-day retention) |

### Memory Protocol

- **Session start**: BRIEFING.md is auto-loaded via SessionStart hook
- **On decisions**: Append to `.genius/memory/decisions.json`
- **On errors resolved**: Append to `.genius/memory/errors.json`
- **On patterns found**: Append to `.genius/memory/patterns.json`
- **Before compaction**: `scripts/memory-extract.sh` extracts key info from session
- **BRIEFING.md regenerated** from all JSON files via `scripts/memory-briefing.sh`

### Auto-loaded Context

@.genius/memory/BRIEFING.md
@.claude/plan.md

### Memory Triggers

| Say This | Effect |
|----------|--------|
| "Remember that..." | Appends to decisions.json |
| "We decided..." | Appends to decisions.json |
| "This broke because..." | Appends to errors.json |
| "Pattern: ..." | Appends to patterns.json |

---

## QA Loop (Mandatory)

After EVERY task, `genius-qa-micro` runs. A task is NOT complete until QA passes:

```
Dev → QA-micro → Fix (if needed) → Re-QA → ✅
```

---

## Save-Token Mode

Toggle with `/save-tokens`. When enabled, high-volume roles (dev, qa-micro, debugger, reviewer) use Sonnet instead of Opus. Lead and architect always use Opus.

---

## Two Phases

### Phase 1: IDEATION (Conversational)
Skills ASK questions. User input expected at checkpoints.

```
genius-interviewer → genius-product-market-analyst → genius-specs
                                                      ↓
                                            [CHECKPOINT: Approve specs]
                                                      ↓
                                            genius-designer
                                                      ↓
                                            [CHECKPOINT: Choose design]
                                                      ↓
                           genius-marketer → genius-copywriter → genius-integration-guide
                                                      ↓
                                            genius-architect
                                                      ↓
                                            [CHECKPOINT: Approve architecture]
```

### Phase 2: EXECUTION (Autonomous)
Agent Teams EXECUTE without stopping. No questions asked.

```
genius-orchestrator (Lead, coordinates):
├── genius-dev (teammate, implements)
├── genius-qa-micro (teammate, validates)
├── genius-debugger (teammate, fixes)
└── genius-reviewer (teammate, scores)

Then: genius-qa (full audit) → genius-security → genius-deployer
```

---

## Commands

| Command | What It Does |
|---------|-------------|
| `/genius-start` | Initialize environment, load memory, show status |
| `/status` | Show current progress |
| `/continue` | Resume from last point |
| `/reset` | Start over (with backup) |
| `/hydrate-tasks` | Reload tasks from plan.md |
| `/save-tokens` | Toggle save-token mode |
| `/update-check` | Check for Claude Code updates |
| `STOP` / `PAUSE` | Halt autonomous execution |

---

## Key Files

| File | Purpose |
|------|---------|
| `.claude/plan.md` | **Single source of truth** for task list |
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
6. **Agent Teams**: Lead coordinates, teammates execute — never mix roles
