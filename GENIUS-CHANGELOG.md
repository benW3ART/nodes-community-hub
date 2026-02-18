# Changelog

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
