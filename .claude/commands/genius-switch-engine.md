# /genius-switch-engine

Switch the Genius Team project engine between Claude Code, Codex CLI, or Dual mode.

## Usage

```
/genius-switch-engine claude
/genius-switch-engine codex
/genius-switch-engine dual
```

## What it does

### → claude
- Removes AGENTS.md (if present)
- Ensures CLAUDE.md is complete
- Updates .genius/state.json with engine: "claude"

### → codex
- Generates AGENTS.md from CLAUDE.md (adapted syntax)
- Creates .agents/ with symlinks to all 38 .claude/skills/
- Verifies Codex CLI installation
- Updates state

### → dual
- Generates both CLAUDE.md + AGENTS.md
- Creates .agents/ symlinks
- Initializes .genius/dual-bridge.json for cross-engine communication
- Enables /challenge command in both terminals

## Behind the scenes

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/scripts/switch-engine.sh) [claude|codex|dual]
```

⚠️ **NEVER run the local script directly. Always curl from GitHub.**

## Compatibility notes

| Feature | Claude Code | Codex | Dual |
|---------|------------|-------|------|
| Skills (.claude/skills/) | ✅ Native | ✅ Via symlinks | ✅ Both |
| Hooks (PostToolUse, Stop) | ✅ | ⚠️ Some only | ✅ Claude side |
| /challenge command | ✅ | ✅ | ✅ Best experience |
| HTTP Hooks (GENIUS_WEBHOOK_URL) | ✅ | ✅ | ✅ |
