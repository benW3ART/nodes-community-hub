#!/bin/bash
# Genius Team v9.0 — Verification Script
# Verify that the environment is properly set up

echo "🔍 Genius Team v9.0 — Environment Verification"
echo "═══════════════════════════════════════════════════════════════"
echo ""

ERRORS=0
WARNINGS=0

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

check_dir() {
  if [ -d "$1" ]; then
    echo -e "  ${GREEN}✓${NC} $1"
  else
    echo -e "  ${RED}✗${NC} $1 (missing)"
    ERRORS=$((ERRORS + 1))
  fi
}

check_file() {
  if [ -f "$1" ]; then
    echo -e "  ${GREEN}✓${NC} $1"
  else
    echo -e "  ${RED}✗${NC} $1 (missing)"
    ERRORS=$((ERRORS + 1))
  fi
}

check_file_optional() {
  if [ -f "$1" ]; then
    echo -e "  ${GREEN}✓${NC} $1"
  else
    echo -e "  ${YELLOW}○${NC} $1 (optional)"
    WARNINGS=$((WARNINGS + 1))
  fi
}

check_json() {
  if [ -f "$1" ]; then
    if jq . "$1" > /dev/null 2>&1; then
      echo -e "  ${GREEN}✓${NC} $1 (valid JSON)"
    else
      echo -e "  ${RED}✗${NC} $1 (invalid JSON)"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo -e "  ${RED}✗${NC} $1 (missing)"
    ERRORS=$((ERRORS + 1))
  fi
}

# ═══════════════════════════════════════════════════════════════
# 0. Detect Engine Type
# ═══════════════════════════════════════════════════════════════
ENGINE="claude"  # default
if [ -f ".genius/config.json" ]; then
  ENGINE=$(jq -r '.engine // "claude"' .genius/config.json 2>/dev/null)
fi
echo "🔧 Engine: $ENGINE"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. Project Structure
# ═══════════════════════════════════════════════════════════════
echo "📁 Checking project structure..."

# Engine-specific checks
if [ "$ENGINE" = "claude" ] || [ "$ENGINE" = "dual" ]; then
  check_file "CLAUDE.md"
  check_dir ".claude"
  check_file ".claude/settings.json"
  check_dir ".claude/commands"
  check_dir ".claude/agents"
  check_dir ".claude/skills"
fi

if [ "$ENGINE" = "codex" ] || [ "$ENGINE" = "dual" ]; then
  check_file "AGENTS.md"
  check_dir ".agents"
  check_dir ".agents/skills"
fi

# Common directories
check_dir ".genius"
check_dir ".genius/memory"
check_dir ".genius/memory/session-logs"
check_dir "scripts"
check_dir "docs"

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. Core Config Files
# ═══════════════════════════════════════════════════════════════
echo "⚙️  Checking configuration..."

check_json ".claude/settings.json"
check_json ".genius/config.json"
check_json ".genius/state.json"

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. Memory System
# ═══════════════════════════════════════════════════════════════
echo "🧠 Checking memory system..."

check_json ".genius/memory/decisions.json"
check_json ".genius/memory/patterns.json"
check_json ".genius/memory/progress.json"
check_json ".genius/memory/errors.json"
check_file ".genius/memory/BRIEFING.md"
check_file "scripts/memory-briefing.sh"
check_file "scripts/memory-extract.sh"

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. Skills (21 expected)
# ═══════════════════════════════════════════════════════════════
echo "🎯 Checking skills..."

SKILLS=(
  "genius-team"
  "genius-interviewer"
  "genius-product-market-analyst"
  "genius-specs"
  "genius-designer"
  "genius-marketer"
  "genius-copywriter"
  "genius-integration-guide"
  "genius-architect"
  "genius-orchestrator"
  "genius-dev"
  "genius-qa"
  "genius-qa-micro"
  "genius-debugger"
  "genius-reviewer"
  "genius-security"
  "genius-deployer"
  "genius-memory"
  "genius-onboarding"
  "genius-test-assistant"
  "genius-team-optimizer"
)

# Determine skills directory based on engine
if [ "$ENGINE" = "codex" ]; then
  SKILLS_DIR=".agents/skills"
else
  SKILLS_DIR=".claude/skills"
fi

SKILL_COUNT=0
SKILL_MISSING=0
for skill in "${SKILLS[@]}"; do
  if [ -f "$SKILLS_DIR/$skill/SKILL.md" ]; then
    SKILL_COUNT=$((SKILL_COUNT + 1))
  else
    echo -e "  ${RED}✗${NC} $skill (missing)"
    SKILL_MISSING=$((SKILL_MISSING + 1))
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $SKILL_MISSING -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} All $SKILL_COUNT/${#SKILLS[@]} skills found"
else
  echo -e "  ${YELLOW}!${NC} $SKILL_COUNT/${#SKILLS[@]} skills found ($SKILL_MISSING missing)"
fi

# Check for new updater skill
if [ -f "$SKILLS_DIR/genius-updater/SKILL.md" ]; then
  echo -e "  ${GREEN}✓${NC} genius-updater (bonus skill)"
else
  echo -e "  ${YELLOW}○${NC} genius-updater (optional)"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 5. Commands (Claude Code only)
# ═══════════════════════════════════════════════════════════════
if [ "$ENGINE" = "claude" ] || [ "$ENGINE" = "dual" ]; then
  echo "⚡ Checking commands..."

  COMMANDS=("genius-start" "status" "continue" "reset" "hydrate-tasks" "save-tokens" "update-check")
  for cmd in "${COMMANDS[@]}"; do
    check_file ".claude/commands/$cmd.md"
  done

  echo ""
fi

# ═══════════════════════════════════════════════════════════════
# 6. Agents (Claude Code only)
# ═══════════════════════════════════════════════════════════════
if [ "$ENGINE" = "claude" ] || [ "$ENGINE" = "dual" ]; then
  echo "🤖 Checking agents..."

  AGENTS=("genius-dev" "genius-qa-micro" "genius-debugger" "genius-reviewer")
  for agent in "${AGENTS[@]}"; do
    check_file ".claude/agents/$agent.md"
  done

  echo ""
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 7. Scripts
# ═══════════════════════════════════════════════════════════════
echo "📜 Checking scripts..."

check_file "scripts/setup.sh"
check_file "scripts/verify.sh"
check_file "scripts/memory-briefing.sh"
check_file "scripts/memory-extract.sh"

echo ""

# ═══════════════════════════════════════════════════════════════
# 8. No Vibeship Remnants
# ═══════════════════════════════════════════════════════════════
echo "🧹 Checking for removed dependencies..."

if [ -f "scripts/setup-vibeship.sh" ]; then
  echo -e "  ${YELLOW}⚠${NC} setup-vibeship.sh still exists (should be removed)"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "  ${GREEN}✓${NC} No Vibeship setup script"
fi

if [ -f ".mcp.json" ]; then
  echo -e "  ${YELLOW}⚠${NC} .mcp.json exists (not needed in v9)"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "  ${GREEN}✓${NC} No .mcp.json"
fi

if [ -d ".mind" ]; then
  echo -e "  ${YELLOW}⚠${NC} .mind/ directory exists (v8 remnant, memory now in .genius/memory/)"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "  ${GREEN}✓${NC} No .mind/ directory"
fi

# Check for mind_recall in skills
MIND_REFS=$(grep -rl "mind_recall\|mind_log\|mind_search\|mind_remind" .claude/skills/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$MIND_REFS" -gt 0 ]; then
  echo -e "  ${RED}✗${NC} Found $MIND_REFS skills with Mind MCP references"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}✓${NC} No Mind MCP references in skills"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 9. Version Check
# ═══════════════════════════════════════════════════════════════
echo "📌 Checking version..."

if [ -f ".genius/config.json" ]; then
  VERSION=$(jq -r '.version' .genius/config.json 2>/dev/null || echo "unknown")
  echo -e "  ${GREEN}✓${NC} Genius Team version: $VERSION"
else
  echo -e "  ${RED}✗${NC} No config.json"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"

if [ $ERRORS -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Genius Team v9.0 is ready.${NC}"
    echo ""
    echo "Run /genius-start to begin."
  else
    echo -e "${YELLOW}⚠️ $WARNINGS warning(s), but ready to use.${NC}"
    echo ""
    echo "Genius Team v9.0 is functional. Warnings are non-blocking."
  fi
else
  echo -e "${RED}❌ $ERRORS error(s) found.${NC}"
  echo ""
  echo "Fix the errors above. Run: bash scripts/setup.sh"
  exit 1
fi

echo ""
