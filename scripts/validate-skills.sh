#!/usr/bin/env bash
# validate-skills.sh — Check all skills have required sections
# Part of Genius Team autoresearch quality framework

set -euo pipefail

SKILLS_DIR=".claude/skills"
ERRORS=0
WARNINGS=0

echo "🔍 Validating Genius Team skills..."
echo ""

for skill_dir in "$SKILLS_DIR"/*/; do
  skill=$(basename "$skill_dir")
  file="$skill_dir/SKILL.md"
  
  if [ ! -f "$file" ]; then
    echo "❌ $skill: SKILL.md missing"
    ((ERRORS++))
    continue
  fi
  
  size=$(wc -c < "$file")
  
  # Check frontmatter
  if ! head -1 "$file" | grep -q "^---"; then
    echo "❌ $skill: missing frontmatter"
    ((ERRORS++))
  fi
  
  # Check description with negative triggers
  if ! grep -q "Do NOT use" "$file" 2>/dev/null; then
    echo "⚠️  $skill: no negative triggers (Do NOT use)"
    ((WARNINGS++))
  fi
  
  # Check Definition of Done
  if ! grep -q "Definition of Done" "$file" 2>/dev/null; then
    echo "⚠️  $skill: missing Definition of Done"
    ((WARNINGS++))
  fi
  
  # Check Handoff section (for skills that route)
  if ! grep -q "Handoff\|Next Step" "$file" 2>/dev/null; then
    echo "⚠️  $skill: no Handoff or Next Step section"
    ((WARNINGS++))
  fi
  
  # Check size (warn if over 10KB)
  if [ "$size" -gt 10000 ]; then
    echo "⚠️  $skill: ${size}B (over 10KB limit)"
    ((WARNINGS++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: $ERRORS errors, $WARNINGS warnings"
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ FAIL"
  exit 1
else
  echo "✅ PASS (with $WARNINGS warnings)"
  exit 0
fi
