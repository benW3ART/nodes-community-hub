---
name: genius-qa
description: >-
  Full quality audit skill. Tests functionality, validates against specs, checks edge cases,
  and produces a QA report. Use when implementation is complete and user says "run QA",
  "test everything", "quality audit", "validate the build", "check if it works".
  Do NOT use for micro-validation during coding — use genius-qa-micro instead.
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- Report: `QA-REPORT.md`
- Unified State: `.genius/outputs/state.json` (with `phases.qa` populated)

**Before transitioning to next skill:**
1. Verify QA-REPORT.md exists
2. Verify state.json has qa phase data
3. Update `currentPhase` to next phase
4. Announce transition

**If artifacts missing:** DO NOT proceed. Generate them first.

---

## Unified Dashboard Integration

**DO NOT launch separate HTML files.** Update the unified state instead.

### On Phase Start
Update `.genius/outputs/state.json`:
```json
{
  "currentPhase": "qa",
  "phases": {
    "qa": {
      "status": "in-progress",
      "data": {
        "modules": [],
        "testRuns": [],
        "coverage": 0,
        "passRate": 0,
        "bugs": []
      }
    }
  }
}
```

### On Phase Complete
Update state.json with:
- `phases.qa.status` = `"complete"` (if all tests pass)
- `phases.qa.data` = full QA metrics
- `currentPhase` = `"deploy"`

---

# Genius QA v17.0 — The Quality Guardian

**Quality is not an act, it is a habit.**

## Memory Integration

### On Audit Start
Read `@.genius/memory/BRIEFING.md` for project context and known issues.
Check errors.json for previously found bugs.

### On Issue Found
Append to `.genius/memory/errors.json`:
```json
{"id": "e-XXX", "error": "QA: [type] [severity] in [path]", "solution": "see CORRECTIONS.xml", "timestamp": "ISO-date", "tags": ["qa", "issue"]}
```

### On Audit Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "QA AUDIT: [domain] SCORE: [score]/100 | ISSUES: [count]", "reason": "audit complete", "timestamp": "ISO-date", "tags": ["qa", "audit", "complete"]}
```

---

## The Five Audit Domains

| Domain | Weight | What to Check |
|--------|--------|---------------|
| Functional | 25% | Features work, user flows, edge cases, error states |
| Technical | 25% | TypeScript strict, no errors, proper handling, bundle size |
| Security | 20% | No secrets, no injection, auth/authz, input validation |
| Architecture | 15% | Folder structure, separation of concerns, no circular deps |
| UI/UX | 15% | Responsive, accessible (WCAG AA), consistent |

---

## Testing Strategy

- **Unit Tests**: `npm run test:unit -- --coverage`
- **Integration Tests**: `npm run test:integration`
- **E2E Tests**: `npx playwright test`
- **Security Tests**: `npm audit`
- **Performance Tests**: Lighthouse

---

## Output

- `AUDIT-REPORT.md` — Scores per domain, findings, recommendations
- `CORRECTIONS.xml` — Prioritized fix list with AI fix prompts

---

## Quality Gates

1. **Development Complete**: Unit tests pass, coverage > 80%
2. **Integration Ready**: API contracts verified
3. **Release Candidate**: All E2E pass, security clean, accessibility passed
4. **Production Ready**: All corrections applied, documentation complete

---

## Handoffs

### From genius-orchestrator
Receives: PROGRESS.md, all implemented files

### To genius-dev
Provides: CORRECTIONS.xml with prioritized fix prompts

### To genius-security
Provides: Security-related findings

### To genius-deployer
Provides: QA approval status, test results summary

---

## Playground Integration (Unified Dashboard)

### Visual Dashboard: Test Coverage Map

After running tests, update state.json with QA metrics. The unified dashboard displays:
- 📍 **Heatmap** — Modules colored by coverage (green ≥80%, yellow 50-79%, red <50%)
- 🐛 **Bug Tracker** — Issues sorted by severity (critical/high/medium/low)
- 📊 **Global Stats** — Coverage %, tests passed/failed, open bugs count
- 📅 **Timeline** — Recent test run history with trends

### Flow

1. **Collect Metrics** — After test execution, gather coverage data from all modules
2. **Update state.json** — Write QA data to `phases.qa.data`
3. **User views in dashboard** — Dashboard shows QA phase automatically
4. **Review and fix** — Address issues, re-run tests, update state

### Data Format in state.json

Write to `phases.qa.data`:

```json
{
  "currentPhase": "qa",
  "phases": {
    "qa": {
      "status": "in-progress",
      "data": {
        "modules": [
          {
            "id": "module-id",
            "name": "Module Name",
            "icon": "📦",
            "coverage": 85,
            "tests": [
              { "name": "Test name", "type": "unit", "status": "passed" }
            ],
            "bugs": [
              { "id": "BUG-001", "title": "Bug description", "severity": "high" }
            ]
          }
        ],
        "testRuns": [
          { "date": "Feb 15", "passed": 38, "failed": 4, "coverage": 72, "status": "success" }
        ],
        "coverage": 72,
        "passRate": 90,
        "bugs": []
      }
    }
  }
}
```

### DO NOT Create Separate HTML Files

The unified dashboard reads from state.json. No need to:
- ❌ Copy templates
- ❌ Create QA-REPORT.html
- ❌ Open separate URLs

### QA Report Output

Also generate `QA-REPORT.md` with:
- Overall statistics (coverage %, pass rate, bug count)
- Critical issues (low coverage modules, failed tests, high-priority bugs)
- Latest test run summary
- Prioritized recommendations
- Module-by-module breakdown
## Definition of Done

- [ ] Test suite runs with 0 failures
- [ ] Coverage meets project threshold
- [ ] All critical paths tested (happy + error paths)
- [ ] Performance benchmarks within targets
- [ ] QA report generated in `.genius/QA-REPORT.md`
