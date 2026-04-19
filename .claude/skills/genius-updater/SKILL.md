---
name: genius-updater
description: >-
  Detects Claude Code and Genius Team version changes and proposes updates. Use when user says
  "check for updates", "upgrade genius", "is there a new version", or automatically at session
  start. Do NOT use manually for code implementation.
user-invocable: true
allowed-tools:
  - Read(*)
  - Write(*)
  - Edit(*)
  - Glob(*)
  - Grep(*)
  - WebSearch(*)
  - WebFetch(*)
  - Bash(claude *)
  - Bash(cat *)
  - Bash(echo *)
  - Bash(curl *)
---

# Genius Updater v17.0 — Self-Update Protocol

**Keep your repo in sync with Claude Code AND Genius Team evolution.**

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for context.

### On New Version Detected
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "UPDATE DETECTED: [component] [old] → [new]", "reason": "new version detected", "timestamp": "ISO-date", "tags": ["updater", "version"]}
```

### On Update Applied
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "UPDATED [component] to [version]: [changes]", "reason": "user approved", "timestamp": "ISO-date", "tags": ["updater", "applied"]}
```

---

## How It Works

### Automatic Detection (SessionStart)

The SessionStart hook checks TWO things:

#### 1. Claude Code Version
Compares:
- **Stored version**: `.genius/claude-code-version.txt`
- **Current version**: `claude --version`

If they differ, outputs a `<version_change>` tag.

#### 2. Genius Team Version
```bash
# Check Genius Team version
LOCAL_GT=$(cat VERSION 2>/dev/null || echo "10.0.0")
REMOTE_GT=$(curl -sfL https://raw.githubusercontent.com/w-3-art/genius-team/main/VERSION 2>/dev/null || echo "$LOCAL_GT")
if [ "$LOCAL_GT" != "$REMOTE_GT" ]; then
  echo "<genius_team_update>New Genius Team version: $LOCAL_GT → $REMOTE_GT. Run /genius-upgrade</genius_team_update>"
fi
```

---

## Manual Check: `/update-check`

### Step 1: Check Claude Code

1. Run `claude --version` and compare with stored version
2. If new version detected:
   - Use WebSearch to fetch changelog from official sources:
     - `https://docs.anthropic.com/claude-code/changelog`
     - Anthropic blog
     - Community posts
   - Analyze what's new (new tools, syntax changes, capabilities)
   - Propose specific repo modifications

### Step 2: Check Genius Team

1. Read local `VERSION` file (or default to current installed version)
2. Fetch remote version:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/VERSION
   ```
3. If versions differ:
   - Fetch `CHANGELOG.md` from GitHub to see what's new
   - Propose running `/genius-upgrade`

### Step 3: Present Combined Results

```
🔄 Update Check

Claude Code: v1.0.50 ✅ (up to date)

Genius Team: v13.0.0 → v14.0.0 available! 🆕
What's new:
- 12 interactive playgrounds
- Anti-drift system
- Persistent memory

Run /genius-upgrade to update.
```

If both are up-to-date:
```
🔄 Update Check

Claude Code: v1.0.50 ✅ (up to date)
Genius Team: v14.0.0 ✅ (up to date)

Everything is up to date! 🎉
```

---

## Genius Team Updates

### Version Detection

**Local version sources (in priority order):**
1. `VERSION` file in repo root
2. `.genius/state.json` → `version` field
3. Default: "10.0.0" (legacy)

**Remote version:**
```bash
curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/VERSION
```

### Fetching Changelog

When new version detected, fetch what's new:
```bash
curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/CHANGELOG.md
```

Parse the latest version section to extract:
- New features
- Breaking changes
- Migration notes

### Upgrade Process: `/genius-upgrade`

The upgrade command:
1. Backs up current configuration
2. Fetches latest from GitHub
3. Runs migration scripts if needed
4. Updates `VERSION` file
5. Logs to `decisions.json`

---

## Claude Code Updates

### What Gets Updated

Depending on the changelog, the updater may propose changes to:

- `.claude/settings.json` — New permissions, hook types, env variables
- Skill frontmatter — New fields, deprecated syntax
- Agent definitions — New capabilities
- Orchestrator — New Task() features, Agent Teams improvements
- Memory scripts — New hook types for extraction

### Version File

`.genius/claude-code-version.txt` contains the last known Claude Code version.
Format: single line with the version string from `claude --version`.

---

## Safety Rules

1. **Never auto-apply** — Always ask for explicit approval
2. **Show diff** — Explain exactly what will change
3. **Backup first** — Create backup before modifying files
4. **Test after** — Run `bash scripts/verify.sh` after applying
5. **Log everything** — Record all changes to decisions.json

---

## Handoffs

### To genius-team-optimizer
Provides: New features that could improve skills

### From SessionStart hook
Triggered: When version mismatch detected (Claude Code or Genius Team)

## Definition of Done

- [ ] Version gap is identified with concrete impacted files or features
- [ ] Proposed changes are reviewed before any modification happens
- [ ] Backup, verification, and logging steps are specified
- [ ] User approval requirements remain explicit
- [ ] Follow-up optimization or maintenance handoff is clear
