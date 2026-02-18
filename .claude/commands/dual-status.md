# /dual-status — Dual Engine Status

Show the current state of the Dual Engine (Builder + Challenger).

## Instructions

1. Read `.genius/dual-state.json` (create with defaults if missing)
2. Display status in this format:

```
╔══════════════════════════════════════════╗
║  🔄 Dual Engine Status                  ║
╚══════════════════════════════════════════╝

Active:     {yes/no}
Mode:       {build-review / discussion / audit / none}
Cycle:      {N} / {DUAL_MAX_ROUNDS}

Builder:    {DUAL_BUILDER_MODEL}
Challenger: {DUAL_CHALLENGER_MODEL}
Profile:    {strict / balanced / lenient}

Last Verdict: {APPROVE / REQUEST_CHANGES / REJECT / none}
Current Task: {description or "none"}

History:
  Cycle 1: REQUEST_CHANGES (score: 65/100)
  Cycle 2: APPROVE (score: 82/100)
```

3. If `.genius/dual-verdict.md` exists, show a brief summary of the latest findings
4. If no dual state exists, report "Dual Engine not initialized. Use a 🔄 task or say 'dual review this' to activate."
