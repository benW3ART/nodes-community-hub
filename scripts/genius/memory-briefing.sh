#!/bin/bash
# Genius Team v9.0 — Generate BRIEFING.md from memory JSON files + events system
# Called by SessionStart hook and after memory-extract.sh
# Now supports: events/*.jsonl (new) + legacy JSON files (backwards compatible)

set -euo pipefail

MEMORY_DIR=".genius/memory"
EVENTS_DIR="$MEMORY_DIR/events"
BRIEFING="$MEMORY_DIR/BRIEFING.md"
STATE=".genius/state.json"
CONFIG=".genius/config.json"

# Helper: read JSON array length
json_len() {
  if [ -f "$1" ]; then
    jq 'length' "$1" 2>/dev/null || echo "0"
  else
    echo "0"
  fi
}

# Helper: safe jq read
safe_jq() {
  if [ -f "$1" ]; then
    jq -r "$2" "$1" 2>/dev/null || echo "$3"
  else
    echo "$3"
  fi
}

# Helper: read all events from JSONL files, output as JSON array
read_all_events() {
  if [ -d "$EVENTS_DIR" ] && ls "$EVENTS_DIR"/events-*.jsonl >/dev/null 2>&1; then
    cat "$EVENTS_DIR"/events-*.jsonl 2>/dev/null | jq -s '.' 2>/dev/null || echo "[]"
  else
    echo "[]"
  fi
}

# Helper: count events by type
count_events_by_type() {
  local events="$1"
  local type="$2"
  echo "$events" | jq "[.[] | select(.type == \"$type\")] | length" 2>/dev/null || echo "0"
}

# Helper: get events by type
get_events_by_type() {
  local events="$1"
  local type="$2"
  echo "$events" | jq "[.[] | select(.type == \"$type\")]" 2>/dev/null || echo "[]"
}

# Read all events once
ALL_EVENTS=$(read_all_events)
TOTAL_EVENTS=$(echo "$ALL_EVENTS" | jq 'length' 2>/dev/null || echo "0")

# Count by type
EVENTS_DECISIONS=$(count_events_by_type "$ALL_EVENTS" "decision")
EVENTS_MILESTONES=$(count_events_by_type "$ALL_EVENTS" "milestone")
EVENTS_ERRORS=$(count_events_by_type "$ALL_EVENTS" "error")

# Start building briefing
{
  echo "# Project Briefing"
  echo ""
  echo "> Auto-generated on $(date '+%Y-%m-%d %H:%M'). Do not edit manually."
  echo ""

  # ── Status ──
  echo "## Status"
  PHASE=$(safe_jq "$STATE" '.phase' 'NOT_STARTED')
  CURRENT_SKILL=$(safe_jq "$STATE" '.currentSkill // "none"' 'none')
  VERSION=$(safe_jq "$CONFIG" '.version' '9.0.0')
  SAVE_MODE=$(safe_jq "$CONFIG" '.models.saveTokenMode' 'false')
  echo "- **Version:** $VERSION"
  echo "- **Phase:** $PHASE"
  echo "- **Current skill:** $CURRENT_SKILL"
  echo "- **Save-token mode:** $SAVE_MODE"
  echo ""

  # Task summary from state
  TOTAL=$(safe_jq "$STATE" '.tasks.total' '0')
  COMPLETED=$(safe_jq "$STATE" '.tasks.completed' '0')
  FAILED=$(safe_jq "$STATE" '.tasks.failed' '0')
  SKIPPED=$(safe_jq "$STATE" '.tasks.skipped' '0')
  if [ "$TOTAL" -gt 0 ] 2>/dev/null; then
    echo "### Tasks: $COMPLETED/$TOTAL complete ($FAILED failed, $SKIPPED skipped)"
    echo ""
  fi

  # Artifacts
  echo "### Artifacts"
  if [ -f "$STATE" ]; then
    jq -r '.artifacts | to_entries[] | select(.value == true) | "- ✅ \(.key)"' "$STATE" 2>/dev/null || echo "- None yet"
    PENDING=$(jq -r '.artifacts | to_entries[] | select(.value == false) | .key' "$STATE" 2>/dev/null | head -5)
    if [ -n "$PENDING" ]; then
      echo "$PENDING" | while read -r art; do echo "- ⬜ $art"; done
    fi
  else
    echo "- No state file"
  fi
  echo ""

  # plan.md summary
  if [ -f ".claude/plan.md" ]; then
    echo "### Plan Summary"
    PLAN_TOTAL=$(grep -c "^- \[" .claude/plan.md 2>/dev/null || echo "0")
    PLAN_DONE=$(grep -c "^- \[x\]" .claude/plan.md 2>/dev/null || echo "0")
    PLAN_PROG=$(grep -c "^- \[~\]" .claude/plan.md 2>/dev/null || echo "0")
    PLAN_PEND=$(grep -c "^- \[ \]" .claude/plan.md 2>/dev/null || echo "0")
    PLAN_BLOCK=$(grep -c "^- \[!\]" .claude/plan.md 2>/dev/null || echo "0")
    echo "- Total: $PLAN_TOTAL | Done: $PLAN_DONE | In-progress: $PLAN_PROG | Pending: $PLAN_PEND | Blocked: $PLAN_BLOCK"
    NEXT=$(grep -m1 "^- \[ \]" .claude/plan.md 2>/dev/null | sed 's/^- \[ \] //' || true)
    if [ -n "$NEXT" ]; then
      echo "- **Next task:** $NEXT"
    fi
    echo ""
  fi

  # ── Recent Events (NEW - from events JSONL) ──
  if [ "$TOTAL_EVENTS" -gt 0 ]; then
    echo "## Recent Events"
    echo "$ALL_EVENTS" | jq -r '
      sort_by(.timestamp) | reverse | .[0:10][] |
      "- [\(.timestamp | split("T")[1] | split(".")[0] | .[0:5] // "??:??")] \(.type): \(.content)"
    ' 2>/dev/null || echo "- Error reading events"
    echo ""
  fi

  # ── Key Decisions (enhanced: events + legacy) ──
  echo "## Key Decisions"
  
  # From events system (grouped by date)
  if [ "$EVENTS_DECISIONS" -gt 0 ]; then
    echo "$ALL_EVENTS" | jq -r '
      [.[] | select(.type == "decision")] |
      sort_by(.timestamp) | reverse | .[0:10] |
      group_by(.timestamp | split("T")[0])[] |
      (.[0].timestamp | split("T")[0]) as $date |
      "### \($date)",
      (.[] | "- **\(.content)** — \(.metadata.reason // "no reason") [\(.metadata.tags // [] | join(", "))]")
    ' 2>/dev/null || true
    echo ""
  fi

  # Legacy decisions.json (fallback/supplement)
  DECISIONS_COUNT=$(json_len "$MEMORY_DIR/decisions.json")
  if [ "$DECISIONS_COUNT" -gt 0 ] && [ "$EVENTS_DECISIONS" -eq 0 ]; then
    echo "*(from legacy decisions.json)*"
    jq -r 'sort_by(.timestamp) | reverse | .[0:10][] | "- **\(.decision)** — \(.reason) [\(.tags | join(", "))] (\(.timestamp // "no date"))"' \
      "$MEMORY_DIR/decisions.json" 2>/dev/null || echo "- Error reading decisions"
    echo ""
  fi

  # ── Milestones (NEW - skills completed timeline) ──
  if [ "$EVENTS_MILESTONES" -gt 0 ]; then
    echo "## Milestones"
    echo "$ALL_EVENTS" | jq -r '
      [.[] | select(.type == "milestone")] |
      sort_by(.timestamp) | reverse | .[0:15][] |
      "- 🏆 [\(.timestamp | split("T")[0])] **\(.content)** \(if .metadata.skill then "(\(.metadata.skill))" else "" end)"
    ' 2>/dev/null || echo "- Error reading milestones"
    echo ""
  fi

  # ── Patterns (legacy) ──
  PATTERNS_COUNT=$(json_len "$MEMORY_DIR/patterns.json")
  if [ "$PATTERNS_COUNT" -gt 0 ]; then
    echo "## Active Patterns"
    jq -r 'sort_by(.timestamp) | reverse | .[0:10][] | "- **\(.pattern)** — \(.context) (\(.timestamp // "no date"))"' \
      "$MEMORY_DIR/patterns.json" 2>/dev/null || echo "- Error reading patterns"
    echo ""
  fi

  # ── Errors & Solutions (enhanced: events + legacy) ──
  echo "## Errors & Solutions"
  
  # From events system
  if [ "$EVENTS_ERRORS" -gt 0 ]; then
    echo "$ALL_EVENTS" | jq -r '
      [.[] | select(.type == "error")] |
      sort_by(.timestamp) | reverse | .[0:10][] |
      "- ❌ **Error:** \(.content)\n  ✅ **Solution:** \(.metadata.solution // "pending")"
    ' 2>/dev/null || true
    echo ""
  fi

  # Legacy errors.json (fallback/supplement)
  ERRORS_COUNT=$(json_len "$MEMORY_DIR/errors.json")
  if [ "$ERRORS_COUNT" -gt 0 ] && [ "$EVENTS_ERRORS" -eq 0 ]; then
    echo "*(from legacy errors.json)*"
    jq -r 'sort_by(.timestamp) | reverse | .[0:8][] | "- ❌ **\(.error)** → ✅ \(.solution) (\(.timestamp // "no date"))"' \
      "$MEMORY_DIR/errors.json" 2>/dev/null || echo "- Error reading errors"
    echo ""
  fi

  # ── Progress (legacy, 7-day decay) ──
  PROGRESS_COUNT=$(json_len "$MEMORY_DIR/progress.json")
  if [ "$PROGRESS_COUNT" -gt 0 ]; then
    CUTOFF=$(date -v-7d '+%Y-%m-%d' 2>/dev/null || date -d '7 days ago' '+%Y-%m-%d' 2>/dev/null || echo "2000-01-01")
    echo "## Recent Progress (7 days)"
    jq -r --arg cutoff "$CUTOFF" '
      [.[] | select(.timestamp >= $cutoff)] |
      sort_by(.timestamp) | reverse | .[0:15][] |
      "- \(.status // "done"): \(.task) (\(.timestamp // "no date"))"
    ' "$MEMORY_DIR/progress.json" 2>/dev/null || echo "- Error reading progress"
    echo ""
  fi

  # ── Session Context ──
  echo "## Session Context"
  echo "- **Memory files:** decisions=$DECISIONS_COUNT patterns=$PATTERNS_COUNT errors=$ERRORS_COUNT progress=$PROGRESS_COUNT"

  # Session logs count
  LOG_COUNT=$(find "$MEMORY_DIR/session-logs" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
  echo "- **Session logs:** $LOG_COUNT"

  # Checkpoints summary
  if [ -f "$STATE" ]; then
    DONE_CHECKS=$(jq '[.checkpoints | to_entries[] | select(.value == true)] | length' "$STATE" 2>/dev/null || echo "0")
    TOTAL_CHECKS=$(jq '[.checkpoints | to_entries[]] | length' "$STATE" 2>/dev/null || echo "0")
    echo "- **Checkpoints:** $DONE_CHECKS/$TOTAL_CHECKS passed"
  fi

  echo ""
  echo "---"
  
  # ── Memory Stats (NEW) ──
  LAST_CAPTURE=$(date '+%Y-%m-%d %H:%M')
  echo "Memory stats: $TOTAL_EVENTS events | $EVENTS_DECISIONS decisions | $EVENTS_MILESTONES milestones | $EVENTS_ERRORS errors"
  echo "Last capture: $LAST_CAPTURE"
  echo ""
  echo "*Read the full JSON files in .genius/memory/ for detailed history.*"

} > "$BRIEFING"

echo "[memory-briefing] BRIEFING.md regenerated ($(wc -l < "$BRIEFING") lines)"
