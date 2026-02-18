---
name: genius-specs
description: Transforms discovery findings into formal specifications with user stories, use cases, business rules, and acceptance criteria. REQUIRES USER APPROVAL before continuing to design phase. Use for "specs", "specifications", "requirements", "user stories", "acceptance criteria", "write specs".
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- XML: `.claude/discovery/SPECIFICATIONS.xml`
- Unified State: `.genius/outputs/state.json` (with `phases.specs` populated)

**Before transitioning to next skill:**
1. Verify XML exists
2. Verify state.json has specs phase complete
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
  "currentPhase": "specs",
  "phases": {
    "specs": {
      "status": "in-progress",
      "data": { ... }
    }
  }
}
```

### On Phase Complete
Update state.json with:
- `phases.specs.status` = `"complete"`
- `phases.specs.data` = full specifications data (stories, use cases, etc.)
- `currentPhase` = `"design"` (after user approval)

---

# Genius Specs v9.0 — Requirements Architect

**Transforming discoveries into crystal-clear specifications.**

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for project context and past decisions.

### During Specification
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "SPEC: [story_id] [title] Priority: [priority]", "reason": "derived from discovery", "timestamp": "ISO-date", "tags": ["specification", "user-story"]}
```

### On Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "SPECIFICATIONS COMPLETE: [count] stories, [use_cases] use cases", "reason": "awaiting user approval", "timestamp": "ISO-date", "tags": ["specification", "checkpoint"]}
```

---

## Prerequisites

**REQUIRED before starting:**
- `DISCOVERY.xml` from genius-interviewer
- `MARKET-ANALYSIS.xml` from genius-product-market-analyst (optional)

---

## Specification Process

1. Load Discovery
2. Extract User Stories (As a... I want... So that...)
3. Elaborate Use Cases (preconditions, flows, postconditions)
4. Document Business Rules
5. Define NFRs (performance, security, accessibility)

---

## Output: SPECIFICATIONS.xml

Structured XML with:
- User stories with acceptance criteria (Given/When/Then)
- Use cases with main and alternative flows
- Business rules
- Non-functional requirements
- Data model
- API endpoints
- Screen definitions
- Glossary

---

## Quality Checklist

- [ ] Every story has at least 2 acceptance criteria
- [ ] All criteria are testable (Given/When/Then)
- [ ] Business rules are explicit and unambiguous
- [ ] No implementation details in specs (WHAT, not HOW)
- [ ] NFRs have measurable targets
- [ ] Data model covers all entities
- [ ] API endpoints defined for all actions

---

## CHECKPOINT: User Approval Required

**MANDATORY. Do NOT continue automatically.**

After generating SPECIFICATIONS.xml:
```
SPECIFICATIONS COMPLETE

Summary: [X] stories, [Y] use cases, [Z] business rules

Ready to move to the design phase?
--> "yes" or "approved" to proceed
--> "change [aspect]" to revise
```

---

## Playground Integration (Unified Dashboard)

### Overview
The unified dashboard shows specs phase with user stories that users can:
- **Reorder priorities** via drag & drop
- **Adjust scope** (MVP / V1 / Full)
- **Configure sprint capacity** and duration
- **Validate the prioritized backlog** before proceeding

### Updated Flow

1. **Generate user stories** from the discovery phase
2. **Update `.genius/outputs/state.json`** with stories in `phases.specs.data`
3. **User views in unified dashboard** — Dashboard shows specs phase automatically
4. **User validates** the backlog → approval triggers next phase

### Story Format in state.json

Write stories to `phases.specs.data.stories`:

```json
{
  "currentPhase": "specs",
  "phases": {
    "specs": {
      "status": "in-progress",
      "data": {
        "stories": [
          {
            "id": 1,
            "title": "User can register with email",
            "priority": "must",
            "estimate": "M",
            "scope": "mvp"
          },
          {
            "id": 2,
            "title": "User can login/logout",
            "priority": "must",
            "estimate": "S",
            "scope": "mvp"
          }
        ],
        "sprintCapacity": 20,
        "sprintDuration": 2
      }
    }
  }
}
```

**Estimation Points:**
- `S` = 1 point
- `M` = 3 points
- `L` = 5 points
- `XL` = 8 points

**Priority Mapping:**
- `must` → MVP (core features, must ship)
- `should` → V1 (important but not blocking)
- `could` → Full (nice to have)
- `wont` → Full (parking lot / future)

### DO NOT Create Separate HTML Files

The unified dashboard at `project-dashboard.html` reads from state.json and displays the specs phase. No need to:
- ❌ Copy templates
- ❌ Create SPECIFICATIONS.html
- ❌ Open separate URLs

Just update state.json and the dashboard reflects changes.

### Output: Validated Backlog

When user approves, update state.json:
- `phases.specs.status` = `"complete"`
- `phases.specs.data` = final validated stories with priorities
- `currentPhase` = `"design"`

---

## Handoffs

### From: genius-interviewer / genius-product-market-analyst
Receives: DISCOVERY.xml, MARKET-ANALYSIS.xml

### To: genius-designer (after approval)
Provides: SPECIFICATIONS.xml, screen definitions, component list

### To: genius-architect
Provides: SPECIFICATIONS.xml, data model, API endpoints, NFRs
