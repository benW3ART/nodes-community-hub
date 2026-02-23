import { NextResponse } from 'next/server';
import { ALCHEMY_API_KEY, NODES_CONTRACT, INNER_STATES } from '@/lib/constants';

const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

// In-memory cache with TTL
let leaderboardCache: {
  data: LeaderboardResponse | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface LeaderboardResponse {
  topCollectors: {
    rank: number;
    address: string;
    displayAddress: string;
    count: number;
  }[];
  fullSetHolders: {
    rank: number;
    address: string;
    displayAddress: string;
    sets: number;
  }[];
  stats: {
    totalSupply: number;
    uniqueHolders: number;
    fullSetCount: number;
  };
}

interface OwnerBalance {
  ownerAddress: string;
  tokenBalances: { tokenId: string; balance: string }[];
}

export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (leaderboardCache.data && (now - leaderboardCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(leaderboardCache.data);
    }

    // Fetch all owners with token balances (single API call)
    const ownersResponse = await fetch(
      `${ALCHEMY_BASE_URL}/getOwnersForContract?contractAddress=${NODES_CONTRACT}&withTokenBalances=true`
    );
    
    if (!ownersResponse.ok) {
      throw new Error('Failed to fetch owners');
    }
    
    const ownersData = await ownersResponse.json();
    const owners: OwnerBalance[] = ownersData.owners || [];
    
    // Process owners - count NFTs per address
    const ownerCounts = owners.map(owner => ({
      address: owner.ownerAddress,
      count: owner.tokenBalances?.length || 0,
      tokenIds: (owner.tokenBalances || []).map(tb => 
        parseInt(tb.tokenId, 16).toString()
      ),
    }));
    
    // Sort by NFT count (descending)
    ownerCounts.sort((a, b) => b.count - a.count);
    
    // Top collectors (simple, no extra API calls needed)
    const topCollectors = ownerCounts.slice(0, 100).map((o, index) => ({
      rank: index + 1,
      address: o.address,
      count: o.count,
      displayAddress: `${o.address.slice(0, 6)}...${o.address.slice(-4)}`,
    }));
    
    // For full sets: only fetch metadata for holders with 8+ NFTs
    // Use batch endpoint to minimize API calls
    const potentialFullSetHolders = ownerCounts.filter(o => o.count >= 8).slice(0, 30);
    const fullSetHolders: { address: string; sets: number }[] = [];
    
    // Batch fetch NFT metadata for potential full set holders
    // Use Promise.all with chunking to parallelize
    const BATCH_SIZE = 5;
    for (let i = 0; i < potentialFullSetHolders.length; i += BATCH_SIZE) {
      const batch = potentialFullSetHolders.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.all(
        batch.map(async (holder) => {
          try {
            const response = await fetch(
              `${ALCHEMY_BASE_URL}/getNFTsForOwner?owner=${holder.address}&contractAddresses[]=${NODES_CONTRACT}&withMetadata=true&pageSize=100`
            );
            
            if (!response.ok) return null;
            
            const data = await response.json();
            const innerStateCounts = new Map<string, number>();
            
            for (const nft of data.ownedNfts || []) {
              const attributes = nft.raw?.metadata?.attributes || [];
              const innerState = attributes.find((a: { trait_type?: string }) => 
                a.trait_type?.toLowerCase() === 'inner state'
              )?.value;
              
              if (innerState) {
                innerStateCounts.set(innerState, (innerStateCounts.get(innerState) || 0) + 1);
              }
            }
            
            // Check if has all inner states
            const hasAllStates = INNER_STATES.every(state => innerStateCounts.has(state));
            
            if (hasAllStates) {
              const completeSets = Math.min(
                ...INNER_STATES.map(state => innerStateCounts.get(state) || 0)
              );
              return { address: holder.address, sets: completeSets };
            }
            
            return null;
          } catch {
            return null;
          }
        })
      );
      
      for (const result of results) {
        if (result) fullSetHolders.push(result);
      }
    }
    
    // Sort full set holders by sets count
    fullSetHolders.sort((a, b) => b.sets - a.sets);
    
    // Total supply is fixed at 3333 — no need for an extra Alchemy call
    const totalSupply = 3333;

    const response: LeaderboardResponse = {
      topCollectors,
      fullSetHolders: fullSetHolders.slice(0, 20).map((h, index) => ({
        rank: index + 1,
        address: h.address,
        displayAddress: `${h.address.slice(0, 6)}...${h.address.slice(-4)}`,
        sets: h.sets,
      })),
      stats: {
        totalSupply,
        uniqueHolders: owners.length,
        fullSetCount: fullSetHolders.length,
      },
    };
    
    // Update cache
    leaderboardCache = { data: response, timestamp: now };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Leaderboard API error:', error);
    
    // Return cached data if available, even if stale
    if (leaderboardCache.data) {
      return NextResponse.json(leaderboardCache.data);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
