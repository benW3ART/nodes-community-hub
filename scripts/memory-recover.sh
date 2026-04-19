#!/bin/bash
# Genius Team v9.0 — Memory Recovery Script
# Reconstruct lost context by scanning project artifacts
# Usage: ./scripts/memory-recover.sh [--dry-run] [--verbose]
# Compatible with bash 3.2+ (macOS default)

set -euo pipefail

# ══════════════════════════════════════════════════════════════════════════════
# Configuration
# ══════════════════════════════════════════════════════════════════════════════

GENIUS_DIR=".genius"
CLAUDE_DIR=".claude"
MEMORY_DIR="$GENIUS_DIR/memory"
OUTPUTS_DIR="$GENIUS_DIR/outputs"
DISCOVERY_DIR="$CLAUDE_DIR/discovery"
STATE_FILE="$GENIUS_DIR/state.json"
CONFIG_FILE="$GENIUS_DIR/config.json"

DRY_RUN=false
VERBOSE=false

# Temp files for state (bash 3.2 compatibility - no associative arrays)
TEMP_DIR=$(mktemp -d)
CHECKPOINTS_FILE="$TEMP_DIR/checkpoints"
ARTIFACTS_FILE="$TEMP_DIR/artifacts"
DECISIONS_FILE="$TEMP_DIR/decisions"
EVENTS_FILE="$TEMP_DIR/events"
WARNINGS_FILE="$TEMP_DIR/warnings"

trap "rm -rf $TEMP_DIR" EXIT

# Initialize temp files
touch "$CHECKPOINTS_FILE" "$ARTIFACTS_FILE" "$DECISIONS_FILE" "$EVENTS_FILE" "$WARNINGS_FILE"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true; shift ;;
    --verbose) VERBOSE=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--verbose]"
      echo "  --dry-run   Show what would be recovered without writing"
      echo "  --verbose   Show detailed recovery information"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

log() {
  echo "[memory-recover] $1"
}

verbose() {
  if $VERBOSE; then
    echo "  ↳ $1"
  fi
}

# Get file modification time in ISO format
get_mtime() {
  local file="$1"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file" 2>/dev/null || echo "unknown"
  else
    stat -c "%y" "$file" 2>/dev/null | cut -d'.' -f1 || echo "unknown"
  fi
}

# Get file modification timestamp for JSONL
get_timestamp() {
  local file="$1"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    stat -f "%Sm" -t "%Y-%m-%dT%H:%M:%S" "$file" 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S'
  else
    stat -c "%y" "$file" 2>/dev/null | cut -d'.' -f1 | tr ' ' 'T' || date '+%Y-%m-%dT%H:%M:%S'
  fi
}

# Get date from file for event log filename
get_date_from_file() {
  local file="$1"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null || date '+%Y-%m-%d'
  else
    stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1 || date '+%Y-%m-%d'
  fi
}

# Set checkpoint as completed
set_checkpoint() {
  local checkpoint="$1"
  if ! grep -q "^$checkpoint$" "$CHECKPOINTS_FILE" 2>/dev/null; then
    echo "$checkpoint" >> "$CHECKPOINTS_FILE"
  fi
}

# Check if checkpoint is set
is_checkpoint_set() {
  local checkpoint="$1"
  grep -q "^$checkpoint$" "$CHECKPOINTS_FILE" 2>/dev/null
}

# Add artifact to list
add_artifact() {
  echo "$1" >> "$ARTIFACTS_FILE"
}

# Add decision
add_decision() {
  echo "$1" >> "$DECISIONS_FILE"
}

# Add event
add_event() {
  echo "$1" >> "$EVENTS_FILE"
}

# Map artifact name to checkpoint
artifact_to_checkpoint() {
  local name_lower="$1"
  case "$name_lower" in
    discovery) echo "discovery" ;;
    market-analysis|market_analysis) echo "market_analysis" ;;
    specs|specifications) echo "specs_approved" ;;
    design) echo "design_chosen" ;;
    marketing|marketing-plan) echo "marketing_done" ;;
    integrations) echo "integrations_done" ;;
    architecture) echo "architecture_approved" ;;
    execution) echo "execution_started" ;;
    qa|qa-report) echo "qa_passed" ;;
    security|security-audit) echo "security_passed" ;;
    deployment|deploy) echo "deployed" ;;
    *) echo "" ;;
  esac
}

# Map checkpoint to skill
checkpoint_to_skill() {
  local checkpoint="$1"
  case "$checkpoint" in
    discovery) echo "genius-discovery" ;;
    market_analysis) echo "genius-market-analyzer" ;;
    specs_approved) echo "genius-specs" ;;
    design_chosen) echo "genius-ui-designer" ;;
    marketing_done) echo "genius-marketer" ;;
    integrations_done) echo "genius-integrator" ;;
    architecture_approved) echo "genius-architect" ;;
    execution_started) echo "genius-orchestrator" ;;
    qa_passed) echo "genius-qa-sentinel" ;;
    security_passed) echo "genius-security-auditor" ;;
    deployed) echo "genius-deployer" ;;
    *) echo "" ;;
  esac
}

# ══════════════════════════════════════════════════════════════════════════════
# Checkpoint order
# ══════════════════════════════════════════════════════════════════════════════

CHECKPOINT_ORDER="discovery market_analysis specs_approved design_chosen marketing_done integrations_done architecture_approved execution_started qa_passed security_passed deployed"

# ══════════════════════════════════════════════════════════════════════════════
# Recovery State
# ══════════════════════════════════════════════════════════════════════════════

RECOVERED_PHASE="NOT_STARTED"
RECOVERED_SKILL=""
PLAN_TOTAL=0
PLAN_COMPLETED=0
PLAN_FAILED=0
PLAN_SKIPPED=0

# ══════════════════════════════════════════════════════════════════════════════
# Step 1: Scan Artifacts (.genius/outputs/*.html)
# ══════════════════════════════════════════════════════════════════════════════

scan_artifacts() {
  log "Scanning artifacts in $OUTPUTS_DIR..."

  if [[ ! -d "$OUTPUTS_DIR" ]]; then
    verbose "No outputs directory found"
    return
  fi

  # Find all output files (bash 3.2 compatible)
  local files=$(find "$OUTPUTS_DIR" -maxdepth 1 \( -name "*.html" -o -name "*.md" -o -name "*.json" \) 2>/dev/null || true)
  
  for file in $files; do
    [[ -f "$file" ]] || continue

    local basename=$(basename "$file")
    local name_lower=$(echo "${basename%.*}" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    local mtime=$(get_mtime "$file")
    local timestamp=$(get_timestamp "$file")
    local date_part=$(get_date_from_file "$file")

    add_artifact "$basename ($mtime)"
    verbose "Found artifact: $basename ($mtime)"

    # Map to checkpoint
    local checkpoint=$(artifact_to_checkpoint "$name_lower")
    if [[ -n "$checkpoint" ]]; then
      set_checkpoint "$checkpoint"
      verbose "  → Maps to checkpoint: $checkpoint"

      # Add event
      add_event "$date_part|{\"type\":\"milestone\",\"event\":\"artifact_created\",\"artifact\":\"$basename\",\"checkpoint\":\"$checkpoint\",\"timestamp\":\"$timestamp\"}"
    fi
  done
}

# ══════════════════════════════════════════════════════════════════════════════
# Step 2: Scan Discovery XMLs (.claude/discovery/*.xml)
# ══════════════════════════════════════════════════════════════════════════════

scan_discovery() {
  log "Scanning discovery files in $DISCOVERY_DIR..."

  if [[ ! -d "$DISCOVERY_DIR" ]]; then
    verbose "No discovery directory found"
    return
  fi

  # Find all XML files (bash 3.2 compatible)
  local files=$(find "$DISCOVERY_DIR" -maxdepth 1 -name "*.xml" 2>/dev/null || true)
  
  for file in $files; do
    [[ -f "$file" ]] || continue

    local basename=$(basename "$file")
    local mtime=$(get_mtime "$file")

    add_artifact "$basename ($mtime)"
    verbose "Found discovery: $basename"

    # Extract decisions from XML
    # Look for <decision>, <target>, <spec> tags
    local decisions=$(grep -oE '<decision[^>]*>[^<]+</decision>' "$file" 2>/dev/null | sed 's/<[^>]*>//g' | head -5 || true)
    local specs=$(grep -oE '<spec[^>]*>[^<]+</spec>' "$file" 2>/dev/null | sed 's/<[^>]*>//g' | head -3 || true)
    local targets=$(grep -oE '<target[^>]*>[^<]+</target>' "$file" 2>/dev/null | sed 's/<[^>]*>//g' | head -3 || true)

    echo "$decisions" | while IFS= read -r decision; do
      [[ -n "$decision" ]] && add_decision "[from $basename] $decision"
    done

    echo "$specs" | while IFS= read -r spec; do
      [[ -n "$spec" ]] && add_decision "[from $basename] Spec: $spec"
    done

    echo "$targets" | while IFS= read -r target; do
      [[ -n "$target" ]] && add_decision "[from $basename] Target: $target"
    done
  done
}

# ══════════════════════════════════════════════════════════════════════════════
# Step 3: Scan Plan (.claude/plan.md)
# ══════════════════════════════════════════════════════════════════════════════

scan_plan() {
  log "Scanning plan file..."

  local plan_file="$CLAUDE_DIR/plan.md"
  if [[ ! -f "$plan_file" ]]; then
    verbose "No plan.md found"
    return
  fi

  local mtime=$(get_mtime "$plan_file")
  add_artifact "plan.md ($mtime)"

  # Count task statuses
  PLAN_TOTAL=$(grep -c "^- \[" "$plan_file" 2>/dev/null || echo "0")
  PLAN_COMPLETED=$(grep -c "^- \[x\]" "$plan_file" 2>/dev/null || echo "0")
  PLAN_FAILED=$(grep -c "^- \[!\]" "$plan_file" 2>/dev/null || echo "0")
  PLAN_SKIPPED=$(grep -c "^- \[-\]" "$plan_file" 2>/dev/null || echo "0")

  verbose "Plan: $PLAN_COMPLETED/$PLAN_TOTAL completed, $PLAN_FAILED failed, $PLAN_SKIPPED skipped"

  # If we have completed tasks, we're at least in execution
  if [[ "$PLAN_COMPLETED" -gt 0 ]]; then
    set_checkpoint "execution_started"
    verbose "  → execution_started detected from plan progress"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# Step 4: Scan Technical Context (ARCHITECTURE.md, PROGRESS.md)
# ══════════════════════════════════════════════════════════════════════════════

scan_technical_context() {
  log "Scanning technical context files..."

  # ARCHITECTURE.md
  if [[ -f "ARCHITECTURE.md" ]]; then
    local mtime=$(get_mtime "ARCHITECTURE.md")
    add_artifact "ARCHITECTURE.md ($mtime)"
    set_checkpoint "architecture_approved"
    verbose "Found ARCHITECTURE.md → architecture_approved"
  fi

  # PROGRESS.md
  if [[ -f "PROGRESS.md" ]]; then
    local mtime=$(get_mtime "PROGRESS.md")
    add_artifact "PROGRESS.md ($mtime)"
    verbose "Found PROGRESS.md"

    # Extract progress milestones
    if grep -qi "completed\|done\|finished" "PROGRESS.md" 2>/dev/null; then
      set_checkpoint "execution_started"
    fi
  fi

  # Check for other common project files
  for docfile in "README.md" "CHANGELOG.md" "CONTRIBUTING.md"; do
    if [[ -f "$docfile" ]]; then
      local mtime=$(get_mtime "$docfile")
      verbose "Found $docfile ($mtime)"
    fi
  done
}

# ══════════════════════════════════════════════════════════════════════════════
# Step 5: Scan Logs
# ══════════════════════════════════════════════════════════════════════════════

scan_logs() {
  log "Scanning log files..."

  # Activity log
  local activity_log="$GENIUS_DIR/activity.log"
  if [[ -f "$activity_log" ]]; then
    local line_count=$(wc -l < "$activity_log" | tr -d ' ')
    verbose "Found activity.log ($line_count lines)"

    # Extract recent actions
    tail -20 "$activity_log" 2>/dev/null | while IFS= read -r line; do
      if [[ "$line" == *"skill:"* ]] || [[ "$line" == *"checkpoint:"* ]]; then
        verbose "  Log: $line"
      fi
    done
  fi

  # Guard log
  local guard_log="$GENIUS_DIR/guard.log"
  if [[ -f "$guard_log" ]]; then
    local warning_count=$(grep -ci "warning\|error\|violation" "$guard_log" 2>/dev/null || echo "0")
    verbose "Found guard.log ($warning_count warnings/errors)"

    if [[ "$warning_count" -gt 0 ]]; then
      grep -i "warning\|error\|violation" "$guard_log" 2>/dev/null | tail -5 >> "$WARNINGS_FILE"
    fi
  fi

  # Router log
  local router_log="$GENIUS_DIR/router.log"
  if [[ -f "$router_log" ]]; then
    local route_count=$(wc -l < "$router_log" | tr -d ' ')
    verbose "Found router.log ($route_count entries)"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# Step 6: Determine Phase and Current Skill
# ══════════════════════════════════════════════════════════════════════════════

determine_phase_and_skill() {
  log "Determining phase and current skill..."

  # Find the first incomplete checkpoint
  local completed_count=0
  for checkpoint in $CHECKPOINT_ORDER; do
    if is_checkpoint_set "$checkpoint"; then
      ((completed_count++)) || true
      verbose "  ✓ $checkpoint"
    else
      RECOVERED_SKILL=$(checkpoint_to_skill "$checkpoint")
      verbose "  ⏳ $checkpoint (current)"
      break
    fi
  done

  # Determine phase based on progress
  if [[ "$completed_count" -eq 0 ]]; then
    RECOVERED_PHASE="NOT_STARTED"
  elif [[ "$completed_count" -lt 4 ]]; then
    RECOVERED_PHASE="DISCOVERY"
  elif [[ "$completed_count" -lt 7 ]]; then
    RECOVERED_PHASE="PLANNING"
  elif [[ "$completed_count" -lt 10 ]]; then
    RECOVERED_PHASE="EXECUTION"
  elif [[ "$completed_count" -ge 10 ]]; then
    RECOVERED_PHASE="DEPLOYED"
  fi

  verbose "Phase: $RECOVERED_PHASE, Current skill: ${RECOVERED_SKILL:-none}"
}

# ══════════════════════════════════════════════════════════════════════════════
# Step 7: Regenerate State and Memory Files
# ══════════════════════════════════════════════════════════════════════════════

regenerate_state() {
  log "Regenerating state.json..."

  if $DRY_RUN; then
    verbose "DRY RUN: Would write state.json"
    return
  fi

  # Backup existing state
  if [[ -f "$STATE_FILE" ]]; then
    cp "$STATE_FILE" "$STATE_FILE.bak"
    verbose "Backed up existing state to state.json.bak"
  fi

  # Build checkpoints JSON
  local checkpoints_json="{"
  local first=true
  for checkpoint in $CHECKPOINT_ORDER; do
    if ! $first; then checkpoints_json+=","; fi
    first=false
    if is_checkpoint_set "$checkpoint"; then
      checkpoints_json+="\"$checkpoint\":true"
    else
      checkpoints_json+="\"$checkpoint\":false"
    fi
  done
  checkpoints_json+="}"

  # Build artifacts JSON
  local artifacts_json="{}"
  local artifact_count=$(wc -l < "$ARTIFACTS_FILE" | tr -d ' ')
  if [[ "$artifact_count" -gt 0 ]]; then
    artifacts_json="{"
    first=true
    while IFS= read -r artifact; do
      if ! $first; then artifacts_json+=","; fi
      first=false
      local name=$(echo "$artifact" | cut -d'(' -f1 | tr -d ' ' | tr '[:upper:]' '[:lower:]')
      artifacts_json+="\"$name\":true"
    done < "$ARTIFACTS_FILE"
    artifacts_json+="}"
  fi

  # Format currentSkill
  local current_skill_json="null"
  if [[ -n "$RECOVERED_SKILL" ]]; then
    current_skill_json="\"$RECOVERED_SKILL\""
  fi

  # Write state.json
  cat > "$STATE_FILE" << EOF
{
  "version": "9.0.0",
  "phase": "$RECOVERED_PHASE",
  "currentSkill": $current_skill_json,
  "skillHistory": [],
  "checkpoints": $checkpoints_json,
  "tasks": {
    "total": $PLAN_TOTAL,
    "completed": $PLAN_COMPLETED,
    "failed": $PLAN_FAILED,
    "skipped": $PLAN_SKIPPED,
    "current_task_id": null
  },
  "artifacts": $artifacts_json,
  "agentTeams": {
    "active": false,
    "leadSessionId": null,
    "teammates": []
  },
  "created_at": null,
  "updated_at": "$(date '+%Y-%m-%dT%H:%M:%S')",
  "recovered_at": "$(date '+%Y-%m-%dT%H:%M:%S')"
}
EOF

  verbose "Wrote state.json"
}

regenerate_events() {
  log "Regenerating event logs..."

  if $DRY_RUN; then
    verbose "DRY RUN: Would write event logs"
    return
  fi

  mkdir -p "$MEMORY_DIR"

  local event_count=$(wc -l < "$EVENTS_FILE" | tr -d ' ')
  if [[ "$event_count" -eq 0 ]]; then
    verbose "No events to write"
    return
  fi

  # Group events by date and write to JSONL files
  local events_written=0
  while IFS= read -r event_entry; do
    [[ -z "$event_entry" ]] && continue
    local date_part=$(echo "$event_entry" | cut -d'|' -f1)
    local event_json=$(echo "$event_entry" | cut -d'|' -f2-)
    local event_file="$MEMORY_DIR/events-$date_part.jsonl"
    echo "$event_json" >> "$event_file"
    ((events_written++)) || true
  done < "$EVENTS_FILE"

  verbose "Total events written: $events_written"
}

regenerate_briefing() {
  log "Regenerating BRIEFING.md..."

  if $DRY_RUN; then
    verbose "DRY RUN: Would regenerate BRIEFING.md"
    return
  fi

  # Call existing briefing script
  if [[ -x "scripts/memory-briefing.sh" ]]; then
    bash scripts/memory-briefing.sh 2>/dev/null || verbose "Warning: briefing script failed"
  else
    verbose "Warning: memory-briefing.sh not found or not executable"
  fi
}

update_decisions() {
  log "Updating decisions.json with recovered decisions..."

  local decision_count=$(wc -l < "$DECISIONS_FILE" | tr -d ' ')
  if [[ "$decision_count" -eq 0 ]]; then
    verbose "No decisions to add"
    return
  fi

  if $DRY_RUN; then
    verbose "DRY RUN: Would update decisions.json"
    return
  fi

  local decisions_json_file="$MEMORY_DIR/decisions.json"

  # Initialize if needed
  if [[ ! -f "$decisions_json_file" ]] || [[ $(cat "$decisions_json_file" 2>/dev/null) == "[]" ]] || [[ ! -s "$decisions_json_file" ]]; then
    echo "[]" > "$decisions_json_file"
  fi

  local timestamp=$(date '+%Y-%m-%dT%H:%M:%S')
  local added=0

  while IFS= read -r decision; do
    [[ -z "$decision" ]] && continue

    local id="r-$(echo "$decision" | md5 2>/dev/null | head -c 8 || echo "$RANDOM")"

    # Check if already exists
    local exists=$(jq --arg d "$decision" '[.[] | select(.decision == $d)] | length' "$decisions_json_file" 2>/dev/null || echo "0")

    if [[ "$exists" == "0" ]]; then
      jq --arg id "$id" --arg d "$decision" --arg t "$timestamp" \
        '. + [{"id": $id, "decision": $d, "reason": "recovered from artifacts", "timestamp": $t, "tags": ["recovered"]}]' \
        "$decisions_json_file" > "$decisions_json_file.tmp" && \
        mv "$decisions_json_file.tmp" "$decisions_json_file"
      ((added++)) || true
      verbose "Added decision: $decision"
    fi
  done < "$DECISIONS_FILE"

  verbose "Added $added new decisions"
}

# ══════════════════════════════════════════════════════════════════════════════
# Step 8: Generate Recovery Report
# ══════════════════════════════════════════════════════════════════════════════

generate_report() {
  local artifact_count=$(wc -l < "$ARTIFACTS_FILE" | tr -d ' ')
  local decision_count=$(wc -l < "$DECISIONS_FILE" | tr -d ' ')
  local event_count=$(wc -l < "$EVENTS_FILE" | tr -d ' ')
  local warning_count=$(wc -l < "$WARNINGS_FILE" | tr -d ' ')

  echo ""
  echo "<memory_recovery>"
  echo ""
  echo "RECOVERED STATE:"
  echo "  Phase: $RECOVERED_PHASE"
  echo "  Current skill: ${RECOVERED_SKILL:-none}"

  # Build checkpoints line
  echo -n "  Checkpoints: "
  for checkpoint in $CHECKPOINT_ORDER; do
    local short_name=$(echo "$checkpoint" | cut -c1-6)
    if is_checkpoint_set "$checkpoint"; then
      echo -n "$short_name✓ "
    else
      echo -n "$short_name⏳ "
      break  # Only show up to current
    fi
  done
  echo ""
  echo ""

  echo "RECOVERED ARTIFACTS: $artifact_count"
  if [[ "$artifact_count" -gt 0 ]]; then
    while IFS= read -r artifact; do
      echo "  - $artifact"
    done < "$ARTIFACTS_FILE"
  fi
  echo ""

  if [[ "$decision_count" -gt 0 ]]; then
    echo "RECOVERED DECISIONS: $decision_count"
    head -10 "$DECISIONS_FILE" | while IFS= read -r decision; do
      echo "  - $decision"
    done
    if [[ "$decision_count" -gt 10 ]]; then
      echo "  ... and $((decision_count - 10)) more"
    fi
    echo ""
  fi

  if [[ "$warning_count" -gt 0 ]]; then
    echo "LOG WARNINGS: $warning_count"
    head -5 "$WARNINGS_FILE" | while IFS= read -r warning; do
      echo "  - $warning"
    done
    echo ""
  fi

  echo "PLAN STATUS:"
  echo "  Tasks: $PLAN_COMPLETED/$PLAN_TOTAL completed"
  echo "  Failed: $PLAN_FAILED | Skipped: $PLAN_SKIPPED"
  echo ""

  if ! $DRY_RUN; then
    echo "MEMORY FILES REGENERATED:"
    echo "  - state.json ✓"
    if [[ "$event_count" -gt 0 ]]; then
      echo "  - events-*.jsonl ✓ ($event_count events)"
    fi
    if [[ "$decision_count" -gt 0 ]]; then
      echo "  - decisions.json ✓ ($decision_count entries)"
    fi
    echo "  - BRIEFING.md ✓"
  else
    echo "DRY RUN - No files modified"
  fi

  echo ""
  echo "</memory_recovery>"
}

# ══════════════════════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════════════════════

main() {
  log "Starting memory recovery..."
  $DRY_RUN && log "DRY RUN MODE - No files will be modified"
  echo ""

  # Run all scans
  scan_artifacts
  scan_discovery
  scan_plan
  scan_technical_context
  scan_logs

  # Analyze and determine state
  determine_phase_and_skill

  # Regenerate files
  regenerate_state
  regenerate_events
  update_decisions
  regenerate_briefing

  # Output report
  generate_report

  log "Recovery complete!"
}

main
