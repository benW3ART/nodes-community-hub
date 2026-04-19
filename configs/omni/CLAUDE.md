# Genius Team v21.0 — Omni Mode

> Your AI product team. From idea to production. Multi-provider orchestration.

**Mode:** Omni (Multi-Provider Routing)
**Settings:** `configs/omni/settings.json` → `.claude/settings.json`

---

## Quick Start

**First time?** Run `/genius-start` to initialize your environment.

**Check providers:** Run `/omni-status` to see which providers are available.

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

## Omni Mode Features

- **Multi-provider routing**: Claude Code leads, secondary providers handle specialized tasks
- **Automatic fallback**: If a provider is unavailable, Claude Code handles everything
- **Provider health check** on every session start
- **Cost optimization**: Route boilerplate to cheaper providers, keep quality-critical on Opus
- **Full hook system**: SessionStart, PreCompact, Stop, PostToolUse

### Provider Routing Table

| Task Type | Default Provider | Fallback |
|-----------|-----------------|----------|
| Architecture & Planning | Claude Code | — |
| Code Implementation | Codex CLI | Claude Code |
| Code Review & QA | Claude Code | — |
| Documentation | Kimi CLI | Claude Code |
| Research & Analysis | Gemini CLI | Claude Code |

### Available Providers

- **Claude Code** (Anthropic) — Lead orchestrator, always available
- **Codex CLI** (OpenAI) — `codex` — Fast code generation
- **Kimi CLI** (Moonshot) — `kimi` — Long-context analysis
- **Gemini CLI** (Google) — `gemini` — Research & multi-modal

All providers use **subscription-based login** (no API keys):
```bash
claude login    # Claude Max/Pro
codex login     # ChatGPT Pro/Plus
kimi auth login # Kimi subscription
gemini login    # Gemini Advanced
```

### Degradation Levels

| Level | Providers | Behavior |
|-------|-----------|----------|
| 🟢 Full Omni | All 4 | Tasks routed optimally |
| 🟡 Partial | Claude + 1-2 others | Available providers used |
| 🔵 Solo | Claude Code only | Everything on Claude Code |

---

## Agent Teams Protocol

Genius Team v21.0 uses Claude Code Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).

- **Lead** (you, the main session) coordinates — never codes directly
- **Teammates** are spawned via Shift+Tab or Task() with natural language prompts
- Each teammate gets: task description, file ownership, BRIEFING.md context
- Git worktree isolation for parallel work
- Shared task list via `.claude/plan.md`
- In Omni mode, the Lead also **routes tasks** to the appropriate provider

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

### Phase 2: EXECUTION (Autonomous)
Agent Teams EXECUTE without stopping. In Omni mode, tasks are routed to the best available provider.

```
genius-orchestrator (Lead, coordinates + routes):
├── genius-dev → Codex CLI (or Claude Code fallback)
├── genius-qa-micro → Claude Code (always)
├── genius-debugger → Claude Code (always)
└── genius-reviewer → Claude Code (always)

Then: genius-qa → genius-security → genius-deployer
```

---

## Commands

| Command | What It Does |
|---------|-------------|
| `/genius-start` | Initialize environment, load memory, show status |
| `/genius-dashboard` | **Generate/refresh your Dashboard** → `open .genius/DASHBOARD.html` |
| `/omni-status` | Show provider statuses and routing table |
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
7. **Omni routing**: Route to cheapest capable provider; Claude Code for quality-critical

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
