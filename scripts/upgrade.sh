#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# Genius Team Universal Upgrade Script
# Upgrades from any previous version to v20.0
#═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Config
REPO_URL="https://raw.githubusercontent.com/w-3-art/genius-team/main"
TARGET_VERSION="21.0.0"
CLAUDE_SKILL_DIR=".claude/skills"

# ── Self-Healing: re-exec from GitHub if this script is outdated ─────────────
# This runs even when the local upgrade.sh targets an old version
_REMOTE_VER=$(curl -sfL --max-time 5 "https://raw.githubusercontent.com/w-3-art/genius-team/main/VERSION" 2>/dev/null || echo "")
if [ -n "$_REMOTE_VER" ] && [ "$_REMOTE_VER" != "$TARGET_VERSION" ]; then
  echo -e "⚠️  This upgrade script targets v$TARGET_VERSION but latest Genius Team is v$_REMOTE_VER."
  echo -e "   Fetching the latest upgrade script from GitHub..."
  echo ""
  exec bash <(curl -fsSL "https://raw.githubusercontent.com/w-3-art/genius-team/main/scripts/upgrade.sh") "$@"
fi

# Flags
FORCE=false
DRY_RUN=false
VERBOSE=false

# Stats
FILES_DOWNLOADED=0
FILES_SKIPPED=0

#═══════════════════════════════════════════════════════════════════════════════
# Helpers
#═══════════════════════════════════════════════════════════════════════════════

print_banner() {
  echo ""
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}  ${BOLD}🚀 Genius Team Upgrade → v21.0${NC}                           ${CYAN}║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

log_step()    { echo -e "${BLUE}[$1/$2]${NC} $3"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error()   { echo -e "${RED}✗${NC} $1"; }
log_info()    { echo -e "${CYAN}ℹ${NC} $1"; }
log_verbose() { [ "$VERBOSE" = true ] && echo -e "  ${CYAN}→${NC} $1" >&2 || true; }

show_usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --force     Skip git clean check"
  echo "  --dry-run   Preview changes without modifying files"
  echo "  --verbose   Show detailed file download output"
  echo "  --help      Show this help"
  echo ""
  echo "Upgrades your Genius Team project to v20.0 from any previous version."
}

#═══════════════════════════════════════════════════════════════════════════════
# Version Detection (supports v9 through v15)
#═══════════════════════════════════════════════════════════════════════════════

detect_version() {
  # Method 1: state.json
  if [ -f ".genius/state.json" ]; then
    local v
    v=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' .genius/state.json 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
    if [ -n "$v" ]; then echo "$v"; return 0; fi
  fi

  # Method 2: CLAUDE.md markers
  if [ -f "CLAUDE.md" ]; then
    if grep -qE "v17|17\." CLAUDE.md 2>/dev/null; then echo "17.0.0"; return 0; fi
    if grep -qE "v16|16\." CLAUDE.md 2>/dev/null; then echo "16.0.0"; return 0; fi
    if grep -qE "v15|15\." CLAUDE.md 2>/dev/null; then echo "15.0.0"; return 0; fi
    if grep -qE "v14|14\." CLAUDE.md 2>/dev/null; then echo "14.0.0"; return 0; fi
    if grep -qE "v1[23]|13\.|12\." CLAUDE.md 2>/dev/null; then echo "13.0.0"; return 0; fi
    if grep -qE "v11|11\." CLAUDE.md 2>/dev/null; then echo "11.0.0"; return 0; fi
    if grep -qE "v10|10\." CLAUDE.md 2>/dev/null; then echo "10.0.0"; return 0; fi
    if grep -qE "v9|9\." CLAUDE.md 2>/dev/null; then echo "9.0.0"; return 0; fi
  fi

  # Method 3: File structure heuristics
  if [ -f "GENIUS_GUARD.md" ] && [ -d "playgrounds/templates" ]; then
    if [ -f "scripts/genius-server.js" ]; then echo "14.0.0"; return 0; fi
    if [ -f "scripts/add.sh" ]; then echo "11.0.0"; return 0; fi
    echo "10.0.0"; return 0
  fi

  echo "9.0.0"
}

version_major() { echo "$1" | cut -d. -f1; }

# Returns 0 if v1 < v2
version_lt() {
  local m1; m1=$(version_major "$1")
  local m2; m2=$(version_major "$2")
  [ "$m1" -lt "$m2" ]
}

#═══════════════════════════════════════════════════════════════════════════════
# Prerequisites
#═══════════════════════════════════════════════════════════════════════════════

check_prerequisites() {
  local errors=0

  if [ ! -f "CLAUDE.md" ]; then
    log_error "CLAUDE.md not found. Run this from inside a Genius Team project directory."
    log_error "  Example: cd my-project && bash <(curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/scripts/upgrade.sh)"
    log_error "  Current directory: $(pwd)"
    errors=$((errors + 1))
  fi

  if ! command -v curl &>/dev/null; then
    log_error "curl is required but not installed."
    errors=$((errors + 1))
  fi

  if [ "$FORCE" = false ] && command -v git &>/dev/null && [ -d ".git" ]; then
    local dirty; dirty=$(git status --porcelain 2>/dev/null)
    if [ -n "$dirty" ]; then
      log_error "Uncommitted changes detected. Commit first, or use --force."
      errors=$((errors + 1))
    fi
  fi

  return $errors
}

#═══════════════════════════════════════════════════════════════════════════════
# Backup
#═══════════════════════════════════════════════════════════════════════════════

create_backup() {
  local ts; ts=$(date +%Y%m%d-%H%M%S)
  local backup_dir=".genius/backups/pre-v17-upgrade-$ts"

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY-RUN] Would create backup at: $backup_dir"
    echo "$backup_dir"
    return 0
  fi

  mkdir -p "$backup_dir"
  [ -d ".claude" ]         && cp -r .claude         "$backup_dir/" 2>/dev/null || true
  [ -f "CLAUDE.md" ]       && cp CLAUDE.md           "$backup_dir/"
  [ -f "GENIUS_GUARD.md" ] && cp GENIUS_GUARD.md     "$backup_dir/"
  [ -d "playgrounds" ]     && cp -r playgrounds      "$backup_dir/" 2>/dev/null || true
  [ -d "scripts" ]         && cp -r scripts          "$backup_dir/" 2>/dev/null || true
  [ -f ".genius/state.json" ] && cp .genius/state.json "$backup_dir/state.json.bak"

  log_verbose "Backup created at: $backup_dir"
  echo "$backup_dir"
}

#═══════════════════════════════════════════════════════════════════════════════
# Download
#═══════════════════════════════════════════════════════════════════════════════

download_file() {
  local remote=$1
  local local_path=$2
  local overwrite=${3:-true}   # default: overwrite existing

  if [ "$DRY_RUN" = true ]; then
    log_verbose "[DRY-RUN] Would download: $remote → $local_path"
    FILES_DOWNLOADED=$((FILES_DOWNLOADED + 1))
    return 0
  fi

  # Skip if exists and overwrite=false
  if [ "$overwrite" = false ] && [ -f "$local_path" ]; then
    log_verbose "Skipped (exists): $local_path"
    FILES_SKIPPED=$((FILES_SKIPPED + 1))
    return 0
  fi

  local dir; dir=$(dirname "$local_path")
  [ -d "$dir" ] || mkdir -p "$dir"

  if curl -fsSL "$REPO_URL/$remote" -o "$local_path" 2>/dev/null; then
    log_verbose "✓ $local_path"
    FILES_DOWNLOADED=$((FILES_DOWNLOADED + 1))
  else
    log_warning "Failed to download: $remote"
  fi
}

#═══════════════════════════════════════════════════════════════════════════════
# Stubs for v10→v14 (these versions didn't change the upgrade infrastructure;
# jumping straight to v15 downloads everything needed to reach v17)
#═══════════════════════════════════════════════════════════════════════════════

upgrade_to_v10() { log_info "v10 stub — bootstrapping chain to v15..."; }
upgrade_to_v11() { upgrade_to_v10; }
upgrade_to_v12() { upgrade_to_v11; }
upgrade_to_v13() { upgrade_to_v12; }
upgrade_to_v14() { upgrade_to_v13; }

#═══════════════════════════════════════════════════════════════════════════════
# Main Upgrade: downloads all v15 files
#═══════════════════════════════════════════════════════════════════════════════

upgrade_to_v16() {
  upgrade_to_v15
  # Update state.json version to 16.0.0
  if [ "$DRY_RUN" = false ] && [ -f ".genius/state.json" ]; then
    sed -i.tmp 's/"version"[[:space:]]*:[[:space:]]*"[^"]*"/"version": "16.0.0"/' .genius/state.json
    rm -f .genius/state.json.tmp
  fi
}

upgrade_to_v17() {
  upgrade_to_v16

  # ── Core files ──────────────────────────────────────────────────────────
  log_info "Core files (v17)..."
  download_file "CLAUDE.md"    "CLAUDE.md"
  download_file "README.md"    "README.md"
  download_file "CHANGELOG.md" "CHANGELOG.md"
  download_file "VERSION"      "VERSION"

  # ── Commands (new in v17) ───────────────────────────────────────────────
  log_info "New commands (v17)..."
  local new_commands=(
    "challenge" "genius-playground" "genius-switch-engine" "genius-dashboard"
  )
  for cmd in "${new_commands[@]}"; do
    download_file ".claude/commands/$cmd.md" ".claude/commands/$cmd.md"
  done

  # ── All 38 skills (updated + 17 new) ────────────────────────────────────
  log_info "Skills (38 total — 17 new + 21 updated)..."
  local all_skills=(
    "genius-team"
    "genius-start" "genius-dev" "genius-reviewer" "genius-debugger"
    "genius-architect" "genius-designer" "genius-qa" "genius-qa-micro"
    "genius-security" "genius-deployer" "genius-copywriter" "genius-marketer"
    "genius-product-market-analyst" "genius-interviewer" "genius-specs"
    "genius-test-assistant" "genius-orchestrator" "genius-dual-engine"
    "genius-omni-router" "genius-integration-guide" "genius-onboarding"
    "genius-updater" "genius-team-optimizer" "genius-memory"
    "genius-code-review"
    "genius-dev-frontend" "genius-dev-backend" "genius-dev-mobile"
    "genius-dev-database" "genius-dev-api"
    "genius-skill-creator" "genius-experiments"
    "genius-seo" "genius-crypto"
    "genius-analytics" "genius-performance" "genius-accessibility"
    "genius-i18n" "genius-docs" "genius-content" "genius-template"
    "genius-playground-generator"
  )
  for skill in "${all_skills[@]}"; do
    download_file "${CLAUDE_SKILL_DIR}/$skill/SKILL.md" "${CLAUDE_SKILL_DIR}/$skill/SKILL.md"
  done

  # ── New scripts (v17) ───────────────────────────────────────────────────
  log_info "New scripts (v17)..."
  local new_scripts=("switch-engine.sh" "update-dual-bridge.sh" "generate-playground.sh")
  for s in "${new_scripts[@]}"; do
    download_file "scripts/$s" "scripts/$s"
  done
  [ "$DRY_RUN" = false ] && chmod +x scripts/*.sh 2>/dev/null || true

  # ── New playground templates (v17) ──────────────────────────────────────
  log_info "New playground templates (v17: +7)..."
  local new_playgrounds=(
    "seo-dashboard" "crypto-analyzer" "analytics-wizard"
    "performance-monitor" "accessibility-checker" "experiments-tracker"
    "code-review-reporter" "project-dashboard-example"
  )
  for pg in "${new_playgrounds[@]}"; do
    download_file "playgrounds/templates/$pg.html" "playgrounds/templates/$pg.html"
  done

  # ── Dual-bridge template ────────────────────────────────────────────────
  log_info "Dual-bridge template..."
  download_file "templates/dual-bridge.json" "templates/dual-bridge.json"

  # ── Mode configs (settings + CLAUDE.md) ─────────────────────────────────
  log_info "Mode configs (v17)..."
  local modes=("cli" "ide" "omni" "dual")
  for mode in "${modes[@]}"; do
    download_file "configs/$mode/settings.json" "configs/$mode/settings.json"
    download_file "configs/$mode/CLAUDE.md"     "configs/$mode/CLAUDE.md"
  done

  # ── Update state.json version ────────────────────────────────────────────
  if [ "$DRY_RUN" = false ] && [ -f ".genius/state.json" ]; then
    sed -i.tmp 's/"version"[[:space:]]*:[[:space:]]*"[^"]*"/"version": "18.0.0"/' .genius/state.json
    rm -f .genius/state.json.tmp
  fi

  log_success "v17.0.0 upgrade complete — 42 skills, 7 new playgrounds, /challenge, engine-switch"
}

upgrade_to_v19() {
  upgrade_to_v18

  # ── v19 extras ─────────────────────────────────────────────────────────────
  log_info "v19: Claude Channels, Voice, 1M context, subagent fix..."

  # ── Re-download core files (v19 refs + subagent fix) ──────────────────────
  download_file "CLAUDE.md"       "CLAUDE.md"
  download_file "TOOLS.md"        "TOOLS.md"
  download_file "CHANGELOG.md"    "CHANGELOG.md"
  download_file "README.md"       "README.md"
  download_file "VERSION"         "VERSION"

  # ── Updated configs (subagent_type fix + version bump) ────────────────────
  for mode in cli ide omni dual; do
    download_file "configs/$mode/settings.json" "configs/$mode/settings.json"
    download_file "configs/$mode/CLAUDE.md"     "configs/$mode/CLAUDE.md"
  done

  # ── Update genius-upgrade command ─────────────────────────────────────────
  download_file ".claude/commands/genius-upgrade.md" ".claude/commands/genius-upgrade.md"

  # ── Update state.json version ────────────────────────────────────────────
  if [ "$DRY_RUN" = false ] && [ -f ".genius/state.json" ]; then
    sed -i.tmp 's/"version"[[:space:]]*:[[:space:]]*"[^"]*"/"version": "19.0.0"/' .genius/state.json
    rm -f .genius/state.json.tmp
  fi

  log_success "v19.0.0 upgrade complete — Claude Channels, Voice, 1M context, subagent fix"
}

upgrade_to_v20() {
  upgrade_to_v19

  # ── v20 extras ─────────────────────────────────────────────────────────────
  log_info "v20: Auto Mode, Computer Use, Bare Mode CI, Scheduler..."

  # ── Re-download core files (v20 refs) ──────────────────────────────────────
  download_file "CLAUDE.md"       "CLAUDE.md"
  download_file "TOOLS.md"        "TOOLS.md"
  download_file "CHANGELOG.md"    "CHANGELOG.md"
  download_file "README.md"       "README.md"
  download_file "VERSION"         "VERSION"
  download_file "GENIUS_GUARD.md" "GENIUS_GUARD.md"

  # ── New skills (v20: +4) ───────────────────────────────────────────────────
  log_info "New skills (v20: genius-auto, genius-ui-tester, genius-scheduler, genius-ci)..."
  local new_skills_v20=("genius-auto" "genius-ui-tester" "genius-scheduler" "genius-ci")
  for skill in "${new_skills_v20[@]}"; do
    download_file "${CLAUDE_SKILL_DIR}/$skill/SKILL.md" "${CLAUDE_SKILL_DIR}/$skill/SKILL.md"
  done

  # ── Updated configs (auto mode + conditional hooks) ─────────────────────────
  log_info "v20 config updates (auto mode, conditional hooks, 2.1.86)..."
  for mode in cli ide omni dual; do
    download_file "configs/$mode/settings.json" "configs/$mode/settings.json"
    download_file "configs/$mode/CLAUDE.md"     "configs/$mode/CLAUDE.md"
  done

  # ── Update genius-upgrade command ──────────────────────────────────────────
  download_file ".claude/commands/genius-upgrade.md" ".claude/commands/genius-upgrade.md"

  # ── Update state.json version ──────────────────────────────────────────────
  if [ "$DRY_RUN" = false ] && [ -f ".genius/state.json" ]; then
    sed -i.tmp 's/"version"[[:space:]]*:[[:space:]]*"[^"]*"/"version": "20.0.0"/' .genius/state.json
    rm -f .genius/state.json.tmp
  fi

  log_success "v20.0.0 upgrade complete — Auto Mode, Computer Use, CI pipelines, Scheduler (47 skills)"
}

upgrade_to_v21() {
  upgrade_to_v20

  # ── v21 extras ─────────────────────────────────────────────────────────────
  log_info "v21: Mode System, Workflow Registry, Validators, Session Recovery..."

  # ── Re-download core files (v21 refs) ──────────────────────────────────────
  download_file "CLAUDE.md"       "CLAUDE.md"
  download_file "CHANGELOG.md"    "CHANGELOG.md"
  download_file "README.md"       "README.md"
  download_file "VERSION"         "VERSION"
  download_file "AGENTS.md"       "AGENTS.md"
  download_file "SECURITY.md"     "SECURITY.md"

  # ── New mode configs ───────────────────────────────────────────────────────
  log_info "Mode configs (v21: beginner/builder/pro/agency)..."
  for mode_file in beginner builder pro agency; do
    download_file "configs/modes/$mode_file.md" "configs/modes/$mode_file.md"
  done

  # ── Workflow registry ──────────────────────────────────────────────────────
  download_file ".genius/workflows.json" ".genius/workflows.json"

  # ── New scripts (v21) ─────────────────────────────────────────────────────
  log_info "New scripts (v21: validators, migration, session recovery)..."
  local new_scripts_v21=(
    "migrate-state.sh" "validate-brief.sh" "validate-spec.sh"
    "validate-architecture.sh" "validate-plan.sh"
    "session-recover.sh" "check-playground-freshness.sh"
  )
  for s in "${new_scripts_v21[@]}"; do
    download_file "scripts/$s" "scripts/$s"
  done
  [ "$DRY_RUN" = false ] && chmod +x scripts/*.sh 2>/dev/null || true

  # ── New guard skills (v21: +3) ────────────────────────────────────────────
  log_info "New guard skills (v21: pre-planning, pre-coding, pre-deploy)..."
  local guard_skills=("genius-guard-pre-planning" "genius-guard-pre-coding" "genius-guard-pre-deploy")
  for skill in "${guard_skills[@]}"; do
    download_file "${CLAUDE_SKILL_DIR}/$skill/SKILL.md" "${CLAUDE_SKILL_DIR}/$skill/SKILL.md"
  done

  # ── New commands (v21) ─────────────────────────────────────────────────────
  log_info "New commands (v21: genius-mode, genius-import)..."
  download_file ".claude/commands/genius-mode.md" ".claude/commands/genius-mode.md"
  download_file ".claude/commands/genius-import.md" ".claude/commands/genius-import.md"

  # ── Updated configs (v21 version + session logging) ────────────────────────
  log_info "v21 config updates (session logging, post-compaction, version)..."
  for mode in cli ide omni dual; do
    download_file "configs/$mode/settings.json" "configs/$mode/settings.json"
    download_file "configs/$mode/CLAUDE.md"     "configs/$mode/CLAUDE.md"
  done

  # ── Updated skills (router + tips) ────────────────────────────────────────
  download_file "${CLAUDE_SKILL_DIR}/genius-team/SKILL.md" "${CLAUDE_SKILL_DIR}/genius-team/SKILL.md"
  download_file "${CLAUDE_SKILL_DIR}/genius-tips/SKILL.md" "${CLAUDE_SKILL_DIR}/genius-tips/SKILL.md"

  # ── GitHub templates ───────────────────────────────────────────────────────
  download_file ".github/ISSUE_TEMPLATE/bug.md" ".github/ISSUE_TEMPLATE/bug.md"
  download_file ".github/ISSUE_TEMPLATE/feature.md" ".github/ISSUE_TEMPLATE/feature.md"

  # ── Initialize mode.json if not present ────────────────────────────────────
  if [ "$DRY_RUN" = false ] && [ ! -f ".genius/mode.json" ]; then
    cat > .genius/mode.json << 'MODEJSON'
{
  "mode": "builder",
  "set_at": "2026-03-29T00:00:00Z",
  "set_by": "default"
}
MODEJSON
  fi

  # ── Run state migration ────────────────────────────────────────────────────
  if [ "$DRY_RUN" = false ] && [ -f "scripts/migrate-state.sh" ]; then
    bash scripts/migrate-state.sh 2>/dev/null || true
  fi

  # ── Update state.json version ──────────────────────────────────────────────
  if [ "$DRY_RUN" = false ] && [ -f ".genius/state.json" ]; then
    sed -i.tmp 's/"version"[[:space:]]*:[[:space:]]*"[^"]*"/"version": "21.0.0"/' .genius/state.json
    rm -f .genius/state.json.tmp
  fi

  log_success "v21.0.0 upgrade complete — Mode System, Workflow Registry, Validators, Session Recovery (51 skills)"
}

upgrade_to_v18() {
  upgrade_to_v17

  # ── v18 extras ─────────────────────────────────────────────────────────────
  log_info "v18 autoresearch + quality files..."
  download_file "scripts/validate-skills.sh"                "scripts/validate-skills.sh"
  download_file "playgrounds/templates/design-tokens.css"   "playgrounds/templates/design-tokens.css"

  # ── Re-download configs (anti-drift + PostCompact fix) ─────────────────────
  log_info "v18 config updates (session durability fixes)..."
  for mode in cli ide omni dual; do
    download_file "configs/$mode/settings.json" "configs/$mode/settings.json"
    download_file "configs/$mode/CLAUDE.md"     "configs/$mode/CLAUDE.md"
  done

  # ── Re-download core files (v18 refs) ─────────────────────────────────────
  download_file "CLAUDE.md"       "CLAUDE.md"
  download_file "GENIUS_GUARD.md" "GENIUS_GUARD.md"
  download_file "CHANGELOG.md"    "CHANGELOG.md"
  download_file "README.md"       "README.md"
  download_file "VERSION"         "VERSION"

  # ── Update state.json version ────────────────────────────────────────────
  if [ "$DRY_RUN" = false ] && [ -f ".genius/state.json" ]; then
    sed -i.tmp 's/"version"[[:space:]]*:[[:space:]]*"[^"]*"/"version": "18.0.0"/' .genius/state.json
    rm -f .genius/state.json.tmp
  fi

  log_success "v18.0.0 upgrade complete — 42 skills, 90% routing accuracy, -30KB context"
}

upgrade_to_v15() {
  upgrade_to_v14
  # ── Core ──────────────────────────────────────────────────────────────────
  log_info "Core files..."
  download_file "CLAUDE.md"       "CLAUDE.md"
  download_file "GENIUS_GUARD.md" "GENIUS_GUARD.md"
  download_file "README.md"       "README.md"
  download_file "CHANGELOG.md"    "CHANGELOG.md"
  download_file ".gitignore"      ".gitignore"

  # ── .claude/settings.json ─────────────────────────────────────────────────
  log_info "Claude settings..."
  download_file ".claude/settings.json" ".claude/settings.json"

  # ── Commands ──────────────────────────────────────────────────────────────
  log_info "Commands..."
  local commands=(
    "genius-start" "status" "continue" "reset" "save-tokens"
    "dual-status" "dual-challenge" "omni-status"
    "hydrate-tasks" "update-check"
    "guard-check" "guard-recover"
    "memory-add" "memory-search" "memory-status" "memory-recover" "memory-forget"
  )
  for cmd in "${commands[@]}"; do
    download_file ".claude/commands/$cmd.md" ".claude/commands/$cmd.md"
  done

  # ── Agents ────────────────────────────────────────────────────────────────
  log_info "Agents..."
  local agents=(
    "genius-dev" "genius-reviewer" "genius-debugger"
    "genius-challenger" "genius-qa-micro"
  )
  for agent in "${agents[@]}"; do
    download_file ".claude/agents/$agent.md" ".claude/agents/$agent.md"
  done

  # ── Skills ────────────────────────────────────────────────────────────────
  log_info "Skills (core set)..."
  local skills=(
    "genius-team"
    "genius-start"
    "genius-dev"
    "genius-reviewer"
    "genius-debugger"
    "genius-architect"
    "genius-designer"
    "genius-qa"
    "genius-qa-micro"
    "genius-security"
    "genius-deployer"
    "genius-copywriter"
    "genius-marketer"
    "genius-product-market-analyst"
    "genius-interviewer"
    "genius-specs"
    "genius-test-assistant"
    "genius-orchestrator"
    "genius-dual-engine"
    "genius-omni-router"
    "genius-integration-guide"
    "genius-onboarding"
    "genius-updater"
    "genius-team-optimizer"
    "genius-memory"
  )
  for skill in "${skills[@]}"; do
    download_file "${CLAUDE_SKILL_DIR}/$skill/SKILL.md" "${CLAUDE_SKILL_DIR}/$skill/SKILL.md"
  done

  # ── Scripts ───────────────────────────────────────────────────────────────
  log_info "Scripts..."
  local scripts=(
    "setup.sh" "create.sh" "add.sh" "upgrade.sh" "verify.sh"
    "guard-validate.sh"
    "memory-capture.sh" "memory-rollup.sh" "memory-briefing.sh"
    "memory-recover.sh" "memory-extract.sh"
    "genius-server.js" "start-genius.sh"
  )
  for s in "${scripts[@]}"; do
    download_file "scripts/$s" "scripts/$s"
  done
  [ "$DRY_RUN" = false ] && chmod +x scripts/*.sh 2>/dev/null || true

  # ── Playgrounds ───────────────────────────────────────────────────────────
  log_info "Playgrounds (13 + dashboard)..."
  local playgrounds=(
    "architecture-explorer" "copy-ab-tester" "deploy-checklist"
    "design-system-builder" "gtm-simulator" "market-simulator"
    "progress-dashboard" "project-canvas" "project-dashboard"
    "risk-matrix" "stack-configurator" "test-coverage-map"
    "user-journey-builder"
  )
  for pg in "${playgrounds[@]}"; do
    download_file "playgrounds/templates/$pg.html" "playgrounds/templates/$pg.html"
  done
  download_file "playgrounds/genius-dashboard.html" "playgrounds/genius-dashboard.html"
  download_file "playgrounds/data/projects.json"    "playgrounds/data/projects.json" false

  # ── Configs ───────────────────────────────────────────────────────────────
  log_info "Configs..."
  download_file ".genius/config.json"      ".genius/config.json"
  download_file "configs/skills.json"      "configs/skills.json"
  download_file "configs/phases.json"      "configs/phases.json"
  download_file "configs/commands.json"    "configs/commands.json"
  download_file "configs/checkpoints.json" "configs/checkpoints.json"

  # ── Directories ───────────────────────────────────────────────────────────
  [ "$DRY_RUN" = false ] && {
    mkdir -p .genius/outputs
    mkdir -p .genius/memory/events
    mkdir -p .genius/memory/summaries
    mkdir -p .genius/memory/archive
    mkdir -p .genius/memory/retros
    mkdir -p .genius/backups
    mkdir -p playgrounds/templates
    mkdir -p playgrounds/data
  }

  # ── Update state.json ─────────────────────────────────────────────────────
  if [ "$DRY_RUN" = false ]; then
    if [ -f ".genius/state.json" ]; then
      cp .genius/state.json .genius/state.json.bak
      sed -i.tmp 's/"version"[[:space:]]*:[[:space:]]*"[^"]*"/"version": "16.0.0"/' .genius/state.json
      rm -f .genius/state.json.tmp
    else
      cat > .genius/state.json << 'STATEJSON'
{
  "version": "16.0.0",
  "phase": "NOT_STARTED",
  "currentSkill": null,
  "skillHistory": [],
  "checkpoints": {
    "interview": false,
    "market_analysis": false,
    "specs_approved": false,
    "design_chosen": false,
    "architecture_approved": false,
    "execution_started": false,
    "qa_passed": false,
    "security_passed": false,
    "deployed": false
  },
  "tasks": { "total": 0, "completed": 0, "failed": 0 },
  "artifacts": {}
}
STATEJSON
    fi
  fi
}

#═══════════════════════════════════════════════════════════════════════════════
# Summary
#═══════════════════════════════════════════════════════════════════════════════

print_summary() {
  local from=$1 backup=$2
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║${NC}  ${BOLD}Upgrade Complete! v$from → v21.0${NC}                        ${GREEN}║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Files downloaded:${NC} $FILES_DOWNLOADED"
  echo -e "  ${BOLD}Files skipped:${NC}    $FILES_SKIPPED (already present, not overwritten)"
  echo -e "  ${BOLD}Backup:${NC}           $backup"
  echo ""
  echo -e "${CYAN}New in v21.0:${NC}"
  echo "  • Mode System — beginner/builder/pro/agency (/genius-mode)"
  echo "  • Workflow Registry — .genius/workflows.json (full dependency graph)"
  echo "  • Project Import — /genius-import (auto-detect artifacts)"
  echo "  • Session Recovery — session-log.jsonl + session-recover.sh"
  echo "  • Pre-transition Guards — 3 micro-checklist skills"
  echo "  • Non-blocking Validators — mode-aware + origin-aware"
  echo "  • 51 skills total"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  1. Run ${BOLD}/genius-start${NC} to re-initialize with v20 features"
  echo "  2. Open the dashboard: ${BOLD}open .genius/DASHBOARD.html${NC}"
  echo "  3. See ${BOLD}CHANGELOG.md${NC} for full details"
  echo ""
}

print_dry_run_summary() {
  local from=$1
  echo ""
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║${NC}  ${BOLD}Dry Run — v$from → v21.0${NC}                                ${YELLOW}║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Files that would be downloaded:${NC} $FILES_DOWNLOADED"
  echo ""
  echo -e "Run without ${CYAN}--dry-run${NC} to perform the actual upgrade."
  echo ""
}

#═══════════════════════════════════════════════════════════════════════════════
# Main
#═══════════════════════════════════════════════════════════════════════════════

main() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --force)    FORCE=true;    shift ;;
      --dry-run)  DRY_RUN=true;  shift ;;
      --verbose)  VERBOSE=true;  shift ;;
      --help|-h)  show_usage; exit 0 ;;
      *) log_error "Unknown option: $1"; show_usage; exit 1 ;;
    esac
  done

  print_banner

  # ── Step 1: Detect version ─────────────────────────────────────────────────
  log_step 1 5 "Detecting current version..."
  CURRENT_VERSION=$(detect_version)
  echo -e "   Detected: ${BOLD}v$CURRENT_VERSION${NC} → Target: ${BOLD}v$TARGET_VERSION${NC}"

  if ! version_lt "$CURRENT_VERSION" "$TARGET_VERSION"; then
    log_success "Already at v$CURRENT_VERSION — nothing to do."
    echo ""
    echo "Your Genius Team is up to date! 🎉"
    echo "To force a re-download of all files: $0 --force"
    exit 0
  fi

  # ── Step 2: Prerequisites ──────────────────────────────────────────────────
  log_step 2 5 "Checking prerequisites..."
  if ! check_prerequisites; then
    echo ""
    log_error "Fix the issues above and try again."
    exit 1
  fi
  log_success "All checks passed"

  # ── Step 3: Backup ─────────────────────────────────────────────────────────
  log_step 3 5 "Creating backup..."
  BACKUP_DIR=$(create_backup)
  [ "$DRY_RUN" = false ] && log_success "Backup: $BACKUP_DIR"

  # ── Step 4: Download ───────────────────────────────────────────────────────
  log_step 4 5 "Downloading v21.0 files..."
  upgrade_to_v21
  log_success "$FILES_DOWNLOADED files downloaded"

  # ── Step 5: Verify ─────────────────────────────────────────────────────────
  log_step 5 5 "Verifying..."
  if [ "$DRY_RUN" = false ] && [ -x "scripts/verify.sh" ]; then
    ./scripts/verify.sh --quiet 2>/dev/null && log_success "Verification passed" || log_warning "Minor issues found (non-critical)"
  else
    log_success "Done"
  fi

  # ── Summary ────────────────────────────────────────────────────────────────
  if [ "$DRY_RUN" = true ]; then
    print_dry_run_summary "$CURRENT_VERSION"
  else
    print_summary "$CURRENT_VERSION" "$BACKUP_DIR"
  fi
}

main "$@"
