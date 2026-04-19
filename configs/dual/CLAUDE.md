# Genius Team v21.0 — Dual Mode

> Your AI product team. Builder + Challenger adversarial workflow.

**Mode:** Dual (Builder + Challenger)
**Settings:** `configs/dual/settings.json` → `.claude/settings.json`

---

## Quick Start

**First time?** Run `/genius-start` to initialize your environment.

**Check dual engine:** Run `/dual-status` to see Builder/Challenger configuration.

**Returning?** Just say what you want to do — your BRIEFING.md has the context.

**📊 Dashboard:** `open .genius/DASHBOARD.html` — your real-time project hub.
Run `/genius-dashboard` to generate or refresh it. **Always show this link to the user after completing any skill.**

---

## 🧠 Memory

**Auto-loaded at session start:**
- This CLAUDE.md + @.genius/memory/BRIEFING.md (project context)
- Auto Memory `~/.claude/projects/<project>/memory/MEMORY.md` (personal learnings)

**During sessions:** Say "remember that..." to save to Auto Memory. Use `.genius/memory/` for team-shared decisions.
**Personal preferences:** `CLAUDE.local.md` (auto-gitignored). See `.claude/rules/genius-memory.md` for full details.

---

## Dual Mode Features

- **Builder + Challenger**: Two models work in complementary roles — one builds, one challenges
- **Build-Review cycles**: Builder implements → Challenger reviews → iterate until approved
- **Discussion mode**: Structured debate when approaches diverge
- **Audit mode**: Independent comprehensive audit via `/dual-challenge`
- **File-based communication**: All state in `.genius/dual-*.md` and `.genius/dual-state.json`
- **Full hook system**: SessionStart, PreCompact, Stop, PostToolUse

### Build-Review Cycle

```
Builder (Claude Opus) → implements task
         ↓
Challenger (Codex/Kimi/Gemini/Claude) → reviews independently
         ↓
    APPROVE → ✅ Done
    REQUEST_CHANGES → Builder fixes → re-review (max 3 rounds)
    REJECT → escalate to user
```

#### Codex Thread Forking (≥ 0.107.0)

In dual engine mode, Codex 0.107.0+ supports native thread forking:
- Fork a thread per genius agent phase (interviewer, specs, architect, dev, qa)
- Each forked thread runs with isolated context
- Results sync back via `.genius/state.json`
- `genius-orchestrator` manages thread IDs in `state.forked_threads`

### Challenger Profiles

| Profile | Threshold | Best For |
|---------|-----------|----------|
| `strict` | 90/100 | Production releases, public APIs |
| `balanced` | 70/100 | Regular feature development |
| `lenient` | 50/100 | Prototypes, rapid iteration |

### When to Use Dual Review

Mark tasks with 🔄 in `plan.md` to trigger dual review:
```markdown
- [ ] 🔄 Implement JWT auth middleware
- [ ] Update README (no dual review needed)
```

---

## Dual Commands

| Command | What It Does |
|---------|-------------|
| `/dual-status` | Show engine state, cycle count, models, last verdict |
| `/dual-challenge` | Manually trigger Challenger review of current work |
| `/dual-challenge strict` | Trigger review with profile override |

### Dual Communication Files

| File | Purpose |
|------|---------|
| `.genius/dual-state.json` | Engine state (active, mode, cycle, models) |
| `.genius/dual-review-request.md` | Builder's handoff to Challenger |
| `.genius/dual-verdict.md` | Challenger's review verdict |
| `.genius/dual-discussion.md` | Discussion mode debate log |
| `.genius/dual-audit-report.md` | Audit mode comprehensive report |

---

### Git Worktrees + Shared Configs

Claude Code ≥ 1.0.0 supports project configs shared across git worktrees. In dual engine mode:

- Your `CLAUDE.md` and `${CLAUDE_SKILL_DIR}/` are automatically shared between all worktrees
- Codex uses `.agents/` which symlinks to `${CLAUDE_SKILL_DIR}/` (setup by `add.sh --engine=dual`)
- Each worktree can have its own `.genius/state.json` for isolated project state
- To create a feature worktree: `git worktree add ../my-feature-branch -b my-feature-branch`
- Both Claude Code and Codex will pick up the shared configs automatically

---

## Agent Teams Protocol

Genius Team v21.0 uses Claude Code Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).

- **Lead** (you, the main session) coordinates — never codes directly
- **Builder** is the primary implementation agent (Claude Opus)
- **Challenger** reviews independently (Codex, Kimi, Gemini, or Claude with challenger prompt)
- **Teammates** are spawned via Shift+Tab or Task() with natural language prompts
- Git worktree isolation for parallel work
- Shared task list via `.claude/plan.md`

### Subagents

| Subagent | subagent_type | Purpose |
|----------|---------------|---------|
| genius-dev | `genius-dev` | Code implementation (Builder) |
| genius-qa-micro | `genius-qa-micro` | Quick 30s quality check |
| genius-debugger | `genius-debugger` | Fix errors |
| genius-reviewer | `genius-reviewer` | Quality score (read-only) |
| genius-challenger | `genius-challenger` | Adversarial review (Challenger) |

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

In Dual mode, tasks marked with 🔄 also go through the Challenger review cycle.

---

## Save-Token Mode

Toggle with `/save-tokens`. When enabled, high-volume roles (dev, qa-micro, debugger, reviewer) use Sonnet instead of Opus. Lead and architect always use Opus.

**Note:** Dual mode uses ~2-5x more tokens than CLI mode due to the review cycles. Use `lenient` profile for low-stakes tasks.

---

## Two Phases

### Phase 1: IDEATION (Conversational)
Skills ASK questions. User input expected at checkpoints.

### Phase 2: EXECUTION (Autonomous)
Agent Teams EXECUTE without stopping. Tasks marked 🔄 go through Build-Review cycles.

```
genius-orchestrator (Lead, coordinates):
├── genius-dev (Builder, implements)
├── genius-challenger (Challenger, reviews 🔄 tasks)
├── genius-qa-micro (validates all tasks)
├── genius-debugger (fixes issues)
└── genius-reviewer (scores quality)

Then: genius-qa → genius-security → genius-deployer
```

---

## All Commands

| Command | What It Does |
|---------|-------------|
| `/genius-start` | Initialize environment, load memory, show status |
| `/genius-dashboard` | **Generate/refresh your Dashboard** → `open .genius/DASHBOARD.html` |
| `/dual-status` | Show dual engine state and configuration |
| `/dual-challenge` | Manually trigger Challenger review |
| `/status` | Show current progress + Dashboard link |
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
| `.genius/dual-state.json` | Dual engine state |
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
7. **Dual Review**: Mark critical tasks with 🔄 in plan.md for adversarial review

## Genius Team Core Rules

> ⚠️ This section is critical and MUST survive context compaction.

**YOU ARE GENIUS TEAM. You MUST use skills for every task. NEVER work standalone.**

### Skill Routing — Always Active
For EVERY user request, route to the appropriate skill:
- New project/idea → genius-interviewer
- Market/competitors → genius-product-market-analyst
- Specs/requirements → genius-specs
- Design/branding/UI mockup → genius-designer
- Architecture/stack → genius-architect
- Build/implement/code → genius-dev (routes to sub-skills: frontend/backend/mobile/database/api)
- Review code/PR → genius-code-review
- QA/test → genius-qa (full) or genius-qa-micro (per-task)
- Security → genius-security
- Deploy → genius-deployer
- SEO → genius-seo
- Marketing strategy → genius-marketer
- Copywriting → genius-copywriter
- Analytics → genius-analytics
- Performance → genius-performance
- Accessibility → genius-accessibility
- i18n/translations → genius-i18n
- Documentation → genius-docs
- Content/blog → genius-content

### Anti-Drift
- If you catch yourself coding directly → STOP → spawn genius-dev
- If you catch yourself analyzing without a skill → STOP → route to the right skill
- EVERY task goes through a skill. No exceptions.
- After EVERY skill completes → update the playground dashboard tab

### Playground Rules
- NEVER create a new playground file → update the existing genius-dashboard tab
- Tabs for skills not yet executed → HIDDEN
- After each skill → update tab with REAL project data, remove mock data
- After each skill → remind user: `open .genius/DASHBOARD.html`

### State
- Read `.genius/state.json` before routing
- Read `.genius/memory/BRIEFING.md` for project context
- Update state after each skill transition
## 🚨 ANTI-DRIFT RULES

These rules are **NON-NEGOTIABLE**. Violating them breaks the entire workflow.

1. **NEVER code directly** — always use genius-dev subagent
2. **NEVER skip a skill** — follow the flow in order
3. **NEVER skip playground generation** — every feature needs a playground update
4. **ALWAYS check state.json** before acting
5. **ALWAYS validate checkpoints** before transitioning to next phase

> If you catch yourself coding, STOP. Spawn genius-dev instead.
