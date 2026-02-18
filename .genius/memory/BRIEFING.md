# NODES Community Hub — Project Briefing

> Auto-loaded at every session start. Keep this up to date.

## Project Overview

**Name:** NODES Community Hub  
**Type:** NFT Community Tools — Web App  
**Stack:** Next.js 15 + React 19 + TypeScript + Tailwind CSS 4  
**Blockchain:** Base Mainnet (Chain ID: 8453)  
**Collection:** NODES — 3,333 NFTs  
**Contract:** `0x95bc4c2e01c2e2d9e537e7a9fe58187e88dd8019`  
**Deploy:** Railway (auto-deploy from `main`) → `nodes-community-hub-production.up.railway.app`  
**GitHub:** `benW3ART/nodes-community-hub`

## Tech Stack Details

- **Frontend:** Next.js 15 App Router, React 19, Tailwind CSS 4
- **Wallet:** wagmi v2 + viem + RainbowKit (WalletConnect, MetaMask, Coinbase)
- **State:** Zustand (`useNodesStore`)
- **NFT Data:** Alchemy API (`getNFTsForOwner`)
- **Blockchain reads:** wagmi hooks
- **Media exports:** html2canvas, gif-encoder-2, gifuct-js, ffmpeg (server-side)
- **Canvas rendering:** `canvas` npm package (server API routes)
- **Package manager:** npm

## Features (Implemented)

### 1. Gallery (`/gallery`)
- View all NODES NFTs in connected wallet
- Filter by Inner State, sort by tokenId/rarity
- Click NFT → zoom modal with ALL attributes from metadata + rarity data
- Full Sets tracker integration
- Rarity scores (rank, score, tier) from pre-calculated `rarity.json`

### 2. Grid Creator (`/grid-creator`)
- Build N×M grids (presets: 2×2 to 6×4, custom sizes)
- 4 export formats: PNG (client-side), GIF, Video (server-side API)
- 4 grid styles: Classic (gray border), Borderless, White Gap, Seamless
- Special cells: Logo (1×1), Banner (2×1 with custom image)
- Export resolution: 600px/cell
- Default banner image: `nodes-banner-logo.jpg`

### 3. Banner Creator (`/banner-creator`)
- Twitter/X header banners (1500×500)
- 6 templates (Spotlight to Quintet)
- NODES branding + custom text
- PNG export (Canvas API + CORS proxy)

### 4. Post Creator (`/post-creator`)
- Social media post images
- Custom text overlays

### 5. Full Sets (`/full-sets`)
- Track which Inner States the user owns
- 7 Inner States: Drifting, Syncing, Processing, Grounding, Expanding, Integrating, Transcending

### 6. Leaderboard (`/leaderboard`)
- Collection-wide rarity rankings

### 7. Admin (`/admin`)
- Wallet-gated (whitelist check via `/api/admin/check`)
- Asset management: upload logos, frames, backgrounds, banners (2×1)

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/proxy-gif` | CORS proxy for NFT images |
| `/api/create-gif` | Server-side GIF generation |
| `/api/create-video` | Server-side MP4 generation (ffmpeg) |
| `/api/create-post-image` | Post image generation |
| `/api/metadata/[tokenId]` | NFT metadata proxy |
| `/api/leaderboard` | Rarity leaderboard data |
| `/api/opensea/listings` | OpenSea marketplace listings |
| `/api/admin/check` | Admin whitelist verification |
| `/api/admin/assets` | Asset CRUD |

## Key Files

```
src/
├── app/                    # Next.js App Router pages
│   ├── gallery/page.tsx
│   ├── grid-creator/page.tsx
│   ├── banner-creator/page.tsx
│   ├── post-creator/page.tsx
│   ├── full-sets/page.tsx
│   ├── leaderboard/page.tsx
│   ├── admin/page.tsx
│   └── api/               # Server-side API routes
├── components/
│   ├── Header.tsx
│   ├── NFTCard.tsx        # NFTCard, NFTCardMini, NFTCardExpanded
│   └── ViewOnlyInput.tsx
├── hooks/
│   └── useWalletAddress.ts
├── lib/
│   ├── alchemy.ts         # getNFTsForOwner, analyzeFullSets
│   ├── rarity.ts          # loadRarityData, calculateCollectionRarity
│   └── wagmi.ts           # chain config, INNER_STATES
├── stores/
│   └── useNodesStore.ts   # Zustand store
└── types/
    └── nft.ts             # NodeNFT, NFTAttribute, GridConfig, etc.

public/
├── data/rarity.json       # Pre-calculated rarity for all 3333 NFTs
├── nodes-logo.png         # Square logo
└── nodes-banner-logo.jpg  # Banner logo (2×1)

scripts/
├── calculate-rarity.ts    # Recalculate rarity.json (run: npx tsx scripts/calculate-rarity.ts)
└── genius/                # Genius Team utility scripts
```

## NFT Data Structure

```typescript
interface NodeNFT {
  tokenId: string;
  name: string;
  image: string;          // GIF or PNG URL
  innerState: string;     // One of 7 states
  grid: string;
  gradient: string;
  glow: string;
  interference: boolean;  // Special edition flag
  metadata: NFTMetadata;  // Full on-chain metadata with all attributes
}
```

## Rarity System

- Pre-calculated in `public/data/rarity.json`
- Contains: `traitCounts`, `totalNFTs: 3333`, per-NFT rank/score/traits
- Regenerate: `npx tsx scripts/calculate-rarity.ts`
- Tiers: Common, Uncommon (70%+), Rare (85%+), Epic (95%+), Legendary (99%+)

## Current Status (as of 2026-02-09)

**Phase:** ACTIVE DEVELOPMENT  
**Deployed:** ✅ Production live  
**Last work:** Grid styles (Classic/Borderless/White Gap/Seamless), Gallery modal, HD exports, Banner 2×1 fix

## Known Issues / Tech Debt

- 30 unit tests failing (interfaces changed without updating tests)
- No CI/CD pipeline yet
- No structured logging/monitoring

## Development Rules

- **Package manager:** npm (not pnpm)
- **Branch policy:** NEVER commit directly to `main` without explicit approval from Ben
- **Deploy:** Railway auto-deploys on push to `main`
- **Testing:** Run `npm run build` before any push
- **Ben's wallet:** `0x2afbCa276F75578f9A4149729b4c374B7863b133` (has NODES NFTs — use for testing)

## Collection Context

NODES is an NFT collection on Base. The community hub provides tools for holders:
- Visualize and showcase their NFTs
- Create content for social media (X/Twitter)
- Track rarity and full set completion
- The founder's motto: "Art is never finished"
