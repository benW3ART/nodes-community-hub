import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { analyzeFullSets } from '../alchemy'
import type { NodeNFT } from '@/types/nft'
import { INNER_STATES } from '../constants'

// Mock fetch for API tests
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create mock NFT
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
    attributes: [
      { trait_type: 'Inner State', value: innerState },
    ],
  },
})

describe('analyzeFullSets', () => {
  it('should identify no complete sets with missing states', () => {
    const nfts: NodeNFT[] = [
      createMockNFT('1', 'Calm'),
      createMockNFT('2', 'Awakened'),
      createMockNFT('3', 'Curious'),
    ]
    
    const result = analyzeFullSets(nfts)
    
    expect(result.completeSets).toBe(0)
    expect(result.missingStates).toContain('Determined')
    expect(result.missingStates).toContain('Ethereal')
    expect(result.missingStates).toContain('Hopeful')
    expect(result.missingStates).toContain('Radiant')
    expect(result.missingStates).toHaveLength(4)
  })

  it('should identify one complete set when all states owned', () => {
    const nfts: NodeNFT[] = INNER_STATES.map((state, i) => 
      createMockNFT(String(i + 1), state)
    )
    
    const result = analyzeFullSets(nfts)
    
    expect(result.completeSets).toBe(1)
    expect(result.missingStates).toHaveLength(0)
  })

  it('should identify multiple complete sets', () => {
    // Create 3 of each Inner State
    const nfts: NodeNFT[] = []
    INNER_STATES.forEach((state, stateIndex) => {
      for (let i = 0; i < 3; i++) {
        nfts.push(createMockNFT(`${stateIndex * 3 + i + 1}`, state))
      }
    })
    
    const result = analyzeFullSets(nfts)
    
    expect(result.completeSets).toBe(3)
    expect(result.missingStates).toHaveLength(0)
  })

  it('should count complete sets as minimum across states', () => {
    // Unequal distribution: 5 Calm, 2 of others
    const nfts: NodeNFT[] = [
      createMockNFT('1', 'Calm'),
      createMockNFT('2', 'Calm'),
      createMockNFT('3', 'Calm'),
      createMockNFT('4', 'Calm'),
      createMockNFT('5', 'Calm'),
      createMockNFT('6', 'Awakened'),
      createMockNFT('7', 'Awakened'),
      createMockNFT('8', 'Curious'),
      createMockNFT('9', 'Curious'),
      createMockNFT('10', 'Determined'),
      createMockNFT('11', 'Determined'),
      createMockNFT('12', 'Ethereal'),
      createMockNFT('13', 'Ethereal'),
      createMockNFT('14', 'Hopeful'),
      createMockNFT('15', 'Hopeful'),
      createMockNFT('16', 'Radiant'),
      createMockNFT('17', 'Radiant'),
    ]
    
    const result = analyzeFullSets(nfts)
    
    expect(result.completeSets).toBe(2) // Limited by states with only 2
    expect(result.missingStates).toHaveLength(0)
  })

  it('should track token IDs per state', () => {
    const nfts: NodeNFT[] = [
      createMockNFT('42', 'Calm'),
      createMockNFT('123', 'Calm'),
      createMockNFT('456', 'Awakened'),
    ]
    
    const result = analyzeFullSets(nfts)
    
    const calmStatus = result.status.find(s => s.innerState === 'Calm')
    expect(calmStatus?.tokenIds).toContain('42')
    expect(calmStatus?.tokenIds).toContain('123')
    expect(calmStatus?.count).toBe(2)
    
    const awakenedStatus = result.status.find(s => s.innerState === 'Awakened')
    expect(awakenedStatus?.tokenIds).toContain('456')
    expect(awakenedStatus?.count).toBe(1)
  })

  it('should mark owned states correctly', () => {
    const nfts: NodeNFT[] = [
      createMockNFT('1', 'Calm'),
      createMockNFT('2', 'Radiant'),
    ]
    
    const result = analyzeFullSets(nfts)
    
    const calmStatus = result.status.find(s => s.innerState === 'Calm')
    expect(calmStatus?.owned).toBe(true)
    
    const radiantStatus = result.status.find(s => s.innerState === 'Radiant')
    expect(radiantStatus?.owned).toBe(true)
    
    const etherealStatus = result.status.find(s => s.innerState === 'Ethereal')
    expect(etherealStatus?.owned).toBe(false)
  })

  it('should handle empty collection', () => {
    const result = analyzeFullSets([])
    
    expect(result.completeSets).toBe(0)
    expect(result.missingStates).toHaveLength(7) // All states missing
    expect(result.status.every(s => !s.owned)).toBe(true)
  })

  it('should return all Inner States in status', () => {
    const result = analyzeFullSets([])
    
    expect(result.status).toHaveLength(INNER_STATES.length)
    INNER_STATES.forEach(state => {
      expect(result.status.find(s => s.innerState === state)).toBeDefined()
    })
  })

  it('should ignore NFTs with unrecognized Inner State', () => {
    const nfts: NodeNFT[] = [
      createMockNFT('1', 'Calm'),
      createMockNFT('2', 'UnknownState'), // Invalid state
      createMockNFT('3', ''), // Empty state
    ]
    
    const result = analyzeFullSets(nfts)
    
    const calmStatus = result.status.find(s => s.innerState === 'Calm')
    expect(calmStatus?.count).toBe(1)
    
    // Total count should only be 1
    const totalOwned = result.status.reduce((sum, s) => sum + s.count, 0)
    expect(totalOwned).toBe(1)
  })
})

describe('getNFTsForOwner', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    
    // Import dynamically to use mocked fetch
    const { getNFTsForOwner } = await import('../alchemy')
    
    const result = await getNFTsForOwner('0x1234')
    
    expect(result).toEqual([])
  })

  it('should handle non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })
    
    const { getNFTsForOwner } = await import('../alchemy')
    
    const result = await getNFTsForOwner('0x1234')
    
    expect(result).toEqual([])
  })

  it('should parse NFT data correctly', async () => {
    const mockResponse = {
      ownedNfts: [
        {
          tokenId: '42',
          raw: {
            metadata: {
              name: 'NODES #42',
              description: 'A test NFT',
              image: 'ipfs://test',
              attributes: [
                { trait_type: 'Inner State', value: 'Calm' },
                { trait_type: 'Grid', value: '3x3' },
                { trait_type: 'Gradient', value: 'Sunset' },
                { trait_type: 'Glow', value: 'Blue' },
                { trait_type: 'Interference', value: 'true' },
              ],
            },
          },
          image: {
            cachedUrl: 'https://cached.example.com/42.png',
          },
        },
      ],
    }
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
    
    const { getNFTsForOwner } = await import('../alchemy')
    
    const result = await getNFTsForOwner('0x1234')
    
    expect(result).toHaveLength(1)
    expect(result[0].tokenId).toBe('42')
    expect(result[0].innerState).toBe('Calm')
    expect(result[0].grid).toBe('3x3')
    expect(result[0].interference).toBe(true)
    expect(result[0].image).toBe('https://cached.example.com/42.png')
  })
})

describe('getNFTMetadata', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should return null on error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    
    const { getNFTMetadata } = await import('../alchemy')
    
    const result = await getNFTMetadata('42')
    
    expect(result).toBeNull()
  })

  it('should return null on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    })
    
    const { getNFTMetadata } = await import('../alchemy')
    
    const result = await getNFTMetadata('42')
    
    expect(result).toBeNull()
  })
})

describe('getCollectionStats', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should return null on error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    
    const { getCollectionStats } = await import('../alchemy')
    
    const result = await getCollectionStats()
    
    expect(result).toBeNull()
  })

  it('should return stats on success', async () => {
    const mockStats = {
      totalSupply: 1000,
      contractMetadata: {
        name: 'NODES',
        symbol: 'NODES',
      },
    }
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStats),
    })
    
    const { getCollectionStats } = await import('../alchemy')
    
    const result = await getCollectionStats()
    
    expect(result).toEqual(mockStats)
  })
})
