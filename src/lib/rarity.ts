import type { NodeNFT, NFTAttribute } from '@/types/nft';

export interface RarityScore {
  totalScore: number;
  traitScores: TraitRarity[];
  rank?: number;
  percentile?: number;
}

export interface TraitRarity {
  traitType: string;
  value: string;
  count: number;
  total: number;
  percentage: number;
  rarityScore: number;
}

export interface TraitDistribution {
  [traitType: string]: {
    [value: string]: number;
  };
}

// Calculate trait distribution from a collection of NFTs
export function calculateTraitDistribution(nfts: NodeNFT[]): TraitDistribution {
  const distribution: TraitDistribution = {};
  
  nfts.forEach(nft => {
    const attributes = nft.metadata?.attributes || [];
    
    attributes.forEach((attr: NFTAttribute) => {
      const traitType = attr.trait_type;
      const value = attr.value;
      
      if (!traitType || !value) return;
      
      if (!distribution[traitType]) {
        distribution[traitType] = {};
      }
      
      if (!distribution[traitType][value]) {
        distribution[traitType][value] = 0;
      }
      
      distribution[traitType][value]++;
    });
  });
  
  return distribution;
}

// Calculate rarity score for a single NFT
export function calculateNFTRarity(
  nft: NodeNFT,
  distribution: TraitDistribution,
  totalNfts: number
): RarityScore {
  const attributes = nft.metadata?.attributes || [];
  const traitScores: TraitRarity[] = [];
  let totalScore = 0;
  
  attributes.forEach((attr: NFTAttribute) => {
    const traitType = attr.trait_type;
    const value = attr.value;
    
    if (!traitType || !value || !distribution[traitType]) return;
    
    const count = distribution[traitType][value] || 0;
    const percentage = (count / totalNfts) * 100;
    
    // Rarity score formula: 1 / (trait_count / total_nfts)
    // This gives higher scores to rarer traits
    const rarityScore = count > 0 ? totalNfts / count : 0;
    
    traitScores.push({
      traitType,
      value,
      count,
      total: totalNfts,
      percentage,
      rarityScore,
    });
    
    totalScore += rarityScore;
  });
  
  return {
    totalScore: Math.round(totalScore * 100) / 100,
    traitScores: traitScores.sort((a, b) => b.rarityScore - a.rarityScore),
  };
}

// Calculate rarity for all NFTs and rank them
export function calculateCollectionRarity(nfts: NodeNFT[]): Map<string, RarityScore> {
  const distribution = calculateTraitDistribution(nfts);
  const rarityMap = new Map<string, RarityScore>();
  
  // Calculate raw rarity scores
  const scores: { tokenId: string; score: RarityScore }[] = [];
  
  nfts.forEach(nft => {
    const rarityScore = calculateNFTRarity(nft, distribution, nfts.length);
    scores.push({ tokenId: nft.tokenId, score: rarityScore });
  });
  
  // Sort by total score (descending) and assign ranks
  scores.sort((a, b) => b.score.totalScore - a.score.totalScore);
  
  scores.forEach((item, index) => {
    const rank = index + 1;
    const percentile = Math.round(((nfts.length - rank) / nfts.length) * 100);
    
    rarityMap.set(item.tokenId, {
      ...item.score,
      rank,
      percentile,
    });
  });
  
  return rarityMap;
}

// Get rarity tier based on percentile
export function getRarityTier(percentile: number): {
  tier: string;
  color: string;
  bgColor: string;
} {
  if (percentile >= 95) {
    return { tier: 'Legendary', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
  } else if (percentile >= 85) {
    return { tier: 'Epic', color: 'text-purple-400', bgColor: 'bg-purple-500/20' };
  } else if (percentile >= 70) {
    return { tier: 'Rare', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
  } else if (percentile >= 40) {
    return { tier: 'Uncommon', color: 'text-green-400', bgColor: 'bg-green-500/20' };
  } else {
    return { tier: 'Common', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
  }
}

// Calculate portfolio rarity (average of all NFTs owned)
export function calculatePortfolioRarity(
  ownedNfts: NodeNFT[],
  collectionRarity: Map<string, RarityScore>
): {
  averageScore: number;
  averageRank: number;
  totalRarityScore: number;
  bestNft: { tokenId: string; score: number } | null;
  rarestTraits: TraitRarity[];
} {
  if (ownedNfts.length === 0) {
    return {
      averageScore: 0,
      averageRank: 0,
      totalRarityScore: 0,
      bestNft: null,
      rarestTraits: [],
    };
  }
  
  let totalScore = 0;
  let totalRank = 0;
  let bestNft: { tokenId: string; score: number } | null = null;
  const allTraits: TraitRarity[] = [];
  
  ownedNfts.forEach(nft => {
    const rarity = collectionRarity.get(nft.tokenId);
    if (rarity) {
      totalScore += rarity.totalScore;
      totalRank += rarity.rank || 0;
      
      if (!bestNft || rarity.totalScore > bestNft.score) {
        bestNft = { tokenId: nft.tokenId, score: rarity.totalScore };
      }
      
      allTraits.push(...rarity.traitScores);
    }
  });
  
  // Get top 5 rarest traits across portfolio
  const rarestTraits = allTraits
    .sort((a, b) => b.rarityScore - a.rarityScore)
    .slice(0, 5);
  
  return {
    averageScore: Math.round((totalScore / ownedNfts.length) * 100) / 100,
    averageRank: Math.round(totalRank / ownedNfts.length),
    totalRarityScore: Math.round(totalScore * 100) / 100,
    bestNft,
    rarestTraits,
  };
}
