---
name: genius-guard-pre-deploy
description: >-
  Pre-deployment checklist. Auto-invoked before genius-deployer.
  Verifies QA passed, security audit done, and no blocking issues.
  Do NOT use manually — this is auto-invoked by the router.
context: fork
---

# Pre-Deploy Guard

Before deploying, verify:

1. Read `.genius/state.json` — confirm QA has run
2. Check `checkpoints.qa_passed === true`
3. Check if `SECURITY-AUDIT.md` exists (recommended but not blocking)
4. Verify no `[~]` (in-progress) tasks remain in `.claude/plan.md`
5. Read `.genius/mode.json` — beginner/agency modes require security audit; pro mode warns only

## Definition of Done
- [ ] All deployment prerequisites verified
- [ ] No blocking issues remain

## Handoff
If all checks pass, proceed with genius-deployer. If not, list what's missing.
