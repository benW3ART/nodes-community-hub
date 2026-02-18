---
description: Initialize Genius Team v9.0 environment, load memory, and hydrate tasks
---

# /genius-start

Initialize Genius Team environment, load file-based memory, and hydrate tasks.

## Execution

### Step 1: Detect Mode

```bash
# Read current mode from config
MODE=$(jq -r '.mode // "cli"' .genius/config.json 2>/dev/null || echo "cli")
echo "Mode: $MODE"

# If no mode set, warn user
if [ "$MODE" = "null" ] || [ -z "$MODE" ]; then
  echo "⚠️  No mode configured. Run setup first:"
  echo "  ./scripts/setup.sh --mode cli   (terminal)"
  echo "  ./scripts/setup.sh --mode ide   (VS Code / Cursor)"
  exit 1
fi
```

### Step 2: Verify Environment

```bash
# Check for jq (required for memory system)
which jq 2>/dev/null || echo "WARNING: jq not found — install with: brew install jq"

# Check Claude Code
claude --version 2>/dev/null || echo "WARNING: claude CLI not in PATH"
```

### Step 3: Initialize if Needed

```bash
# Create directories
mkdir -p .genius/memory/session-logs .genius/backups

# Initialize empty memory files if missing
for f in decisions.json patterns.json progress.json errors.json; do
  [ -f ".genius/memory/$f" ] || echo '[]' > ".genius/memory/$f"
done

# Initialize state if missing
[ -f .genius/state.json ] || bash scripts/setup.sh --mode "$MODE" 2>/dev/null
```

### Step 4: Load Memory

```bash
# Regenerate BRIEFING.md from memory files
bash scripts/memory-briefing.sh 2>/dev/null

# Display briefing
cat .genius/memory/BRIEFING.md 2>/dev/null
```

### Step 5: Check for Version Updates

```bash
STORED_VER=$(cat .genius/claude-code-version.txt 2>/dev/null || echo "unknown")
CURRENT_VER=$(claude --version 2>/dev/null | head -1 || echo "unknown")
if [ "$STORED_VER" != "$CURRENT_VER" ] && [ "$CURRENT_VER" != "unknown" ]; then
  echo "🔄 Claude Code updated: $STORED_VER → $CURRENT_VER"
  echo "   Run /update-check for details."
fi
```

### Step 6: Display Status

```
╔════════════════════════════════════════════════════════════╗
║  🧠 Genius Team v9.0 — Environment Ready                   ║
║  Mode: {MODE}                                               ║
╚════════════════════════════════════════════════════════════╝

Memory: {BRIEFING.md summary}

Project State:
  Phase: {from state.json}
  Current: {currentSkill}

Tasks: {if plan.md exists, show counts}

Ready! What would you like to do?

  💡 "I want to build [idea]"     → Start new project
  📋 "/status"                    → See detailed progress
  ▶️  "continue"                  → Resume where we left off
  🔧 "/reset"                     → Start over
  💰 "/save-tokens"               → Toggle save-token mode
```

If in **IDE mode**, also show:
```
  🔧 Run "Genius: Generate Memory Briefing" task in VS Code (Cmd+Shift+P → Tasks: Run Task)
```

### Step 7: Wait for User Input

Route to appropriate skill based on response.
