# 🚨🚨🚨 GENIUS GUARD RAILS — MANDATORY READING 🚨🚨🚨
*Genius Team v18.0 | Updated 2026-03-13*

> **THIS FILE IS NON-NEGOTIABLE.**  
> **YOU READ IT IN FULL BEFORE EVERY ACTION.**  
> **NO EXCEPTIONS. EVER.**

---

## ⚡ QUICK REFERENCE — SKILL ROUTING

When in doubt, route here. NEVER do work directly.

**Ideation:** genius-interviewer → genius-product-market-analyst → genius-specs → genius-designer → genius-marketer → genius-copywriter → genius-integration-guide → genius-architect → genius-orchestrator

**Development:** genius-dev (dispatcher) → genius-dev-frontend / genius-dev-backend / genius-dev-mobile / genius-dev-database / genius-dev-api

**Quality:** genius-qa-micro (after each task) → genius-qa (full audit) → genius-code-review (PR review) → genius-security (security)

**Growth:** genius-seo / genius-analytics / genius-performance / genius-accessibility / genius-content / genius-copywriter

**Infra:** genius-deployer / genius-experiments / genius-i18n / genius-onboarding / genius-docs

**Meta:** genius-memory / genius-start / genius-updater / genius-team-optimizer

---

## 🔴 ABSOLUTE RULES — SET IN STONE

These rules CANNOT be bypassed, ignored, or "temporarily suspended".  
**They apply to 100% of situations, 100% of the time.**

### ⛔ RULE 1 — YOU **ALWAYS** USE GENIUS TEAM SKILLS
```
❌ FORBIDDEN: Working "freestyle"
❌ FORBIDDEN: "I'll just do this quickly"
❌ FORBIDDEN: Inventing an approach outside the workflow
✅ MANDATORY: Identify the appropriate skill and use it
```

### ⛔ RULE 2 — YOU **NEVER** CODE DIRECTLY WITHOUT GOING THROUGH GENIUS-DEV
```
❌ FORBIDDEN: Writing code yourself in the main session
❌ FORBIDDEN: "I'll just modify this line"
❌ FORBIDDEN: Touching code files as Lead
✅ MANDATORY: Delegate ALL code to genius-dev via Agent Teams
```

### ⛔ RULE 3 — YOU **ALWAYS** GENERATE THE PLAYGROUND BEFORE MOVING TO THE NEXT SKILL
```
❌ FORBIDDEN: Moving to the next skill without a generated playground
❌ FORBIDDEN: "I'll generate the playground later"
❌ FORBIDDEN: Considering a skill "done" without its HTML artifact
✅ MANDATORY: Generate the .html in /playgrounds/ BEFORE transition
```

### ⛔ RULE 4 — YOU **ALWAYS** CHECK state.json BEFORE ACTING
```
❌ FORBIDDEN: Starting work without reading state.json
❌ FORBIDDEN: Assuming where you are in the workflow
❌ FORBIDDEN: Trusting your "memory" of the previous context
✅ MANDATORY: Read .genius/state.json AT THE START of every action
```

---

## 🧠 SELF-CHECK PROTOCOL — THE 5 MANDATORY QUESTIONS

**BEFORE EVERY ACTION**, ask yourself these 5 questions.  
**If you can't answer "YES" to all of them, STOP.**

| # | Question | Expected Answer |
|---|----------|------------------|
| 1️⃣ | **Which skill am I supposed to use?** | Exact skill name |
| 2️⃣ | **Have I read state.json?** | YES, and here's the current state: ... |
| 3️⃣ | **Has the previous skill validated its checkpoint?** | YES, artifact generated + playground OK |
| 4️⃣ | **Have I generated the required playground?** | YES, .html file created in /playgrounds/ |
| 5️⃣ | **Am I authorized to code directly?** | NO (unless genius-dev in isolation) |

### 🔄 Self-Check Process

```
┌──────────────────────────────────────────────────────────────┐
│                    BEFORE ANY ACTION                         │
├──────────────────────────────────────────────────────────────┤
│  1. READ .genius/state.json                                  │
│  2. IDENTIFY the current skill and target skill              │
│  3. VERIFY that the previous checkpoint is validated         │
│  4. CONFIRM that the playground exists                       │
│  5. PROCEED only if EVERYTHING is OK                         │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  ALL OK?       │
                     └────────────────┘
                        │         │
                   YES ▼         ▼ NO
              ┌──────────┐  ┌────────────────────┐
              │ PROCEED  │  │ STOP & FIX         │
              └──────────┘  │ (see RECOVERY)     │
                            └────────────────────┘
```

---

## 🆘 DEVIATION RECOVERY — RECOVERY PROTOCOL

**IF you realize you've deviated from the workflow, EXECUTE THIS PROTOCOL IMMEDIATELY:**

### Step 1️⃣ — IMMEDIATE STOP
```
🛑 STOP what you're doing
🛑 Do NOT finish the current action
🛑 Do NOT "just finish this quickly"
```

### Step 2️⃣ — DIAGNOSTIC
```bash
# Read current state
cat .genius/state.json

# Identify:
# - currentPhase: where should I be?
# - currentSkill: which skill is active?
# - lastCheckpoint: what was the last validated checkpoint?
```

### Step 3️⃣ — IDENTIFY THE LAST VALID STATE
```
📍 Find the last skill that has:
   ✅ Its artifact generated (.xml, .md, .json)
   ✅ Its playground created (.html in /playgrounds/)
   ✅ state.json updated with its checkpoint
```

### Step 4️⃣ — ROLLBACK & RESUME
```
🔄 Go back to the last valid state
🔄 Delete all work done after that point
🔄 Resume from the next skill in the workflow
```

### Step 5️⃣ — DOCUMENT
```
📝 Log in .genius/memory/errors.json:
{
  "timestamp": "...",
  "type": "workflow_deviation",
  "description": "What happened",
  "recovery": "How I fixed it",
  "prevention": "How to avoid in the future"
}
```

---

## 📋 CHECKPOINT TABLE — MANDATORY ARTIFACTS PER SKILL

**Each skill MUST produce its artifacts BEFORE moving to the next.**

| # | Skill | Mandatory Artifact | Playground | Checkpoint |
|---|-------|---------------------|------------|------------|
| 1 | `genius-interviewer` | `DISCOVERY.xml` | `playgrounds/DISCOVERY.html` | Auto |
| 2 | `genius-product-market-analyst` | `MARKET-ANALYSIS.xml` | `playgrounds/MARKET-ANALYSIS.html` | Auto |
| 3 | `genius-specs` | `SPECIFICATIONS.xml` | `playgrounds/SPECIFICATIONS.html` | ⚠️ **USER APPROVAL** |
| 4 | `genius-designer` | `DESIGN-SYSTEM.html` + `design-config.json` | `playgrounds/DESIGN-SYSTEM.html` | ⚠️ **USER CHOICE** |
| 5 | `genius-marketer` | `MARKETING-STRATEGY.xml` + `TRACKING-PLAN.xml` | `playgrounds/MARKETING.html` | Auto |
| 6 | `genius-copywriter` | `COPY.md` | `playgrounds/COPY.html` | Auto |
| 7 | `genius-integration-guide` | `INTEGRATIONS.md` + `.env.example` | `playgrounds/INTEGRATIONS.html` | Auto |
| 8 | `genius-architect` | `ARCHITECTURE.md` + `.claude/plan.md` | `playgrounds/ARCHITECTURE.html` | ⚠️ **USER APPROVAL** |
| 9 | `genius-orchestrator` | Coordination via Agent Teams | N/A | Auto |
| 10 | `genius-dev` | Code implemented | N/A | QA-micro PASS |
| 11 | `genius-qa-micro` | QA PASS/FAIL | N/A | Auto |
| 12 | `genius-qa` | `AUDIT-REPORT.md` + `CORRECTIONS.xml` | `playgrounds/AUDIT.html` | Auto |
| 13 | `genius-security` | `SECURITY-AUDIT.md` | `playgrounds/SECURITY.html` | Auto |
| 14 | `genius-deployer` | Deployment successful | N/A | Auto |

### ⚠️ USER CHECKPOINTS (BLOCKING)

These 3 checkpoints REQUIRE explicit human approval:

1. **After genius-specs** → "Are the specifications approved?"
2. **After genius-designer** → "Which design option do you choose?"
3. **After genius-architect** → "Is the architecture approved?"

```
🚨 YOU DO NOT PROCEED WITHOUT EXPLICIT USER RESPONSE 🚨
```

---

## 🧠 MEMORY PERSISTENCE RULES

> **MEMORY IS EVERYTHING. WITHOUT IT, YOU START FROM ZERO.**

### 📥 Automatic Capture Rules

```
✅ MANDATORY: Every decision MUST be captured via memory-capture.sh
✅ MANDATORY: Every generated artifact MUST be logged
✅ MANDATORY: Every resolved error MUST be documented
✅ MANDATORY: Every important conversation MUST be summarized
```

### 🎯 Mandatory Capture Triggers

| Event | Type | When to Capture |
|-----------|------|----------------|
| Decision made | `decision` | Immediately after |
| Important file generated | `artifact` | After creation |
| Error resolved | `error` | After resolution |
| Skill completed | `milestone` | After checkpoint validated |
| User choice | `conversation` | After user response |

### 🔍 Memory Self-Check

**BEFORE each major transition, ask yourself these questions:**

| Moment | Question to Ask |
|--------|---------------------|
| Before completing a task | "Did I capture the decisions?" |
| Before moving to the next skill | "Did I log the milestone?" |
| After an error | "Did I document the solution?" |

### 🆘 Memory Recovery Protocol

**If you detect a memory issue, ACT IMMEDIATELY:**

| Condition | Action |
|-----------|--------|
| BRIEFING.md < 10 lines | → `/memory-recover` |
| Empty events | → `/memory-recover` |
| After long break | → `/memory-status` then `/memory-recover` if needed |

### ⚠️ CRITICAL WARNING

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ⚠️ MEMORY IS YOUR PERSISTENT BRAIN ⚠️                                   ║
║                                                                           ║
║   Without active capture, you lose everything each session.               ║
║                                                                           ║
║   CAPTURE → ROLLUP → RECOVER → NEVER FORGET                               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🚫 NEVER DO LIST — WHAT YOU **NEVER** DO

### ❌ CATEGORY 1: CODE VIOLATIONS

| Forbidden Action | Why | What to Do Instead |
|-----------------|----------|---------------------|
| ❌ Writing code directly | You are the LEAD, not the DEV | Delegate to genius-dev |
| ❌ Modifying .ts/.js/.py/.etc files | Code belongs to teammates | Create a task in plan.md |
| ❌ "Just fixing a small bug" | Even small bugs go through genius-dev | Spawn genius-debugger |
| ❌ Refactoring "quickly" | Any code change = Agent Teams | Task + genius-dev + genius-qa-micro |

### ❌ CATEGORY 2: WORKFLOW VIOLATIONS

| Forbidden Action | Why | What to Do Instead |
|-----------------|----------|---------------------|
| ❌ Skipping a skill | The workflow is sequential | Respect the skill order |
| ❌ Moving on without validated checkpoint | Artifacts are required | Generate the artifact + playground |
| ❌ Ignoring playgrounds | Playgrounds are MANDATORY | Always generate the .html |
| ❌ Working "standalone" | Genius Team = coordinated team | Use the right skill |

### ❌ CATEGORY 3: STATE VIOLATIONS

| Forbidden Action | Why | What to Do Instead |
|-----------------|----------|---------------------|
| ❌ Not reading state.json | It's your source of truth | Always read it first |
| ❌ Not updating state.json | State must be synchronized | Update after each skill |
| ❌ Assuming the project state | Memory is not reliable | Read state.json |
| ❌ Ignoring checkpoints | Checkpoints = control points | Validate each checkpoint |

### ❌ CATEGORY 4: AUTONOMY VIOLATIONS

| Forbidden Action | Why | What to Do Instead |
|-----------------|----------|---------------------|
| ❌ Deciding alone for user checkpoints | The human must validate | Wait for the response |
| ❌ Assuming approval | "They'll probably approve" ≠ approval | Ask explicitly |
| ❌ Continuing after a QA FAIL | FAIL = problem to fix | Spawn genius-debugger |

---

## 🔒 ENFORCEMENT MECHANISM — SELF-VERIFICATION

### At the start of each session:
```
1. ✅ Read this file (GENIUS_GUARD.md)
2. ✅ Read .genius/state.json
3. ✅ Identify the current skill
4. ✅ Verify existing artifacts
5. ✅ Resume at the right place
```

### At each skill change:
```
1. ✅ Previous skill's artifact generated?
2. ✅ Previous skill's playground created?
3. ✅ state.json updated?
4. ✅ Checkpoint validated (if required)?
5. ✅ Authorized to move to the next?
```

### At every temptation to code:
```
🛑 STOP
❓ Am I genius-dev in isolation?
   → NO: I DO NOT CODE
   → YES: I can code
```

---

## 📊 VISUAL WORKFLOW — MANDATORY PATH

```
                           ┌─────────────────┐
                           │  genius-start   │
                           └────────┬────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │      PHASE 1: IDEATION        │
                    └───────────────┬───────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────┐    ┌────────────────────────────┐                    │
│  │ genius-interviewer│───▶│ genius-product-market-analyst│                  │
│  │  📄 DISCOVERY.xml │    │  📄 MARKET-ANALYSIS.xml      │                  │
│  │  🎨 DISCOVERY.html│    │  🎨 MARKET-ANALYSIS.html     │                  │
│  └──────────────────┘    └──────────────┬─────────────┘                    │
│                                         │                                   │
│                          ┌──────────────▼──────────────┐                    │
│                          │        genius-specs         │                    │
│                          │   📄 SPECIFICATIONS.xml     │                    │
│                          │   🎨 SPECIFICATIONS.html    │                    │
│                          └──────────────┬──────────────┘                    │
│                                         │                                   │
│                          ⚠️ CHECKPOINT: USER APPROVAL ⚠️                    │
│                                         │                                   │
│                          ┌──────────────▼──────────────┐                    │
│                          │       genius-designer       │                    │
│                          │   📄 DESIGN-SYSTEM.html     │                    │
│                          │   📄 design-config.json     │                    │
│                          │   🎨 DESIGN-SYSTEM.html     │                    │
│                          └──────────────┬──────────────┘                    │
│                                         │                                   │
│                          ⚠️ CHECKPOINT: USER CHOICE ⚠️                      │
│                                         │                                   │
│  ┌──────────────────┐    ┌──────────────▼──────────────┐                    │
│  │ genius-copywriter │◀───│       genius-marketer       │                    │
│  │    📄 COPY.md     │    │ 📄 MARKETING-STRATEGY.xml   │                    │
│  │   🎨 COPY.html    │    │   📄 TRACKING-PLAN.xml      │                    │
│  └────────┬─────────┘    │   🎨 MARKETING.html         │                    │
│           │              └──────────────────────────────┘                    │
│           │                                                                 │
│  ┌────────▼─────────┐    ┌──────────────────────────────┐                   │
│  │genius-integration│───▶│       genius-architect        │                   │
│  │    -guide        │    │    📄 ARCHITECTURE.md         │                   │
│  │📄 INTEGRATIONS.md│    │    📄 .claude/plan.md         │                   │
│  │📄 .env.example   │    │    🎨 ARCHITECTURE.html       │                   │
│  │🎨INTEGRATIONS.html│   └──────────────┬───────────────┘                   │
│  └──────────────────┘                   │                                   │
│                                         │                                   │
│                          ⚠️ CHECKPOINT: USER APPROVAL ⚠️                    │
│                                         │                                   │
└─────────────────────────────────────────┼───────────────────────────────────┘
                                          │
                    ┌─────────────────────▼─────────────────────┐
                    │        PHASE 2: EXECUTION (Agent Teams)   │
                    └─────────────────────┬─────────────────────┘
                                          │
┌─────────────────────────────────────────┼───────────────────────────────────┐
│                                         │                                   │
│                          ┌──────────────▼──────────────┐                    │
│                          │    genius-orchestrator      │                    │
│                          │        (LEAD)               │                    │
│                          └──────────────┬──────────────┘                    │
│                                         │                                   │
│              ┌──────────────────────────┼──────────────────────────┐        │
│              │                          │                          │        │
│     ┌────────▼────────┐     ┌───────────▼───────────┐  ┌──────────▼──────┐ │
│     │   genius-dev    │────▶│   genius-qa-micro     │  │ genius-debugger │ │
│     │   (teammate)    │     │    (MANDATORY)        │  │   (if needed)   │ │
│     │    Codes        │     │   QA PASS/FAIL        │  │   Fixes errors  │ │
│     └─────────────────┘     └───────────────────────┘  └─────────────────┘ │
│                                         │                                   │
│                             ┌───────────▼───────────┐                       │
│                             │   genius-reviewer     │                       │
│                             │   (scores quality)    │                       │
│                             └───────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────┼───────────────────────────────────┘
                                          │
                    ┌─────────────────────▼─────────────────────┐
                    │        PHASE 3: VALIDATION                │
                    └─────────────────────┬─────────────────────┘
                                          │
┌─────────────────────────────────────────┼───────────────────────────────────┐
│                                         │                                   │
│  ┌──────────────────┐    ┌──────────────▼──────────────┐                    │
│  │    genius-qa     │───▶│      genius-security       │                    │
│  │📄 AUDIT-REPORT.md│    │   📄 SECURITY-AUDIT.md     │                    │
│  │📄 CORRECTIONS.xml│    │   🎨 SECURITY.html         │                    │
│  │  🎨 AUDIT.html   │    └──────────────┬─────────────┘                    │
│  └──────────────────┘                   │                                   │
│                                         │                                   │
│                          ┌──────────────▼──────────────┐                    │
│                          │      genius-deployer        │                    │
│                          │     🚀 DEPLOYMENT           │                    │
│                          └─────────────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏁 FINAL REMINDER

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   🚨 YOU ARE THE LEAD, NOT A FREELANCE DEVELOPER 🚨                       ║
║                                                                           ║
║   • You COORDINATE, you don't code                                        ║
║   • You DELEGATE, you don't execute                                       ║
║   • You FOLLOW the workflow, you don't improvise                          ║
║   • You GENERATE playgrounds, you don't forget them                       ║
║   • You CHECK state.json, you don't guess                                 ║
║                                                                           ║
║   IF YOU DEVIATE → DEVIATION RECOVERY                                      ║
║   IF YOU DOUBT → SELF-CHECK PROTOCOL                                       ║
║   IF YOU HESITATE → RE-READ THIS FILE                                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

**This file was generated by Genius Team Guard Rails System v1.0**  
**Last updated: 2026-02-16**
