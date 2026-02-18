#!/usr/bin/env bash
#
# memory-capture.sh - Capture structured memory events for Genius Team
#
# Usage: ./scripts/memory-capture.sh <type> <content> [metadata_json]
#
# Types: decision, action, error, pattern, milestone, conversation, artifact, checkpoint
#
# Examples:
#   ./scripts/memory-capture.sh decision "Use PostgreSQL over MongoDB" '{"reason":"ACID compliance","alternatives":["MongoDB","SQLite"]}'
#   ./scripts/memory-capture.sh error "Build failed" '{"cause":"missing dep","solution":"npm install"}'
#   ./scripts/memory-capture.sh milestone "Discovery phase completed"
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get icon for event type
get_type_icon() {
    case "$1" in
        decision)     echo "🎯" ;;
        action)       echo "⚡" ;;
        error)        echo "❌" ;;
        pattern)      echo "🔄" ;;
        milestone)    echo "🏆" ;;
        conversation) echo "💬" ;;
        artifact)     echo "📦" ;;
        checkpoint)   echo "✅" ;;
        *)            echo "📝" ;;
    esac
}

# Valid event types
VALID_TYPES="decision action error pattern milestone conversation artifact checkpoint"

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
    # Fallback to genius-team directory
    if [[ -d "/Users/benbot/genius-team/.genius" ]]; then
        echo "/Users/benbot/genius-team"
        return 0
    fi
    return 1
}

# Generate unique event ID
generate_event_id() {
    local timestamp=$(date +%s%N 2>/dev/null || date +%s)
    local random=$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 6 2>/dev/null || echo "$$")
    echo "evt-${timestamp}-${random}"
}

# Get current skill and phase from state.json
get_current_state() {
    local state_file="$1"
    local skill="null"
    local phase="unknown"
    
    if [[ -f "$state_file" ]]; then
        skill=$(jq -r '.currentSkill // "null"' "$state_file" 2>/dev/null || echo "null")
        phase=$(jq -r '.phase // "unknown"' "$state_file" 2>/dev/null || echo "unknown")
    fi
    
    echo "$skill|$phase"
}

# Validate event type
validate_type() {
    local type="$1"
    for valid in $VALID_TYPES; do
        [[ "$type" == "$valid" ]] && return 0
    done
    return 1
}

# Get legacy file for event type
get_legacy_file() {
    local type="$1"
    case "$type" in
        decision)    echo "decisions.json" ;;
        error)       echo "errors.json" ;;
        pattern)     echo "patterns.json" ;;
        milestone|checkpoint) echo "progress.json" ;;
        *)           echo "" ;;  # No legacy file for action, conversation, artifact
    esac
}

# Append to legacy JSON array file
append_to_legacy() {
    local legacy_file="$1"
    local event_json="$2"
    
    [[ -z "$legacy_file" ]] && return 0
    [[ ! -f "$legacy_file" ]] && echo "[]" > "$legacy_file"
    
    # Read current array, append event, write back
    local current
    current=$(cat "$legacy_file" 2>/dev/null || echo "[]")
    
    # Handle empty or invalid JSON
    if [[ "$current" == "" ]] || ! echo "$current" | jq '.' >/dev/null 2>&1; then
        current="[]"
    fi
    
    # Append to array
    echo "$current" | jq --argjson evt "$event_json" '. + [$evt]' > "$legacy_file.tmp" && \
        mv "$legacy_file.tmp" "$legacy_file"
}

# Extract tags from content and metadata
extract_tags() {
    local type="$1"
    local content="$2"
    local metadata="$3"
    
    local tags="[\"$type\"]"
    
    # Add skill as tag if present
    local skill="$4"
    if [[ "$skill" != "null" && "$skill" != "" ]]; then
        tags=$(echo "$tags" | jq --arg s "$skill" '. + [$s]')
    fi
    
    # Extract hashtags from content
    local hashtags=$(echo "$content" | grep -oE '#[a-zA-Z0-9_]+' | tr -d '#' | tr '\n' ' ')
    for tag in $hashtags; do
        tags=$(echo "$tags" | jq --arg t "$tag" '. + [$t] | unique')
    done
    
    echo "$tags"
}

# Main function
main() {
    # Check arguments
    if [[ $# -lt 2 ]]; then
        echo -e "${RED}Error: Missing arguments${NC}"
        echo "Usage: $0 <type> <content> [metadata_json]"
        echo "Types: $VALID_TYPES"
        exit 1
    fi
    
    local event_type="$1"
    local content="$2"
    local metadata="${3:-"{}"}"
    
    # Validate type
    if ! validate_type "$event_type"; then
        echo -e "${RED}Error: Invalid event type '${event_type}'${NC}"
        echo "Valid types: $VALID_TYPES"
        exit 1
    fi
    
    # Validate metadata is valid JSON
    if ! echo "$metadata" | jq '.' >/dev/null 2>&1; then
        echo -e "${YELLOW}Warning: Invalid metadata JSON, using empty object${NC}"
        metadata="{}"
    fi
    
    # Find project root
    local project_root
    if ! project_root=$(find_project_root); then
        echo -e "${RED}Error: Cannot find .genius directory${NC}"
        exit 1
    fi
    
    local genius_dir="$project_root/.genius"
    local memory_dir="$genius_dir/memory"
    local events_dir="$memory_dir/events"
    local state_file="$genius_dir/state.json"
    
    # Create events directory if needed
    mkdir -p "$events_dir"
    
    # Get current state
    local state_info
    state_info=$(get_current_state "$state_file")
    local skill=$(echo "$state_info" | cut -d'|' -f1)
    local phase=$(echo "$state_info" | cut -d'|' -f2)
    
    # Generate event data
    local event_id=$(generate_event_id)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local session_id="${GENIUS_SESSION_ID:-$(date +%Y%m%d)-default}"
    local today=$(date +"%Y-%m-%d")
    
    # Extract tags
    local tags
    tags=$(extract_tags "$event_type" "$content" "$metadata" "$skill")
    
    # Build event JSON (compact for JSONL)
    local event_json
    event_json=$(jq -nc \
        --arg id "$event_id" \
        --arg type "$event_type" \
        --arg ts "$timestamp" \
        --arg sid "$session_id" \
        --arg skill "$skill" \
        --arg phase "$phase" \
        --arg content "$content" \
        --argjson meta "$metadata" \
        --argjson tags "$tags" \
        '{
            id: $id,
            type: $type,
            timestamp: $ts,
            session_id: $sid,
            skill: (if $skill == "null" then null else $skill end),
            phase: $phase,
            content: $content,
            metadata: $meta,
            tags: $tags
        }')
    
    # Append to daily JSONL file
    local events_file="$events_dir/events-${today}.jsonl"
    echo "$event_json" >> "$events_file"
    
    # Append to legacy file if applicable
    local legacy_filename
    legacy_filename=$(get_legacy_file "$event_type")
    if [[ -n "$legacy_filename" ]]; then
        local legacy_file="$memory_dir/$legacy_filename"
        append_to_legacy "$legacy_file" "$event_json"
    fi
    
    # Output summary
    local icon=$(get_type_icon "$event_type")
    echo -e "${GREEN}${icon} Event captured${NC}"
    echo -e "   ${CYAN}ID:${NC}      $event_id"
    echo -e "   ${CYAN}Type:${NC}    $event_type"
    echo -e "   ${CYAN}Phase:${NC}   $phase"
    if [[ "$skill" != "null" ]]; then
        echo -e "   ${CYAN}Skill:${NC}   $skill"
    fi
    echo -e "   ${CYAN}Content:${NC} ${content:0:60}$([ ${#content} -gt 60 ] && echo '...')"
    echo -e "   ${CYAN}File:${NC}    events-${today}.jsonl"
}

# Run main
main "$@"
