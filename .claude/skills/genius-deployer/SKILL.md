---
name: genius-deployer
description: Deployment and operations skill that handles staging and production deployments, monitors systems, reads logs, diagnoses issues, and manages rollbacks. Works with Vercel, Railway, and other platforms. Use for "deploy", "go live", "push to production", "ship it".
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

# Genius Deployer v9.0 — Ship It Safely

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
Before any deployment, update state.json with checklist items for human validation.

### Deployment Flow with Unified Dashboard

```
1. UPDATE STATE → Write checklist to phases.deploy.data
2. USER VIEWS   → Dashboard shows deploy phase automatically
3. VALIDATE     → User checks items in dashboard
4. CONFIRM      → Wait for GO status in state.json
5. DEPLOY       → Execute deployment
6. UPDATE       → Record final status in state.json
```

### Updating state.json with Checklist

Write to `phases.deploy.data`:

```json
{
  "currentPhase": "deploy",
  "phases": {
    "deploy": {
      "status": "in-progress",
      "data": {
        "projectInfo": {
          "projectName": "my-awesome-app",
          "version": "v2.1.0",
          "environment": "production",
          "deployDate": "2024-02-17T18:00:00Z"
        },
        "checklist": {
          "preDeploy": [
            { "item": "Environment variables configured", "status": "done", "critical": true },
            { "item": "Database backup completed", "status": "done", "critical": true }
          ],
          "deploy": [
            { "item": "Team notified", "status": "done", "critical": false },
            { "item": "Deployment executed", "status": "in-progress", "critical": true }
          ],
          "postDeploy": [
            { "item": "Error rates checked", "status": "pending", "critical": true },
            { "item": "Smoke tests passed", "status": "pending", "critical": true }
          ],
          "rollback": [
            { "item": "Previous version tagged", "status": "done", "critical": false }
          ]
        },
        "goStatus": "wait",
        "rollbackPlan": "..."
      }
    }
  }
}
```

### DO NOT Create Separate HTML Files

The unified dashboard reads from state.json. No need to:
- ❌ Copy templates
- ❌ Create DEPLOY-CHECKLIST.html
- ❌ Open separate URLs

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

When user clicks "Copy", the checklist generates a status report:

```
# DEPLOYMENT CHECKLIST STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 STATUS: ✅ GO - Ready to Deploy!

## 📋 Project Info
- Project: my-awesome-app
- Version: v2.1.0
- Environment: production

## 📈 Progress: 95%
- ✓ Done: 28
- ⏳ In Progress: 1
- ✗ Not Done: 1

## 🚨 BLOCKERS (0)
None

## 📊 Phase Summary
📋 Pre-Deploy: [██████████] 100%
🚀 Deploy: [████████░░] 80%
✅ Post-Deploy: [██████████] 100%
🔙 Rollback Plan: [██████████] 100%

## 🔙 Rollback Plan
1. Revert to v2.0.9: docker pull myapp:v2.0.9
2. Restore DB: pg_restore backup_20240115.sql
...
```

### Integration with Memory

**On checklist completion (GO):**
```json
{"id": "d-XXX", "decision": "DEPLOY APPROVED: [version] to [env]", "reason": "checklist passed", "timestamp": "ISO", "tags": ["deployment", "checklist", "approved"]}
```

**On deployment blocked (NO-GO):**
```json
{"id": "d-XXX", "decision": "DEPLOY BLOCKED: [version] to [env]", "reason": "[blocker list]", "timestamp": "ISO", "tags": ["deployment", "checklist", "blocked"]}
```

### Usage Example

```
User: Deploy to production

Agent:
1. Reads BRIEFING.md for deployment context
2. Updates state.json with deploy checklist data
3. User views Deploy tab in unified dashboard
4. Waits for GO status in state.json
5. Executes deployment protocol
6. Records decision in memory
```
