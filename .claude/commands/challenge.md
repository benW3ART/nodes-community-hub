# /challenge

Reads what the OTHER engine just did and challenges it with a multi-agent code review.

Works from both Claude Code and Codex terminals — no need to explain what happened.

## Usage

```
/challenge
```

## What it does

1. Detects the current engine (Claude Code or Codex)
2. Reads `.genius/dual-bridge.json` to get the OTHER engine's last action
3. Retrieves the diff/changes made by the other engine
4. Runs genius-code-review on those specific changes
5. Reports back: CRITICAL / HIGH / MEDIUM / LOW findings

## Example workflow

**Terminal 1 (Claude Code):** You implement a feature. Bridge is updated.
**Terminal 2 (Codex):** You type `/challenge`. Codex reads what Claude just built and reviews it — no context needed.

**Terminal 1 (Claude Code):** You type `/challenge`. Claude reads what Codex just wrote and reviews it.

## Under the hood

```bash
# Reads .genius/dual-bridge.json
# Identifies: current engine = claude → reads codex.last_diff
# If no diff in bridge: runs git diff to find recent changes
# Then spawns genius-code-review on those changes
```

## Bridge file location

`.genius/dual-bridge.json` — auto-written by hooks in both engines after each dev action.

## No bridge data yet?

If the bridge is empty (first use or other engine hasn't acted yet), /challenge will:
1. Run `git diff HEAD~1` to find the most recent commit changes
2. Challenge those changes instead

## Compatibility

- Claude Code: reads `codex.last_diff` from bridge, challenges via genius-code-review
- Codex: reads `claude.last_diff` from bridge, challenges via genius-code-review
- Same behavior, same output format, in both terminals
