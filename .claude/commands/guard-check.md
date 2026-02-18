# Guard Check

Validate current Genius Team state and detect any deviations.

## What it does
1. Run scripts/guard-validate.sh
2. Display guard status
3. Suggest recovery actions if needed

## Usage
User says: /guard-check

## Instructions

Run the guard validation script and analyze the output:

```bash
cd /Users/benbot/genius-team && ./scripts/guard-validate.sh
```

Then read the current state:
```bash
cat /Users/benbot/genius-team/.genius-team/state.json
```

## Response Format

Display the script output, then provide a summary:

**If issues detected:**
```
⚠️ **RECOVERY NEEDED**
- Issue 1: [description from script output]
- Issue 2: [description from script output]

**Recommended action:** Run /guard-recover to restore valid state
```

**If no issues:**
```
✅ **ALL GOOD**
Project is on track with Genius Team workflow.
Current skill: [from state.json current_skill]
Current phase: [from state.json current_phase]
Next checkpoint: [from state.json or infer from phase]
```

## State File Location
`/Users/benbot/genius-team/.genius-team/state.json`

## What to Check
- All required artifacts exist for current phase
- state.json is valid JSON
- Current skill matches the phase requirements
- No orphaned or incomplete checkpoints
