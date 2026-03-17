import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateCollectionRarity,
  getRarityTier,
  calculatePortfolioRarity,
} from '../rarity'
import type { NodeNFT } from '@/types/nft'

// ─── Mock fetch (browser path) ───────────────────────────────────────────────

const MOCK_RARITY_DATA = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  totalNFTs: 10,
  traitCounts: {
    'Inner State': { Calm: 3, Awakened: 2, Ethereal: 1, Curious: 1, Determined: 1, Hopeful: 1, Radiant: 1 },
    Grid: { '3x3': 8, '4x4': 1, '5x5': 1 },
  },
  nfts: {
    '1': { rank: 5, score: 120, traits: { 'Inner State': { value: 'Calm', rarity: 0.3 } } },
    '2': { rank: 6, score: 115, traits: { 'Inner State': { value: 'Calm', rarity: 0.3 } } },
    '3': { rank: 7, score: 110, traits: { 'Inner State': { value: 'Calm', rarity: 0.3 } } },
    '4': { rank: 4, score: 130, traits: { 'Inner State': { value: 'Awakened', rarity: 0.2 } } },
    '5': { rank: 3, score: 140, traits: { 'Inner State': { value: 'Awakened', rarity: 0.2 } } },
    '6': { rank: 2, score: 160, traits: { 'Inner State': { value: 'Ethereal', rarity: 0.1 } } },
    '7': { rank: 8, score: 105, traits: { 'Inner State': { value: 'Curious', rarity: 0.1 } } },
    '8': { rank: 9, score: 100, traits: { 'Inner State': { value: 'Determined', rarity: 0.1 } } },
    '9': { rank: 10, score: 90, traits: { 'Inner State': { value: 'Hopeful', rarity: 0.1 } } },
    '10': { rank: 1, score: 200, traits: { 'Inner State': { value: 'Radiant', rarity: 0.1 } } },
  },
}

const createMockNFT = (tokenId: string, innerState: string): NodeNFT => ({
  tokenId,
  name: `NODES #${tokenId}`,
  image: `https://example.com/${tokenId}.png`,
  innerState,
  grid: '3x3',
  gradient: 'Sunset',
  glow: 'Blue',
  interference: false,
  metadata: {
    name: `NODES #${tokenId}`,
    image: `https://example.com/${tokenId}.png`,
    attributes: [{ trait_type: 'Inner State', value: innerState }],
  },
})

const mockCollection: NodeNFT[] = [
  createMockNFT('1', 'Calm'),
  createMockNFT('2', 'Calm'),
  createMockNFT('3', 'Calm'),
  createMockNFT('4', 'Awakened'),
  createMockNFT('5', 'Awakened'),
  createMockNFT('6', 'Ethereal'),
  createMockNFT('7', 'Curious'),
  createMockNFT('8', 'Determined'),
  createMockNFT('9', 'Hopeful'),
  createMockNFT('10', 'Radiant'),
]

// Mock global fetch for the loadRarityData function
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => MOCK_RARITY_DATA,
  })
  // Reset module cache between tests
  vi.resetModules()
})

// ─── getRarityTier ────────────────────────────────────────────────────────────

describe('getRarityTier', () => {
  it('should return Legendary for percentile >= 99', () => {
    expect(getRarityTier(99).name).toBe('Legendary')
    expect(getRarityTier(100).name).toBe('Legendary')
  })

  it('should return Epic for percentile >= 95 and < 99', () => {
    expect(getRarityTier(95).name).toBe('Epic')
    expect(getRarityTier(98).name).toBe('Epic')
  })

  it('should return Rare for percentile >= 85 and < 95', () => {
    expect(getRarityTier(85).name).toBe('Rare')
    expect(getRarityTier(94).name).toBe('Rare')
  })

  it('should return Uncommon for percentile >= 70 and < 85', () => {
    expect(getRarityTier(70).name).toBe('Uncommon')
    expect(getRarityTier(84).name).toBe('Uncommon')
  })

  it('should return Common for percentile < 70', () => {
    expect(getRarityTier(0).name).toBe('Common')
    expect(getRarityTier(69).name).toBe('Common')
  })

  it('should return correct color classes', () => {
    expect(getRarityTier(99).color).toBe('text-yellow-400')
    expect(getRarityTier(95).color).toBe('text-purple-400')
    expect(getRarityTier(85).color).toBe('text-blue-400')
    expect(getRarityTier(70).color).toBe('text-green-400')
    expect(getRarityTier(0).color).toBe('text-gray-400')
  })
})

// ─── calculateCollectionRarity ────────────────────────────────────────────────

describe('calculateCollectionRarity', () => {
  it('should return a map with all NFTs that have rarity data', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    expect(rarityMap.size).toBe(10)
  })

  it('should assign correct rank from rarity data', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    expect(rarityMap.get('10')?.rank).toBe(1) // Rarest
    expect(rarityMap.get('9')?.rank).toBe(10) // Most common
  })

  it('should assign correct score from rarity data', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    expect(rarityMap.get('10')?.score).toBe(200)
    expect(rarityMap.get('1')?.score).toBe(120)
  })

  it('should calculate percentile based on rank and total NFTs', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    // Rank 1 out of 10 → percentile = (1 - 1/10) * 100 = 90
    expect(rarityMap.get('10')?.percentile).toBe(90)
    // Rank 10 out of 10 → percentile = (1 - 10/10) * 100 = 0
    expect(rarityMap.get('9')?.percentile).toBe(0)
  })

  it('should assign tier based on percentile', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    const rarest = rarityMap.get('10')
    // percentile 90 → Rare
    expect(rarest?.tier).toBe('Rare')
  })

  it('should return empty map when no rarity data available', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })
    const rarityMap = await calculateCollectionRarity(mockCollection)
    expect(rarityMap.size).toBe(0)
  })

  it('should return empty map for empty collection', async () => {
    const rarityMap = await calculateCollectionRarity([])
    expect(rarityMap.size).toBe(0)
  })

  it('should skip NFTs not found in rarity data', async () => {
    const unknownNFT = createMockNFT('9999', 'Unknown')
    const rarityMap = await calculateCollectionRarity([unknownNFT])
    expect(rarityMap.size).toBe(0)
  })
})

// ─── calculatePortfolioRarity ─────────────────────────────────────────────────

describe('calculatePortfolioRarity', () => {
  it('should return null for empty portfolio', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    const result = calculatePortfolioRarity([], rarityMap)
    expect(result).toBeNull()
  })

  it('should return null for empty rarityMap', async () => {
    const result = calculatePortfolioRarity(mockCollection, new Map())
    expect(result).toBeNull()
  })

  it('should calculate correct average rank', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    const owned = [mockCollection[0], mockCollection[3]] // tokenId 1 (rank 5) + tokenId 4 (rank 4)
    const result = calculatePortfolioRarity(owned, rarityMap)
    expect(result?.avgRank).toBe(Math.round((5 + 4) / 2)) // 4 or 5
  })

  it('should find the rarest NFT in portfolio', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    const owned = mockCollection.slice(0, 5)
    const result = calculatePortfolioRarity(owned, rarityMap)
    // Among first 5, tokenId 5 has rank 3 (best rank)
    expect(result?.rarestNFT?.tokenId).toBe('5')
    expect(result?.rarestNFT?.rank).toBe(3)
  })

  it('should calculate best and worst rank', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    const owned = mockCollection // All 10 NFTs
    const result = calculatePortfolioRarity(owned, rarityMap)
    expect(result?.bestRank).toBe(1)  // Rarest
    expect(result?.worstRank).toBe(10) // Most common
  })

  it('should skip NFTs not in rarityMap', async () => {
    const rarityMap = await calculateCollectionRarity(mockCollection)
    const owned = [createMockNFT('9999', 'Unknown'), mockCollection[9]] // 1 unknown + NFT 10 (rank 1)
    const result = calculatePortfolioRarity(owned, rarityMap)
    // Should only count NFT 10
    expect(result?.avgRank).toBe(1)
    expect(result?.rarestNFT?.tokenId).toBe('10')
  })
})
