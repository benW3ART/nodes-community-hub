#!/bin/bash
# Genius Team v18.0 — Setup Script
# No external MCPs required. Pure Claude Code + Agent Teams.
# Supports multiple AI engines: Claude Code, Codex CLI, or both.
set -e

# ═══════════════════════════════════════════════════════════════
# Parse Arguments
# ═══════════════════════════════════════════════════════════════
MODE="cli"
ENGINE="claude"
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --mode=*)
      MODE="${1#*=}"
      shift
      ;;
    --engine)
      ENGINE="$2"
      shift 2
      ;;
    --engine=*)
      ENGINE="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./scripts/setup.sh [--mode cli|ide|omni|dual] [--engine claude|codex|dual]"
      exit 1
      ;;
  esac
done

# Validate mode
if [[ ! "$MODE" =~ ^(cli|ide|omni|dual)$ ]]; then
  echo "Invalid mode: $MODE"
  echo "Valid modes: cli, ide, omni, dual"
  exit 1
fi

# Validate engine
if [[ ! "$ENGINE" =~ ^(claude|codex|dual)$ ]]; then
  echo "Invalid engine: $ENGINE"
  echo "Valid engines: claude (default), codex, dual"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🧠 Genius Team v18.0 — Setup                              ║"
echo "║  Mode: ${MODE} | Engine: ${ENGINE}                                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0

# ═══════════════════════════════════════════════════════════════
# 1. Check Prerequisites
# ═══════════════════════════════════════════════════════════════
echo "📋 Checking prerequisites..."

# Claude Code (required for claude and dual engines)
if [[ "$ENGINE" == "claude" || "$ENGINE" == "dual" ]]; then
  if command -v claude &>/dev/null; then
    CLAUDE_VER=$(claude --version 2>/dev/null | head -1 || echo "unknown")
    echo -e "${GREEN}✓${NC} Claude Code: $CLAUDE_VER"
    # Save version for updater
    mkdir -p .genius
    echo "$CLAUDE_VER" > .genius/claude-code-version.txt
  else
    echo -e "${RED}✗${NC} Claude Code not found"
    echo "  Install: https://docs.anthropic.com/claude-code"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Codex CLI (required for codex and dual engines)
if [[ "$ENGINE" == "codex" || "$ENGINE" == "dual" ]]; then
  if command -v codex &>/dev/null; then
    CODEX_VER=$(codex --version 2>/dev/null | head -1 || echo "unknown")
    echo -e "${GREEN}✓${NC} Codex CLI: $CODEX_VER"
    echo "$CODEX_VER" > .genius/codex-cli-version.txt
  else
    echo -e "${RED}✗${NC} Codex CLI not found"
    echo "  Install: npm install -g @openai/codex"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Node.js
if command -v node &>/dev/null; then
  echo -e "${GREEN}✓${NC} Node.js $(node --version)"
else
  echo -e "${YELLOW}⚠${NC} Node.js not found (optional but recommended)"
fi

# Git
if command -v git &>/dev/null; then
  echo -e "${GREEN}✓${NC} Git $(git --version | cut -d' ' -f3)"
else
  echo -e "${RED}✗${NC} Git required"
  ERRORS=$((ERRORS + 1))
fi

# jq (needed for memory system)
if command -v jq &>/dev/null; then
  echo -e "${GREEN}✓${NC} jq $(jq --version 2>/dev/null || echo 'installed')"
else
  echo -e "${RED}✗${NC} jq required for memory system"
  echo "  Install: brew install jq (macOS) / apt install jq (Linux)"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. Check Environment
# ═══════════════════════════════════════════════════════════════
echo "🔧 Checking environment..."

if [ "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-}" = "1" ]; then
  echo -e "${GREEN}✓${NC} CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1"
else
  echo -e "${YELLOW}⚠${NC} CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS not set"
  echo "  The settings.json env block will set this automatically."
  echo "  For manual use: export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. Create Directory Structure
# ═══════════════════════════════════════════════════════════════
echo "📁 ${BLUE}Creating directory structure...${NC}"

mkdir -p .genius/memory/session-logs
mkdir -p .genius/backups

# Engine-specific directories
if [[ "$ENGINE" == "claude" || "$ENGINE" == "dual" ]]; then
  mkdir -p .claude/commands
  mkdir -p .claude/agents
  mkdir -p .claude/skills
  echo -e "${GREEN}✓${NC} .claude/ directory structure created"
fi

if [[ "$ENGINE" == "codex" || "$ENGINE" == "dual" ]]; then
  mkdir -p .agents
  # For codex engine, symlink skills from .claude if exists, or create fresh
  if [[ "$ENGINE" == "dual" && -d ".claude/skills" ]]; then
    # In dual mode, .agents symlinks to .claude/skills for shared skills
    if [ ! -L ".agents/skills" ] && [ ! -d ".agents/skills" ]; then
      ln -s ../.claude/skills .agents/skills
      echo -e "${GREEN}✓${NC} .agents/skills → .claude/skills (symlinked)"
    fi
  else
    mkdir -p .agents/skills
  fi
  echo -e "${GREEN}✓${NC} .agents/ directory structure created"
fi

echo -e "${GREEN}✓${NC} .genius/ directory structure created"

# ═══════════════════════════════════════════════════════════════
# 4. Install Mode & Engine-Specific Configs
# ═══════════════════════════════════════════════════════════════
echo "⚙️  ${BLUE}Installing ${MODE} mode + ${ENGINE} engine configs...${NC}"

# Claude engine: Copy mode-specific settings.json and CLAUDE.md
if [[ "$ENGINE" == "claude" || "$ENGINE" == "dual" ]]; then
  if [ -f "configs/${MODE}/settings.json" ]; then
    cp "configs/${MODE}/settings.json" .claude/settings.json
    echo -e "${GREEN}✓${NC} Installed configs/${MODE}/settings.json → .claude/settings.json"
  else
    echo -e "${YELLOW}⚠${NC} configs/${MODE}/settings.json not found, keeping existing"
  fi

  if [ -f "configs/${MODE}/CLAUDE.md" ]; then
    cp "configs/${MODE}/CLAUDE.md" CLAUDE.md
    echo -e "${GREEN}✓${NC} Installed configs/${MODE}/CLAUDE.md → CLAUDE.md"
  else
    echo -e "${YELLOW}⚠${NC} configs/${MODE}/CLAUDE.md not found, keeping existing"
  fi
fi

# Codex engine: Generate AGENTS.md (Codex-compatible instructions)
if [[ "$ENGINE" == "codex" || "$ENGINE" == "dual" ]]; then
  # Generate AGENTS.md from CLAUDE.md template or create fresh
  if [ -f "CLAUDE.md" ] && [[ "$ENGINE" == "dual" ]]; then
    # In dual mode, copy CLAUDE.md to AGENTS.md with modifications
    sed 's/Claude Code/Codex CLI/g; s/\.claude\//.agents\//g' CLAUDE.md > AGENTS.md
    echo -e "${GREEN}✓${NC} Generated AGENTS.md from CLAUDE.md (adapted for Codex)"
  elif [ -f "configs/${MODE}/CLAUDE.md" ]; then
    # Generate AGENTS.md from template
    sed 's/Claude Code/Codex CLI/g; s/\.claude\//.agents\//g' "configs/${MODE}/CLAUDE.md" > AGENTS.md
    echo -e "${GREEN}✓${NC} Generated AGENTS.md from template"
  else
    # Create minimal AGENTS.md
    cat > AGENTS.md << 'AGENTSEOF'
# Genius Team v18.0 — Codex Mode

> Your AI product team. From idea to production.

**Engine:** Codex CLI

---

## Quick Start

**First time?** Read BRIEFING.md for context, then start building.

**Returning?** Your BRIEFING.md has the context from previous sessions.

---

## Directory Structure

- `.agents/` — Codex configuration and skills
- `.genius/` — Project state and memory
- `BRIEFING.md` — Auto-generated context briefing

---

## Skills

Skills are located in `.agents/skills/`. Each skill has a `SKILL.md` with instructions.

Run skills by reading their SKILL.md and following the workflow.
AGENTSEOF
    echo -e "${GREEN}✓${NC} Created AGENTS.md"
  fi
fi

# Codex-only mode: Skip Claude-specific hooks, use simpler settings
if [[ "$ENGINE" == "codex" ]]; then
  # Remove CLAUDE.md if it exists (codex-only mode)
  if [ -f "CLAUDE.md" ]; then
    rm CLAUDE.md
    echo -e "${GREEN}✓${NC} Removed CLAUDE.md (codex-only mode)"
  fi
fi

# IDE-specific extras
if [ "$MODE" = "ide" ]; then
  # VS Code tasks
  if [ -f "configs/ide/tasks.json" ]; then
    mkdir -p .vscode
    cp configs/ide/tasks.json .vscode/tasks.json
    echo -e "${GREEN}✓${NC} Installed .vscode/tasks.json"
  fi

  # Cursor rules
  if [ -f "configs/ide/.cursorrules" ]; then
    cp configs/ide/.cursorrules .cursorrules
    echo -e "${GREEN}✓${NC} Installed .cursorrules"
  fi
fi

# Omni-specific: check secondary providers
if [ "$MODE" = "omni" ]; then
  echo ""
  echo "🌐 ${BLUE}Checking Omni Mode providers...${NC}"
  for cmd in codex kimi gemini; do
    if command -v "$cmd" &>/dev/null; then
      echo -e "  ${GREEN}✓${NC} $cmd: $($cmd --version 2>/dev/null | head -1 || echo 'installed')"
    else
      echo -e "  ${YELLOW}⚠${NC} $cmd: not installed (optional — fallback to Claude Code)"
    fi
  done
  # Auth: subscription-based login (not API keys)
  echo ""
  echo -e "  ${YELLOW}📝${NC} All providers use subscription-based login (no API keys needed):"
  echo -e "     ${GREEN}claude login${NC}      — Claude Max/Pro subscription"
  echo -e "     ${GREEN}codex login${NC}       — ChatGPT Pro/Plus subscription"
  echo -e "     ${GREEN}kimi auth login${NC}   — Kimi subscription"
  echo -e "     ${GREEN}gemini login${NC}      — Gemini Advanced subscription"
fi

# Dual-specific: check challenger providers and setup
if [ "$MODE" = "dual" ]; then
  echo ""
  echo "🔄 ${BLUE}Configuring Dual Mode (Builder + Challenger)...${NC}"
  echo ""
  echo "  Builder model:    ${DUAL_BUILDER_MODEL:-opus} (default)"
  echo "  Challenger model: ${DUAL_CHALLENGER_MODEL:-codex} (default)"
  echo "  Challenger profile: ${DUAL_CHALLENGER_PROFILE:-balanced}"
  echo "  Max rounds:       ${DUAL_MAX_ROUNDS:-3}"
  echo ""
  echo "  Checking challenger CLIs..."
  for cmd in codex kimi gemini; do
    if command -v "$cmd" &>/dev/null; then
      echo -e "  ${GREEN}✓${NC} $cmd: $($cmd --version 2>/dev/null | head -1 || echo 'installed')"
    else
      echo -e "  ${YELLOW}⚠${NC} $cmd: not installed (fallback → Claude Code as challenger)"
    fi
  done

  # Ensure challenger agent exists
  if [ -f ".claude/agents/genius-challenger.md" ]; then
    echo -e "  ${GREEN}✓${NC} Challenger agent: .claude/agents/genius-challenger.md"
  else
    echo -e "  ${YELLOW}⚠${NC} Challenger agent not found — it should be at .claude/agents/genius-challenger.md"
  fi

  # Initialize dual state
  if [ ! -f ".genius/dual-state.json" ]; then
    NOW=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')
    cat > .genius/dual-state.json << DUALEOF
{
  "active": false,
  "mode": null,
  "cycle": 0,
  "max_rounds": ${DUAL_MAX_ROUNDS:-3},
  "builder_model": "${DUAL_BUILDER_MODEL:-opus}",
  "challenger_model": "${DUAL_CHALLENGER_MODEL:-codex}",
  "challenger_profile": "${DUAL_CHALLENGER_PROFILE:-balanced}",
  "current_task": null,
  "last_verdict": null,
  "history": [],
  "updated_at": "$NOW"
}
DUALEOF
    echo -e "  ${GREEN}✓${NC} Dual state initialized (.genius/dual-state.json)"
  else
    echo -e "  ${GREEN}✓${NC} Dual state already exists"
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 5. Initialize Memory Files
# ═══════════════════════════════════════════════════════════════
echo "🧠 ${BLUE}Initializing memory files...${NC}"

init_json() {
  if [ ! -f "$1" ] || [ ! -s "$1" ]; then
    echo '[]' > "$1"
    echo -e "  ${GREEN}✓${NC} Created $1"
  else
    echo -e "  ${GREEN}✓${NC} $1 already exists"
  fi
}

init_json ".genius/memory/decisions.json"
init_json ".genius/memory/patterns.json"
init_json ".genius/memory/progress.json"
init_json ".genius/memory/errors.json"

# Generate initial briefing
if [ -f "scripts/memory-briefing.sh" ]; then
  bash scripts/memory-briefing.sh 2>/dev/null || true
  echo -e "${GREEN}✓${NC} BRIEFING.md generated"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 6. Initialize State & Config
# ═══════════════════════════════════════════════════════════════
echo "📊 ${BLUE}Initializing state...${NC}"

if [ ! -f ".genius/state.json" ]; then
  NOW=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')
  cat > .genius/state.json << EOF
{
  "version": "14.0.0",
  "phase": "NOT_STARTED",
  "currentSkill": null,
  "skillHistory": [],
  "checkpoints": {
    "discovery": false,
    "market_analysis": false,
    "specs_approved": false,
    "design_chosen": false,
    "marketing_done": false,
    "integrations_done": false,
    "architecture_approved": false,
    "execution_started": false,
    "qa_passed": false,
    "security_passed": false,
    "deployed": false
  },
  "tasks": {
    "total": 0,
    "completed": 0,
    "failed": 0,
    "skipped": 0,
    "current_task_id": null
  },
  "artifacts": {},
  "agentTeams": {
    "active": false,
    "leadSessionId": null,
    "teammates": []
  },
  "created_at": "$NOW",
  "updated_at": "$NOW"
}
EOF
  echo -e "${GREEN}✓${NC} State initialized"
else
  echo -e "${GREEN}✓${NC} State already exists"
fi

# Update config.json with mode and engine
if [ ! -f ".genius/config.json" ]; then
  NOW=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')
  cat > .genius/config.json << CFGEOF
{
  "mode": "$MODE",
  "engine": "$ENGINE",
  "version": "18.0.0",
  "created_at": "$NOW",
  "updated_at": "$NOW"
}
CFGEOF
  echo -e "${GREEN}✓${NC} Created config.json (mode: ${MODE}, engine: ${ENGINE})"
else
  jq --arg mode "$MODE" --arg engine "$ENGINE" '.mode = $mode | .engine = $engine' .genius/config.json > .genius/config.json.tmp && mv .genius/config.json.tmp .genius/config.json
  echo -e "${GREEN}✓${NC} Mode set to '${MODE}', engine set to '${ENGINE}' in config.json"
fi

# Engine=dual specific: Initialize dual-engine coordination state
if [[ "$ENGINE" == "dual" ]]; then
  echo ""
  echo "🔀 ${BLUE}Configuring Dual Engine (Claude + Codex)...${NC}"
  
  if [ ! -f ".genius/dual-engine-state.json" ]; then
    NOW=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')
    cat > .genius/dual-engine-state.json << DUALENGEOF
{
  "engine": "dual",
  "primary": "claude",
  "secondary": "codex",
  "sync_enabled": true,
  "last_sync": null,
  "claude_sessions": 0,
  "codex_sessions": 0,
  "shared_artifacts": [],
  "updated_at": "$NOW"
}
DUALENGEOF
    echo -e "  ${GREEN}✓${NC} Dual engine state initialized (.genius/dual-engine-state.json)"
  else
    echo -e "  ${GREEN}✓${NC} Dual engine state already exists"
  fi
  
  # Copy skills to .agents if not symlinked
  if [ -d ".claude/skills" ] && [ ! -L ".agents/skills" ]; then
    echo -e "  ${GREEN}✓${NC} Skills shared between engines via symlink"
  fi
  
  echo -e "  ${GREEN}✓${NC} Both CLAUDE.md and AGENTS.md installed"
  echo -e "  ${GREEN}✓${NC} Use 'claude' for Claude Code, 'codex' for Codex CLI"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 7. Validate JSON Files
# ═══════════════════════════════════════════════════════════════
echo "✅ ${BLUE}Validating JSON files...${NC}"

validate_json() {
  if jq . "$1" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $1"
  else
    echo -e "  ${RED}✗${NC} $1 (invalid JSON)"
    ERRORS=$((ERRORS + 1))
  fi
}

validate_json ".genius/config.json"
validate_json ".genius/state.json"
if [[ "$ENGINE" == "claude" || "$ENGINE" == "dual" ]]; then
  validate_json ".claude/settings.json"
fi
if [[ "$ENGINE" == "dual" ]]; then
  validate_json ".genius/dual-engine-state.json"
fi
validate_json ".genius/memory/decisions.json"
validate_json ".genius/memory/patterns.json"
validate_json ".genius/memory/progress.json"
validate_json ".genius/memory/errors.json"

echo ""

# ═══════════════════════════════════════════════════════════════
# 8. Run Verify
# ═══════════════════════════════════════════════════════════════
if [ -f "scripts/verify.sh" ]; then
  echo "🔍 ${BLUE}Running verification...${NC}"
  echo ""
  bash scripts/verify.sh || true
else
  echo -e "${YELLOW}⚠${NC} verify.sh not found, skipping verification"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════
echo "╔════════════════════════════════════════════════════════════╗"
if [ $ERRORS -eq 0 ]; then
  echo "║  ✅ Setup Complete! (${MODE} mode, ${ENGINE} engine)           ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Genius Team v18.0 is ready."
  echo "  Mode:   ${MODE}"
  echo "  Engine: ${ENGINE}"
  echo ""
  echo "Features:"
  if [[ "$ENGINE" == "claude" || "$ENGINE" == "dual" ]]; then
    echo -e "  ${GREEN}✓${NC} Agent Teams (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS)"
  fi
  echo -e "  ${GREEN}✓${NC} File-based memory (.genius/memory/)"
  echo -e "  ${GREEN}✓${NC} Auto-briefing (BRIEFING.md)"
  echo -e "  ${GREEN}✓${NC} 21 specialized skills"
  if [ "$MODE" = "ide" ]; then
    echo -e "  ${GREEN}✓${NC} VS Code tasks (.vscode/tasks.json)"
    echo -e "  ${GREEN}✓${NC} Cursor rules (.cursorrules)"
  fi
  if [ "$MODE" = "omni" ]; then
    echo -e "  ${GREEN}✓${NC} Multi-provider routing (omni-router skill)"
    echo -e "  ${GREEN}✓${NC} Provider health checks on session start"
  fi
  if [ "$MODE" = "dual" ]; then
    echo -e "  ${GREEN}✓${NC} Builder + Challenger dual workflow"
    echo -e "  ${GREEN}✓${NC} Challenger agent (genius-challenger)"
    echo -e "  ${GREEN}✓${NC} Build-Review / Discussion / Audit modes"
  fi
  # Engine-specific features
  if [[ "$ENGINE" == "claude" ]]; then
    echo -e "  ${GREEN}✓${NC} Claude Code integration (.claude/)"
    echo -e "  ${GREEN}✓${NC} CLAUDE.md as primary instructions"
  elif [[ "$ENGINE" == "codex" ]]; then
    echo -e "  ${GREEN}✓${NC} Codex CLI integration (.agents/)"
    echo -e "  ${GREEN}✓${NC} AGENTS.md as primary instructions"
  elif [[ "$ENGINE" == "dual" ]]; then
    echo -e "  ${GREEN}✓${NC} Dual engine: Claude Code + Codex CLI"
    echo -e "  ${GREEN}✓${NC} Shared skills (\${CLAUDE_SKILL_DIR}/ ← .agents/skills/)"
    echo -e "  ${GREEN}✓${NC} Both CLAUDE.md and AGENTS.md installed"
  fi
  echo ""
  echo "Next steps:"
  echo ""
  if [[ "$ENGINE" == "claude" ]]; then
    if [ "$MODE" = "cli" ]; then
      echo -e "  1. Open Claude Code in this directory"
      echo -e "  2. Run: ${YELLOW}/genius-start${NC}"
      echo -e "  3. Say what you want to build!"
    elif [ "$MODE" = "ide" ]; then
      echo -e "  1. Open this folder in VS Code or Cursor"
      echo -e "  2. Start a Claude Code session"
      echo -e "  3. Run: ${YELLOW}/genius-start${NC}"
      echo -e "  4. Say what you want to build!"
    elif [ "$MODE" = "omni" ]; then
      echo -e "  1. Install secondary providers (optional):"
      echo -e "     ${YELLOW}npm install -g @openai/codex${NC}"
      echo -e "  2. Open Claude Code and run: ${YELLOW}/omni-status${NC}"
      echo -e "  3. Run: ${YELLOW}/genius-start${NC}"
    elif [ "$MODE" = "dual" ]; then
      echo -e "  1. Install a challenger CLI (optional):"
      echo -e "     ${YELLOW}npm install -g @openai/codex${NC}"
      echo -e "  2. Open Claude Code and run: ${YELLOW}/dual-status${NC}"
      echo -e "  3. Mark tasks with 🔄 in plan.md for dual review"
      echo -e "  4. Run: ${YELLOW}/genius-start${NC}"
    fi
  elif [[ "$ENGINE" == "codex" ]]; then
    echo -e "  1. Run ${YELLOW}codex${NC} in this directory"
    echo -e "  2. Codex will read AGENTS.md for instructions"
    echo -e "  3. Say what you want to build!"
  elif [[ "$ENGINE" == "dual" ]]; then
    echo -e "  1. For Claude Code: Run ${YELLOW}claude${NC} → ${YELLOW}/genius-start${NC}"
    echo -e "  2. For Codex CLI:   Run ${YELLOW}codex${NC} (reads AGENTS.md)"
    echo -e "  3. Both engines share skills in \${CLAUDE_SKILL_DIR}/"
    echo -e "  4. State is coordinated via .genius/dual-engine-state.json"
  fi
else
  echo "║  ❌ Setup has $ERRORS error(s)                              ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Fix the errors above and run setup again."
  exit 1
fi
echo ""
