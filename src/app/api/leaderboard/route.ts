import { NextResponse } from 'next/server';
import { ALCHEMY_API_KEY, NODES_CONTRACT, INNER_STATES } from '@/lib/constants';
import * as fs from 'fs';
import * as path from 'path';

const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

// In-memory cache with TTL
let leaderboardCache: {
  data: LeaderboardResponse | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Rarity data cache (loaded once from public/data/rarity.json)
let rarityDataCache: Map<string, string> | null = null; // tokenId → Inner State

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
    totalFullSets: number;
  };
}

interface OwnerBalance {
  ownerAddress: string;
  tokenBalances: { tokenId: string; balance: string }[];
}

/**
 * Load rarity.json and build a tokenId → Inner State lookup map.
 * Cached in memory after first load.
 */
function loadInnerStateMap(): Map<string, string> {
  if (rarityDataCache) return rarityDataCache;

  const possiblePaths = [
    path.join(process.cwd(), 'public', 'data', 'rarity.json'),
    '/app/public/data/rarity.json',
  ];

  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const nfts = raw.nfts || {};
        const map = new Map<string, string>();
        for (const [tokenId, nftData] of Object.entries(nfts)) {
          const innerState = (nftData as any)?.traits?.['Inner State']?.value;
          if (innerState) {
            map.set(tokenId, innerState);
          }
        }
        console.log(`Loaded rarity.json: ${map.size} NFTs with Inner State`);
        rarityDataCache = map;
        return map;
      }
    } catch (err) {
      console.error('Failed to load rarity.json from', filePath, err);
    }
  }

  console.warn('rarity.json not found, falling back to empty map');
  return new Map();
}

export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (leaderboardCache.data && (now - leaderboardCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(leaderboardCache.data);
    }

    // Load inner state lookup from rarity.json (no API calls needed)
    const innerStateMap = loadInnerStateMap();

    // Fetch all owners with token balances (single API call)
    const ownersResponse = await fetch(
      `${ALCHEMY_BASE_URL}/getOwnersForContract?contractAddress=${NODES_CONTRACT}&withTokenBalances=true`
    );
    
    if (!ownersResponse.ok) {
      throw new Error('Failed to fetch owners');
    }
    
    const ownersData = await ownersResponse.json();
    const owners: OwnerBalance[] = ownersData.owners || [];
    
    // Process owners - count NFTs per address and resolve token IDs
    const ownerCounts = owners.map(owner => ({
      address: owner.ownerAddress,
      count: owner.tokenBalances?.length || 0,
      tokenIds: (owner.tokenBalances || []).map(tb => 
        parseInt(tb.tokenId, 16).toString()
      ),
    }));
    
    // Sort by NFT count (descending)
    ownerCounts.sort((a, b) => b.count - a.count);
    
    // Top collectors
    const topCollectors = ownerCounts.slice(0, 100).map((o, index) => ({
      rank: index + 1,
      address: o.address,
      count: o.count,
      displayAddress: `${o.address.slice(0, 6)}...${o.address.slice(-4)}`,
    }));
    
    // Full set calculation — check ALL holders with 7+ NFTs (7 inner states)
    // Uses local rarity.json lookup instead of per-holder API calls
    const potentialFullSetHolders = ownerCounts.filter(o => o.count >= INNER_STATES.length);
    const fullSetHolders: { address: string; sets: number }[] = [];
    
    for (const holder of potentialFullSetHolders) {
      const innerStateCounts = new Map<string, number>();
      
      for (const tokenId of holder.tokenIds) {
        const innerState = innerStateMap.get(tokenId);
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
        fullSetHolders.push({ address: holder.address, sets: completeSets });
      }
    }
    
    // Sort full set holders by sets count
    fullSetHolders.sort((a, b) => b.sets - a.sets);
    
    // Count total number of complete sets across all holders
    const totalFullSets = fullSetHolders.reduce((sum, h) => sum + h.sets, 0);
    
    // Total supply is fixed at 3333
    const totalSupply = 3333;

    const response: LeaderboardResponse = {
      topCollectors,
      fullSetHolders: fullSetHolders.map((h, index) => ({
        rank: index + 1,
        address: h.address,
        displayAddress: `${h.address.slice(0, 6)}...${h.address.slice(-4)}`,
        sets: h.sets,
      })),
      stats: {
        totalSupply,
        uniqueHolders: owners.length,
        fullSetCount: fullSetHolders.length,
        totalFullSets,
      },
    };
    
    console.log(`Leaderboard: ${fullSetHolders.length} full set holders, ${totalFullSets} total sets`);
    
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
