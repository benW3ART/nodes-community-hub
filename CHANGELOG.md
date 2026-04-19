# Changelog

## [21.0.0] - 2026-03-29

### Added — Self-Evolution Engine
- **genius-evolution** — Captures corrections, verifies patterns, promotes learned rules. Auto-triggers on user corrections.
- **genius-autoresearch** — Karpathy-inspired optimization loop. Modify → Test → Measure → Keep if better → Repeat.
- **/genius-evolve** command — Manual evolution audit (run every ~10 sessions)
- **/autoresearch** command — Launch optimization loop on any component
- **`.genius/memory/learned-rules.md`** — Graduated rules with machine-checkable verify lines
- **`.genius/memory/corrections.jsonl`** — Auto-captured user corrections
- **`.genius/memory/observations.jsonl`** — Verified codebase patterns
- **`.genius/memory/evolution-log.md`** — Audit trail of evolution decisions

### Added — Mode System
- **Experience modes** — `/genius-mode` switches between `beginner` (strict validation, verbose), `builder` (default), `pro` (permissive, terse), and `agency` (client-friendly, multi-project). Stored in `.genius/mode.json`.
- **Mode configs** — `configs/modes/beginner.md`, `builder.md`, `pro.md`, `agency.md` define behavior adjustments per mode.

### Added — Workflow Registry
- **`.genius/workflows.json`** — Complete workflow dependency graph: prerequisites, outputs, next_workflow, category (core/quality/growth/business/infra/meta) for all 51 skills.

### Added — State Migration
- **`scripts/migrate-state.sh`** — Detects existing artifacts (DISCOVERY.xml, SPECIFICATIONS.xml, ARCHITECTURE.md, plan.md), sets phase/checkpoints, origin field. Never blocks.
- **`/genius-import` command** — Import existing codebases into Genius Team workflow with `origin=imported` (validators warn instead of block).
- **state.json enhanced** — New `mode` and `origin` fields (native/imported/upgraded).

### Added — Non-blocking Validators
- **`scripts/validate-brief.sh`** — Validates DISCOVERY.xml sections
- **`scripts/validate-spec.sh`** — Validates SPECIFICATIONS.xml sections
- **`scripts/validate-architecture.sh`** — Validates ARCHITECTURE.md sections
- **`scripts/validate-plan.sh`** — Validates .claude/plan.md has tasks
- Validators respect mode (beginner=strict, pro=permissive) and origin (imported=warn only).

### Added — Session Logging + Recovery
- **`.genius/session-log.jsonl`** — PostToolUse hook appends tool/skill/phase to JSONL log
- **`scripts/session-recover.sh`** — Rebuilds state.json from session log after crashes
- **`/continue` enhanced** — Integrates session recovery before resume

### Added — Micro-checklists (Guard Skills)
- **`genius-guard-pre-planning`** — Auto-invoked before genius-architect (verifies specs exist, checkpoint passed)
- **`genius-guard-pre-coding`** — Auto-invoked before genius-dev (verifies architecture approved, plan exists)
- **`genius-guard-pre-deploy`** — Auto-invoked before genius-deployer (verifies QA passed)

### Added — 3 New Skills (total: 51)
- **genius-guard-pre-planning** — Pre-planning validation checklist
- **genius-guard-pre-coding** — Pre-coding validation checklist
- **genius-guard-pre-deploy** — Pre-deployment validation checklist

### Added — New Commands
- **`/genius-mode`** — Switch experience mode (beginner/builder/pro/agency)
- **`/genius-import`** — Import existing project into Genius Team workflow

### Improved — Categorized Skill Routing
- Router (`genius-team/SKILL.md`) now organizes skills by category: Core, Quality, Growth, Business, Infrastructure, Meta
- `CLAUDE.md` routing section organized by category
- All version refs updated to v21

### Improved — Playground Freshness
- **`scripts/check-playground-freshness.sh`** — Detects stale playgrounds (artifact newer than playground)

### Improved — Post-Compaction
- `postCompactionSections` now includes Mode System and Workflow Registry sections
- PreCompact hook injects mode info into snapshot

### Improved — Codex Compatibility
- `AGENTS.md` updated to v21 with mode system references

### Added — GitHub Visibility
- `.github/ISSUE_TEMPLATE/bug.md` and `feature.md`
- `SECURITY.md` — Security policy and reporting guidelines
- `README.md` rewritten around outcomes

### Changed
- `VERSION` → 21.0.0
- All 4 mode configs (cli/ide/omni/dual) updated to v21
- `upgrade.sh` → `upgrade_to_v21()` function added
- genius-tips updated with v21 tips (import, mode, session recovery, workflows)

---

## [20.0.0] - 2026-03-29

### Added — 5 New Skills (total: 48)
- **genius-auto** — Configures Claude Code Auto Mode with skill-aware safety profiles. Permissive for content skills, standard for dev, restrictive for deploy/security, monitor for QA.
- **genius-ui-tester** — Visual UI testing using Computer Use. Screenshots, layout validation, responsive checks across 4 viewports, interactive element testing, visual bug reports.
- **genius-scheduler** — Configures /loop recurring tasks and remote triggers. Templates: PR review cycles, deploy watch, daily summaries, test watcher, autoresearch loops.
- **genius-ci** — CI/CD pipelines using `claude --bare` mode. GitHub Actions workflows for PR auto-review, quality gates with AI security scanning, auto-fix lint.
- **genius-tips** — Contextual skill discovery tips during wait time. Shows 1-2 sentence tips about relevant skills while builds/deploys run. 30+ tips organized by context.

### Improved — Auto Mode Integration
- Auto Mode is now built INTO all 4 modes (not a separate mode). `CLAUDE_CODE_AUTO_MODE=skill-aware` in all configs.
- genius-auto is a tuning skill that adjusts safety profiles, not a separate mode.
- Three profiles: permissive (prototyping), standard (dev), restrictive (production).

### Added — Claude Code 2.1.86 Integration
- **Computer Use** — Screen control, clicking, browsing, screenshots (Pro/Max). Powering genius-ui-tester.
- **Auto Mode** — Automatic approval of safe actions. genius-auto configures per-skill safety policies.
- **--bare Mode** — Headless execution for CI. genius-ci generates GitHub Actions with `claude --bare`.
- **Plugins GA** — Official marketplace. Genius-Claw available as plugin.
- **Conditional Hooks** — `if` field in hook configs for permission-based rules.
- **Background Agent + Worktree** — Parallel isolated task execution.
- **Remote Triggers** — Cron-scheduled agents via `claude trigger create`.
- **Agent SDK renamed** — `@anthropic-ai/claude-agent-sdk`

### Improved — Configuration
- All 4 mode configs updated: conditional hooks, auto mode env vars, v20 version refs
- Compaction optimized for 1M context window
- Claude Code minimum version: 2.1.76 → **2.1.86**

### Improved — Documentation
- TOOLS.md fully updated with 2.1.80–2.1.86 features
- Website (genius.w3art.io) updated: v20 badge, What's New section, 47 skills

---

## [19.0.0] - 2026-03-21

### Added — Claude Code Channels & Mobile Vibe Coding
- 📱 **Claude Code Channels support** — Talk to your Genius Team session from Telegram or Discord. Vibe code from your phone, monitor builds from the train, brainstorm on the go. Full filesystem + MCP + git access through messaging apps.
- 🎙️ **Voice mode guide** — Use `/voice` for push-to-talk interactions with Genius Team. Perfect for brainstorming with genius-pm, quick design reviews, or hands-free coding sessions. 20 languages supported.
- 🔄 **/loop integration** — Native recurring tasks with `/loop 5m check deploy`. Simplifies autoresearch loops and CI monitoring. No more bash wrapper scripts.
- 🎚️ **Effort levels** — `/effort low|medium|high` to control analysis depth per-task. Quick answers when you need speed, deep analysis when you need precision.

### Improved — 1M Token Context Window
- 🧠 **Opus 4.6 1M context** — Full support for 1M token window on Max/Team/Enterprise. Less aggressive compaction = better session continuity. Genius Team workflows can now maintain full context across longer sessions.
- Updated compaction strategy references across all 4 modes

### Improved — Tool & Engine Versions
- Claude Code minimum version: 1.0.0 → **2.1.76**
- Updated TOOLS.md with all March 2026 Claude Code features
- MCP elicitation support documented
- Codex CLI multi-agent orchestration patterns updated

### Improved — Website
- 🌐 **New landing page** (proposition3 / Premium Gold) — editorial design, DM Sans, timeline workflow, interactive skills grid, testimonials
- 25 autoresearch iterations of visual polish
- Messaging aligned: "vibe coding toolkit" — honest positioning, not magic promises

---

## [18.0.0] - 2026-03-13

### Added — Autoresearch Framework
- 🔬 **Autoresearch optimization loop** — Karpathy-inspired autonomous improvement system
- 📊 **auto-benchmark.sh** — Automated 30-task routing accuracy test suite
- ✅ **validate-skills.sh** — Automated skill quality checks (frontmatter, triggers, DoD, handoffs, size)
- 🎨 **design-tokens.css** — Shared design system for all 18 playground templates

### Improved — Context Efficiency (-30KB)
- All SKILL.md files compressed: **0 files over 10KB** (was 10)
- Verbose code blocks, JSON schemas, and templates replaced with concise instructions
- ~30KB total context savings across 42 skills — more room for actual work

### Improved — Session Durability
- 🐛 **Critical fix: postCompactionSections mismatch** — headers in settings.json didn't match CLAUDE.md (emojis + case). After compaction, zero sections survived → total context loss. Now fixed.
- Anti-drift Core Rules injected in all 4 config modes (CLI, IDE, Omni, Dual)
- PostCompact hook reinjects anti-drift rules after every compaction

### Improved — Routing Accuracy (87-90%)
- Negative triggers added to 30+ skills (was ~15)
- Router disambiguation rules for 5 common confusion pairs
- Definition of Done added to all 42/42 skills
- Handoff sections standardized across all skills
- Benchmark: **63.3% → 90%** routing accuracy on 30-task test suite

### Improved — Playground Design
- All 18 templates migrated to shared design-tokens.css
- Consistent theming, typography, and color system
- Responsive layouts standardized

---

## [17.0.0] - 2026-03-10

### Added — 18 Nouveaux Skills (total: 42)
- 🖥️ **genius-dev-frontend** — React/Vue/Svelte/Tailwind specialist, responsive, a11y-first
- ⚙️ **genius-dev-backend** — API, auth, middleware, REST/GraphQL specialist
- 📱 **genius-dev-mobile** — React Native/Expo specialist, native APIs, offline-first
- 🗄️ **genius-dev-database** — Schema design, migrations, query optimization specialist
- 🔌 **genius-dev-api** — Third-party API integrations, SDK wrappers, webhooks specialist
- 🔍 **genius-code-review** — Multi-agent PR review: bugs + security + quality in parallel (inspired by Anthropic's Code Review)
- 🛠️ **genius-skill-creator** — Meta-skill: creates project-specific skills on demand (self-extending framework)
- 🔬 **genius-experiments** — Autoresearch-inspired autonomous optimization loop (Karpathy pattern)
- 🌐 **genius-seo** — GEO-first SEO (AI search: ChatGPT/Perplexity/Claude + traditional), llms.txt, citability scoring
- 🪙 **genius-crypto** — Web3 intelligence via DexScreener + OpenSea + Dune MCP
- 📊 **genius-analytics** — GA4/Plausible/PostHog setup, event taxonomy, conversion funnels
- ⚡ **genius-performance** — Lighthouse audits, Core Web Vitals (LCP/CLS/INP), bundle optimization
- ♿ **genius-accessibility** — WCAG 2.2 AA audit, ARIA, keyboard nav, screen reader testing
- 🌍 **genius-i18n** — i18n setup, string extraction, RTL support, locale routing
- 📝 **genius-docs** — README, API docs, Storybook, ADRs, Divio documentation system
- 🖊️ **genius-content** — Blog, newsletter, social media threads, GEO-optimized long-form content
- 📦 **genius-template** — Project template bootstrapper (SaaS, e-commerce, mobile, web3, API, game)

### Added — Flow & Architecture
- **genius-dev** converted to smart dispatcher → routes to 5 specialized sub-skills by task type
- **genius-specs** suggests genius-skill-creator when recurring project workflows are detected
- **genius-architect** recommends specific genius-dev-* sub-skills based on project type
- **genius-deployer** suggests genius-seo + genius-analytics + genius-performance post-launch
- **genius-reviewer** suggests /simplify for complex sections after code review
- **genius-qa-micro** documents /loop for continuous monitoring (`/loop 2m /genius-qa-micro`)
- **genius-team router updated with all 42 skills + new routing table

### Added — Quality & Compliance
- All 21+ existing skills audited per Anthropic's "Complete Guide to Building Skills for Claude"
- All descriptions now include trigger phrases ("Use when...") + negative triggers ("Do NOT use for...")
- `genius-start/SKILL.md` was missing frontmatter entirely — added complete YAML block
- ACP provenance security guide added (`docs/acp-provenance-guide.md`)
- Genius-Claw v2 roadmap added (`docs/genius-claw-v2-roadmap.md`)

### Added — OpenClaw Integration
- `postCompactionSections` in all 4 mode configs — re-injects critical CLAUDE.md sections after context compaction
- ACP provenance check pattern documented for Genius-Claw

### Changed
- genius-team router now lists 42 skills (was ~14)
- genius-dev: smart dispatcher (was monolithic implementation skill)
- All 21+ existing skills: updated to v17, trigger phrases added
- TOOLS.md: added Crypto tools (DexScreener, OpenSea, Dune MCP) + GEO/SEO section

---

## [16.0.0] - 2026-03-06

### Added
- 📁 **`${CLAUDE_SKILL_DIR}` portable paths** — all skill references now use Claude Code's `${CLAUDE_SKILL_DIR}` variable; Genius Team installs anywhere without path issues
- 🤖 **GPT-5.4 in Codex engine** — `--engine=codex` users now get GPT-5.4 (1M context, reasoning, computer use) automatically; documented in orchestrator and QA agents
- 🔗 **`includeGitInstructions: false`** — all 4 mode configs now prevent git instruction conflicts in pre-configured repos
- 🔔 **`InstructionsLoaded` hook** — startup validation confirms GENIUS_GUARD.md and memory are loaded correctly
- 🌩️ **Cloudflare Code Mode MCP** — genius-dev can now use MCP servers with Cloudflare Code Mode pattern (2 tools, fixed token cost, API in ~1K tokens)
- 📊 **HTTP Hooks enriched** — webhook payloads now include `agent` field for sub-agent identification

### Changed
- All 4 mode `settings.json` — `includeGitInstructions: false`, enriched HTTP hooks, new `InstructionsLoaded` hook
- `TOOLS.md` — Codex updated to GPT-5.4 default model, 1M context documented
- `agents/genius-orchestrator.yaml` — GPT-5.4 noted as Codex default model
- `agents/genius-qa.yaml` — `gpt-5.4-thinking` recommended for Codex engine QA

---

## [15.0.0] - 2026-03-04

### Added
- 🔗 **HTTP Hooks support** — `GENIUS_WEBHOOK_URL` env var enables POST JSON notifications on skill completion and session stop (PostToolUse + Stop events in all 4 mode configs)
- 🔀 **Codex thread forking in genius-orchestrator** — v2.1 orchestrator documents native Codex 0.107.0 thread forking pattern for parallel agent execution (dual engine mode)
- 📄 **PDF specs support in genius-qa** — genius-qa accepts PDF specification documents as input (OpenClaw native + text extraction fallback)
- 🌐 **Git worktrees + shared configs** — dual engine mode now documents config sharing between Claude Code and Codex worktrees
- 📊 **Codex 0.107.0 stable** — updated tooling references; thread forking, realtime voice, custom multimodal tools

### Changed  
- `genius-orchestrator.yaml` — v2.1: added `thread_forking` section documenting Codex native sub-agent pattern
- `genius-qa.yaml` — added PDF input as optional source alongside specs.md
- All 4 mode `settings.json` — added optional `http` hook type for webhook notifications

---

## [14.0.0] - 2026-02-27

### Added
- 📊 **Proactive Dashboard UX** — Dashboard link shown after every skill, in `/genius-start`, `/status`, and at every checkpoint
- 🧠 **Native Auto Memory integration** — `@.genius/memory/BRIEFING.md` import in CLAUDE.md auto-loads project context without SessionStart hook
- 📁 **`.claude/rules/genius-memory.md`** — New modular rule file explaining the full memory hierarchy (Auto Memory vs `.genius/memory/`)
- 📝 **`CLAUDE.local.md` template** — Personal project preferences, auto-gitignored (sandbox URLs, local ports, personal API keys)
- 🌀 **Genius-Claw — Auto Memory aware** — §4 resume checks Auto Memory; §5 post-session always announces dashboard update; §5b full native memory table
- 🔧 **`/genius-start` Step 4b** — Bootstraps Claude Code Auto Memory with project facts on first run
- 🗂️ **`.claude/rules/` support** — Foundation for path-scoped modular rules (topic-specific, path-aware via YAML frontmatter)

### Changed
- All CLAUDE.md files (root + 4 modes): added `🧠 Memory` section with @import and Auto Memory guidance
- `genius-team` SKILL.md: PROACTIVE RULE — always mention Dashboard after skill completion
- `genius-orchestrator` SKILL.md: Dashboard link in Completion Protocol
- `/genius-dashboard` command: PROACTIVE RULE header (auto-suggest after every skill)

---

## [13.0.0] - 2026-02-26

### Added
- 🗂️ **Master Playground Dashboard** — `/genius-dashboard` command, `.genius/DASHBOARD.html` hub aggregating all playgrounds
- 📱 **Mobile-responsive playgrounds** — All 12 playgrounds work on phone and tablet
- 🌀 **Genius-Claw plugin** — OpenClaw native install: `openclaw plugins install https://genius.w3art.io/genius-claw.zip`
  - Cross-project memory (`memory/genius-claw.md`)
  - Project registry (`memory/genius-claw-projects.json`)
  - Global dashboard with Canvas presentation
  - Daily brief + stale alert + auto-update crons
- 🧙 **OpenClaw-first wizard** on genius.w3art.io
- 🔁 **Post-output dashboard hooks** — HTML-generating skills auto-open dashboard

### Changed
- CLAUDE.md wizard refactored to OpenClaw-first flow
- Banner and hero text updated to v13

---

## [12.0.0] - 2026-02-20

### Added
- 🤖 **8 full agent specifications** with YAML manifests
  - `genius-interviewer`, `genius-specs`, `genius-architect`, `genius-qa`
  - `genius-deploy`, `genius-dev`, `genius-security` + full orchestration registry
- 🎤 **Interview-First Flow** — Every project starts with `genius-interviewer` before any work begins
- ⛔ **Phase Checkpoints** — Human approval gates between major phase transitions
- 🔁 **Retrospective Engine** — Phase retrospectives feed learnings back into memory
- 🧠 **Cross-Project Memory** — Decisions and lessons persist across projects, not just sessions
- 🤝 **Agent coordination protocol** — shared artifacts, git worktree isolation, handoff contracts

---

## [11.0.0] - 2026-02-17

### Added
- 🔀 **Multi-engine support** via `--engine` flag
  - `--engine=claude` — Claude Code only (default, existing behavior)
  - `--engine=codex` — Codex CLI only (creates `.agents/` folder, uses `AGENTS.md`)
  - `--engine=dual` — Both engines (shared skills, both instruction files)
- 📁 `.agents/` directory structure for Codex CLI
  - Symlinks to `.claude/skills/` in dual mode for shared skills
- 📄 `AGENTS.md` auto-generated for Codex compatibility
  - Adapted from `CLAUDE.md` with path/tool substitutions
- 🔄 Dual engine coordination
  - `.genius/dual-engine-state.json` for tracking engine usage
  - Shared artifacts between Claude and Codex sessions
- 📜 Updated `create.sh` one-liner to accept `--engine` flag:
  ```bash
  bash <(curl -fsSL .../create.sh) my-project --engine=dual
  ```

### Changed
- `setup.sh` now validates engine parameter (claude|codex|dual)
- Prerequisite checks are engine-aware (only checks relevant CLIs)
- JSON validation skips engine-specific files appropriately
- Summary and next-steps guidance customized per engine

### Note
- `--mode=dual` (Builder+Challenger workflow) and `--engine=dual` (Claude+Codex) are independent
- You can combine them: `--mode=dual --engine=dual` for maximum flexibility

## [10.0.0] - 2026-02-16

### Added
- 🎮 12 interactive HTML playgrounds (one per skill)
  - Project Canvas, Market Simulator, User Journey Builder, Design System Builder
  - GTM Simulator, Copy A/B Tester, Stack Configurator, Architecture Explorer
  - Progress Dashboard, Test Coverage Map, Risk Matrix, Deploy Checklist
- 🛡️ Anti-drift guard system
  - GENIUS_GUARD.md with absolute rules
  - /guard-check and /guard-recover commands
  - Blocking handoffs if artifacts missing
  - PreToolUse hook detects code written outside genius-dev
- 🧠 Persistent memory system
  - memory-capture.sh for structured event capture
  - memory-rollup.sh for daily summaries
  - memory-recover.sh for reconstruction
  - /memory-status, /memory-add, /memory-search, /memory-recover, /memory-forget commands
- 🔄 Self-update system
  - /genius-upgrade command
  - scripts/upgrade.sh for v9→v10 migration
  - VERSION file for version detection
  - genius-updater now checks Genius Team version (not just Claude Code)

### Changed
- All 12 skills now have MANDATORY ARTIFACT sections
- settings.json hooks enriched for memory capture
- BRIEFING.md now includes Recent Events, Key Decisions, Milestones
- Router (genius-team skill) now has blocking handoffs

## [9.0.0] - 2026-02-08
- Initial open source release
- Agent Teams support
- File-based memory system
- 4 operating modes (CLI, IDE, Omni, Dual)

---

## [8.0.0] and earlier — Pre-open-source

Versions v1.0 through v8.x were internal/private iterations developed before the open-source release.

Key milestones:
- **v1.0–v4.x** — Initial concept: skill files + basic memory for personal use
- **v5.0–v6.x** — Multi-skill router, first QA loop, save-token mode
- **v7.0** — External MCP integrations (later removed in v9 for zero-dependency architecture)
- **v8.x** — Last private version before open-source rewrite

**v9.0.0 (2026-02-08)** was a clean-room rewrite for public release — no external MCPs, pure Claude Code + file system.
