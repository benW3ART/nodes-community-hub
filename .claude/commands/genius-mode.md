---
description: Switch Genius Team mode (beginner/builder/pro/agency)
---

# /genius-mode

Switch your Genius Team experience level.

## Execution

### Step 1: Show Current Mode

Read `.genius/mode.json` and display current mode.

### Step 2: Present Options

```
Current mode: {current}

Available modes:
  beginner  — Extra guidance, strict validation, step-by-step explanations
  builder   — Standard workflow with balanced guidance (default)
  pro       — Minimal hand-holding, fast transitions, permissive validation
  agency    — Multi-project workflow, client-friendly outputs
```

If user provided mode as argument (e.g., `/genius-mode pro`), skip to Step 3.
Otherwise, ask: "Which mode would you like?"

### Step 3: Switch Mode

Update `.genius/mode.json`:
```json
{
  "mode": "{chosen_mode}",
  "set_at": "{ISO timestamp}",
  "set_by": "user"
}
```

Update `.genius/state.json` — set `mode` field to match.

### Step 4: Confirm

Read the mode description from `configs/modes/{mode}.md` and show the greeting.
