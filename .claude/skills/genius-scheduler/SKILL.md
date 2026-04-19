---
name: genius-scheduler
description: >-
  Configures recurring tasks using Claude Code /loop and scheduled triggers.
  Provides templates for common patterns: PR review cycles, deploy monitoring, daily summaries,
  test watching, and autoresearch loops. Use when user says "schedule a task", "recurring check",
  "run every X minutes", "monitor continuously", "setup cron", "watch for changes",
  "periodic review", "scheduled task", "babysit", "poll for".
  Do NOT use for one-time task execution (just run the command directly).
  Do NOT use for CI/CD pipelines (use genius-ci).
  Do NOT use for deployment monitoring (use genius-deployer).
context: fork
agent: genius-scheduler
user-invocable: false
allowed-tools:
  - Read(*)
  - Glob(*)
  - Grep(*)
  - Write(*)
  - Edit(*)
  - Bash(jq *)
  - Bash(cat *)
  - Bash(date *)
---

# Genius Scheduler v20.0 — Recurring Task Configuration

**Sets up /loop tasks and remote triggers for automated recurring workflows. Templates for common patterns.**

## Memory Integration

### On Schedule Created
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "SCHEDULED: [task] every [interval]", "reason": "[rationale]", "timestamp": "ISO-date", "tags": ["scheduler", "recurring"]}
```

---

## Available Scheduling Methods

### Method 1: /loop (In-Session Recurring)
Runs a command every N minutes within the current session.

```
/loop 5m /genius-qa-micro          # QA check every 5 min
/loop 10m check deploy status      # Deploy monitoring
/loop 30m summarize git changes    # Activity digest
/loop 2m run tests                 # Continuous test watch
```

Constraints: active while session runs, min 30s interval, stops on session end or `STOP`.

### Method 2: Remote Triggers (Persistent Scheduled)
Runs on cron schedule even without active session (requires Max/Team plan).

```bash
claude trigger create --name "daily-summary" --schedule "0 9 * * *" --prompt "Generate daily summary"
claude trigger create --name "pr-review" --schedule "*/30 * * * *" --prompt "Review open PRs"
```

---

## Task Templates

### Template 1: PR Review Cycle
Every 30min during work hours. Check open PRs, run code review on new ones.

### Template 2: Deploy Watch
Every 5min for 30min post-deploy. Check health endpoint, error rates, response times.

### Template 3: Daily Summary
Daily at 9 AM via remote trigger. Git activity, open issues, PR status.

### Template 4: Test Watcher
Every 2min during dev. Run tests on changed files, report failures immediately.

### Template 5: Autoresearch Loop
Every 10min. Run optimization cycle, evaluate, keep or revert.

---

## Configuration Protocol

1. Identify task type: what, how often, session-only or persistent?
2. Select method: in-session -> `/loop`, persistent -> remote trigger
3. Generate config in `.genius/schedules.json`
4. Activate: provide /loop command or create trigger

---

## Handoffs

### From genius-orchestrator
Receives: Recurring monitoring request during execution

### From genius-deployer
Receives: Post-deploy monitoring request

### To genius-qa-micro
Provides: Recurring QA check configuration

---

## Definition of Done

- [ ] Task type identified (loop vs trigger)
- [ ] Template selected or custom config created
- [ ] Configuration written to `.genius/schedules.json`
- [ ] Activation command provided to user
- [ ] Stop/cancel instructions documented
- [ ] Memory decision logged
