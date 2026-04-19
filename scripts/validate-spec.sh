#!/usr/bin/env bash
# validate-spec.sh — Check SPECIFICATIONS.xml has required sections
set -euo pipefail

FILE="${1:-SPECIFICATIONS.xml}"
[ -f "$FILE" ] || FILE=".genius/discovery/SPECIFICATIONS.xml"

ORIGIN=$(jq -r '.origin // "native"' .genius/state.json 2>/dev/null || echo "native")
MODE=$(jq -r '.mode // "builder"' .genius/mode.json 2>/dev/null || echo "builder")
ERRORS=0

if [ ! -f "$FILE" ]; then
  echo "WARN: $FILE not found"
  [ "$ORIGIN" = "native" ] && [ "$MODE" != "pro" ] && exit 1
  exit 0
fi

for section in "features" "user-stories" "requirements" "scope"; do
  if ! grep -qi "$section" "$FILE" 2>/dev/null; then
    echo "WARN: Missing section: $section in $FILE"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "Spec validation: $ERRORS issues found"
  [ "$ORIGIN" = "native" ] && [ "$MODE" = "beginner" ] && exit 1
  [ "$ORIGIN" = "native" ] && [ "$MODE" = "builder" ] && exit 1
  exit 0
fi

echo "Spec validation: PASS"
exit 0
