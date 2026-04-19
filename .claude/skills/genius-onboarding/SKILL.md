---
name: genius-onboarding
description: >-
  First-time setup wizard for new Genius Team installations. Use when the .genius/ directory
  doesn't exist, or user says "setup genius", "initialize", "first time setup",
  "configure genius team". Do NOT use on projects already initialized — use genius-start instead.
---

# Genius Onboarding v17.0 — Welcome Experience

**Making every first interaction memorable and productive.**

## Memory Integration

### On Onboarding Start
Read `@.genius/memory/BRIEFING.md` for any existing context.

### On Profile Created
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "USER ONBOARDED: [name] | LEVEL: [skill_level] | STACK: [stack]", "reason": "first-time setup", "timestamp": "ISO-date", "tags": ["onboarding", "user"]}
```

---

## Trigger Conditions

Activate when:
- No `.claude/user-profile.json` exists
- User says "hello", "hi", "get started", "new here"
- First interaction in a new project

---

## Onboarding Flow (MAX 5 questions)

1. **Name & Role**: "What should I call you?"
2. **Experience Level**: Vibe Coder / Builder / Developer / Expert
3. **Preferred Stack**: "What's your go-to tech stack?"
4. **Communication Style**: Direct / Detailed / Casual
5. **Language Preference**: en/fr/both

### Output: `.claude/user-profile.json`
```json
{
  "name": "...",
  "role": "...",
  "skill_level": "...",
  "preferences": {
    "communication": "...",
    "language": "...",
    "stack": { "frontend": "...", "backend": "...", "styling": "...", "deployment": "..." }
  },
  "onboarded_at": "ISO-date",
  "genius_team_version": "14.0.0"
}
```

---

## Environment Check

```bash
which node npm git jq claude 2>/dev/null
ls -la .claude/ .genius/ 2>/dev/null
```

---

## Handoffs

### To genius-interviewer
Provides: User profile, initial project idea

### To genius-memory
Provides: User preferences to store


---

## Definition of Done

Onboarding flow MUST be:
1. **Complete journey**: From sign-up to first meaningful action fully mapped
2. **Tested end-to-end**: Manually walked through as a new user (cold start)
3. **Skip options**: Every step has a skip/dismiss path
4. **Progress indicator**: User always knows where they are in the flow
5. **Exit recovery**: If user abandons midway, they can resume where they left off

Report must include: average time to complete, key drop-off points, and recommendations.
