---
name: genius-qa-micro
description: Quick quality check skill. Fast 30-second validation of code changes. MANDATORY after every dev task. Use for "quick check", "validate", "does this work", "test this".
context: fork
agent: genius-qa-micro
user-invocable: false
allowed-tools:
  - Read(*)
  - Glob(*)
  - Grep(*)
  - Bash(npm run lint*)
  - Bash(npm run typecheck*)
  - Bash(npx tsc*)
  - Bash(npx eslint*)
hooks:
  Stop:
    - type: command
      command: "bash -c 'echo \"QA-MICRO COMPLETE: $(date)\" >> .genius/qa.log 2>/dev/null || true'"
      once: true
---

# Genius QA Micro v9.0 — Rapid Validation

**Lightning-fast quality checks in 30 seconds or less. MANDATORY after every task.**

## Memory Integration

### On Check Start
Read `@.genius/memory/BRIEFING.md` for project context and known issues.

### On Issue Found
Append to `.genius/memory/errors.json`:
```json
{"id": "e-XXX", "error": "QA-MICRO: [issue] in [file]", "solution": "pending fix", "timestamp": "ISO-date", "tags": ["qa-micro", "issue"]}
```

### On Pass
No memory write needed for routine passes.

---

## Speed Commitment

```
30 SECONDS MAX

- Syntax check: 5 seconds
- Type check: 10 seconds
- Pattern scan: 10 seconds
- Smoke test: 5 seconds
```

---

## Micro-Check Pipeline

1. **Syntax Check** — TypeScript/ESLint errors
2. **Type Check** — `tsc --noEmit`
3. **Critical Patterns** — Security anti-patterns, common bugs
4. **Smoke Test** — Does it build? No runtime errors?

### Quick Commands
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
npx eslint . --quiet --max-warnings 0 2>&1 | head -10
grep -rn "eval\|innerHTML\|dangerouslySetInnerHTML" src/ --include="*.ts" --include="*.tsx" | head -5
grep -rn "sk_live\|password\s*=\s*['\"]" src/ --include="*.ts" | head -5
```

---

## Response Formats

### Pass
```
QA PASS (18s)
- TypeScript: No errors
- ESLint: Clean
- Patterns: No issues
- Build: Success
Ready for next task.
```

### Fail
```
QA FAIL (24s)
Issues:
- [issue 1 with file:line]
- [issue 2 with file:line]
Fix required before continuing.
```

---

## Escalation Rules

Escalate to genius-qa when:
- Build completely broken
- More than 5 issues found
- Security vulnerability detected
- User requests full QA

---

## Handoffs

### From genius-orchestrator
Receives: Just-completed task, files modified. MANDATORY after every dev task.

### To genius-debugger
Provides: Specific error found, file and line number

### To genius-qa (escalation)
Provides: Issues found, files checked, reason for escalation
