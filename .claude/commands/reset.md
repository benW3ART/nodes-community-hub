---
description: Reset Genius Team project (with backup and confirmation)
---

# /reset

Start the project over with confirmation and backup.

## Execution

### Step 1: Confirm Reset

```
⚠️ **Reset Project**

This will:
- Create a backup of current state in .genius/backups/
- Reset .genius/state.json to NOT_STARTED
- Clear PROGRESS.md and .claude/plan.md

This will NOT:
- Delete generated files (DISCOVERY.xml, etc.)
- Clear memory (.genius/memory/) — decisions and patterns persist
- Remove code files

Are you sure? Type "yes" to confirm.
```

### Step 2: If Confirmed

```bash
# Backup
BACKUP_DIR=".genius/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp .genius/state.json "$BACKUP_DIR/" 2>/dev/null
cp PROGRESS.md "$BACKUP_DIR/" 2>/dev/null
cp .claude/plan.md "$BACKUP_DIR/" 2>/dev/null

# Reset state
NOW=$(date -Iseconds 2>/dev/null || date)
cat > .genius/state.json << EOF
{
  "version": "9.0.0",
  "phase": "NOT_STARTED",
  "currentSkill": null,
  "skillHistory": [],
  "checkpoints": {},
  "tasks": {"total": 0, "completed": 0, "failed": 0, "skipped": 0},
  "artifacts": {},
  "agentTeams": {"active": false},
  "created_at": "$NOW",
  "updated_at": "$NOW"
}
EOF

# Clear progress
rm -f PROGRESS.md .claude/plan.md

# Regenerate briefing
bash scripts/memory-briefing.sh 2>/dev/null
```

### Step 3: Log Reset

Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "PROJECT RESET — backup saved", "reason": "user requested", "timestamp": "ISO-date", "tags": ["reset"]}
```

### Step 4: Show Ready State

```
🔄 **Project Reset Complete**

Backup saved to: .genius/backups/{timestamp}/
Memory preserved (decisions, patterns, errors persist).

Say "I want to build [idea]" to begin a new project.
```
