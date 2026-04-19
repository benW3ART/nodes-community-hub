---
name: genius-deployer
description: >-
  Deployment skill. Handles environment setup, CI/CD configuration, and production deployment.
  Use when user says "deploy", "ship it", "go to production", "setup CI/CD", "configure deployment",
  "publish", "release", "push to prod", "make it live".
  Do NOT use for development/coding (use genius-dev skills).
  Do NOT use for testing (use genius-qa).
  After deployment, suggest genius-seo and genius-analytics for post-launch optimization.
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- Log: `DEPLOY-LOG.md`
- Unified State: `.genius/outputs/state.json` (with `phases.deploy` populated)

**Before transitioning to next skill:**
1. Verify DEPLOY-LOG.md exists
2. Verify state.json has deploy phase data
3. Update phase status
4. Announce completion

**If artifacts missing:** DO NOT proceed. Generate them first.

---

## Unified Dashboard Integration

**DO NOT launch separate HTML files.** Update the unified state instead.

### On Phase Start
Update `.genius/outputs/state.json`:
```json
{
  "currentPhase": "deploy",
  "phases": {
    "deploy": {
      "status": "in-progress",
      "data": {
        "checklist": {
          "preDeploy": [],
          "deploy": [],
          "postDeploy": [],
          "rollback": []
        },
        "projectInfo": {
          "version": "",
          "environment": "",
          "deployDate": ""
        },
        "goStatus": "no-go"
      }
    }
  }
}
```

### On Phase Complete
Update state.json with:
- `phases.deploy.status` = `"complete"`
- `phases.deploy.data.goStatus` = `"deployed"`
- All phases complete = project shipped! 🚀

---

# Genius Deployer v17.0 — Ship It Safely

**Ships code to production with zero downtime. Never deploy on Friday at 5pm.**

## Memory Integration

### On Deploy Start
Read `@.genius/memory/BRIEFING.md` for deployment history and env config.

### On Deploy Success
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "DEPLOYED: [version] to [env]", "reason": "all checks passed", "timestamp": "ISO-date", "tags": ["deployment", "success"]}
```

### On Deploy Failure
Append to `.genius/memory/errors.json`:
```json
{"id": "e-XXX", "error": "DEPLOY FAILED: [version] to [env] — [error]", "solution": "[rollback or fix]", "timestamp": "ISO-date", "tags": ["deployment", "failed"]}
```

---

## Deployment Protocol

### 1. Pre-Deploy Checklist
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] Lint clean
- [ ] Build succeeds
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] NOT Friday after 3pm

### 2. Staged Deployment
Build → Deploy to Staging → Smoke Test → Deploy to Production → Monitor (15 min)

### 3. Rollback Procedure
When: Error rate > 5%, critical flow broken, security vulnerability

```bash
# Vercel
vercel rollback
# Railway
railway rollback
```

---

## Platform Commands

### Vercel
`vercel`, `vercel --prod`, `vercel logs`, `vercel rollback`

### Railway
`railway up`, `railway logs`, `railway rollback`

---

## Handoffs

### From genius-qa + genius-security
Receives: QA approval, security clearance

### To genius-debugger (on issue)
Provides: Deployment logs, error messages, environment context

---

## Playground Integration (Unified Dashboard)

### Deploy Checklist in Dashboard

Write checklist to `phases.deploy.data` in state.json. Flow: update state → user views dashboard → validate items → confirm GO → deploy → record final status. Checklist has 4 categories: `preDeploy`, `deploy`, `postDeploy`, `rollback` — each item has `{ item, status, critical }`. Set `goStatus: "wait"|"go"|"no-go"`. **DO NOT create separate HTML files** — dashboard reads from state.json.

### Presets

Select the appropriate deployment type:

| Preset | Use Case | Key Items |
|--------|----------|-----------|
| 🆕 **First Deploy** | New project going live | SSL, DNS, basic smoke tests |
| 🔥 **Hotfix** | Emergency fix | Minimal checks, fast rollback |
| 📦 **Major Release** | Version bump, new features | Full test suite, migrations, monitoring |
| 🗃️ **Database Migration** | Schema changes | Backup, rollback scripts, maintenance mode |

### Interactive Validation

The user validates each item through three states:
- **✗ Not Done** (red) → Item not started
- **⏳ In Progress** (orange, animated) → Currently being done
- **✓ Done** (green) → Item completed

**Features:**
- ⏱️ **Timer per item** — Tracks time spent in "In Progress"
- 🚨 **Blocker detection** — Critical items block deployment
- 📊 **Progress bar** — Visual completion percentage
- 🔙 **Rollback plan** — Document rollback strategy inline

### Go/No-Go Indicator

| Status | Meaning |
|--------|---------|
| ✅ **GO** | All critical items done, ready to deploy |
| ⏳ **WAIT** | No blockers but items in progress |
| 🚫 **NO-GO** | Critical blockers remain |

**Rule:** NEVER deploy with NO-GO status.

### Deployment Phases

#### Phase 1: Pre-Deploy 📋
Environment, database, code, and test verification.
- Environment variables configured ⚠️ CRITICAL
- Database backup completed ⚠️ CRITICAL
- Code review approved ⚠️ CRITICAL
- All test suites passing ⚠️ CRITICAL

#### Phase 2: Deploy 🚀
Actual deployment execution.
- Team notified
- Maintenance mode (if needed)
- Deployment executed ⚠️ CRITICAL
- Deployment verified

#### Phase 3: Post-Deploy ✅
Verification and monitoring.
- Error rates checked ⚠️ CRITICAL
- Performance baseline established
- Smoke tests passed ⚠️ CRITICAL
- DNS/CDN/SSL verified

#### Phase 4: Rollback Plan 🔙
Preparation for potential rollback.
- Previous version tagged
- DB rollback script tested
- On-call team identified
- Rollback timeline defined

### Prompt Output Format

The checklist summary should surface environment, readiness status, remaining blockers, phase progress, and rollback instructions in a copyable format.

### Integration with Memory

Log a deployment approval or block decision to memory with version, environment, reason, timestamp, and deployment tags.

### Usage Example

Flow: read BRIEFING, update deploy checklist state, surface dashboard status, deploy only on GO, then log the decision.

## Post-Deployment Suggestions

After successful deployment:
- **genius-seo** — Optimize for AI and traditional search (GEO + SEO audit)
- **genius-analytics** — Set up event tracking and conversion funnels
- **genius-performance** — Run Lighthouse audit and optimize Core Web Vitals
## Definition of Done

- [ ] All tests passing before deploy
- [ ] Environment variables verified
- [ ] Build succeeds cleanly (no warnings)
- [ ] Deployment verified with health check URL
- [ ] Rollback plan documented
