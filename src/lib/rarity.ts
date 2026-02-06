import type { NodeNFT } from '@/types/nft';

interface RarityData {
  generatedAt: string;
  totalNFTs: number;
  traitCounts: Record<string, Record<string, number>>;
  nfts: Record<string, {
    rank: number;
    score: number;
    traits: Record<string, { value: string; rarity: number }>;
  }>;
}

let cachedRarityData: RarityData | null = null;

/**
 * Load pre-calculated rarity data from public/data/rarity.json
 */
export async function loadRarityData(): Promise<RarityData | null> {
  if (cachedRarityData) {
    return cachedRarityData;
  }
  
  try {
    // In browser, fetch from public folder
    if (typeof window !== 'undefined') {
      const response = await fetch('/data/rarity.json');
      if (!response.ok) return null;
      cachedRarityData = await response.json();
      return cachedRarityData;
    }
    
    // On server, read from file system
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'rarity.json');
    
    if (!fs.existsSync(filePath)) {
      console.warn('Rarity data not found. Run: npm run calculate-rarity');
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf-8');
    cachedRarityData = JSON.parse(data);
    return cachedRarityData;
  } catch (error) {
    console.error('Failed to load rarity data:', error);
    return null;
  }
}

/**
 * Get rarity info for a specific token
 */
export async function getTokenRarity(tokenId: string): Promise<{
  rank: number;
  score: number;
  percentile: number;
  traits: Record<string, { value: string; rarity: number }>;
} | null> {
  const rarityData = await loadRarityData();
  if (!rarityData) return null;
  
  const nftRarity = rarityData.nfts[tokenId];
  if (!nftRarity) return null;
  
  return {
    rank: nftRarity.rank,
    score: nftRarity.score,
    percentile: Math.round((1 - nftRarity.rank / rarityData.totalNFTs) * 100),
    traits: nftRarity.traits,
  };
}

/**
 * Enrich NFTs with global rarity data
 */
export async function enrichNFTsWithRarity(nfts: NodeNFT[]): Promise<(NodeNFT & {
  rarity?: {
    rank: number;
    score: number;
    percentile: number;
  };
})[]> {
  const rarityData = await loadRarityData();
  if (!rarityData) return nfts;
  
  return nfts.map(nft => {
    const nftRarity = rarityData.nfts[nft.tokenId];
    if (!nftRarity) return nft;
    
    return {
      ...nft,
      rarity: {
        rank: nftRarity.rank,
        score: nftRarity.score,
        percentile: Math.round((1 - nftRarity.rank / rarityData.totalNFTs) * 100),
      },
    };
  });
}

/**
 * Calculate portfolio rarity stats from global data
 */
export async function getPortfolioRarityStats(nfts: NodeNFT[]): Promise<{
  avgRank: number;
  avgScore: number;
  bestRank: number;
  worstRank: number;
  rarestNFT: { tokenId: string; rank: number } | null;
} | null> {
  const rarityData = await loadRarityData();
  if (!rarityData || nfts.length === 0) return null;
  
  let totalRank = 0;
  let totalScore = 0;
  let bestRank = Infinity;
  let worstRank = 0;
  let rarestNFT: { tokenId: string; rank: number } | null = null;
  let validCount = 0;
  
  for (const nft of nfts) {
    const nftRarity = rarityData.nfts[nft.tokenId];
    if (!nftRarity) continue;
    
    totalRank += nftRarity.rank;
    totalScore += nftRarity.score;
    validCount++;
    
    if (nftRarity.rank < bestRank) {
      bestRank = nftRarity.rank;
      rarestNFT = { tokenId: nft.tokenId, rank: nftRarity.rank };
    }
    
    if (nftRarity.rank > worstRank) {
      worstRank = nftRarity.rank;
    }
  }
  
  if (validCount === 0) return null;
  
  return {
    avgRank: Math.round(totalRank / validCount),
    avgScore: Math.round((totalScore / validCount) * 100) / 100,
    bestRank: bestRank === Infinity ? 0 : bestRank,
    worstRank,
    rarestNFT,
  };
}
