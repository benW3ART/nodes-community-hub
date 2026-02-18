---
description: Toggle save-token mode — use Sonnet for high-volume roles instead of Opus
---

# /save-tokens

Toggle save-token mode in `.genius/config.json`.

## What It Does

When **enabled**, high-volume roles use Sonnet instead of Opus:
- `dev` → Sonnet
- `qa-micro` → Sonnet
- `debugger` → Sonnet
- `reviewer` → Sonnet

Lead, architect, interviewer, and other planning roles always stay on Opus.

## Execution

### Step 1: Read Current State

```bash
CURRENT=$(jq -r '.models.saveTokenMode' .genius/config.json 2>/dev/null || echo "false")
```

### Step 2: Toggle

```bash
if [ "$CURRENT" = "true" ]; then
  # Disable save-token mode
  jq '.models.saveTokenMode = false' .genius/config.json > .genius/config.json.tmp
  mv .genius/config.json.tmp .genius/config.json
  echo "💰 Save-token mode: OFF"
  echo "All roles now use Opus."
else
  # Enable save-token mode
  jq '.models.saveTokenMode = true' .genius/config.json > .genius/config.json.tmp
  mv .genius/config.json.tmp .genius/config.json
  echo "💰 Save-token mode: ON"
  echo "Dev, QA-micro, Debugger, Reviewer → Sonnet"
  echo "Lead, Architect, Interviewer → Opus (unchanged)"
fi
```

### Step 3: Log Decision

Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "SAVE-TOKEN MODE: [on/off]", "reason": "user toggled", "timestamp": "ISO-date", "tags": ["config", "save-tokens"]}
```

### Step 4: Confirm

Display current model assignments:
```
Current Model Assignments:
  Lead:        opus
  Architect:   opus
  Interviewer: opus
  Dev:         {opus or sonnet}
  QA-micro:    {opus or sonnet}
  Debugger:    {opus or sonnet}
  Reviewer:    {opus or sonnet}
  ...other:    opus
```
