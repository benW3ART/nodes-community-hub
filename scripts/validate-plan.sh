#!/usr/bin/env bash
# validate-plan.sh — Check .claude/plan.md has tasks
set -euo pipefail

FILE="${1:-.claude/plan.md}"
ORIGIN=$(jq -r '.origin // "native"' .genius/state.json 2>/dev/null || echo "native")
MODE=$(jq -r '.mode // "builder"' .genius/mode.json 2>/dev/null || echo "builder")

if [ ! -f "$FILE" ]; then
  echo "WARN: $FILE not found"
  [ "$ORIGIN" = "native" ] && [ "$MODE" != "pro" ] && exit 1
  exit 0
fi

TOTAL=$(grep -c "^- \[" "$FILE" 2>/dev/null || echo 0)
if [ "$TOTAL" -eq 0 ]; then
  echo "WARN: No tasks found in $FILE"
  [ "$ORIGIN" = "native" ] && [ "$MODE" = "beginner" ] && exit 1
  [ "$ORIGIN" = "native" ] && [ "$MODE" = "builder" ] && exit 1
  exit 0
fi

echo "Plan validation: PASS ($TOTAL tasks)"
exit 0
