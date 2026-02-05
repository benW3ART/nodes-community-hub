import { NextResponse } from 'next/server';
import { ALCHEMY_API_KEY, NODES_CONTRACT, INNER_STATES } from '@/lib/constants';

const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

interface OwnerData {
  address: string;
  count: number;
  tokenIds: string[];
  innerStates: Set<string>;
}

export async function GET() {
  try {
    // Fetch all owners of the NODES collection
    const ownersResponse = await fetch(
      `${ALCHEMY_BASE_URL}/getOwnersForContract?contractAddress=${NODES_CONTRACT}&withTokenBalances=true`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    
    if (!ownersResponse.ok) {
      throw new Error('Failed to fetch owners');
    }
    
    const ownersData = await ownersResponse.json();
    const owners: OwnerData[] = [];
    
    // Process owners and their token balances
    for (const owner of ownersData.owners || []) {
      const tokenBalances = owner.tokenBalances || [];
      const tokenIds = tokenBalances.map((tb: any) => 
        parseInt(tb.tokenId, 16).toString()
      );
      
      owners.push({
        address: owner.ownerAddress,
        count: tokenIds.length,
        tokenIds,
        innerStates: new Set<string>(),
      });
    }
    
    // Sort by NFT count (descending)
    const topCollectors = owners
      .sort((a, b) => b.count - a.count)
      .slice(0, 100)
      .map((o, index) => ({
        rank: index + 1,
        address: o.address,
        count: o.count,
        displayAddress: `${o.address.slice(0, 6)}...${o.address.slice(-4)}`,
      }));
    
    // Calculate full set holders
    // We need to fetch metadata to determine Inner States
    // For performance, we'll fetch in batches for top holders
    const fullSetHolders: { address: string; sets: number }[] = [];
    
    // Fetch metadata for top 50 holders to check full sets
    const topHoldersForFullSets = owners
      .filter(o => o.count >= 7) // Only check holders with at least 7 NFTs
      .slice(0, 50);
    
    for (const holder of topHoldersForFullSets) {
      try {
        const nftsResponse = await fetch(
          `${ALCHEMY_BASE_URL}/getNFTsForOwner?owner=${holder.address}&contractAddresses[]=${NODES_CONTRACT}&withMetadata=true`
        );
        
        if (nftsResponse.ok) {
          const nftsData = await nftsResponse.json();
          const innerStates = new Map<string, number>();
          
          for (const nft of nftsData.ownedNfts || []) {
            const attributes = nft.raw?.metadata?.attributes || [];
            const innerState = attributes.find((a: any) => 
              a.trait_type?.toLowerCase() === 'inner state'
            )?.value;
            
            if (innerState) {
              innerStates.set(innerState, (innerStates.get(innerState) || 0) + 1);
            }
          }
          
          // Check if has all 7 inner states
          const hasAllStates = INNER_STATES.every(state => 
            innerStates.has(state)
          );
          
          if (hasAllStates) {
            // Count complete sets (min across all states)
            const completeSets = Math.min(...INNER_STATES.map(state => 
              innerStates.get(state) || 0
            ));
            
            fullSetHolders.push({
              address: holder.address,
              sets: completeSets,
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching NFTs for ${holder.address}:`, err);
      }
    }
    
    // Sort full set holders by number of sets
    fullSetHolders.sort((a, b) => b.sets - a.sets);
    
    // Get collection stats
    const statsResponse = await fetch(
      `${ALCHEMY_BASE_URL}/getContractMetadata?contractAddress=${NODES_CONTRACT}`
    );
    
    let totalSupply = 0;
    let uniqueHolders = owners.length;
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      totalSupply = statsData.totalSupply || 0;
    }
    
    return NextResponse.json({
      topCollectors,
      fullSetHolders: fullSetHolders.slice(0, 20).map((h, index) => ({
        rank: index + 1,
        address: h.address,
        displayAddress: `${h.address.slice(0, 6)}...${h.address.slice(-4)}`,
        sets: h.sets,
      })),
      stats: {
        totalSupply,
        uniqueHolders,
        fullSetCount: fullSetHolders.length,
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
