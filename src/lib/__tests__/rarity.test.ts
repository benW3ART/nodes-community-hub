import { describe, it, expect } from 'vitest'
import {
  calculateTraitDistribution,
  calculateNFTRarity,
  calculateCollectionRarity,
  getRarityTier,
  calculatePortfolioRarity,
} from '../rarity'
import type { NodeNFT } from '@/types/nft'

// Test fixtures
const createMockNFT = (
  tokenId: string,
  innerState: string,
  grid: string = '3x3',
  gradient: string = 'Sunset'
): NodeNFT => ({
  tokenId,
  name: `NODES #${tokenId}`,
  image: `https://example.com/${tokenId}.png`,
  innerState,
  grid,
  gradient,
  glow: 'Blue',
  interference: false,
  metadata: {
    name: `NODES #${tokenId}`,
    image: `https://example.com/${tokenId}.png`,
    attributes: [
      { trait_type: 'Inner State', value: innerState },
      { trait_type: 'Grid', value: grid },
      { trait_type: 'Gradient', value: gradient },
      { trait_type: 'Glow', value: 'Blue' },
    ],
  },
})

const mockCollection: NodeNFT[] = [
  createMockNFT('1', 'Calm', '3x3', 'Sunset'),
  createMockNFT('2', 'Calm', '3x3', 'Ocean'),
  createMockNFT('3', 'Calm', '4x4', 'Sunset'),
  createMockNFT('4', 'Awakened', '3x3', 'Sunset'),
  createMockNFT('5', 'Awakened', '5x5', 'Forest'),
  createMockNFT('6', 'Ethereal', '3x3', 'Sunset'),
  createMockNFT('7', 'Curious', '3x3', 'Sunset'),
  createMockNFT('8', 'Determined', '3x3', 'Sunset'),
  createMockNFT('9', 'Hopeful', '3x3', 'Sunset'),
  createMockNFT('10', 'Radiant', '3x3', 'Unique'), // Rare trait
]

describe('calculateTraitDistribution', () => {
  it('should calculate correct distribution for Inner State', () => {
    const distribution = calculateTraitDistribution(mockCollection)
    
    expect(distribution['Inner State']['Calm']).toBe(3)
    expect(distribution['Inner State']['Awakened']).toBe(2)
    expect(distribution['Inner State']['Ethereal']).toBe(1)
    expect(distribution['Inner State']['Radiant']).toBe(1)
  })

  it('should calculate correct distribution for Grid', () => {
    const distribution = calculateTraitDistribution(mockCollection)
    
    expect(distribution['Grid']['3x3']).toBe(8)
    expect(distribution['Grid']['4x4']).toBe(1)
    expect(distribution['Grid']['5x5']).toBe(1)
  })

  it('should calculate correct distribution for Gradient', () => {
    const distribution = calculateTraitDistribution(mockCollection)
    
    expect(distribution['Gradient']['Sunset']).toBe(7)
    expect(distribution['Gradient']['Ocean']).toBe(1)
    expect(distribution['Gradient']['Forest']).toBe(1)
    expect(distribution['Gradient']['Unique']).toBe(1)
  })

  it('should handle empty collection', () => {
    const distribution = calculateTraitDistribution([])
    expect(Object.keys(distribution)).toHaveLength(0)
  })

  it('should skip NFTs with missing attributes', () => {
    const nftsWithMissing: NodeNFT[] = [
      {
        ...createMockNFT('1', 'Calm'),
        metadata: { name: 'Test', image: '', attributes: [] },
      },
    ]
    const distribution = calculateTraitDistribution(nftsWithMissing)
    expect(Object.keys(distribution)).toHaveLength(0)
  })
})

describe('calculateNFTRarity', () => {
  it('should calculate higher rarity for rarer traits', () => {
    const distribution = calculateTraitDistribution(mockCollection)
    
    // NFT #10 has unique Gradient trait
    const rareNFT = calculateNFTRarity(mockCollection[9], distribution, mockCollection.length)
    // NFT #1 has common traits
    const commonNFT = calculateNFTRarity(mockCollection[0], distribution, mockCollection.length)
    
    expect(rareNFT.totalScore).toBeGreaterThan(commonNFT.totalScore)
  })

  it('should sort trait scores by rarity (descending)', () => {
    const distribution = calculateTraitDistribution(mockCollection)
    const rarity = calculateNFTRarity(mockCollection[9], distribution, mockCollection.length)
    
    // Traits should be sorted by rarityScore descending
    for (let i = 0; i < rarity.traitScores.length - 1; i++) {
      expect(rarity.traitScores[i].rarityScore)
        .toBeGreaterThanOrEqual(rarity.traitScores[i + 1].rarityScore)
    }
  })

  it('should calculate correct percentage', () => {
    const distribution = calculateTraitDistribution(mockCollection)
    const rarity = calculateNFTRarity(mockCollection[0], distribution, mockCollection.length)
    
    const calmTrait = rarity.traitScores.find(t => t.value === 'Calm')
    expect(calmTrait?.percentage).toBe(30) // 3/10 = 30%
    expect(calmTrait?.count).toBe(3)
  })

  it('should handle NFT with no attributes', () => {
    const distribution = calculateTraitDistribution(mockCollection)
    const emptyNFT: NodeNFT = {
      ...createMockNFT('99', ''),
      metadata: { name: 'Empty', image: '', attributes: [] },
    }
    
    const rarity = calculateNFTRarity(emptyNFT, distribution, mockCollection.length)
    expect(rarity.totalScore).toBe(0)
    expect(rarity.traitScores).toHaveLength(0)
  })
})

describe('calculateCollectionRarity', () => {
  it('should assign ranks to all NFTs', () => {
    const rarityMap = calculateCollectionRarity(mockCollection)
    
    expect(rarityMap.size).toBe(mockCollection.length)
    
    // Check that rank 1 exists
    const ranks = Array.from(rarityMap.values()).map(r => r.rank)
    expect(ranks).toContain(1)
    expect(ranks).toContain(mockCollection.length)
  })

  it('should assign rank 1 to the rarest NFT', () => {
    const rarityMap = calculateCollectionRarity(mockCollection)
    
    // Find NFT with rank 1
    let topNFT: string | null = null
    let topScore = 0
    
    rarityMap.forEach((rarity, tokenId) => {
      if (rarity.rank === 1) topNFT = tokenId
      if (rarity.totalScore > topScore) topScore = rarity.totalScore
    })
    
    expect(topNFT).not.toBeNull()
    expect(rarityMap.get(topNFT!)?.totalScore).toBe(topScore)
  })

  it('should calculate percentile correctly', () => {
    const rarityMap = calculateCollectionRarity(mockCollection)
    
    // Rank 1 should have highest percentile (90 for 10 items)
    const rank1 = Array.from(rarityMap.values()).find(r => r.rank === 1)
    expect(rank1?.percentile).toBe(90)
    
    // Last rank should have lowest percentile (0)
    const lastRank = Array.from(rarityMap.values()).find(r => r.rank === 10)
    expect(lastRank?.percentile).toBe(0)
  })

  it('should handle empty collection', () => {
    const rarityMap = calculateCollectionRarity([])
    expect(rarityMap.size).toBe(0)
  })
})

describe('getRarityTier', () => {
  it('should return Legendary for percentile >= 95', () => {
    expect(getRarityTier(95).tier).toBe('Legendary')
    expect(getRarityTier(100).tier).toBe('Legendary')
  })

  it('should return Epic for percentile >= 85 and < 95', () => {
    expect(getRarityTier(85).tier).toBe('Epic')
    expect(getRarityTier(94).tier).toBe('Epic')
  })

  it('should return Rare for percentile >= 70 and < 85', () => {
    expect(getRarityTier(70).tier).toBe('Rare')
    expect(getRarityTier(84).tier).toBe('Rare')
  })

  it('should return Uncommon for percentile >= 40 and < 70', () => {
    expect(getRarityTier(40).tier).toBe('Uncommon')
    expect(getRarityTier(69).tier).toBe('Uncommon')
  })

  it('should return Common for percentile < 40', () => {
    expect(getRarityTier(0).tier).toBe('Common')
    expect(getRarityTier(39).tier).toBe('Common')
  })

  it('should return correct colors', () => {
    expect(getRarityTier(95).color).toBe('text-yellow-400')
    expect(getRarityTier(85).color).toBe('text-purple-400')
    expect(getRarityTier(70).color).toBe('text-blue-400')
    expect(getRarityTier(40).color).toBe('text-green-400')
    expect(getRarityTier(0).color).toBe('text-gray-400')
  })
})

describe('calculatePortfolioRarity', () => {
  it('should calculate average score correctly', () => {
    const rarityMap = calculateCollectionRarity(mockCollection)
    const owned = mockCollection.slice(0, 3) // First 3 NFTs
    
    const portfolio = calculatePortfolioRarity(owned, rarityMap)
    
    // Calculate expected average
    let totalScore = 0
    owned.forEach(nft => {
      totalScore += rarityMap.get(nft.tokenId)?.totalScore || 0
    })
    const expectedAvg = Math.round((totalScore / owned.length) * 100) / 100
    
    expect(portfolio.averageScore).toBe(expectedAvg)
  })

  it('should find the best NFT', () => {
    const rarityMap = calculateCollectionRarity(mockCollection)
    const owned = mockCollection.slice(0, 5)
    
    const portfolio = calculatePortfolioRarity(owned, rarityMap)
    
    expect(portfolio.bestNft).not.toBeNull()
    
    // Best NFT should have the highest score among owned
    let maxScore = 0
    owned.forEach(nft => {
      const score = rarityMap.get(nft.tokenId)?.totalScore || 0
      if (score > maxScore) maxScore = score
    })
    
    expect(portfolio.bestNft?.score).toBe(maxScore)
  })

  it('should return top 5 rarest traits', () => {
    const rarityMap = calculateCollectionRarity(mockCollection)
    
    const portfolio = calculatePortfolioRarity(mockCollection, rarityMap)
    
    expect(portfolio.rarestTraits.length).toBeLessThanOrEqual(5)
    
    // Should be sorted by rarityScore descending
    for (let i = 0; i < portfolio.rarestTraits.length - 1; i++) {
      expect(portfolio.rarestTraits[i].rarityScore)
        .toBeGreaterThanOrEqual(portfolio.rarestTraits[i + 1].rarityScore)
    }
  })

  it('should handle empty portfolio', () => {
    const rarityMap = calculateCollectionRarity(mockCollection)
    
    const portfolio = calculatePortfolioRarity([], rarityMap)
    
    expect(portfolio.averageScore).toBe(0)
    expect(portfolio.averageRank).toBe(0)
    expect(portfolio.totalRarityScore).toBe(0)
    expect(portfolio.bestNft).toBeNull()
    expect(portfolio.rarestTraits).toHaveLength(0)
  })

  it('should calculate total rarity score', () => {
    const rarityMap = calculateCollectionRarity(mockCollection)
    const owned = mockCollection.slice(0, 3)
    
    const portfolio = calculatePortfolioRarity(owned, rarityMap)
    
    let expectedTotal = 0
    owned.forEach(nft => {
      expectedTotal += rarityMap.get(nft.tokenId)?.totalScore || 0
    })
    
    expect(portfolio.totalRarityScore).toBe(Math.round(expectedTotal * 100) / 100)
  })
})
