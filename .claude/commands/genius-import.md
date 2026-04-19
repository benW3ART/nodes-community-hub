---
description: Import an existing project into Genius Team workflow
---

# /genius-import

Import an existing codebase into Genius Team without starting from scratch.

## Execution

### Step 1: Detect Existing Artifacts

Scan for common project artifacts:
```bash
ls -la README.md ARCHITECTURE.md SPECIFICATIONS.md specs.md .claude/plan.md package.json 2>/dev/null
```

### Step 2: Run Migration

```bash
bash scripts/migrate-state.sh --imported
```

This will:
- Detect existing artifacts (DISCOVERY.xml, SPECIFICATIONS.xml, ARCHITECTURE.md, plan.md)
- Set phase and checkpoints based on what exists
- Set `origin=imported` in state.json
- Produce a valid state — never blocks

### Step 3: Set Mode

If `.genius/mode.json` doesn't exist, ask the user their experience level.
Default to `builder`.

### Step 4: Show Import Summary

Display detected artifacts, phase, origin, and mode. Tell user validators will WARN (not block) for imported projects.
