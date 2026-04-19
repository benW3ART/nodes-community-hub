#!/usr/bin/env bash
# check-playground-freshness.sh — Check if playgrounds are up-to-date with skill outputs
set -euo pipefail

STALE=0

check_freshness() {
  local artifact="$1"
  local playground="$2"
  local skill="$3"

  if [ -f "$artifact" ] && [ ! -f "$playground" ]; then
    echo "STALE: $skill output exists ($artifact) but playground missing ($playground)"
    STALE=$((STALE + 1))
  elif [ -f "$artifact" ] && [ -f "$playground" ]; then
    # Check if artifact is newer than playground
    if [ "$artifact" -nt "$playground" ]; then
      echo "STALE: $skill playground is older than its artifact"
      STALE=$((STALE + 1))
    fi
  fi
}

# Check each skill's playground freshness
check_freshness ".genius/discovery/SPECIFICATIONS.xml" ".genius/outputs/specs-playground.html" "genius-specs"
check_freshness ".genius/discovery/DESIGN-SYSTEM.html" ".genius/outputs/design-playground.html" "genius-designer"
check_freshness "ARCHITECTURE.md" ".genius/outputs/architecture-playground.html" "genius-architect"
check_freshness ".genius/discovery/MARKETING-STRATEGY.xml" ".genius/outputs/marketing-playground.html" "genius-marketer"

if [ "$STALE" -gt 0 ]; then
  echo ""
  echo "$STALE playground(s) need refreshing. Run /genius-dashboard to update."
  exit 1
fi

echo "All playgrounds are fresh."
exit 0
