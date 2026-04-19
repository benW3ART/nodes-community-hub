#!/usr/bin/env bash
# validate-architecture.sh — Check ARCHITECTURE.md has required sections
set -euo pipefail

FILE="${1:-ARCHITECTURE.md}"
ORIGIN=$(jq -r '.origin // "native"' .genius/state.json 2>/dev/null || echo "native")
MODE=$(jq -r '.mode // "builder"' .genius/mode.json 2>/dev/null || echo "builder")
ERRORS=0

if [ ! -f "$FILE" ]; then
  echo "WARN: $FILE not found"
  [ "$ORIGIN" = "native" ] && [ "$MODE" != "pro" ] && exit 1
  exit 0
fi

for section in "Stack" "Database" "API" "Deployment"; do
  if ! grep -qi "$section" "$FILE" 2>/dev/null; then
    echo "WARN: Missing section: $section in $FILE"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "Architecture validation: $ERRORS issues found"
  [ "$ORIGIN" = "native" ] && [ "$MODE" = "beginner" ] && exit 1
  [ "$ORIGIN" = "native" ] && [ "$MODE" = "builder" ] && exit 1
  exit 0
fi

echo "Architecture validation: PASS"
exit 0
