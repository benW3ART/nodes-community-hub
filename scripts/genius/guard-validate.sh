#!/bin/bash
#
# guard-validate.sh - Validate checkpoints and artifacts coherence
# Part of the Genius Team guard system
# Compatible with bash 3.2+ (macOS default)
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Find project root (where .genius exists)
find_project_root() {
    local dir="$PWD"
    while [[ "$dir" != "/" ]]; do
        if [[ -d "$dir/.genius" ]]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

PROJECT_ROOT=$(find_project_root) || {
    echo -e "${RED}ERROR: No .genius directory found. Run from a genius project.${NC}" >&2
    exit 1
}

STATE_FILE="$PROJECT_ROOT/.genius/state.json"
OUTPUTS_DIR="$PROJECT_ROOT/.genius/outputs"
PLAYGROUNDS_DIR="$PROJECT_ROOT/.genius/playgrounds"

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo -e "${RED}ERROR: jq is required but not installed.${NC}" >&2
    exit 1
fi

# Check state file exists
if [[ ! -f "$STATE_FILE" ]]; then
    echo -e "${RED}ERROR: state.json not found at $STATE_FILE${NC}" >&2
    exit 1
fi

# ============================================================================
# MAPPING FUNCTIONS (bash 3.2 compatible)
# ============================================================================

# Checkpoint to artifact mapping
get_artifact_for_checkpoint() {
    case "$1" in
        discovery) echo "DISCOVERY.html" ;;
        market_analysis) echo "MARKET-ANALYSIS.html" ;;
        specs_approved) echo "SPECIFICATIONS.html" ;;
        design_chosen) echo "DESIGN-SYSTEM.html" ;;
        marketing_done) echo "MARKETING-BRIEF.html" ;;
        integrations_done) echo "INTEGRATIONS.html" ;;
        architecture_approved) echo "ARCHITECTURE.html" ;;
        execution_started) echo "EXECUTION-PLAN.html" ;;
        qa_passed) echo "QA-REPORT.html" ;;
        security_passed) echo "SECURITY-AUDIT.html" ;;
        deployed) echo "DEPLOYMENT-REPORT.html" ;;
        *) echo "" ;;
    esac
}

# Checkpoint to phase mapping
get_phase_for_checkpoint() {
    case "$1" in
        discovery|market_analysis|specs_approved) echo "ideation" ;;
        design_chosen|marketing_done|integrations_done) echo "design" ;;
        architecture_approved) echo "planning" ;;
        execution_started) echo "execution" ;;
        qa_passed|security_passed) echo "validation" ;;
        deployed) echo "deployment" ;;
        *) echo "" ;;
    esac
}

# Skill to checkpoint mapping
get_checkpoint_for_skill() {
    case "$1" in
        genius-discovery) echo "discovery" ;;
        genius-market) echo "market_analysis" ;;
        genius-specs) echo "specs_approved" ;;
        genius-design) echo "design_chosen" ;;
        genius-marketing) echo "marketing_done" ;;
        genius-integrations) echo "integrations_done" ;;
        genius-architect) echo "architecture_approved" ;;
        genius-dev) echo "execution_started" ;;
        genius-qa) echo "qa_passed" ;;
        genius-security) echo "security_passed" ;;
        genius-deploy) echo "deployed" ;;
        *) echo "" ;;
    esac
}

# Checkpoint to skill mapping
get_skill_for_checkpoint() {
    case "$1" in
        discovery) echo "genius-discovery" ;;
        market_analysis) echo "genius-market" ;;
        specs_approved) echo "genius-specs" ;;
        design_chosen) echo "genius-design" ;;
        marketing_done) echo "genius-marketing" ;;
        integrations_done) echo "genius-integrations" ;;
        architecture_approved) echo "genius-architect" ;;
        execution_started) echo "genius-dev" ;;
        qa_passed) echo "genius-qa" ;;
        security_passed) echo "genius-security" ;;
        deployed) echo "genius-deploy" ;;
        *) echo "" ;;
    esac
}

# ============================================================================
# READ STATE
# ============================================================================
PHASE=$(jq -r '.phase // "NOT_STARTED"' "$STATE_FILE")
CURRENT_SKILL=$(jq -r '.currentSkill // "null"' "$STATE_FILE")
[[ "$CURRENT_SKILL" == "null" ]] && CURRENT_SKILL=""

# ============================================================================
# COLLECT DATA
# ============================================================================
ERRORS=""
WARNINGS=""
MISSING_PLAYGROUNDS=""
CHECKPOINT_STATUS=""
ARTIFACT_STATUS=""

# Ordered list of checkpoints
CHECKPOINTS="discovery market_analysis specs_approved design_chosen marketing_done integrations_done architecture_approved execution_started qa_passed security_passed deployed"

# Check each checkpoint
for checkpoint in $CHECKPOINTS; do
    is_validated=$(jq -r ".checkpoints.$checkpoint // false" "$STATE_FILE")
    artifact=$(get_artifact_for_checkpoint "$checkpoint")
    artifact_path="$OUTPUTS_DIR/$artifact"
    
    if [[ "$is_validated" == "true" ]]; then
        # Checkpoint is validated - artifact MUST exist
        if [[ -f "$artifact_path" ]]; then
            CHECKPOINT_STATUS="$CHECKPOINT_STATUS ${checkpoint}✓"
            ARTIFACT_STATUS="$ARTIFACT_STATUS
  ✓ .genius/outputs/$artifact"
        else
            CHECKPOINT_STATUS="$CHECKPOINT_STATUS ${checkpoint}✗"
            ARTIFACT_STATUS="$ARTIFACT_STATUS
  ✗ .genius/outputs/$artifact (MISSING - checkpoint validated!)"
            ERRORS="$ERRORS
  ERROR: Checkpoint '$checkpoint' is validated but artifact '$artifact' is MISSING"
        fi
    else
        # Checkpoint not validated
        if [[ -f "$artifact_path" ]]; then
            # Artifact exists but checkpoint not validated - warning
            CHECKPOINT_STATUS="$CHECKPOINT_STATUS ${checkpoint}⚠"
            ARTIFACT_STATUS="$ARTIFACT_STATUS
  ⚠ .genius/outputs/$artifact (exists but checkpoint not validated)"
            WARNINGS="$WARNINGS
  WARNING: Artifact '$artifact' exists but checkpoint '$checkpoint' is not validated"
        else
            CHECKPOINT_STATUS="$CHECKPOINT_STATUS ${checkpoint}⏳"
            ARTIFACT_STATUS="$ARTIFACT_STATUS
  ⏳ .genius/outputs/$artifact (pending)"
        fi
    fi
done

# Check skill/phase coherence
if [[ -n "$CURRENT_SKILL" && "$PHASE" != "NOT_STARTED" ]]; then
    skill_checkpoint=$(get_checkpoint_for_skill "$CURRENT_SKILL")
    if [[ -n "$skill_checkpoint" ]]; then
        expected_phase=$(get_phase_for_checkpoint "$skill_checkpoint")
        if [[ "$expected_phase" != "$PHASE" ]]; then
            WARNINGS="$WARNINGS
  WARNING: Current skill '$CURRENT_SKILL' belongs to phase '$expected_phase' but current phase is '$PHASE'"
        fi
    fi
fi

# Check playgrounds
EXPECTED_PLAYGROUNDS="discovery market specs design marketing integrations architecture dev qa security deploy"

for pg in $EXPECTED_PLAYGROUNDS; do
    pg_dir="$PLAYGROUNDS_DIR/$pg"
    if [[ ! -d "$pg_dir" ]]; then
        MISSING_PLAYGROUNDS="$MISSING_PLAYGROUNDS $pg"
    fi
done

# ============================================================================
# DETERMINE NEXT ACTION
# ============================================================================
determine_next_action() {
    # If there are errors, suggest recovery first
    if [[ -n "$ERRORS" ]]; then
        echo "⚠️  FIX ISSUES FIRST: Run recovery to regenerate missing artifacts"
        return
    fi
    
    # Find the first incomplete checkpoint
    for checkpoint in $CHECKPOINTS; do
        is_validated=$(jq -r ".checkpoints.$checkpoint // false" "$STATE_FILE")
        if [[ "$is_validated" != "true" ]]; then
            artifact=$(get_artifact_for_checkpoint "$checkpoint")
            skill=$(get_skill_for_checkpoint "$checkpoint")
            echo "Continue with $skill → generate $artifact"
            return
        fi
    done
    
    echo "All checkpoints complete! 🎉"
}

NEXT_ACTION=$(determine_next_action)

# ============================================================================
# OUTPUT
# ============================================================================
echo "<guard_status>"
echo "PHASE: $PHASE"
echo "CURRENT_SKILL: ${CURRENT_SKILL:-none}"
echo ""
echo "CHECKPOINTS:$CHECKPOINT_STATUS"
echo ""
echo "ARTIFACTS:$ARTIFACT_STATUS"
echo ""

# Issues section
if [[ -z "$ERRORS" && -z "$WARNINGS" ]]; then
    echo "ISSUES: none"
else
    echo "ISSUES:$ERRORS$WARNINGS"
fi

# Missing playgrounds
if [[ -n "$MISSING_PLAYGROUNDS" ]]; then
    echo ""
    echo "MISSING_PLAYGROUNDS:$MISSING_PLAYGROUNDS"
fi

echo ""
echo "NEXT_ACTION: $NEXT_ACTION"
echo "</guard_status>"

# ============================================================================
# RECOVERY SUGGESTIONS
# ============================================================================
if [[ -n "$ERRORS" || -n "$WARNINGS" ]]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}RECOVERY SUGGESTIONS:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Parse errors for missing artifacts
    for checkpoint in $CHECKPOINTS; do
        is_validated=$(jq -r ".checkpoints.$checkpoint // false" "$STATE_FILE")
        artifact=$(get_artifact_for_checkpoint "$checkpoint")
        artifact_path="$OUTPUTS_DIR/$artifact"
        
        if [[ "$is_validated" == "true" && ! -f "$artifact_path" ]]; then
            skill=$(get_skill_for_checkpoint "$checkpoint")
            echo ""
            echo -e "${YELLOW}Issue:${NC} Checkpoint '$checkpoint' validated but '$artifact' missing"
            echo -e "${GREEN}Fix options:${NC}"
            echo "  1. Re-run the skill to regenerate the artifact:"
            echo "     genius run $skill"
            echo "  2. Or reset the checkpoint if artifact shouldn't exist:"
            echo "     jq '.checkpoints.$checkpoint = false' \"$STATE_FILE\" | sponge \"$STATE_FILE\""
            echo "     # Or: jq '.checkpoints.$checkpoint = false' \"$STATE_FILE\" > tmp.json && mv tmp.json \"$STATE_FILE\""
        fi
        
        if [[ "$is_validated" != "true" && -f "$artifact_path" ]]; then
            echo ""
            echo -e "${YELLOW}Issue:${NC} Artifact '$artifact' exists but checkpoint '$checkpoint' not validated"
            echo -e "${GREEN}Fix:${NC} Validate the checkpoint if artifact is correct:"
            echo "     jq '.checkpoints.$checkpoint = true' \"$STATE_FILE\" | sponge \"$STATE_FILE\""
        fi
    done
    
    # Skill/phase mismatch
    if [[ -n "$CURRENT_SKILL" && "$PHASE" != "NOT_STARTED" ]]; then
        skill_checkpoint=$(get_checkpoint_for_skill "$CURRENT_SKILL")
        if [[ -n "$skill_checkpoint" ]]; then
            expected_phase=$(get_phase_for_checkpoint "$skill_checkpoint")
            if [[ "$expected_phase" != "$PHASE" ]]; then
                echo ""
                echo -e "${YELLOW}Issue:${NC} Skill/phase mismatch"
                echo -e "${GREEN}Fix:${NC} Update phase in state.json:"
                echo "     jq '.phase = \"$expected_phase\"' \"$STATE_FILE\" | sponge \"$STATE_FILE\""
                echo "  Or switch to a skill appropriate for phase '$PHASE'"
            fi
        fi
    fi
    
    # Missing playgrounds
    if [[ -n "$MISSING_PLAYGROUNDS" ]]; then
        echo ""
        echo -e "${YELLOW}Issue:${NC} Missing playground directories"
        echo -e "${GREEN}Fix:${NC} Create missing playgrounds:"
        for pg in $MISSING_PLAYGROUNDS; do
            echo "     mkdir -p \"$PLAYGROUNDS_DIR/$pg\""
        done
    fi
    
    echo ""
fi

# Exit code based on errors
if [[ -n "$ERRORS" ]]; then
    exit 1
else
    exit 0
fi
