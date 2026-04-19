#!/bin/bash
# Genius Team v9.0 — Extract memories from session context
# Called by PreCompact and Stop hooks
# Reads STDIN or arguments for context, extracts decisions/patterns/errors
# Then regenerates BRIEFING.md

set -euo pipefail

MEMORY_DIR=".genius/memory"
TIMESTAMP=$(date '+%Y-%m-%dT%H:%M:%S')
DATE_SHORT=$(date '+%Y-%m-%d-%H%M')

mkdir -p "$MEMORY_DIR/session-logs"

# ── Read context from STDIN or first argument ──
CONTEXT=""
if [ -n "${1:-}" ]; then
  CONTEXT="$1"
elif [ ! -t 0 ]; then
  CONTEXT=$(cat)
fi

# If no context provided, try to gather from project state
if [ -z "$CONTEXT" ]; then
  CONTEXT=""
  [ -f PROGRESS.md ] && CONTEXT="$CONTEXT\n$(cat PROGRESS.md)"
  [ -f .claude/plan.md ] && CONTEXT="$CONTEXT\n$(grep -E "^\- \[" .claude/plan.md 2>/dev/null || true)"
fi

if [ -z "$CONTEXT" ]; then
  echo "[memory-extract] No context available, skipping extraction"
  # Still regenerate briefing
  bash scripts/memory-briefing.sh 2>/dev/null || true
  exit 0
fi

# ── Save session log ──
SESSION_LOG="$MEMORY_DIR/session-logs/${DATE_SHORT}.md"
{
  echo "# Session Log — $TIMESTAMP"
  echo ""
  echo "$CONTEXT" | head -200
} > "$SESSION_LOG"

# ── Extract and append decisions ──
# Look for lines containing DECISION: or "we decided" or "decided to"
DECISIONS=$(echo "$CONTEXT" | grep -iE "(DECISION:|decided to|we decided|going with|chose to)" | head -5 || true)
if [ -n "$DECISIONS" ]; then
  while IFS= read -r line; do
    # Generate a simple ID
    ID="d-$(echo "$line" | md5sum 2>/dev/null | cut -c1-8 || echo "$RANDOM")"
    CLEAN=$(echo "$line" | sed 's/^[[:space:]]*//' | head -c 200)

    # Append to decisions.json if not duplicate
    if [ -f "$MEMORY_DIR/decisions.json" ]; then
      EXISTS=$(jq --arg d "$CLEAN" '[.[] | select(.decision == $d)] | length' "$MEMORY_DIR/decisions.json" 2>/dev/null || echo "0")
      if [ "$EXISTS" = "0" ]; then
        jq --arg id "$ID" --arg d "$CLEAN" --arg t "$TIMESTAMP" \
          '. + [{"id": $id, "decision": $d, "reason": "extracted from session", "timestamp": $t, "tags": ["auto-extracted"]}]' \
          "$MEMORY_DIR/decisions.json" > "$MEMORY_DIR/decisions.json.tmp" && \
          mv "$MEMORY_DIR/decisions.json.tmp" "$MEMORY_DIR/decisions.json"
      fi
    fi
  done <<< "$DECISIONS"
fi

# ── Extract and append errors ──
ERRORS=$(echo "$CONTEXT" | grep -iE "(ERROR:|FAIL:|BROKE:|BUG:|FIXED:)" | head -5 || true)
if [ -n "$ERRORS" ]; then
  while IFS= read -r line; do
    ID="e-$(echo "$line" | md5sum 2>/dev/null | cut -c1-8 || echo "$RANDOM")"
    CLEAN=$(echo "$line" | sed 's/^[[:space:]]*//' | head -c 200)

    if [ -f "$MEMORY_DIR/errors.json" ]; then
      EXISTS=$(jq --arg e "$CLEAN" '[.[] | select(.error == $e)] | length' "$MEMORY_DIR/errors.json" 2>/dev/null || echo "0")
      if [ "$EXISTS" = "0" ]; then
        jq --arg id "$ID" --arg e "$CLEAN" --arg t "$TIMESTAMP" \
          '. + [{"id": $id, "error": $e, "solution": "see session log", "timestamp": $t, "tags": ["auto-extracted"]}]' \
          "$MEMORY_DIR/errors.json" > "$MEMORY_DIR/errors.json.tmp" && \
          mv "$MEMORY_DIR/errors.json.tmp" "$MEMORY_DIR/errors.json"
      fi
    fi
  done <<< "$ERRORS"
fi

# ── Extract and append patterns ──
PATTERNS=$(echo "$CONTEXT" | grep -iE "(PATTERN:|CONVENTION:|ALWAYS:|NEVER:|RULE:)" | head -5 || true)
if [ -n "$PATTERNS" ]; then
  while IFS= read -r line; do
    ID="p-$(echo "$line" | md5sum 2>/dev/null | cut -c1-8 || echo "$RANDOM")"
    CLEAN=$(echo "$line" | sed 's/^[[:space:]]*//' | head -c 200)

    if [ -f "$MEMORY_DIR/patterns.json" ]; then
      EXISTS=$(jq --arg p "$CLEAN" '[.[] | select(.pattern == $p)] | length' "$MEMORY_DIR/patterns.json" 2>/dev/null || echo "0")
      if [ "$EXISTS" = "0" ]; then
        jq --arg id "$ID" --arg p "$CLEAN" --arg t "$TIMESTAMP" \
          '. + [{"id": $id, "pattern": $p, "context": "extracted from session", "timestamp": $t}]' \
          "$MEMORY_DIR/patterns.json" > "$MEMORY_DIR/patterns.json.tmp" && \
          mv "$MEMORY_DIR/patterns.json.tmp" "$MEMORY_DIR/patterns.json"
      fi
    fi
  done <<< "$PATTERNS"
fi

# ── Update progress from plan.md ──
if [ -f ".claude/plan.md" ]; then
  # Get completed tasks and add to progress
  grep "^- \[x\]" .claude/plan.md 2>/dev/null | head -10 | while IFS= read -r line; do
    TASK=$(echo "$line" | sed 's/^- \[x\] //')
    ID="t-$(echo "$TASK" | md5sum 2>/dev/null | cut -c1-8 || echo "$RANDOM")"

    EXISTS=$(jq --arg task "$TASK" '[.[] | select(.task == $task)] | length' "$MEMORY_DIR/progress.json" 2>/dev/null || echo "0")
    if [ "$EXISTS" = "0" ]; then
      jq --arg id "$ID" --arg task "$TASK" --arg t "$TIMESTAMP" \
        '. + [{"id": $id, "task": $task, "status": "completed", "timestamp": $t}]' \
        "$MEMORY_DIR/progress.json" > "$MEMORY_DIR/progress.json.tmp" && \
        mv "$MEMORY_DIR/progress.json.tmp" "$MEMORY_DIR/progress.json"
    fi
  done
fi

# ── Decay: remove progress older than 7 days ──
if [ -f "$MEMORY_DIR/progress.json" ]; then
  CUTOFF=$(date -v-7d '+%Y-%m-%d' 2>/dev/null || date -d '7 days ago' '+%Y-%m-%d' 2>/dev/null || echo "2000-01-01")
  jq --arg cutoff "$CUTOFF" '[.[] | select(.timestamp >= $cutoff)]' \
    "$MEMORY_DIR/progress.json" > "$MEMORY_DIR/progress.json.tmp" 2>/dev/null && \
    mv "$MEMORY_DIR/progress.json.tmp" "$MEMORY_DIR/progress.json" || true
fi

# ── Clean old session logs (retention: 30 days) ──
find "$MEMORY_DIR/session-logs" -name "*.md" -mtime +30 -delete 2>/dev/null || true

# ── Regenerate BRIEFING.md ──
bash scripts/memory-briefing.sh 2>/dev/null || true

echo "[memory-extract] Extraction complete. Session logged to $SESSION_LOG"
