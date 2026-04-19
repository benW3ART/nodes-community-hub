#!/usr/bin/env bash
# migrate-state.sh — Detect existing artifacts and populate state.json
# Part of Genius Team v21.0 — NEVER blocks, always produces valid state
set -euo pipefail

STATE=".genius/state.json"
NOW=$(date -Iseconds 2>/dev/null || date)

# Ensure .genius directory exists
mkdir -p .genius

# Detect origin
ORIGIN="native"
if [ "${1:-}" = "--imported" ] || [ "${1:-}" = "--import" ]; then
  ORIGIN="imported"
elif [ -f "$STATE" ]; then
  EXISTING_ORIGIN=$(jq -r '.origin // "native"' "$STATE" 2>/dev/null || echo "native")
  if [ "$EXISTING_ORIGIN" != "native" ]; then
    ORIGIN="$EXISTING_ORIGIN"
  else
    ORIGIN="upgraded"
  fi
fi

# Detect mode
MODE="builder"
if [ -f ".genius/mode.json" ]; then
  MODE=$(jq -r '.mode // "builder"' .genius/mode.json 2>/dev/null || echo "builder")
fi

# Detect phase and checkpoints by scanning for artifacts
PHASE="NOT_STARTED"
SKILL="null"
declare -A CHECKS=(
  [discovery]=false
  [market_analysis]=false
  [specs_approved]=false
  [design_chosen]=false
  [marketing_done]=false
  [integrations_done]=false
  [architecture_approved]=false
  [execution_started]=false
  [qa_passed]=false
  [security_passed]=false
  [deployed]=false
)

# Scan for artifacts in common locations
find_artifact() {
  local name="$1"
  [ -f "$name" ] || [ -f ".genius/discovery/$name" ] || [ -f ".genius/outputs/$name" ]
}

if find_artifact "DISCOVERY.xml"; then
  CHECKS[discovery]=true
  PHASE="IDEATION"
  SKILL="genius-product-market-analyst"
fi

if find_artifact "MARKET-ANALYSIS.xml"; then
  CHECKS[market_analysis]=true
  PHASE="IDEATION"
  SKILL="genius-specs"
fi

if find_artifact "SPECIFICATIONS.xml"; then
  CHECKS[specs_approved]=true
  PHASE="IDEATION"
  SKILL="genius-designer"
fi

if find_artifact "DESIGN-SYSTEM.html" || find_artifact "design-config.json"; then
  CHECKS[design_chosen]=true
  PHASE="IDEATION"
  SKILL="genius-marketer"
fi

if find_artifact "ARCHITECTURE.md"; then
  CHECKS[architecture_approved]=true
  PHASE="IDEATION"
  SKILL="genius-orchestrator"
fi

if [ -f ".claude/plan.md" ]; then
  TOTAL=$(grep -c "^- \[" .claude/plan.md 2>/dev/null || echo 0)
  COMPLETED=$(grep -c "^- \[x\]" .claude/plan.md 2>/dev/null || echo 0)
  if [ "$TOTAL" -gt 0 ]; then
    CHECKS[execution_started]=true
    PHASE="EXECUTION"
    SKILL="genius-orchestrator"
    if [ "$COMPLETED" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
      PHASE="COMPLETE"
      SKILL="genius-qa"
    fi
  fi
fi

# Build artifacts map
ARTIFACTS="{}"
for f in DISCOVERY.xml MARKET-ANALYSIS.xml SPECIFICATIONS.xml DESIGN-SYSTEM.html ARCHITECTURE.md; do
  if [ -f "$f" ]; then
    ARTIFACTS=$(echo "$ARTIFACTS" | jq --arg k "$f" --arg v "$f" '. + {($k): $v}')
  elif [ -f ".genius/discovery/$f" ]; then
    ARTIFACTS=$(echo "$ARTIFACTS" | jq --arg k "$f" --arg v ".genius/discovery/$f" '. + {($k): $v}')
  fi
done

# Build state.json
cat > "$STATE" << ENDJSON
{
  "version": "21.0.0",
  "phase": "$PHASE",
  "mode": "$MODE",
  "origin": "$ORIGIN",
  "currentSkill": $([ "$SKILL" = "null" ] && echo "null" || echo "\"$SKILL\""),
  "skillHistory": [],
  "checkpoints": {
    "discovery": ${CHECKS[discovery]},
    "market_analysis": ${CHECKS[market_analysis]},
    "specs_approved": ${CHECKS[specs_approved]},
    "design_chosen": ${CHECKS[design_chosen]},
    "marketing_done": ${CHECKS[marketing_done]},
    "integrations_done": ${CHECKS[integrations_done]},
    "architecture_approved": ${CHECKS[architecture_approved]},
    "execution_started": ${CHECKS[execution_started]},
    "qa_passed": ${CHECKS[qa_passed]},
    "security_passed": ${CHECKS[security_passed]},
    "deployed": ${CHECKS[deployed]}
  },
  "tasks": {
    "total": 0,
    "completed": 0,
    "failed": 0,
    "skipped": 0,
    "current_task_id": null
  },
  "artifacts": $ARTIFACTS,
  "agentTeams": {
    "active": false,
    "leadSessionId": null,
    "teammates": []
  },
  "created_at": "$NOW",
  "updated_at": "$NOW"
}
ENDJSON

echo "State migrated: phase=$PHASE origin=$ORIGIN mode=$MODE"
