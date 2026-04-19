---
name: genius-auto
description: >-
  Configures and tunes Auto Mode settings within the current mode (CLI/IDE/Omni/Dual).
  Auto Mode is built into all modes by default — this skill adjusts safety profiles
  per project needs. Use when user says "tune auto mode", "make it more permissive",
  "tighten permissions", "configure auto approve", "safety settings", "I want less prompts".
  Do NOT use for CI/CD pipelines (use genius-ci).
  Do NOT use for scheduled tasks (use genius-scheduler).
context: fork
agent: genius-auto
user-invocable: true
allowed-tools:
  - Read(*)
  - Glob(*)
  - Grep(*)
  - Write(*)
  - Edit(*)
  - Bash(jq *)
  - Bash(cat *)
---

# Genius Auto v20.0 — Auto Mode Tuning

**Tunes Auto Mode safety profiles within your current mode. Auto Mode is ON by default in all modes — this skill adjusts how aggressive it is.**

Auto Mode is NOT a separate mode. It's a layer inside CLI/IDE/Omni/Dual that auto-approves safe actions.

## How It Works

Auto Mode is already active via `CLAUDE_CODE_AUTO_MODE=skill-aware` in all mode configs. This skill helps you:
1. Check your current auto mode profile
2. Switch between safety profiles (permissive/standard/restrictive)
3. Add custom allow/deny rules per project

## Memory Integration

### On Start
Read `@.genius/memory/BRIEFING.md` for project context and current mode.

### On Configuration Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "AUTO-MODE: tuned to [profile] for [reason]", "timestamp": "ISO-date"}
```

---

## Safety Profiles

### Permissive
Best for: content projects, prototyping, solo dev
Auto-approves: file read/write, lint, test, git add/commit, npm install
Requires approval: git push, deploy, production DB, env vars

### Standard (default)
Best for: team projects, active development
Auto-approves: file read/write, lint, test, npm install
Requires approval: git operations, deploy, CI config, DB migrations

### Restrictive
Best for: production, infrastructure, security-sensitive
Auto-approves: file reads, dry-run commands, .genius/ outputs
Requires approval: ALL writes, git, deploy, build, secrets

## Tuning Commands

To change profile, update the mode config:
```bash
# In settings.json for your mode:
"env": { "CLAUDE_CODE_AUTO_MODE": "permissive" | "standard" | "skill-aware" | "restrictive" }
```

Or use conditional hooks (Claude Code 2.1.85+):
```json
{
  "hooks": {
    "PreToolUse": [{
      "type": "command",
      "if": "Bash(git push*)",
      "command": "echo 'CONFIRM: pushing to remote'"
    }]
  }
}
```

## Definition of Done
- [ ] Current auto mode profile identified
- [ ] Profile adjusted per user preference
- [ ] Settings written to mode config
- [ ] User informed of what's auto-approved vs gated

## Handoff
After tuning: return to current task. No further action needed.
