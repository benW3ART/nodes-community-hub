#!/usr/bin/env bash
# scripts/update-dual-bridge.sh
# Called by hooks after each dev action to update the dual-bridge.json
# Usage: bash scripts/update-dual-bridge.sh [claude|codex] "task description"

set -euo pipefail

ENGINE="${1:-claude}"
TASK="${2:-unknown task}"
BRIDGE_FILE=".genius/dual-bridge.json"

# Ensure .genius/ exists
mkdir -p .genius

# Initialize bridge if not exists
if [ ! -f "$BRIDGE_FILE" ]; then
  cat > "$BRIDGE_FILE" << 'BRIDGE_EOF'
{
  "schema": "genius-dual-bridge/v1",
  "claude": {"engine":"claude","last_task":null,"last_files_modified":[],"last_diff":null,"last_summary":null,"timestamp":null},
  "codex":  {"engine":"codex", "last_task":null,"last_files_modified":[],"last_diff":null,"last_summary":null,"timestamp":null},
  "challenge_log": [],
  "last_updated": null
}
BRIDGE_EOF
fi

# Get recent diff (last uncommitted changes or last commit)
DIFF=""
if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
  # No uncommitted changes — get last commit diff
  DIFF=$(git diff HEAD~1 HEAD --unified=3 2>/dev/null | head -200 || echo "")
else
  DIFF=$(git diff HEAD --unified=3 2>/dev/null | head -200 || echo "")
fi

# Get modified files
FILES=$(git diff --name-only HEAD 2>/dev/null | tr '\n' ',' | sed 's/,$//' || echo "")
if [ -z "$FILES" ]; then
  FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | tr '\n' ',' | sed 's/,$//' || echo "")
fi

TIMESTAMP=$(date -Iseconds 2>/dev/null || date)

# Update bridge
if command -v jq &>/dev/null; then
  jq --arg engine "$ENGINE" \
     --arg task "$TASK" \
     --arg diff "$DIFF" \
     --arg files "$FILES" \
     --arg ts "$TIMESTAMP" \
     '.[$engine].last_task = $task |
      .[$engine].last_diff = $diff |
      .[$engine].last_files_modified = ($files | split(",") | map(select(length > 0))) |
      .[$engine].timestamp = $ts |
      .last_updated = $ts' \
     "$BRIDGE_FILE" > "$BRIDGE_FILE.tmp" && mv "$BRIDGE_FILE.tmp" "$BRIDGE_FILE"
fi
