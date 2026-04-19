---
name: genius-guard-pre-planning
description: >-
  Pre-planning checklist. Auto-invoked before genius-architect or any planning task.
  Verifies specs exist, checkpoints passed, and mode is correct.
  Do NOT use manually — this is auto-invoked by the router.
context: fork
---

# Pre-Planning Guard

Before starting any planning/architecture work, verify:

1. Read `.genius/state.json` — confirm phase is IDEATION
2. Check `SPECIFICATIONS.xml` exists (run `scripts/validate-spec.sh`)
3. Confirm specs checkpoint is approved (`checkpoints.specs_approved === true`)
4. Read `.genius/mode.json` — adjust strictness accordingly
5. If any check fails: STOP and report what's missing

## Definition of Done
- [ ] All checks passed or issues reported
- [ ] State is valid for planning phase

## Handoff
If all checks pass, proceed with the planning skill. If not, route to recovery.
