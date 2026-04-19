---
name: genius-team
description: >-
  Main intelligent router for Genius Team. Analyzes intent and routes to the
  right specialized skill. Use when user says "start", "begin project", "what
  should I do next", "I want to build", or asks for status/progress.
  Do NOT use directly for implementation, design, or QA tasks — those have
  dedicated skills.
user-invocable: true
skills:
  - genius-interviewer
  - genius-product-market-analyst
  - genius-specs
  - genius-designer
  - genius-marketer
  - genius-copywriter
  - genius-integration-guide
  - genius-architect
  - genius-orchestrator
  - genius-qa
  - genius-security
  - genius-deployer
  - genius-memory
  - genius-onboarding
  - genius-dev-frontend
  - genius-dev-backend
  - genius-dev-mobile
  - genius-dev-database
  - genius-dev-api
  - genius-code-review
  - genius-skill-creator
  - genius-experiments
  - genius-seo
  - genius-crypto
  - genius-analytics
  - genius-performance
  - genius-accessibility
  - genius-i18n
  - genius-docs
  - genius-content
  - genius-template
  - genius-dev
  - genius-debugger
  - genius-reviewer
  - genius-qa-micro
  - genius-test-assistant
  - genius-dual-engine
  - genius-omni-router
  - genius-start
  - genius-team-optimizer
  - genius-updater
  - genius-playground-generator
  - genius-auto
  - genius-ui-tester
  - genius-ci
  - genius-scheduler
  - genius-tips
  - genius-guard-pre-planning
  - genius-guard-pre-coding
  - genius-guard-pre-deploy
hooks:
  PreToolUse:
    - type: command
      command: "bash -c 'echo \"[$(date +%H:%M:%S)] ROUTER: $TOOL_NAME\" >> .genius/router.log 2>/dev/null || true'"
---

# Genius Team v21.0 — Your AI Product Team

**From idea to production. Agent Teams. File-based memory. No fluff.**

---

## MANDATORY CHECKS (NON-NEGOTIABLE)

Before routing:
1. Read `.genius/state.json` — verify phase, checkpoint, and mode
2. Read `.genius/mode.json` — adjust behavior per mode (beginner/builder/pro/agency)
3. Verify previous checkpoint is validated and required artifact/playground exists
4. If any check fails, block routing and recover first

---

## Mode-Aware Behavior

Read `@.genius/mode.json` and adjust:
- **beginner**: Explain routing choice, confirm with user before invoking
- **builder**: Announce transition briefly (default)
- **pro**: Route silently, minimal output
- **agency**: Client-friendly status updates

---

## Memory Integration

Read `@.genius/memory/BRIEFING.md` at session start and check `plan.md` before routing.

## Intent Detection — By Category

### Core Workflow
| User Says | Route To |
|-----------|----------|
| "new project", "I want to build", "idea", "let's build" | genius-interviewer |
| "market analysis", "competitors", "market research", "TAM/SAM" | genius-product-market-analyst |
| "write specs", "requirements", "specifications", "user stories" | genius-specs |
| "design", "branding", "colors", "UI", "visual", "logo" | genius-designer |
| "marketing", "launch plan", "go-to-market", "acquisition" | genius-marketer |
| "write copy", "landing page text", "headlines", "email copy" | genius-copywriter |
| "setup services", "env vars", "API keys", "integrations" | genius-integration-guide |
| "architecture", "plan the build", "technical design", "plan.md" | genius-architect |
| "start building", "execute", "build it", "go", "make it" | genius-orchestrator |
| "implement", "code", "build feature", "create component" | genius-dev |

### Quality
| User Says | Route To |
|-----------|----------|
| "run tests", "quality check", "QA", "full audit" | genius-qa |
| "quick check", "validate this", "did it work" | genius-qa-micro |
| "security audit", "vulnerabilities", "penetration test" | genius-security |
| "code review", "review PR", "review code", "review all files" | genius-code-review |
| "review my code", "check code quality" | genius-reviewer |
| "debug", "fix this error", "why is this broken" | genius-debugger |
| "help me test", "testing session", "manual test" | genius-test-assistant |
| "test the UI", "visual testing", "screenshot test" | genius-ui-tester |

### Growth
| User Says | Route To |
|-----------|----------|
| "SEO", "search ranking", "Google ranking", "keywords" | genius-seo |
| "analytics setup", "tracking", "events", "GA4", "Plausible" | genius-analytics |
| "performance", "speed", "load time", "Core Web Vitals" | genius-performance |
| "accessibility", "a11y", "WCAG", "screen reader" | genius-accessibility |
| "write blog", "content strategy", "article", "newsletter" | genius-content |
| "translate", "localization", "i18n", "multi-language" | genius-i18n |

### Business
| User Says | Route To |
|-----------|----------|
| "crypto", "Web3", "blockchain", "smart contract", "NFT" | genius-crypto |

### Infrastructure
| User Says | Route To |
|-----------|----------|
| "deploy", "go live", "ship it", "production" | genius-deployer |
| "setup CI", "GitHub Actions", "CI pipeline" | genius-ci |
| "schedule a task", "recurring check", "run every X minutes" | genius-scheduler |
| "A/B test", "experiment", "autonomous optimization" | genius-experiments |
| "documentation", "write docs", "README", "API docs" | genius-docs |

### Meta
| User Says | Route To |
|-----------|----------|
| "remember", "what did we decide", "context", "history" | genius-memory |
| "optimize skills", "update genius team" | genius-team-optimizer |
| "check for updates", "new claude code version" | genius-updater |
| "onboard", "user onboarding", "welcome flow" | genius-onboarding |
| "playground template", "generate playground" | genius-playground-generator |
| "tune auto mode", "make it more permissive" | genius-auto |
| "switch mode", "change to pro", "beginner mode" | /genius-mode command |
| "import project", "add existing project" | /genius-import command |
| "tips", "what else can you do", "show me features" | genius-tips |

## Context Detection

Check both the phase artifact and any required playground before routing:
- No project files: `genius-interviewer`
- `DISCOVERY.xml` + `DISCOVERY.html`: `genius-product-market-analyst`
- `MARKET-ANALYSIS.xml`: `genius-specs`
- `SPECIFICATIONS.xml`: approval gate, then `genius-designer`
- `DESIGN-SYSTEM.xml` + `DESIGN-SYSTEM.html`: choice gate, then `genius-marketer`
- `MARKETING-PLAN.xml`: `genius-copywriter`
- `COPY-SYSTEM.xml` + `COPY-SYSTEM.html`: `genius-integration-guide`
- `INTEGRATIONS.xml`: `genius-architect`
- `ARCHITECTURE.md`: approval gate, then `genius-orchestrator`
- `.claude/plan.md` with active work: resume `genius-orchestrator`
- `PROGRESS.md` complete: `genius-qa` or `genius-deployer`

If the previous artifact or required playground is missing, block routing and regenerate it first.

## Pre-Transition Guards

Before certain transitions, auto-invoke guard skills:
- Before genius-architect: invoke `genius-guard-pre-planning`
- Before genius-dev/genius-orchestrator: invoke `genius-guard-pre-coding`
- Before genius-deployer: invoke `genius-guard-pre-deploy`

---

## ARTIFACT VALIDATION

Required handoff artifacts are:
- `genius-interviewer`: `DISCOVERY.xml` + `DISCOVERY.html`
- `genius-product-market-analyst`: `MARKET-ANALYSIS.xml`
- `genius-specs`: `SPECIFICATIONS.xml`
- `genius-designer`: `DESIGN-SYSTEM.xml` + `DESIGN-SYSTEM.html`
- `genius-marketer`: `MARKETING-PLAN.xml`
- `genius-copywriter`: `COPY-SYSTEM.xml` + `COPY-SYSTEM.html`
- `genius-integration-guide`: `INTEGRATIONS.xml`
- `genius-architect`: `ARCHITECTURE.md`
- `genius-orchestrator`: updated `plan.md`
- `genius-qa`: `QA-REPORT.xml`
- `genius-security`: `SECURITY-AUDIT.xml`
- `genius-deployer`: `DEPLOYMENT.md`

See `GENIUS_GUARD.md` for full recovery protocol.

---

## Checkpoints

User approval is only required after `genius-specs`, `genius-designer`, and `genius-architect`. All other valid handoffs are automatic.

## State Management

Update `.genius/state.json` on every successful handoff with the chosen skill and a fresh `updated_at` timestamp.

---

## Handoff Protocol (BLOCKING)

Before routing: required artifact exists, required checkpoint is validated, and required playground exists. On success, update `state.json`, pass context, and announce the transition briefly.

---

## Memory Triggers

- "Remember that..." / "We decided..." -> `.genius/memory/decisions.json`
- "This broke because..." -> `.genius/memory/errors.json`
- "Pattern: ..." -> `.genius/memory/patterns.json`

## Disambiguation Rules

When the user's request is ambiguous or could match multiple skills:

1. **Prefer specificity over generality**: If the request mentions "React component" -> genius-dev-frontend directly
2. **When genuinely ambiguous**: Ask ONE clarifying question
3. **NEVER default to working without a skill** — wrong skill > no skill
4. **Common confusions**:
   - "review" without "PR" -> genius-reviewer. "review PR" -> genius-code-review
   - "copy" for landing page -> genius-copywriter. "blog post" -> genius-content
   - "integrate Stripe" -> genius-dev-api. "Stripe billing" -> genius-dev-backend
   - "analyze the market" -> genius-product-market-analyst (NOT genius-specs)
   - "define the architecture" -> genius-architect
   - "test" / "QA" after full build -> genius-qa. "quick check" -> genius-qa-micro
   - "build login page" -> genius-dev-frontend. "build auth system" -> genius-dev-backend

## Commands

Use `/genius-start`, `/status`, `/continue`, `/reset`, `/update-check`, `/genius-dashboard`, `/genius-mode`, and `/genius-import` as the primary control commands. `STOP` or `PAUSE` halts autonomous execution.

## Master Dashboard

Mention `.genius/DASHBOARD.html` after skill completion, `/genius-start`, `/status`, and checkpoint approvals.

## Dual Mode

Use `/challenge` and `/genius-switch-engine {dual|claude|codex}` for cross-engine workflows.

## Workflow Registry

The full workflow dependency graph is defined in `.genius/workflows.json`. Reference it for prerequisites and next-workflow routing.

---

## Error Recovery

If a routed skill fails:
1. **Retry once** with the same skill
2. If still fails, **fall back to genius-dev** for implementation or **genius-reviewer** for review
3. **Log the failure** in `.genius/errors.log`
4. **Notify user**
5. Never silently swallow errors

## Definition of Done

- [ ] Selected skill matches the user's intent and current project state
- [ ] Checkpoint and artifact validation happened before routing
- [ ] Ambiguous requests were clarified or resolved with explicit rules
- [ ] Fallback behavior is defined for routing failures
- [ ] User sees the next skill or recovery step clearly
