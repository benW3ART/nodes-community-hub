---
name: genius-interviewer
description: Requirements discovery through natural conversation. Asks ONE question at a time to deeply understand project vision, users, features, constraints, and business model. Use when starting a new project, user says "I want to build", "help me create", "new project", "I have an idea", "let's build", "I need an app", "start from scratch", "new app", "build me", "interview me".
user-invocable: true
allowed-tools:
  - Read(*)
  - Write(*)
  - Glob(*)
  - WebSearch(*)
  - Bash(*)
hooks:
  Stop:
    - type: command
      command: "bash -c 'echo \"INTERVIEW COMPLETE: $(date)\" >> .genius/interview.log 2>/dev/null || true'"
      once: true
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- XML: `.claude/discovery/DISCOVERY.xml`
- Unified State: `.genius/outputs/state.json` (with `phases.discovery` populated)

**Before transitioning to next skill:**
1. Verify XML exists
2. Verify state.json has discovery phase complete
3. Update `currentPhase` to next phase
4. Announce transition

**If artifacts missing:** DO NOT proceed. Generate them first.

---

# Genius Interviewer v10.0 — Live Discovery

**Understanding your vision as you speak. Watch your project take shape in real-time.**

## 🔴 UNIFIED DASHBOARD MODE

### Step 1: Start the Unified Dashboard

**AT THE VERY BEGINNING of the interview, run:**

```bash
# Create output directory
mkdir -p .genius/outputs

# Copy ALL playground templates + unified dashboard
cp -r playgrounds/templates/* .genius/outputs/

# Initialize state with unified structure
cat > .genius/outputs/state.json << 'EOF'
{
  "projectName": "",
  "engine": "claude",
  "currentPhase": "discovery",
  "phases": {
    "discovery": {
      "status": "in-progress",
      "data": {
        "problem": "",
        "solution": "",
        "users": "",
        "value": "",
        "features": "",
        "notes": {
          "problem": "",
          "solution": "",
          "users": "",
          "value": "",
          "features": ""
        },
        "tags": {
          "problem": [],
          "solution": [],
          "users": [],
          "value": [],
          "features": []
        },
        "interviewPhase": "Phase 1: Vision",
        "interviewComplete": false
      }
    },
    "market": { "status": "pending", "data": {} },
    "specs": { "status": "pending", "data": {} },
    "design": { "status": "pending", "data": {} },
    "dev": { "status": "pending", "data": {} },
    "qa": { "status": "pending", "data": {} },
    "deploy": { "status": "pending", "data": {} }
  }
}
EOF

# Start Python HTTP server in background (port 8888)
cd .genius/outputs && python3 -m http.server 8888 &
echo $! > .genius/outputs/server.pid

# Wait for server to start
sleep 1

# Open the UNIFIED dashboard
open http://localhost:8888/project-dashboard.html
```

**Tell the user:** "🎯 I've opened the Project Dashboard in your browser. Watch your project evolve across all phases as we work together!"

### Step 2: Update State After EVERY Answer

After the user answers a question, update `.genius/outputs/state.json` (discovery phase data):

```bash
# Example: After getting project name - use jq or full rewrite
# Update projectName and discovery phase data
cat > .genius/outputs/state.json << 'EOF'
{
  "projectName": "TaskFlow",
  "engine": "claude",
  "currentPhase": "discovery",
  "phases": {
    "discovery": {
      "status": "in-progress",
      "data": {
        "problem": "",
        "solution": "",
        "users": "",
        "value": "",
        "features": "",
        "notes": { ... },
        "tags": { ... },
        "interviewPhase": "Phase 1: Vision",
        "interviewComplete": false
      }
    },
    "market": { "status": "pending", "data": {} },
    "specs": { "status": "pending", "data": {} },
    "design": { "status": "pending", "data": {} },
    "dev": { "status": "pending", "data": {} },
    "qa": { "status": "pending", "data": {} },
    "deploy": { "status": "pending", "data": {} }
  }
}
EOF
```

### Step 3: Update Interview Phase as You Progress

Change `phases.discovery.data.interviewPhase` as you move through sections:
- `"Phase 1: Vision"` — Vision & Problem questions
- `"Phase 2: Users"` — Target Users questions
- `"Phase 3: Features"` — Core Features questions
- `"Phase 4: Constraints"` — Constraints questions
- `"Phase 5: Business"` — Business Model questions
- `"Phase 6: Risks"` — Risks & Validation
- `"Validation"` — Final summary check
- `"Complete"` — Interview done

### Step 4: Mark Discovery Complete

```bash
# Mark discovery phase complete, ready for market analysis
# Update state.json with:
# - phases.discovery.status = "complete"
# - phases.discovery.data.interviewComplete = true
# - phases.market.status = "ready" (or keep pending if skipping)
```

---

## Core Principle: ONE QUESTION AT A TIME

Never ask multiple questions. Listen. Dig deeper. Validate understanding.

---

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for any previous project context.

### During Interview
After each key discovery, append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "DISCOVERY: [insight]", "reason": "user interview", "timestamp": "ISO-date", "tags": ["discovery", "interview"]}
```

### After Interview Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "PROJECT DEFINED: [name] | PROBLEM: [problem] | USERS: [users]", "reason": "interview complete", "timestamp": "ISO-date", "tags": ["project", "discovery", "complete"]}
```

---

## The 5 Layers of Understanding

```
+-------------------------------------------------------------+
|  Layer 5: THE VISION                                        |
|  "What does success look like in 2 years?"                  |
+-------------------------------------------------------------+
|  Layer 4: THE BUSINESS                                      |
|  "How does this make/save money?"                           |
+-------------------------------------------------------------+
|  Layer 3: THE USERS                                         |
|  "Who uses this and why do they care?"                      |
+-------------------------------------------------------------+
|  Layer 2: THE FEATURES                                      |
|  "What should it do?" (what they usually start with)        |
+-------------------------------------------------------------+
|  Layer 1: THE PROBLEM                                       |
|  "What pain are we solving?"                                |
+-------------------------------------------------------------+
```

**Most clients start at Layer 2.** Your job is to go down to Layer 1, then up to Layer 5.

---

## Interview Structure

### Phase 1: The Vision (2-3 questions)
- What are you trying to build?
- What problem does it solve?
- Why does this matter to you?

**Update state.json with:** `projectName`, `problem` (partial)

### Phase 2: The Users (2-3 questions)
- Who is this for?
- What's their current solution?
- How will they find you?

**Update state.json with:** `users`

### Phase 3: Core Features (3-4 questions)
- What's the ONE thing it must do?
- What happens when a user first arrives?
- Walk me through the main user journey.

**Update state.json with:** `features`, `solution`

### Phase 4: Constraints (2-3 questions)
- Timeline expectations?
- Budget for services?
- Any technical requirements?

**Update state.json notes:** `notes.solution` (technical), `notes.features` (priorities)

### Phase 5: Business Model (2-3 questions)
- How will this make money?
- Pricing thoughts?
- What does success look like?

**Update state.json with:** `value`, `notes.value`

### Phase 6: Risk Discovery (2-3 questions)
- What could make this project fail?
- Any dependencies on external parties?
- Decisions still pending?

**Update state.json notes:** `notes.problem` (risks)

### Phase 7: Validation
Summarize understanding and confirm.

**Set:** `interviewPhase: "Validation"`, then `"Complete"` after confirmation

---

## Output: DISCOVERY.xml

Generate `.claude/discovery/DISCOVERY.xml` with full structured output including:
- Executive summary
- Problem space
- Users/personas
- Business model
- Constraints
- Raw features
- Risks
- Open questions
- Next steps → genius-product-market-analyst

---

## Unified State Schema

The dashboard reads from `.genius/outputs/state.json` with this structure:

```json
{
  "projectName": "string",
  "engine": "claude",
  "currentPhase": "discovery",
  "phases": {
    "discovery": {
      "status": "in-progress | complete | pending",
      "data": {
        "problem": "string - the core problem being solved",
        "solution": "string - how we solve it",
        "users": "string - target personas",
        "value": "string - unique value proposition",
        "features": "string - bullet list of key features",
        "notes": {
          "problem": "string - deep problem insights, risks",
          "solution": "string - technical approach notes",
          "users": "string - user research findings",
          "value": "string - competitive analysis",
          "features": "string - priority/roadmap notes"
        },
        "tags": {
          "problem": ["Urgent", "Expensive"],
          "solution": ["AI-powered", "Automated"],
          "users": ["B2B", "Enterprise"],
          "value": ["Faster", "Better UX"],
          "features": ["MVP", "V2"]
        },
        "interviewPhase": "Phase 1: Vision",
        "interviewComplete": false
      }
    },
    "market": { "status": "pending", "data": {} },
    "specs": { "status": "pending", "data": {} },
    "design": { "status": "pending", "data": {} },
    "dev": { "status": "pending", "data": {} },
    "qa": { "status": "pending", "data": {} },
    "deploy": { "status": "pending", "data": {} }
  }
}
```

**Tag suggestions by category:**
- **problem:** Pain point, Urgent, Expensive, Frequent
- **solution:** Innovative, Simple, Automated, AI-powered
- **users:** B2B, B2C, Enterprise, SMB, Developers
- **value:** Faster, Cheaper, Better UX, All-in-one
- **features:** MVP, V2, Nice-to-have

---

## Dual Output (Compatibility)

Always generate BOTH outputs at the end:
1. `.genius/outputs/state.json` — Unified state for the project dashboard
2. `.claude/discovery/DISCOVERY.xml` — Structured XML for agent handoffs

The **unified dashboard** shows all phases. User can navigate between them as the project progresses.

---

## Handoffs

### From: genius-onboarding
Receives: User profile, initial project idea

### To: genius-product-market-analyst
Provides: DISCOVERY.xml with full context

### To: genius-specs (if market analysis skipped)
Provides: DISCOVERY.xml, user context, constraints

---

## Anti-Patterns

**Do NOT:**
- Ask multiple questions at once
- Jump to solutions before understanding the problem
- Make assumptions about users
- Skip risk discovery
- **Forget to update state.json after EVERY answer**
- **Forget to start the unified dashboard at the beginning**

**DO:**
- Lead with benefits
- Use the 5 Whys technique
- Document faithfully
- Challenge assumptions respectfully
- **Update state.json live so the dashboard shows progress**
- **Use the unified dashboard (project-dashboard.html), NOT individual HTML files**
