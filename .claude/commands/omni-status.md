Check the status of all Omni Mode providers and report their availability.

Run this bash script and display the results:

```bash
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🌐 Genius Team v17.0 — Omni Mode Provider Status         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Claude Code (always available)
echo "── Claude Code (Lead Orchestrator) ──"
if command -v claude &>/dev/null; then
  echo "  ✅ Installed: $(claude --version 2>/dev/null | head -1)"
else
  echo "  ❌ Not found (CRITICAL — required for all modes)"
fi
echo ""

# Codex CLI
echo "── Codex CLI (Code Implementation) ──"
if command -v codex &>/dev/null; then
  echo "  ✅ Installed: $(codex --version 2>/dev/null | head -1)"
else
  echo "  ❌ Not installed → fallback to Claude Code"
  echo "  📦 Install: npm install -g @openai/codex"
fi
if [ -n "$OPENAI_API_KEY" ]; then
  echo "  🔑 OPENAI_API_KEY: set (${OPENAI_API_KEY:0:8}...)"
else
  echo "  🔑 OPENAI_API_KEY: ❌ not set"
fi
echo ""

# Kimi CLI
echo "── Kimi CLI (Documentation) ──"
if command -v kimi &>/dev/null; then
  echo "  ✅ Installed: $(kimi --version 2>/dev/null | head -1)"
else
  echo "  ❌ Not installed → fallback to Claude Code"
  echo "  📦 Install: npm install -g kimi-cli"
fi
if [ -n "$KIMI_API_KEY" ]; then
  echo "  🔑 KIMI_API_KEY: set (${KIMI_API_KEY:0:8}...)"
else
  echo "  🔑 KIMI_API_KEY: ❌ not set"
fi
echo ""

# Gemini CLI
echo "── Gemini CLI (Research & Analysis) ──"
if command -v gemini &>/dev/null; then
  echo "  ✅ Installed: $(gemini --version 2>/dev/null | head -1)"
else
  echo "  ❌ Not installed → fallback to Claude Code"
  echo "  📦 Install: npm install -g @anthropic-ai/gemini-cli"
fi
if [ -n "$GOOGLE_API_KEY" ]; then
  echo "  🔑 GOOGLE_API_KEY: set (${GOOGLE_API_KEY:0:8}...)"
else
  echo "  🔑 GOOGLE_API_KEY: ❌ not set"
fi
echo ""

# Aider (bonus)
echo "── Aider (Optional — Pair Programming) ──"
if command -v aider &>/dev/null; then
  echo "  ✅ Installed: $(aider --version 2>/dev/null | head -1)"
else
  echo "  ⚪ Not installed (optional)"
  echo "  📦 Install: pip install aider-chat"
fi
echo ""

# Summary
echo "── Summary ──"
AVAILABLE=1  # Claude Code always counts
for cmd in codex kimi gemini; do
  command -v "$cmd" &>/dev/null && AVAILABLE=$((AVAILABLE + 1))
done
echo "  Providers available: $AVAILABLE/4"
if [ $AVAILABLE -eq 4 ]; then
  echo "  Mode: 🟢 Full Omni"
elif [ $AVAILABLE -gt 1 ]; then
  echo "  Mode: 🟡 Partial Omni ($AVAILABLE providers)"
else
  echo "  Mode: 🔵 Solo (Claude Code only — fully functional)"
fi

# Routing log
if [ -f .genius/omni-router.log ]; then
  LAST=$(tail -1 .genius/omni-router.log 2>/dev/null)
  echo "  Last routing: $LAST"
fi
```

Display the output in a clear, formatted way.
