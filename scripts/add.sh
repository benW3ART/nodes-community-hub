#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Genius Team v18.0 — Add to Existing Project
# Usage: cd your-project && bash <(curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/scripts/add.sh) [--mode cli|ide|omni|dual] [--engine claude|codex|dual]
# ═══════════════════════════════════════════════════════════════
set -e

# Colors (degrade gracefully)
if [ -t 1 ] && command -v tput &>/dev/null && [ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]; then
  GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
  BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'
  DIM='\033[2m'; NC='\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; BLUE=''; CYAN=''; BOLD=''; DIM=''; NC=''
fi

# ── Helpers ──────────────────────────────────────────────────
info()  { echo -e "${BLUE}ℹ${NC}  $1"; }
ok()    { echo -e "${GREEN}✓${NC}  $1"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $1"; }
fail()  { echo -e "${RED}✗${NC}  $1"; }
die()   { echo -e "\n${RED}ERROR:${NC} $1" >&2; exit 1; }

# ── Parse Arguments ──────────────────────────────────────────
MODE="cli"
ENGINE="claude"

while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)   MODE="$2"; shift 2 ;;
    --mode=*) MODE="${1#*=}"; shift ;;
    --engine)   ENGINE="$2"; shift 2 ;;
    --engine=*) ENGINE="${1#*=}"; shift ;;
    -h|--help)
      echo "Usage: cd your-project && bash <(curl -fsSL URL) [--mode cli|ide|omni|dual] [--engine claude|codex|dual]"
      echo ""
      echo "  --mode MODE      Setup mode: cli (default), ide, omni, dual"
      echo "  --engine ENGINE  AI engine: claude (default), codex, dual"
      echo ""
      echo "Run this from INSIDE your existing project directory."
      exit 0
      ;;
    -*)  die "Unknown option: $1" ;;
    *)   die "Unexpected argument: $1\nRun this from inside your project directory: cd your-project && bash <(curl ...) --mode cli" ;;
  esac
done

# Validate mode
if [[ ! "$MODE" =~ ^(cli|ide|omni|dual)$ ]]; then
  die "Invalid mode: ${MODE}\nValid modes: cli, ide, omni, dual"
fi

# Validate engine
if [[ ! "$ENGINE" =~ ^(claude|codex|dual)$ ]]; then
  die "Invalid engine: ${ENGINE}\nValid engines: claude, codex, dual"
fi

# ── Banner ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  🧠 Genius Team v18.0 — Add to Existing Project  ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Target:  ${CYAN}$(pwd)${NC}"
echo -e "  Mode:    ${CYAN}${MODE}${NC}"
echo -e "  Engine:  ${CYAN}${ENGINE}${NC}"
echo ""

# ── Pre-flight Checks ───────────────────────────────────────
command -v git &>/dev/null || die "Git is not installed. Please install git first.\n  macOS: xcode-select --install\n  Linux: sudo apt install git"

# Check we're in a project directory (not home or root)
if [ "$(pwd)" = "$HOME" ] || [ "$(pwd)" = "/" ]; then
  die "You appear to be in your home or root directory.\nPlease navigate to your project: cd your-project"
fi

# Soft check: warn if not in a git repo, but don't fail
if ! git rev-parse --git-dir &>/dev/null 2>&1; then
  warn "Current directory is not a git repository. Genius Team works best with git."
  echo -e "     Consider running: ${CYAN}git init${NC}"
  echo ""
fi

# Quick connectivity check
if ! git ls-remote https://github.com/w-3-art/genius-team.git HEAD &>/dev/null 2>&1; then
  die "Cannot reach GitHub. Check your internet connection."
fi

# ── Download Genius Team files ───────────────────────────────
TMPDIR_GT=$(mktemp -d)
trap "rm -rf ${TMPDIR_GT}" EXIT

info "Downloading Genius Team files..."
if ! git clone --quiet https://github.com/w-3-art/genius-team.git "${TMPDIR_GT}/genius" 2>/dev/null; then
  die "Git clone failed. Check your internet connection and try again."
fi
ok "Downloaded Genius Team"

# ── Copy files (without overwriting) ────────────────────────
info "Copying Genius Team files to your project..."

GENIUS_SRC="${TMPDIR_GT}/genius"
COPIED=0
SKIPPED=0

copy_file() {
  local src="$1"
  local dst="$2"
  if [ -e "$dst" ]; then
    warn "Skipping $(basename "$dst") — already exists"
    ((SKIPPED++)) || true
  else
    cp -r "$src" "$dst"
    ok "Added $(basename "$dst")"
    ((COPIED++)) || true
  fi
}

copy_dir() {
  local src="$1"
  local dst="$2"
  if [ -d "$dst" ]; then
    # Merge: copy only files that don't exist yet
    find "$src" -type f | while read -r file; do
      local rel="${file#$src/}"
      local target="$dst/$rel"
      if [ ! -e "$target" ]; then
        mkdir -p "$(dirname "$target")"
        cp "$file" "$target"
        ((COPIED++)) || true
      else
        ((SKIPPED++)) || true
      fi
    done
    ok "Merged ${CYAN}$(basename "$dst")/${NC} (skipped existing files)"
  else
    cp -r "$src" "$dst"
    ok "Added ${CYAN}$(basename "$dst")/${NC}"
    ((COPIED++)) || true
  fi
}

# Core files
copy_dir  "${GENIUS_SRC}/.claude"         "./.claude"
copy_file "${GENIUS_SRC}/CLAUDE.md"       "./CLAUDE.md"
# Scripts: ALWAYS overwrite (critical for upgrades to work)
if [ -d "./scripts" ]; then
  cp -r "${GENIUS_SRC}/scripts/"* "./scripts/"
  ok "Updated ${CYAN}scripts/${NC} (force-overwrite)"
  ((COPIED++)) || true
else
  cp -r "${GENIUS_SRC}/scripts" "./scripts"
  ok "Added ${CYAN}scripts/${NC}"
  ((COPIED++)) || true
fi

# Configs: ALWAYS overwrite (mode settings must match latest version)
if [ -d "./configs" ]; then
  cp -r "${GENIUS_SRC}/configs/"* "./configs/"
  ok "Updated ${CYAN}configs/${NC} (force-overwrite)"
  ((COPIED++)) || true
else
  cp -r "${GENIUS_SRC}/configs" "./configs"
  ok "Added ${CYAN}configs/${NC}"
  ((COPIED++)) || true
fi
copy_file "${GENIUS_SRC}/GENIUS_GUARD.md" "./GENIUS_GUARD.md"
copy_file "${GENIUS_SRC}/VERSION"         "./VERSION"

# Templates (needed for dual-bridge etc.)
[ -d "${GENIUS_SRC}/templates" ] && copy_dir "${GENIUS_SRC}/templates" "./templates"

# Optional but useful
[ -f "${GENIUS_SRC}/MEMORY-SYSTEM.md" ] && copy_file "${GENIUS_SRC}/MEMORY-SYSTEM.md" "./MEMORY-SYSTEM.md"

echo ""
echo -e "  ${DIM}Copied: ${COPIED} files | Skipped (already exist): ${SKIPPED} files${NC}"
echo ""

# ── Run Setup ────────────────────────────────────────────────
info "Running setup (${MODE} mode, ${ENGINE} engine)..."
echo ""
chmod +x scripts/setup.sh
./scripts/setup.sh --mode "$MODE" --engine "$ENGINE"
echo ""

# ── Done ─────────────────────────────────────────────────────
echo -e "${BOLD}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  🧠 Genius Team v18.0 — Ready!                   ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Genius Team has been added to your existing project."
echo ""

# Engine-specific next steps
if [[ "$ENGINE" == "codex" ]]; then
  echo -e "  ${BOLD}Next steps:${NC}"
  echo -e "  1. Run ${CYAN}codex${NC}"
  echo -e "  2. Codex reads AGENTS.md automatically"
  echo -e "  3. Tell it what you want to build! 🚀"
elif [[ "$ENGINE" == "dual" ]]; then
  echo -e "  ${BOLD}Next steps:${NC}"
  echo -e "  1. For Claude: Run ${CYAN}claude${NC} → ${CYAN}/genius-start${NC}"
  echo -e "  2. For Codex:  Run ${CYAN}codex${NC} (reads AGENTS.md)"
  echo -e "  3. Tell it what you want to build! 🚀"
else
  case "$MODE" in
    cli|omni|dual)
      echo -e "  ${BOLD}Next steps:${NC}"
      echo -e "  1. Run ${CYAN}claude${NC}"
      echo -e "  2. Type ${CYAN}/genius-start${NC}"
      echo -e "  3. Tell it what you want to build! 🚀"
      ;;
    ide)
      echo -e "  ${BOLD}Next steps:${NC}"
      echo -e "  1. Open this folder in ${CYAN}VS Code${NC} or ${CYAN}Cursor${NC}"
      echo -e "  2. Start Claude Code ${DIM}(Cmd+Shift+P → \"Claude Code: Open\")${NC}"
      echo -e "  3. Type ${CYAN}/genius-start${NC}"
      echo -e "  4. Tell it what you want to build! 🚀"
      ;;
  esac
fi

echo ""
echo -e "${DIM}─────────────────────────────────────────────────────${NC}"
echo -e "  📁 Project: ${CYAN}$(pwd)${NC}"
echo -e "  📖 Docs:    ${CYAN}docs/GETTING-STARTED.md${NC}"
echo -e "  🌐 GitHub:  ${CYAN}https://github.com/w-3-art/genius-team${NC}"
echo -e "${DIM}─────────────────────────────────────────────────────${NC}"
echo ""
echo -e "  ${GREEN}Happy building! 🧠✨${NC}"
echo ""
