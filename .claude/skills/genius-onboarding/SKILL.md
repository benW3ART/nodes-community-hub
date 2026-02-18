---
name: genius-onboarding
description: First-time user experience and setup wizard for Genius Team. Use when a new user starts their first project, says "hello", "get started", or when no user profile exists in .claude/user-profile.json.
---

# Genius Onboarding v9.0 — Welcome Experience

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
  "genius_team_version": "9.0.0"
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
