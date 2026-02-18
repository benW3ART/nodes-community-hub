---
description: Show current Genius Team v9.0 project status and progress
---

# /status

Show current project status, memory state, and progress.

## Execution

### Step 1: Read State & Memory
```bash
cat .genius/state.json 2>/dev/null
cat .genius/memory/BRIEFING.md 2>/dev/null | head -40
```

### Step 2: Check Artifacts
```bash
ls -la DISCOVERY.xml MARKET-ANALYSIS.xml SPECIFICATIONS.xml DESIGN-SYSTEM.html ARCHITECTURE.md .claude/plan.md PROGRESS.md 2>/dev/null
```

### Step 3: Display Status

```
📊 **Project Status — Genius Team v9.0**

**Phase:** {Ideation / Execution / Complete}
**Current Step:** {skill name or "Ready to start"}

**Memory:**
  • Decisions: {count from decisions.json}
  • Patterns: {count from patterns.json}
  • Errors: {count from errors.json}
  • Session logs: {count}

**Progress:**
  Discovery       {✅ | ░░░░}
  Market Analysis {✅ | ░░░░}
  Specifications  {✅ | ░░░░}
  Design          {✅ | ░░░░}
  Architecture    {✅ | ░░░░}
  Execution       {XX% | ░░░░}
  QA              {Pending}
  Deployment      {Pending}

**Execution Progress:** (if in execution phase)
  Total: {X} | Done: {Y} ✅ | In Progress: {Z} ⏳ | Remaining: {W}

**Save-Token Mode:** {on/off}

**Next Action:** {context-aware suggestion}
```
