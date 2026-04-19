---
name: genius-omni-router
description: >-
  Multi-provider routing for Omni mode. Routes tasks to secondary providers (Codex, Kimi, Gemini)
  based on task type. Use automatically in Omni mode to route specialized tasks to the best
  available provider. Do NOT invoke manually. Do NOT use for implementation, QA, or
  architecture decisions outside Omni routing; use the destination Genius skill instead.
skills:
  - genius-orchestrator
  - genius-team
allowed-tools:
  - Read(*)
  - Write(*)
  - Edit(*)
  - Glob(*)
  - Grep(*)
  - Bash(*)
  - Task(*)
  - WebFetch(*)
  - WebSearch(*)
hooks:
  PreToolUse:
    - type: command
      command: "bash -c 'echo \"[$(date +%H:%M:%S)] OMNI-ROUTER: $TOOL_NAME\" >> .genius/omni-router.log 2>/dev/null || true'"
---

# Genius Omni Router v17.0 — Multi-Provider Orchestration

**Route tasks to the best AI provider. Claude Code leads. Others assist. Graceful fallback always.**

## Core Principle

Claude Code (Opus 4.6) is the **lead orchestrator** and the **always-available fallback**. Secondary providers are force multipliers — used when available and when they offer a clear advantage for the task at hand.

---

## Provider Registry

| Provider | CLI Command | Model | Strengths | Relative Cost |
|----------|------------|-------|-----------|---------------|
| **Claude Code** | `claude` | Opus 4.6 | Architecture, reasoning, code review, orchestration | $$$ (highest quality) |
| **Codex CLI** | `codex` | GPT-4.1 | Fast code generation, refactoring, boilerplate | $$ |
| **Kimi CLI** | `kimi` | Kimi K2 | Long-context analysis, documentation, summaries | $ |
| **Gemini CLI** | `gemini` | Gemini 2.5 Pro | Research, multi-modal, large codebases | $$ |

### Authentication

Use each provider's normal CLI login flow. If the CLI is missing or unauthenticated, fall back to Claude Code.

---

## Routing Table

### When to route to each provider:

### 🏗️ Architecture & Planning → **Claude Code** (always)
- System design, component architecture, API design
- Technical decision-making, trade-off analysis
- Project planning, task decomposition
- **Why:** Requires deep reasoning and holistic understanding
- **No fallback needed** — Claude Code is the primary

### 💻 Code Implementation → **Codex CLI** (fallback: Claude Code)
- Writing new functions, classes, modules
- Refactoring existing code
- Generating boilerplate, CRUD operations
- **Why:** Fast, cost-effective for straightforward coding tasks
- **Route command:** `codex "implement function X that does Y"`
- **When to keep on Claude Code:** Complex logic, security-sensitive code, code requiring deep architectural context

### 🔍 Code Review → **Claude Code** (always)
- PR reviews, security audits, quality checks
- Bug hunting, performance analysis
- **Why:** Requires deep reasoning about correctness and edge cases
- **No fallback needed**

### 📝 Documentation → **Kimi CLI** (fallback: Claude Code)
- README generation, API docs, user guides
- Code documentation, JSDoc/docstrings
- Summarizing large codebases
- **Why:** Excellent at long-context understanding and clear writing
- **Route command:** `kimi "write documentation for module X based on the source files in src/"`
- **When to keep on Claude Code:** Documentation requiring architectural decisions

### 🔬 Research & Analysis → **Gemini CLI** (fallback: Claude Code)
- Technology comparisons, library evaluation
- Analyzing large datasets or codebases
- Multi-modal analysis (images, diagrams)
- **Why:** Strong research capabilities and multi-modal understanding
- **Route command:** `gemini "research the best approach for implementing X, compare options A vs B vs C"`
- **When to keep on Claude Code:** Research requiring immediate action or code changes

### ✅ QA & Testing → **Claude Code** (always)
- Test strategy, test writing, test review
- Bug reproduction, debugging
- CI/CD pipeline design
- **Why:** Testing requires understanding intent, edge cases, and system behavior
- **No fallback needed**

---

## Provider Health Check

Before routing to any secondary provider, verify availability:

```bash
# Check all providers at once
for cmd in codex kimi gemini; do
  if command -v "$cmd" &>/dev/null; then
    echo "✓ $cmd: $($cmd --version 2>/dev/null | head -1)"
  else
    echo "✗ $cmd: not installed → fallback to Claude Code"
  fi
done

# Check auth status (each CLI has its own login mechanism)
# codex: uses OAuth via `codex login`
# kimi: uses `kimi auth login`  
# gemini: uses Google OAuth via `gemini login`
```

**Rule:** A provider is "available" only if the CLI binary is installed AND the user is authenticated (logged in). Otherwise → Claude Code.

---

## Routing Decision Flow

```
1. Classify the task (architecture/code/review/docs/research/qa)
2. Look up the default provider in the routing table
3. Check if that provider is available (binary installed + authenticated)
4. If available → route to provider
5. If unavailable → fall back to Claude Code
6. Log the routing decision to .genius/omni-router.log
```

### How to Route (for the orchestrator)

When Claude Code decides to route a task to a secondary provider, use Bash:

```bash
# Codex example — code implementation
codex "Create a REST API endpoint for user authentication with JWT tokens. \
Use Express.js, include input validation and error handling."

# Kimi example — documentation
kimi "Generate comprehensive API documentation for the files in src/api/. \
Include endpoint descriptions, parameters, response formats, and examples."

# Gemini example — research
gemini "Compare Redis vs Memcached vs DragonflyDB for our session store. \
Consider: performance, memory efficiency, clustering, ecosystem. Recommend one."
```

### Capturing Output

Route via Bash and capture the output for integration:

```bash
# Route and capture
RESULT=$(codex "implement the getUserById function" 2>&1)
echo "$RESULT"
# Then Claude Code reviews and integrates the result
```

---

## Fallback Logic

**Priority chain:** Preferred Provider → Claude Code (always available)

There is no cascading between secondary providers. If Codex is unavailable for a code task, it goes to Claude Code — not to Gemini or Kimi. This keeps routing simple and predictable.

### Graceful Degradation Levels

- **Full Omni**: All providers available
- **Partial Omni**: Claude plus some secondary providers
- **Solo Mode**: Claude only; routing is skipped

---

## Cost Tracking

Log provider usage for cost awareness:

```bash
# Append to routing log after each provider call
echo "[$(date +%H:%M:%S)] ROUTED: task_type=$TASK_TYPE provider=$PROVIDER" >> .genius/omni-router.log
```

### When Cost Optimization Matters
- For large projects with many implementation tasks → route boilerplate to Codex
- For projects with extensive documentation needs → route to Kimi
- For exploration/research-heavy phases → route to Gemini
- For small/quick tasks → keep on Claude Code (overhead of routing > savings)

---

## Integration with Genius Team

The Omni Router works alongside the existing Genius Team skills:

1. **genius-team** (router) classifies intent and picks a skill
2. **genius-orchestrator** breaks work into tasks
3. **genius-omni-router** decides which *provider* executes each task
4. Results flow back through Claude Code for review and integration

**Important:** Secondary providers produce raw output. Claude Code ALWAYS reviews and integrates the output before committing. Never blindly trust external provider output.

---

## Session Start Checklist

On every Omni Mode session:

1. ✅ Announce "Omni Mode — Multi-Provider Orchestration"
2. ✅ Run provider health check (binary + API key)
3. ✅ Report available providers and fallback status
4. ✅ Load BRIEFING.md and plan.md as usual
5. ✅ Proceed with routing-aware task execution

## Handoff

- → **genius-orchestrator**: Return provider choice, fallback status, and command
- → **genius-dev / specialist skills**: Execute the routed task once the provider is selected
- → **genius-start**: Report available providers during session bootstrap

## Next Step

Choose the provider, run the delegated task, then hand the output back to Claude for review and integration.

## Definition of Done

- [ ] Provider choice is justified by task type, cost, or latency
- [ ] Health checks or fallback status are surfaced before execution
- [ ] Output from secondary providers is reviewed before integration
- [ ] Routing preserves Genius Team ownership of the final result
- [ ] Failure path names the fallback provider or local execution plan
