#!/bin/bash
# Genius Team v9.0 — Memory Rollup & Condensation
# Condenses detailed events into summaries to prevent memory explosion
# Usage: ./scripts/memory-rollup.sh [--force] [--days N]

set -euo pipefail

# ══════════════════════════════════════════════════════════════════════════════
# Configuration
# ══════════════════════════════════════════════════════════════════════════════

MEMORY_DIR=".genius/memory"
EVENTS_DIR="$MEMORY_DIR/events"
SUMMARIES_DIR="$MEMORY_DIR/summaries"
ARCHIVE_DIR="$MEMORY_DIR/archive"
DIGEST_FILE="$MEMORY_DIR/MEMORY_DIGEST.md"

ARCHIVE_AFTER_DAYS=7
FORCE=false
PROCESS_DAYS=30

# ══════════════════════════════════════════════════════════════════════════════
# Parse arguments
# ══════════════════════════════════════════════════════════════════════════════

while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE=true
      shift
      ;;
    --days)
      PROCESS_DAYS="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--force] [--days N]"
      echo ""
      echo "Options:"
      echo "  --force    Regenerate summaries even if they exist"
      echo "  --days N   Process last N days (default: 30)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# ══════════════════════════════════════════════════════════════════════════════
# Ensure directories exist
# ══════════════════════════════════════════════════════════════════════════════

mkdir -p "$EVENTS_DIR" "$SUMMARIES_DIR" "$ARCHIVE_DIR"

# ══════════════════════════════════════════════════════════════════════════════
# Helper functions
# ══════════════════════════════════════════════════════════════════════════════

# Date calculation (macOS/BSD compatible)
date_subtract() {
  local days=$1
  if date -v-1d &>/dev/null; then
    # macOS/BSD
    date -v-${days}d '+%Y-%m-%d'
  else
    # GNU date
    date -d "$days days ago" '+%Y-%m-%d'
  fi
}

# Get timestamp from ISO date string
get_time() {
  echo "$1" | grep -oE '[0-9]{2}:[0-9]{2}' | head -1 || echo "00:00"
}

# Safe JSON array length
json_len() {
  if [ -f "$1" ]; then
    jq 'if type == "array" then length else 0 end' "$1" 2>/dev/null || echo "0"
  else
    echo "0"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# Generate daily summary from events file
# ══════════════════════════════════════════════════════════════════════════════

generate_daily_summary() {
  local date="$1"
  local events_file="$EVENTS_DIR/events-${date}.jsonl"
  local summary_file="$SUMMARIES_DIR/summary-${date}.md"

  # Skip if no events file
  if [ ! -f "$events_file" ]; then
    return 0
  fi

  # Skip if summary exists and not forcing
  if [ -f "$summary_file" ] && [ "$FORCE" = false ]; then
    return 0
  fi

  echo "[rollup] Generating summary for $date..."

  # Parse events using jq -s to handle multi-line JSON (not strict JSONL)
  # Extract categorized data in one pass for efficiency
  
  local milestones=$(jq -rs '
    [.[] | select(.type == "milestone" or .type == "phase_complete" or .type == "skill_complete")] |
    .[] | "- [\(.timestamp | split("T")[1] | split(":")[0:2] | join(":"))] \(.content)\(if .skill then " (skill: \(.skill))" else "" end)"
  ' "$events_file" 2>/dev/null || echo "")

  local decisions=$(jq -rs '
    [.[] | select(.type == "decision")] |
    .[] | "- \(.content)\(if .metadata.reason then " — \(.metadata.reason)" else "" end)"
  ' "$events_file" 2>/dev/null || echo "")
  local decision_count=$(jq -rs '[.[] | select(.type == "decision")] | length' "$events_file" 2>/dev/null || echo "0")

  local artifacts=$(jq -rs '
    [.[] | select(.type == "artifact" or .type == "file_created" or .type == "output")] |
    [.[].content // .[].metadata.file // .[].metadata.artifact // "unknown"] | join(", ")
  ' "$events_file" 2>/dev/null || echo "")
  local artifact_count=$(jq -rs '[.[] | select(.type == "artifact" or .type == "file_created" or .type == "output")] | length' "$events_file" 2>/dev/null || echo "0")

  local errors=$(jq -rs '
    [.[] | select(.type == "error" or .type == "failure")] |
    .[] | "- \(.content) → \(.metadata.solution // "pending")"
  ' "$events_file" 2>/dev/null || echo "")
  local error_count=$(jq -rs '[.[] | select(.type == "error" or .type == "failure")] | length' "$events_file" 2>/dev/null || echo "0")

  local conversations=$(jq -rs '
    [.[] | select(.type == "conversation" or .type == "user_input" or .type == "clarification")] |
    .[] | "- \(.content)"
  ' "$events_file" 2>/dev/null || echo "")

  # Generate markdown summary
  {
    echo "# Day Summary — $date"
    echo ""

    if [ -n "$milestones" ] && [ "$milestones" != "null" ]; then
      echo "## Milestones"
      echo "$milestones"
      echo ""
    fi

    if [ -n "$decisions" ] && [ "$decisions" != "null" ] && [ "$decision_count" -gt 0 ]; then
      echo "## Decisions ($decision_count)"
      echo "$decisions"
      echo ""
    fi

    if [ "$artifact_count" -gt 0 ] && [ -n "$artifacts" ] && [ "$artifacts" != "null" ]; then
      echo "## Artifacts Generated ($artifact_count)"
      echo "- $artifacts"
      echo ""
    fi

    if [ -n "$errors" ] && [ "$errors" != "null" ] && [ "$error_count" -gt 0 ]; then
      echo "## Errors Resolved ($error_count)"
      echo "$errors"
      echo ""
    fi

    if [ -n "$conversations" ] && [ "$conversations" != "null" ]; then
      echo "## Key Conversations"
      echo "$conversations"
      echo ""
    fi

    echo "---"
    echo "*Generated by memory-rollup.sh on $(date '+%Y-%m-%d %H:%M')*"

  } > "$summary_file"

  echo "[rollup] Created $summary_file"
}

# ══════════════════════════════════════════════════════════════════════════════
# Generate global MEMORY_DIGEST.md
# ══════════════════════════════════════════════════════════════════════════════

generate_digest() {
  echo "[rollup] Generating MEMORY_DIGEST.md..."

  {
    echo "# 🧠 Memory Digest"
    echo ""
    echo "> Consolidated project memory — auto-generated on $(date '+%Y-%m-%d %H:%M')"
    echo ""

    # ── Top 10 Decisions (all time) ──
    echo "## 📋 Top 10 Decisions"
    echo ""
    if [ -f "$MEMORY_DIR/decisions.json" ]; then
      local dec_count=$(json_len "$MEMORY_DIR/decisions.json")
      if [ "$dec_count" -gt 0 ]; then
        jq -r 'sort_by(.timestamp) | reverse | .[0:10][] | 
          "- **\(.content // .decision // "?")** — \(.metadata.reason // .reason // "no reason") _(\(.timestamp // "?"))_"' \
          "$MEMORY_DIR/decisions.json" 2>/dev/null || echo "- Error reading decisions"
      else
        echo "- No decisions recorded yet"
      fi
    else
      echo "- No decisions file"
    fi
    echo ""

    # ── Milestone History ──
    echo "## 🏆 Milestone History"
    echo ""
    # Aggregate milestones from all summaries
    local milestone_found=false
    for summary in $(ls -r "$SUMMARIES_DIR"/summary-*.md 2>/dev/null | head -20); do
      local sum_date=$(basename "$summary" | sed 's/summary-\(.*\)\.md/\1/')
      local milestones=$(grep -A 100 "^## Milestones" "$summary" 2>/dev/null | \
        grep "^- \[" | head -5 || true)
      if [ -n "$milestones" ]; then
        echo "### $sum_date"
        echo "$milestones"
        echo ""
        milestone_found=true
      fi
    done
    [ "$milestone_found" = false ] && echo "- No milestones yet"
    echo ""

    # ── Identified Patterns ──
    echo "## 🔄 Identified Patterns"
    echo ""
    if [ -f "$MEMORY_DIR/patterns.json" ]; then
      local pat_count=$(json_len "$MEMORY_DIR/patterns.json")
      if [ "$pat_count" -gt 0 ]; then
        jq -r 'sort_by(.timestamp) | reverse | .[0:15][] | 
          "- **\(.content // .pattern // "?")** — \(.metadata.context // .context // "") _(\(.timestamp // "?"))_"' \
          "$MEMORY_DIR/patterns.json" 2>/dev/null || echo "- Error reading patterns"
      else
        echo "- No patterns identified yet"
      fi
    else
      echo "- No patterns file"
    fi
    echo ""

    # ── Recurring Errors ──
    echo "## ⚠️ Recurring Errors & Solutions"
    echo ""
    if [ -f "$MEMORY_DIR/errors.json" ]; then
      local err_count=$(json_len "$MEMORY_DIR/errors.json")
      if [ "$err_count" -gt 0 ]; then
        jq -r 'sort_by(.timestamp) | reverse | .[0:10][] | 
          "- ❌ **\(.content // .error // "?")** → ✅ \(.metadata.solution // .solution // "?") _(\(.timestamp // "?"))_"' \
          "$MEMORY_DIR/errors.json" 2>/dev/null || echo "- Error reading errors"
      else
        echo "- No errors recorded"
      fi
    else
      echo "- No errors file"
    fi
    echo ""

    # ── Statistics ──
    echo "## 📊 Statistics"
    echo ""
    local total_events=0
    local total_summaries=$(ls "$SUMMARIES_DIR"/summary-*.md 2>/dev/null | wc -l | tr -d ' ')
    local archived=$(ls "$ARCHIVE_DIR"/*.jsonl.gz 2>/dev/null | wc -l | tr -d ' ')
    
    for events_file in "$EVENTS_DIR"/events-*.jsonl; do
      [ -f "$events_file" ] || continue
      local count=$(wc -l < "$events_file" | tr -d ' ')
      ((total_events += count)) || true
    done

    echo "- **Active event files:** $(ls "$EVENTS_DIR"/events-*.jsonl 2>/dev/null | wc -l | tr -d ' ')"
    echo "- **Total events:** $total_events"
    echo "- **Daily summaries:** $total_summaries"
    echo "- **Archived files:** $archived"
    echo "- **Decisions recorded:** $(json_len "$MEMORY_DIR/decisions.json")"
    echo "- **Patterns identified:** $(json_len "$MEMORY_DIR/patterns.json")"
    echo "- **Errors logged:** $(json_len "$MEMORY_DIR/errors.json")"
    echo ""

    echo "---"
    echo "*Last rollup: $(date '+%Y-%m-%d %H:%M:%S')*"

  } > "$DIGEST_FILE"

  echo "[rollup] Created $DIGEST_FILE"
}

# ══════════════════════════════════════════════════════════════════════════════
# Archive old events (> 7 days)
# ══════════════════════════════════════════════════════════════════════════════

archive_old_events() {
  echo "[rollup] Archiving events older than $ARCHIVE_AFTER_DAYS days..."

  local cutoff_date=$(date_subtract $ARCHIVE_AFTER_DAYS)
  local archived_count=0

  for events_file in "$EVENTS_DIR"/events-*.jsonl; do
    [ -f "$events_file" ] || continue

    local file_date=$(basename "$events_file" | sed 's/events-\(.*\)\.jsonl/\1/')
    
    # Compare dates (lexicographic works for YYYY-MM-DD)
    if [[ "$file_date" < "$cutoff_date" ]]; then
      local archive_name="$ARCHIVE_DIR/events-${file_date}.jsonl.gz"
      
      if gzip -c "$events_file" > "$archive_name" 2>/dev/null; then
        rm "$events_file"
        echo "[rollup] Archived: $events_file → $archive_name"
        ((archived_count++))
      else
        echo "[rollup] Warning: Failed to archive $events_file"
      fi
    fi
  done

  echo "[rollup] Archived $archived_count event file(s)"
}

# ══════════════════════════════════════════════════════════════════════════════
# Main execution
# ══════════════════════════════════════════════════════════════════════════════

main() {
  echo "════════════════════════════════════════════════════════════════"
  echo "  Memory Rollup — $(date '+%Y-%m-%d %H:%M:%S')"
  echo "════════════════════════════════════════════════════════════════"
  echo ""

  # Check if we have any events to process
  local event_files=$(ls "$EVENTS_DIR"/events-*.jsonl 2>/dev/null | wc -l | tr -d ' ')
  
  if [ "$event_files" -eq 0 ]; then
    echo "[rollup] No event files found in $EVENTS_DIR"
    echo "[rollup] Events should be logged to: events-YYYY-MM-DD.jsonl"
    echo ""
    
    # Still generate digest from existing JSON files
    if [ -f "$MEMORY_DIR/decisions.json" ] || [ -f "$MEMORY_DIR/patterns.json" ]; then
      generate_digest
    fi
  else
    # Process each day
    for events_file in "$EVENTS_DIR"/events-*.jsonl; do
      [ -f "$events_file" ] || continue
      local file_date=$(basename "$events_file" | sed 's/events-\(.*\)\.jsonl/\1/')
      generate_daily_summary "$file_date"
    done

    # Generate global digest
    generate_digest

    # Archive old events
    archive_old_events
  fi

  # Also generate summaries from existing JSON memory files (fallback)
  # This ensures we have a digest even without JSONL events
  if [ ! -f "$DIGEST_FILE" ]; then
    generate_digest
  fi

  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "  Updating BRIEFING.md..."
  echo "════════════════════════════════════════════════════════════════"

  # Call memory-briefing.sh if it exists
  if [ -f "scripts/memory-briefing.sh" ]; then
    bash scripts/memory-briefing.sh
  else
    echo "[rollup] Warning: scripts/memory-briefing.sh not found"
  fi

  echo ""
  echo "[rollup] ✅ Rollup complete!"
  echo ""
  echo "Summary:"
  echo "  - Summaries: $SUMMARIES_DIR/"
  echo "  - Digest:    $DIGEST_FILE"
  echo "  - Archive:   $ARCHIVE_DIR/"
}

# Run main
main
