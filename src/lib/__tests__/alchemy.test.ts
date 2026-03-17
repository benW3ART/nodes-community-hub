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
    // Use the first 3 actual INNER_STATES — missing the rest
    const nfts: NodeNFT[] = [
      createMockNFT('1', INNER_STATES[0]), // e.g. 'Ascended'
      createMockNFT('2', INNER_STATES[1]), // e.g. 'Diamond Hand'
      createMockNFT('3', INNER_STATES[2]), // e.g. 'Enlightened'
    ]
    
    const result = analyzeFullSets(nfts)
    const missingCount = INNER_STATES.length - 3
    
    expect(result.completeSets).toBe(0)
    // All states not in first 3 should be missing
    INNER_STATES.slice(3).forEach(state => {
      expect(result.missingStates).toContain(state)
    })
    expect(result.missingStates).toHaveLength(missingCount)
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
    // Unequal distribution: 5 of first state, 2 of all others
    const nfts: NodeNFT[] = []
    // 5 of INNER_STATES[0]
    for (let i = 0; i < 5; i++) {
      nfts.push(createMockNFT(`s0-${i}`, INNER_STATES[0]))
    }
    // 2 of each remaining state
    for (let s = 1; s < INNER_STATES.length; s++) {
      nfts.push(createMockNFT(`s${s}-0`, INNER_STATES[s]))
      nfts.push(createMockNFT(`s${s}-1`, INNER_STATES[s]))
    }
    
    const result = analyzeFullSets(nfts)
    
    expect(result.completeSets).toBe(2) // Limited by states with only 2
    expect(result.missingStates).toHaveLength(0)
  })

  it('should track token IDs per state', () => {
    const STATE_A = INNER_STATES[0]
    const STATE_B = INNER_STATES[1]
    const nfts: NodeNFT[] = [
      createMockNFT('42', STATE_A),
      createMockNFT('123', STATE_A),
      createMockNFT('456', STATE_B),
    ]
    
    const result = analyzeFullSets(nfts)
    
    const statusA = result.status.find(s => s.innerState === STATE_A)
    expect(statusA?.tokenIds).toContain('42')
    expect(statusA?.tokenIds).toContain('123')
    expect(statusA?.count).toBe(2)
    
    const statusB = result.status.find(s => s.innerState === STATE_B)
    expect(statusB?.tokenIds).toContain('456')
    expect(statusB?.count).toBe(1)
  })

  it('should mark owned states correctly', () => {
    const OWNED_A = INNER_STATES[0]
    const OWNED_B = INNER_STATES[INNER_STATES.length - 1]
    const UNOWNED = INNER_STATES[Math.floor(INNER_STATES.length / 2)]
    const nfts: NodeNFT[] = [
      createMockNFT('1', OWNED_A),
      createMockNFT('2', OWNED_B),
    ]
    
    const result = analyzeFullSets(nfts)
    
    const statusA = result.status.find(s => s.innerState === OWNED_A)
    expect(statusA?.owned).toBe(true)
    
    const statusB = result.status.find(s => s.innerState === OWNED_B)
    expect(statusB?.owned).toBe(true)
    
    // Unowned state (middle of list, not OWNED_A or OWNED_B)
    const unownedStatus = result.status.find(s => s.innerState === UNOWNED && s.innerState !== OWNED_A && s.innerState !== OWNED_B)
    if (unownedStatus) {
      expect(unownedStatus.owned).toBe(false)
    }
  })

  it('should handle empty collection', () => {
    const result = analyzeFullSets([])
    
    expect(result.completeSets).toBe(0)
    expect(result.missingStates).toHaveLength(INNER_STATES.length) // All states missing
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
    const VALID_STATE = INNER_STATES[0]
    const nfts: NodeNFT[] = [
      createMockNFT('1', VALID_STATE),
      createMockNFT('2', 'UnknownState'), // Invalid state — not in INNER_STATES
      createMockNFT('3', ''), // Empty state
    ]
    
    const result = analyzeFullSets(nfts)
    
    const validStatus = result.status.find(s => s.innerState === VALID_STATE)
    expect(validStatus?.count).toBe(1)
    
    // Total count should only be 1 (invalid/empty states ignored)
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
    // getNFTsForOwner makes 2 calls:
    // 1. fetchOwnedTokenIds — returns list of token IDs
    // 2. fetchFreshMetadata per token — returns raw metadata from metadata API
    const tokenIdsResponse = {
      ownedNfts: [{ tokenId: '42' }],
    }

    const metadataResponse = {
      name: 'NODES #42',
      description: 'A test NFT',
      image: 'https://cached.example.com/42.png',
      attributes: [
        { trait_type: 'Inner State', value: 'Ascended' }, // Use a valid INNER_STATE
        { trait_type: 'Grid', value: '3x3' },
        { trait_type: 'Gradient', value: 'Sunset' },
        { trait_type: 'Glow', value: 'Blue' },
        { trait_type: 'Interference', value: 'true' },
      ],
    }

    // First call: token IDs list; second call: metadata for token 42
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tokenIdsResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(metadataResponse) })

    const { getNFTsForOwner } = await import('../alchemy')

    const result = await getNFTsForOwner('0x1234')

    expect(result).toHaveLength(1)
    expect(result[0].tokenId).toBe('42')
    expect(result[0].innerState).toBe('Ascended')
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

// NOTE: getCollectionStats was removed from alchemy.ts (deprecated — use rarity.json data instead)
// Tests removed to keep test suite in sync with actual exports.
