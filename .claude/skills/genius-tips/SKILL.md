---
name: genius-tips
description: >-
  Displays contextual tips about Genius Team skills while the user waits for development.
  Called automatically by other skills during long-running operations (builds, deploys, tests).
  Shows 1-2 sentence tips about relevant skills the user might not know about.
  Use when: a long task is running and user is waiting, user says "tips", "what else can you do",
  "show me features", "help me discover".
  Do NOT use as the primary skill for any task.
context: fork
agent: genius-tips
user-invocable: true
allowed-tools:
  - Read(*)
  - Glob(*)
---

# Genius Tips v21.0 — Contextual Skill Discovery

**Shows short, useful tips about Genius Team skills while the user waits. Turns passive waiting time into learning time.**

## When to Show Tips

Any skill can call genius-tips during idle moments:
- While waiting for `npm run build` (10-30s)
- While waiting for `npx tsc` (5-15s)
- While tests are running (10-60s)
- While deploying (30-120s)
- During git operations
- While waiting for CI

## How to Display Tips

Show ONE tip at a time, formatted as:

```
💡 **Genius Tip:** Did you know genius-designer can generate full HTML mockups? Just say "/genius-designer dark dashboard for my project" and get an interactive preview!
```

Keep tips:
- 1-2 sentences max
- Actionable (tell HOW to use the skill)
- Relevant to what the user is currently doing
- Non-repetitive (track shown tips in memory)

## Tip Database

### For Dev Tasks (while building/testing)
- 💡 `genius-qa-micro` runs in 30 seconds. After any code change, say "quick check" to catch bugs before they compound.
- 💡 `genius-code-review` uses 3 parallel agents (bugs + security + quality). Try "/genius-code-review" on your next PR.
- 💡 `genius-performance` can run Lighthouse audits and fix Core Web Vitals. Just say "check performance".
- 💡 `genius-experiments` runs autoresearch loops — it'll optimize your code autonomously over multiple iterations.
- 💡 You can use `/loop 2m /genius-qa-micro` for continuous quality monitoring while you code.

### For Design Tasks
- 💡 `genius-designer` generates full interactive HTML mockups, not just descriptions. Say "design a login page" and get clickable HTML.
- 💡 `genius-accessibility` checks WCAG 2.2 AA compliance. Run it before shipping any UI changes.
- 💡 `genius-i18n` can extract all hardcoded strings and set up i18n in one pass.

### For Architecture Tasks
- 💡 `genius-architect` recommends specific dev sub-skills based on your project type (frontend, backend, mobile, DB, API).
- 💡 `genius-specs` creates full technical specifications. Start big tasks with "/genius-specs" to avoid rework.
- 💡 `genius-template` can bootstrap entire project structures (SaaS, e-commerce, mobile, web3).

### For Content/Marketing Tasks
- 💡 `genius-seo` does GEO-first SEO — optimizes for AI search (ChatGPT, Perplexity, Claude) plus traditional Google.
- 💡 `genius-content` writes blog posts, newsletters, and social threads with your brand voice.
- 💡 `genius-copywriter` specializes in conversion copy — landing pages, CTAs, email sequences.

### For Deployment/Ops Tasks
- 💡 `genius-scheduler` can set up `/loop` recurring tasks: PR reviews every 30m, deploy watches, daily summaries.
- 💡 `genius-ci` generates GitHub Actions workflows with AI-powered PR review built in.
- 💡 `genius-deployer` handles Vercel, Railway, Fly.io, and more. Just say "deploy to [platform]".

### For Security Tasks
- 💡 `genius-security` scans for vulnerabilities and suggests fixes. Run it before any release.
- 💡 Auto Mode is built into all modes. Say "tune auto mode" to adjust what gets auto-approved.

### General Discovery
- 💡 There are 51 specialized skills in Genius Team v21. Say "list skills" to see them all.
- 💡 Skills chain automatically: genius-specs → genius-dev → genius-qa-micro → genius-code-review.
- 💡 Use `/effort low` for quick answers, `/effort high` for deep analysis.
- 💡 Voice mode works with all skills. Hold spacebar and talk instead of typing.
- 💡 Computer Use lets genius-ui-tester click through your app and find visual bugs automatically.
- 💡 `.genius/workflows.json` defines the entire workflow graph — prerequisites, outputs, and next steps for every skill.
- 💡 Session logs in `.genius/session-log.jsonl` let you recover state after crashes. Run `scripts/session-recover.sh`.
- 💡 `/genius-import` brings an existing codebase into Genius Team — detects artifacts and sets checkpoints automatically.
- 💡 `/genius-mode` switches between beginner, builder, pro, and agency modes — each adjusts validation and verbosity.

## Memory Integration

### Track Shown Tips
After showing a tip, append to `.genius/memory/tips-shown.json`:
```json
{"tip": "genius-qa-micro 30s", "context": "during build", "timestamp": "ISO-date"}
```

Read this file before showing tips to avoid repeats.

## Integration Pattern for Other Skills

Any skill can show a tip during wait time:
```
# While running a build:
echo "Building... ⏳"
# [genius-tips shows a relevant tip here]
echo "✅ Build complete!"
```

The orchestrator or active skill should call genius-tips when:
1. A command is running that takes >5 seconds
2. The user hasn't interacted in >10 seconds
3. There's a natural pause in the workflow

## Definition of Done
- [ ] Tip displayed during wait time
- [ ] Tip was relevant to current context
- [ ] Tip was not repeated
- [ ] Tip was actionable (told user HOW to use the skill)

## Handoff
After showing tip: return control to the calling skill. genius-tips never takes over the workflow.
