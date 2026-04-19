#!/usr/bin/env bash
# session-recover.sh — Recover state from session-log.jsonl
set -euo pipefail

LOG=".genius/session-log.jsonl"
STATE=".genius/state.json"

if [ ! -f "$LOG" ]; then
  echo "No session log found at $LOG"
  echo "Falling back to state.json"
  [ -f "$STATE" ] && cat "$STATE" | jq '.phase, .currentSkill'
  exit 0
fi

echo "Recovering state from session log..."

# Get last known skill and phase from log
LAST_SKILL=$(tail -100 "$LOG" 2>/dev/null | jq -r 'select(.skill != null) | .skill' 2>/dev/null | tail -1 || echo "")
LAST_PHASE=$(tail -100 "$LOG" 2>/dev/null | jq -r 'select(.phase != null) | .phase' 2>/dev/null | tail -1 || echo "")
LAST_TOOL=$(tail -100 "$LOG" 2>/dev/null | jq -r 'select(.tool != null) | .tool' 2>/dev/null | tail -1 || echo "")

if [ -n "$LAST_SKILL" ] && [ -f "$STATE" ]; then
  # Update state.json with recovered info
  jq --arg s "$LAST_SKILL" --arg p "${LAST_PHASE:-IDEATION}" --arg now "$(date -Iseconds 2>/dev/null || date)" \
    '.currentSkill = $s | .phase = $p | .updated_at = $now' "$STATE" > "${STATE}.tmp" && mv "${STATE}.tmp" "$STATE"
  echo "Recovered: phase=$LAST_PHASE skill=$LAST_SKILL"
else
  echo "No recoverable state in session log"
  [ -f "$STATE" ] && echo "Using existing state.json"
fi

# Show summary
if [ -f "$STATE" ]; then
  echo ""
  echo "Current state:"
  jq -r '"  Phase: \(.phase)\n  Skill: \(.currentSkill // "none")\n  Tasks: \(.tasks.completed)/\(.tasks.total)"' "$STATE" 2>/dev/null || true
fi
