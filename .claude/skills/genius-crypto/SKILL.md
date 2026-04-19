---
name: genius-crypto
description: >-
  Blockchain and Web3 analysis skill. Scans tokens via DexScreener, analyzes NFT
  collections via OpenSea, and runs on-chain SQL analytics via Dune MCP.
  Use for Web3 project due diligence, tokenomics analysis, DeFi protocol research,
  portfolio tracking, or when user says "check this token", "analyze NFT collection",
  "on-chain analytics", "DeFi analysis", "crypto research", "blockchain data".
  Do NOT use for implementing Web3 smart contracts — use genius-dev-backend for that.
context: fork
agent: genius-crypto
user-invocable: true
allowed-tools:
  - Read(*)
  - Write(*)
  - Bash(npx *)
  - Bash(curl *)
  - Bash(python3 *)
  - Bash(jq *)
---

# Genius Crypto v17 — Blockchain Intelligence

**On-chain data + market signals + NFT analytics. Due diligence before you build.**

---

## Tools Available

### 1. DexScreener CLI/MCP
Token scanning across all chains. Free, no API key required.

```bash
# Install (first time)
git clone https://github.com/vibeforge1111/dexscreener-cli-mcp-tool.git ~/.genius/tools/dexscreener
cd ~/.genius/tools/dexscreener && chmod +x install.sh && ./install.sh

# Scan hot tokens
./ds hot

# Watch specific token
./ds watch {TOKEN_ADDRESS}

# Setup scanning preferences
./ds setup
```

**Scoring metrics**: Volume, liquidity, momentum, flow pressure.

### 2. OpenSea Skill (NFT/marketplace)
Requires: `OPENSEA_API_KEY` + `OPENSEA_MCP_TOKEN` in environment.

```bash
# Install OpenSea CLI
npm install -g @opensea/cli

# Query collection
opensea collections get {collection-slug}

# Best listings
opensea listings best {collection-slug} --limit 5

# Trending tokens
opensea tokens trending --limit 10

# Swap quote
opensea swaps quote --from-chain base --from-address 0x0... --to-chain base --to-address 0x0... --quantity 0.1 --address 0xYourWallet

# Use TOON format to save tokens (~40% less than JSON)
opensea collections get {slug} --format toon
```

### 3. Dune MCP (On-chain SQL analytics)
Requires: `DUNE_API_KEY` in environment.

Available MCP tools:
- `searchTables` — find blockchain data tables by protocol/chain
- `createDuneQuery` — write and save SQL for on-chain data
- `executeQueryById` — run a saved query
- `getExecutionResults` — retrieve query results
- `createVisualization` — build charts from query data
- `searchDocs` — find Dune documentation

```
Example queries:
- "Find all wallets that interacted with [protocol] in the last 7 days"
- "Show daily active users for [token]"
- "Compare TVL across DeFi protocols"
```

---

## Analysis Protocol

### Token Due Diligence
1. DexScreener scan: volume, liquidity, price action, holder concentration
2. Dune query: on-chain activity, whale movements, token distribution
3. Output: risk score + opportunity summary

### NFT Collection Analysis
1. OpenSea: floor price, volume, listings quality, trading activity
2. Dune: on-chain minting data, holder distribution, wash trading detection
3. Output: collection health score

### Web3 Project Research
1. Check token (DexScreener)
2. Check protocol TVL and usage (Dune)
3. Check NFT ecosystem if applicable (OpenSea)
4. Output: `.genius/crypto-research-{project}.md`

---

## Output

Save research to `.genius/crypto-research-{topic}.md`

Update state:
```bash
jq --arg ts "$(date -Iseconds)" '.skill = "genius-crypto" | .status = "complete" | .updatedAt = $ts' .genius/outputs/state.json > .genius/outputs/state.json.tmp && mv .genius/outputs/state.json.tmp .genius/outputs/state.json 2>/dev/null || true
```

---

## Environment Setup

Add to your project's `.claude/settings.json` → `env`:
```json
"OPENSEA_API_KEY": "your-key",
"OPENSEA_MCP_TOKEN": "your-token",
"DUNE_API_KEY": "your-key"
```

Optional Dune MCP configuration in `.claude/settings.json` → `mcpServers`:
```json
"dune": {
  "command": "npx",
  "args": ["-y", "@duneanalytics/mcp-server"],
  "env": { "DUNE_API_KEY": "${DUNE_API_KEY}" }
}
```

## Compatibility

Works in all Genius Team modes (CLI, IDE, OpenClaw, Codex engine).
In Codex dual mode, use thread forking for parallel DexScreener + Dune queries.

---

## Playground Update (MANDATORY)

After completing your task:
1. **DO NOT create a new HTML file** — update the existing genius-dashboard tab
2. Open `.genius/DASHBOARD.html` and update YOUR tab's data section with real project data
3. If your tab doesn't exist yet, add it to the dashboard (hidden tabs become visible on first real data)
4. Remove any mock/placeholder data from your tab
5. Tell the user: `📊 Dashboard updated → open .genius/DASHBOARD.html`


---

## Definition of Done

Crypto/Web3 implementation MUST be:
1. **Contract audited**: Smart contract reviewed for common vulnerabilities (reentrancy, overflow, access control)
2. **Testnet verified**: All functions tested on testnet before mainnet
3. **Gas optimized**: Loops and storage patterns reviewed for gas efficiency
4. **ABI documented**: All public functions documented with parameters and events
5. **Error handling**: All revert reasons documented and user-friendly messages added

Never deploy to mainnet without testnet verification.

## Handoffs
- → **genius-dev-backend**: For implementing smart contracts or blockchain integrations
- → **genius-security**: For security audit of crypto implementations
- → **genius-deployer**: For deploying Web3 applications
