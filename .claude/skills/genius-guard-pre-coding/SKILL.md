---
name: genius-guard-pre-coding
description: >-
  Pre-coding checklist. Auto-invoked before genius-dev or any implementation task.
  Verifies architecture approved, plan.md exists, and mode permits coding.
  Do NOT use manually — this is auto-invoked by the router.
context: fork
---

# Pre-Coding Guard

Before starting any implementation work, verify:

1. Read `.genius/state.json` — confirm phase is EXECUTION
2. Check `ARCHITECTURE.md` exists (run `scripts/validate-architecture.sh`)
3. Check `.claude/plan.md` exists with tasks (run `scripts/validate-plan.sh`)
4. Confirm architecture checkpoint approved (`checkpoints.architecture_approved === true`)
5. Read `.genius/mode.json` — beginner mode requires all checks; pro mode warns only

## Definition of Done
- [ ] All checks passed or issues reported
- [ ] Ready for genius-dev to begin implementation

## Handoff
If all checks pass, proceed with genius-dev. If not, route to recovery.
