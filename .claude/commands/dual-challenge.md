# /dual-challenge — Trigger Challenger Review

Manually invoke the Challenger to review current work, even outside a normal build-review cycle.

## Instructions

1. Read `.genius/dual-state.json` to get challenger config (model, profile). Create with defaults if missing.
2. Gather current work context:
   - Read recent git diff (`git diff HEAD~1` or staged changes)
   - Read `.claude/plan.md` for current task context
   - Read any recently modified files (check `.genius/activity.log`)
3. Write a review request to `.genius/dual-review-request.md` with:
   - Summary of current changes
   - Files modified
   - Context from plan.md
4. Spawn the `genius-challenger` agent (via Task) to perform the review:
   - Pass the review request
   - Apply the configured challenger profile
   - Challenger writes verdict to `.genius/dual-verdict.md`
5. Read and display the verdict to the user
6. Update `.genius/dual-state.json` with the result

## Arguments

You can specify a profile override: `/dual-challenge strict` or `/dual-challenge lenient`

If no argument is given, use the profile from `DUAL_CHALLENGER_PROFILE` env var (default: `balanced`).
