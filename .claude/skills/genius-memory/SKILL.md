---
name: genius-memory
description: Persistent context and knowledge management skill. Maintains project memory across sessions using file-based storage. Tracks decisions, patterns, conventions, and lessons learned. AUTO-TRIGGERS on "remember this", "we decided", "don't forget", "this broke because", "lesson learned".
---

# Genius Memory v9.0 — The Knowledge Keeper

> **File-based memory system. No external MCPs required.**

## Memory Architecture

```
.genius/memory/
├── BRIEFING.md          # Auto-generated summary (~150 lines)
├── decisions.json       # Key decisions with rationale
├── patterns.json        # Code patterns and conventions
├── progress.json        # Task progress (7-day decay)
├── errors.json          # Resolved errors + solutions
└── session-logs/        # Compressed session logs (30-day retention)
```

## Core Operations

### 1. Load Context (Session Start)
Read `@.genius/memory/BRIEFING.md` — auto-generated summary of all memory.

### 2. Record Decision
Append to `.genius/memory/decisions.json`:
```json
{
  "id": "d-XXXX",
  "decision": "DECISION: What was decided",
  "reason": "Why it was decided",
  "timestamp": "2025-01-29T12:00:00",
  "tags": ["decision", "category"]
}
```

### 3. Record Error + Solution
Append to `.genius/memory/errors.json`:
```json
{
  "id": "e-XXXX",
  "error": "What broke and where",
  "solution": "How it was fixed",
  "timestamp": "2025-01-29T12:00:00",
  "tags": ["error", "category"]
}
```

### 4. Record Pattern
Append to `.genius/memory/patterns.json`:
```json
{
  "id": "p-XXXX",
  "pattern": "Pattern description",
  "context": "When/where to apply",
  "timestamp": "2025-01-29T12:00:00"
}
```

### 5. Search Memory
Read the relevant JSON file and search by tags, keywords, or date range.

### 6. Regenerate Briefing
Run `bash scripts/memory-briefing.sh` to regenerate BRIEFING.md from all JSON files.

## Auto-Trigger Phrases

| Trigger Phrase | Action | File |
|----------------|--------|------|
| "Remember that..." | Add fact | decisions.json |
| "Don't forget..." | Add fact | decisions.json |
| "Important:..." | Add fact | decisions.json |
| "We decided..." | Add decision | decisions.json |
| "Let's go with..." | Add decision | decisions.json |
| "This broke because..." | Add error | errors.json |
| "Lesson learned..." | Add error | errors.json |
| "Never do..." | Add pattern | patterns.json |
| "Pattern: ..." | Add pattern | patterns.json |
| "Always use..." | Add pattern | patterns.json |

**Response**: "Got it, saved to memory."

## Integration Patterns for ALL Skills

### Pattern 1: Session Start (MANDATORY)
Every skill MUST read `@.genius/memory/BRIEFING.md` before any work.

### Pattern 2: Decision Made
Append to decisions.json with decision, reason, and tags.

### Pattern 3: Something Failed
Append to errors.json with error description and solution.

### Pattern 4: Before Proposing Solution
Check BRIEFING.md and errors.json for previously rejected approaches.

### Pattern 5: Pattern Discovered
Append to patterns.json with pattern description and context.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/memory-briefing.sh` | Regenerate BRIEFING.md from JSON files |
| `scripts/memory-extract.sh` | Extract memories from session context |

## Decay & Retention

- **progress.json**: 7-day rolling window (older entries pruned)
- **session-logs/**: 30-day retention
- **decisions.json, patterns.json, errors.json**: Permanent (manual cleanup)

## Handoffs

### To ALL Skills
Provides: Project context via BRIEFING.md, searchable history via JSON files.

Protocol: Every skill MUST read BRIEFING.md at session start.
