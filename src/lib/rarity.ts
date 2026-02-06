import type { NodeNFT } from '@/types/nft';

// Exported type for components
export interface RarityScore {
  rank: number;
  score: number;
  percentile: number;
  tier?: string;
  traits?: Record<string, { value: string; rarity: number }>;
}

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
 * Get rarity tier based on percentile
 */
export function getRarityTier(percentile: number): { name: string; color: string } {
  if (percentile >= 99) return { name: 'Legendary', color: 'text-yellow-400' };
  if (percentile >= 95) return { name: 'Epic', color: 'text-purple-400' };
  if (percentile >= 85) return { name: 'Rare', color: 'text-blue-400' };
  if (percentile >= 70) return { name: 'Uncommon', color: 'text-green-400' };
  return { name: 'Common', color: 'text-gray-400' };
}

/**
 * Calculate rarity for a collection of NFTs (alias for enrichNFTsWithRarity)
 * Returns a Map of tokenId -> RarityScore
 */
export async function calculateCollectionRarity(nfts: NodeNFT[]): Promise<Map<string, RarityScore>> {
  const rarityData = await loadRarityData();
  const rarityMap = new Map<string, RarityScore>();
  
  if (!rarityData) return rarityMap;
  
  for (const nft of nfts) {
    const nftRarity = rarityData.nfts[nft.tokenId];
    if (nftRarity) {
      const percentile = Math.round((1 - nftRarity.rank / rarityData.totalNFTs) * 100);
      rarityMap.set(nft.tokenId, {
        rank: nftRarity.rank,
        score: nftRarity.score,
        percentile,
        tier: getRarityTier(percentile).name,
        traits: nftRarity.traits,
      });
    }
  }
  
  return rarityMap;
}

/**
 * Calculate portfolio rarity summary from pre-loaded rarityMap (synchronous)
 */
export function calculatePortfolioRarity(
  nfts: NodeNFT[], 
  rarityMap: Map<string, RarityScore>
): {
  avgRank: number;
  avgScore: number;
  bestRank: number;
  worstRank: number;
  avgPercentile: number;
  rarestNFT: { tokenId: string; rank: number } | null;
} | null {
  if (nfts.length === 0 || rarityMap.size === 0) return null;
  
  let totalRank = 0;
  let totalScore = 0;
  let totalPercentile = 0;
  let bestRank = Infinity;
  let worstRank = 0;
  let rarestNFT: { tokenId: string; rank: number } | null = null;
  let validCount = 0;
  
  for (const nft of nfts) {
    const rarity = rarityMap.get(nft.tokenId);
    if (!rarity) continue;
    
    totalRank += rarity.rank;
    totalScore += rarity.score;
    totalPercentile += rarity.percentile;
    validCount++;
    
    if (rarity.rank < bestRank) {
      bestRank = rarity.rank;
      rarestNFT = { tokenId: nft.tokenId, rank: rarity.rank };
    }
    
    if (rarity.rank > worstRank) {
      worstRank = rarity.rank;
    }
  }
  
  if (validCount === 0) return null;
  
  return {
    avgRank: Math.round(totalRank / validCount),
    avgScore: Math.round((totalScore / validCount) * 100) / 100,
    bestRank: bestRank === Infinity ? 0 : bestRank,
    worstRank,
    avgPercentile: Math.round(totalPercentile / validCount),
    rarestNFT,
  };
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
