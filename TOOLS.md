# TOOLS.md — Genius Team Tooling Reference

## Supported Engines

| Engine | Min Version | Notes |
|--------|-------------|-------|
| Claude Code | 2.1.86+ | Default engine; Auto Mode, Computer Use, Bare Mode, Plugins GA |
| Codex CLI | 0.107.0+ | GPT-5.4 default; multi-agent orchestration |

## Codex Features (≥ 0.107.0)

- **Thread forking** — spawn sub-agent branches without leaving conversation
- **Realtime voice** — mic/speaker selection, persistent across sessions
- **Custom tools multimodal** — tools can return images + structured content
- **Configurable memories** — `codex debug clear-memories` to reset
- **GPT-5.4 (05 Mar 2026)** — le modèle par défaut dans Codex CLI. Reasoning + coding + agentic en un modèle unifié. Contexte 1M tokens. Computer use natif.

## Claude Code Features (≥ 2.1.86)

### New in 2.1.80–2.1.86

- **Computer Use** — control screen, click, browse, take screenshots. Pro/Max plans. Used by `genius-ui-tester` for visual testing. Enable via settings or `--computer-use`.
- **Auto Mode** — automatically approve safe actions based on permission rules. Used by `genius-auto` to configure skill-aware safety profiles. Toggle with `/auto` or `--auto-approve`.
- **--bare Mode** — scripted execution without hooks, UI, or interactivity. Designed for CI/CD. Used by `genius-ci` for GitHub Actions pipelines: `claude --bare -p "prompt" --output-format json`.
- **Plugins GA** — official plugin marketplace. Install plugins via `claude plugins install <name>`. Genius-Claw available as plugin.
- **Conditional Hooks** — `if` field in hook definitions for permission-based rules. Used by `genius-auto` for skill-aware auto-approval.
- **MCP Elicitation** — MCP servers can ask users questions interactively to gather missing parameters.
- **Background Agent + Worktree** — run agents in background with isolated git worktrees. `--background` flag for parallel task execution.
- **Remote Triggers** — schedule agents to run on cron: `claude trigger create --schedule "0 9 * * *" --prompt "..."`. Used by `genius-scheduler`.
- **Agent SDK renamed** — now `@anthropic-ai/claude-agent-sdk` (was `@anthropic-ai/agent-sdk`).

### Existing (2.1.76+)

- **Claude Code Channels** — talk to your session from Telegram or Discord. Full filesystem + MCP + git access from your phone.
- **Voice Mode** — `/voice` push-to-talk (spacebar). 20 languages. Improved in 2.1.84 with better push-to-talk UX.
- **1M Token Context** — Opus 4.6 supports 1M tokens on Max/Team/Enterprise. Less compaction needed.
- **/loop** — recurring tasks: `/loop 5m check deploy`, `/loop 30s run tests`. Used by `genius-scheduler`.
- **/effort** — control analysis depth: `low` (quick), `medium` (default), `high` (deep).
- **/color** — color-code your session prompt for multiple parallel sessions.
- **Agent Teams** — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` for parallel genius-dev
- **HTTP Hooks** — POST JSON to external URL on hook events (set `GENIUS_WEBHOOK_URL`)
- **Shared project configs** — configs sync across git worktrees automatically
- `/simplify`, `/batch` — built-in slash commands for context management
- **Remote Control** — control your terminal session from your phone via Claude Code mobile app

## OpenClaw (Genius-Claw)

- **sessions_spawn + attachments** — pass files inline to genius sub-agents
- **PDF tool** — genius-qa can analyze PDF specs natively
- **Canvas** — present `.genius/DASHBOARD.html` as live OpenClaw canvas
- **Telegram streaming** — genius-dev/qa stream output in real-time

## MCP — Model Context Protocol

### Cloudflare Code Mode (Recommandé pour genius-dev)

Réduit le coût tokens des MCP servers de 1M+ → ~1K tokens.

| Pattern | Tools exposés | Coût tokens |
|---------|--------------|-------------|
| Standard MCP | 200+ tools avec schemas | 500K-1.17M tokens |
| Code Mode | 2 tools (`run_code` + `get_docs`) | ~1 000 tokens |

**Setup :**
```bash
# Dans le projet utilisateur
npx cloudflare-mcp-server --setup
# Ou dans .claude/settings.json → mcpServers
```

**Guide complet :** `docs/cloudflare-mcp-guide.md`
**Source :** https://blog.cloudflare.com/code-mode-mcp/

## Crypto & Web3 Tools

### DexScreener CLI/MCP (genius-crypto)
- Token scanner across all chains — free, no API key required
- Scores: volume, liquidity, momentum, flow pressure  
- Install: `git clone https://github.com/vibeforge1111/dexscreener-cli-mcp-tool.git`
- MCP server included for AI agent integration

### OpenSea CLI + Skill (genius-crypto)
- NFT queries, Seaport trades, ERC20 swaps across Ethereum/Base/Arbitrum/Optimism/Polygon
- TOON output format: ~40% fewer tokens than JSON
- Install: `npm install -g @opensea/cli`
- Requires: `OPENSEA_API_KEY` + `OPENSEA_MCP_TOKEN`

### Dune MCP — On-chain Analytics (genius-crypto)
- SQL access to all indexed blockchain data
- Tools: searchTables, createDuneQuery, executeQueryById, getExecutionResults, createVisualization
- Requires: `DUNE_API_KEY`
- Config: `@duneanalytics/mcp-server` via npx in mcpServers

## GEO / SEO

- **GEO (Generative Engine Optimization)** — AI search optimization for ChatGPT/Perplexity/Claude/Gemini
- **llms.txt standard** — AI crawler guidance file at `/llms.txt`
- **Citability scoring** — Content structured for AI citations (clarity, factual density, E-E-A-T)
- **geo-seo-claude** (zubair-trabzada/geo-seo-claude) — Architecture inspiration for genius-seo
- Used by: `genius-seo`
