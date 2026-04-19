#!/usr/bin/env bash
# scripts/switch-engine.sh
# Switch a Genius Team project between claude, codex, and dual engines
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/scripts/switch-engine.sh) [claude|codex|dual]

set -euo pipefail

TARGET_ENGINE="${1:-}"
GENIUS_DIR=".genius"
STATE_FILE="$GENIUS_DIR/state.json"
CLAUDE_SKILLS_DIR=".claude/skills"
AGENTS_DIR=".agents"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()  { echo -e "${BLUE}[switch]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[ok]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }
log_error() { echo -e "${RED}[error]${NC} $*"; exit 1; }

# Print banner
echo ""
echo "⚡ Genius Team — Engine Switch"
echo "================================"
echo ""

# Detect current engine
detect_current_engine() {
  if [ -f "$STATE_FILE" ]; then
    local engine
    engine=$(jq -r '.engine // "unknown"' "$STATE_FILE" 2>/dev/null || echo "unknown")
    echo "$engine"
  elif [ -f "AGENTS.md" ] && [ -f "CLAUDE.md" ]; then
    echo "dual"
  elif [ -f "AGENTS.md" ]; then
    echo "codex"
  elif [ -f "CLAUDE.md" ]; then
    echo "claude"
  else
    echo "unknown"
  fi
}

CURRENT_ENGINE=$(detect_current_engine)
log_info "Current engine: $CURRENT_ENGINE"

# Validate target
if [ -z "$TARGET_ENGINE" ]; then
  echo "Usage: $(basename "$0") [claude|codex|dual]"
  echo ""
  echo "Current engine: $CURRENT_ENGINE"
  echo ""
  echo "Options:"
  echo "  claude  — Claude Code only (CLAUDE.md + .claude/)"
  echo "  codex   — Codex CLI only (AGENTS.md + .agents/)"
  echo "  dual    — Both engines (CLAUDE.md + AGENTS.md + symlinks)"
  echo ""
  exit 0
fi

if [[ ! "$TARGET_ENGINE" =~ ^(claude|codex|dual)$ ]]; then
  log_error "Invalid engine: '$TARGET_ENGINE'. Must be claude, codex, or dual."
fi

if [ "$CURRENT_ENGINE" = "$TARGET_ENGINE" ]; then
  log_ok "Already on engine: $TARGET_ENGINE. Nothing to do."
  exit 0
fi

log_info "Switching: $CURRENT_ENGINE → $TARGET_ENGINE"
echo ""

# Backup current state
BACKUP_DIR="$GENIUS_DIR/engine-switch-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
[ -f "CLAUDE.md" ] && cp "CLAUDE.md" "$BACKUP_DIR/"
[ -f "AGENTS.md" ] && cp "AGENTS.md" "$BACKUP_DIR/"
[ -f "$STATE_FILE" ] && cp "$STATE_FILE" "$BACKUP_DIR/"
log_info "Backup saved to $BACKUP_DIR"

# Switch to claude
switch_to_claude() {
  log_info "Configuring for Claude Code..."

  # CLAUDE.md: ensure it exists and is up to date
  if [ ! -f "CLAUDE.md" ]; then
    log_warn "No CLAUDE.md found. Generating from AGENTS.md..."
    if [ -f "AGENTS.md" ]; then
      sed 's/AGENTS.md/CLAUDE.md/g; s/codex/claude/g; s/Codex/Claude Code/g' AGENTS.md > CLAUDE.md
      log_ok "CLAUDE.md generated from AGENTS.md"
    else
      log_error "Neither CLAUDE.md nor AGENTS.md found. Cannot switch."
    fi
  fi

  # Remove AGENTS.md symlinks if in dual mode
  if [ "$CURRENT_ENGINE" = "dual" ]; then
    log_info "Removing dual-mode AGENTS.md..."
    rm -f AGENTS.md
    [ -d "$AGENTS_DIR" ] && log_warn ".agents/ directory left in place (contains your skills symlinks)"
  fi

  # Update state
  if [ -f "$STATE_FILE" ]; then
    jq --arg engine "claude" --arg ts "$(date -Iseconds)" \
      '.engine = $engine | .engineSwitchedAt = $ts' \
      "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi
}

# Switch to codex
switch_to_codex() {
  log_info "Configuring for Codex CLI..."

  # Generate AGENTS.md from CLAUDE.md
  if [ -f "CLAUDE.md" ]; then
    log_info "Generating AGENTS.md from CLAUDE.md..."
    sed 's/CLAUDE\.md/AGENTS.md/g; s/claude code/codex/gi; s/Claude Code/Codex/g' CLAUDE.md > AGENTS.md
    # Add Codex-specific header
    sed -i.bak '1s/^/# AGENTS.md — Genius Team v17 (Codex Engine)\n# Auto-generated from CLAUDE.md via genius-switch-engine\n# Do not edit manually — use \/genius-switch-engine to maintain\n\n/' AGENTS.md
    rm -f AGENTS.md.bak
    log_ok "AGENTS.md generated"
  else
    log_error "No CLAUDE.md found. Cannot generate AGENTS.md."
  fi

  # Create .agents/ directory with symlinks to skills
  mkdir -p "$AGENTS_DIR"
  if [ -d "$CLAUDE_SKILLS_DIR" ]; then
    for skill_dir in "$CLAUDE_SKILLS_DIR"/*/; do
      skill_name=$(basename "$skill_dir")
      if [ ! -e "$AGENTS_DIR/$skill_name" ]; then
        ln -sf "../$CLAUDE_SKILLS_DIR/$skill_name" "$AGENTS_DIR/$skill_name"
      fi
    done
    log_ok ".agents/ symlinks created ($(ls "$AGENTS_DIR" | wc -l | tr -d ' ') skills)"
  fi

  # Check codex CLI
  if ! command -v codex &>/dev/null; then
    log_warn "Codex CLI not found. Install: npm install -g @openai/codex"
  else
    local codex_version
    codex_version=$(codex --version 2>/dev/null || echo "unknown")
    log_ok "Codex CLI detected: $codex_version"
  fi

  # Update state
  if [ -f "$STATE_FILE" ]; then
    jq --arg engine "codex" --arg ts "$(date -Iseconds)" \
      '.engine = $engine | .engineSwitchedAt = $ts' \
      "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi
}

# Switch to dual
switch_to_dual() {
  log_info "Configuring dual mode (Claude Code + Codex)..."

  # Ensure CLAUDE.md exists
  if [ ! -f "CLAUDE.md" ]; then
    log_error "No CLAUDE.md found. Run genius setup first."
  fi

  # Generate AGENTS.md
  switch_to_codex  # Reuse codex setup

  log_info "Both CLAUDE.md and AGENTS.md are now active."
  log_ok "Dual mode configured. Open two terminals:"
  echo "  Terminal 1: claude  (Claude Code)"
  echo "  Terminal 2: codex   (Codex CLI)"
  echo "  Shared: .genius/dual-bridge.json (auto-written after each action)"
  echo "  Command: /challenge (works in both terminals)"

  # Update state
  if [ -f "$STATE_FILE" ]; then
    jq --arg engine "dual" --arg ts "$(date -Iseconds)" \
      '.engine = $engine | .engineSwitchedAt = $ts' \
      "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi
}

# Execute switch
case "$TARGET_ENGINE" in
  claude) switch_to_claude ;;
  codex)  switch_to_codex ;;
  dual)   switch_to_dual ;;
esac

echo ""
log_ok "Engine switched to: $TARGET_ENGINE"
echo ""
echo "Next steps:"
case "$TARGET_ENGINE" in
  claude)
    echo "  1. Open project in Claude Code: claude"
    echo "  2. Run: /genius-start"
    ;;
  codex)
    echo "  1. Open project in Codex: codex"
    echo "  2. The agent will read AGENTS.md automatically"
    ;;
  dual)
    echo "  1. Terminal 1: claude → /genius-start"
    echo "  2. Terminal 2: codex  → reads AGENTS.md"
    echo "  3. Use /challenge in either terminal to cross-review"
    ;;
esac
echo ""
