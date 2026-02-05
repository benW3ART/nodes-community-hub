# NODES Community Hub 🟣

The ultimate toolkit for [NODES](https://opensea.io/collection/nodes-by-hunter) NFT holders on Base.

![NODES](https://img.shields.io/badge/Chain-Base-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

### 🖼️ Gallery
Connect your wallet and view all your NODES NFTs in one beautiful gallery.

### 📝 Post Creator
Create stunning social media posts featuring your NFTs:
- Templates for 0-7 NFTs
- Custom text overlays
- Multiple background options
- Export as PNG

### 🔲 Grid Montage
Create grid layouts with your NODES:
- Preset sizes: 2×2, 3×3, 4×4, 5×5, 4×6
- Custom grid dimensions
- Add NODES logo
- Random shuffle
- Export as PNG/Video

### 🎯 Full Set Tracker
Track your Inner State collection progress:
- 7 Inner States to collect
- Visual progress indicator
- Missing piece finder with OpenSea listings
- Interference eligibility checker

### 🏆 Leaderboard
*Coming soon*
- Top collectors
- Full set holders
- Rarity scores

### 🎨 Banner Creator
*Coming soon*
- X/Twitter banner templates (1500×500)
- Multiple NFT layouts

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Web3**: RainbowKit + wagmi + viem
- **State**: Zustand
- **NFT Data**: Alchemy NFT API
- **Export**: html2canvas

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/nodes-community-hub.git
cd nodes-community-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Environment Variables

```env
# Alchemy API
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key

# Nodes Collection
NEXT_PUBLIC_NODES_CONTRACT=0x95bc4c2e01c2e2d9e537e7a9fe58187e88dd8019
NEXT_PUBLIC_CHAIN_ID=8453

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Admin Whitelist (comma-separated addresses)
ADMIN_WHITELIST=0xAddress1,0xAddress2

# OpenSea API (optional)
OPENSEA_API_KEY=
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── admin/          # Admin panel
│   ├── api/            # API routes
│   ├── gallery/        # NFT gallery
│   ├── grid-creator/   # Grid montage tool
│   ├── post-creator/   # Post creation tool
│   ├── full-sets/      # Full set tracker
│   └── ...
├── components/         # React components
├── lib/               # Utilities (wagmi, alchemy)
├── stores/            # Zustand stores
└── types/             # TypeScript types
```

## Admin Panel

Access `/admin` with a whitelisted wallet to:
- Upload custom assets (logos, frames, backgrounds)
- Manage templates

## Deployment

### Vercel (Recommended)
```bash
vercel
```

### Railway
```bash
railway up
```

## Collection Info

- **Contract**: `0x95bc4c2e01c2e2d9e537e7a9fe58187e88dd8019`
- **Chain**: Base
- **Supply**: 3,333
- **Creator**: [@gmhunterart](https://x.com/gmhunterart)
- **Collection**: [@nodesonbase](https://x.com/nodesonbase)

## Inner States (for Full Sets)
1. Awakened
2. Calm
3. Curious
4. Determined
5. Ethereal
6. Hopeful
7. Radiant

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## License

MIT

---

Built with 💜 for the NODES community.

*Not affiliated with NODES or gmhunterart. Community project.*
