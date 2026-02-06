import { ALCHEMY_API_KEY, NODES_CONTRACT, INNER_STATES } from './constants';
import type { NodeNFT, FullSetStatus } from '@/types/nft';

const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

// Direct metadata API (always fresh, not cached by Alchemy)
const METADATA_API_URL = 'https://nodes-metadata-api.10amstudios.xyz/metadata';

// Fresh metadata response from the contract's tokenURI
interface FreshMetadata {
  name: string;
  description: string;
  image: string;
  cleanimage?: string;
  id: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

// Alchemy API response types (only used for getting token IDs)
interface AlchemyNFT {
  tokenId?: string;
  id?: { tokenId?: string };
}

/**
 * Fetch fresh metadata directly from the contract's tokenURI API
 * This bypasses Alchemy's cache and always returns current data
 */
async function fetchFreshMetadata(tokenId: string): Promise<FreshMetadata | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(`${METADATA_API_URL}/${tokenId}`, {
      signal: controller.signal,
      cache: 'no-store', // Don't use Next.js cache for external API
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`[Metadata API] Token ${tokenId}: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[Metadata API] Token ${tokenId}: OK - ${data.name}`);
    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Metadata API] Token ${tokenId}: ${errorMsg}`);
    return null;
  }
}

/**
 * Parse fresh metadata into NodeNFT format
 */
function parseMetadataToNFT(tokenId: string, metadata: FreshMetadata): NodeNFT {
  const getAttribute = (traitType: string): string => {
    const attr = metadata.attributes?.find(a => 
      a.trait_type?.toLowerCase() === traitType.toLowerCase()
    );
    return attr?.value || '';
  };
  
  const interferenceValue = getAttribute('Interference');
  const hasInterference = interferenceValue !== '' && 
    interferenceValue.toLowerCase() !== 'none' && 
    interferenceValue.toLowerCase() !== 'false';
  
  return {
    tokenId,
    name: metadata.name || `NODES #${tokenId}`,
    image: metadata.image || '',
    innerState: getAttribute('Inner State'),
    grid: getAttribute('Grid'),
    gradient: getAttribute('Gradient'),
    glow: getAttribute('Glow'),
    interference: hasInterference,
    metadata: {
      name: metadata.name || '',
      description: metadata.description || '',
      image: metadata.image || '',
      attributes: metadata.attributes || [],
    },
  };
}

/**
 * Get NFTs for an owner with FRESH metadata from the contract API
 * Falls back to Alchemy's cached data if the fresh API fails
 */
export async function getNFTsForOwner(ownerAddress: string): Promise<NodeNFT[]> {
  try {
    // Fetch from Alchemy WITH metadata as fallback
    const response = await fetch(
      `${ALCHEMY_BASE_URL}/getNFTsForOwner?owner=${ownerAddress}&contractAddresses[]=${NODES_CONTRACT}&withMetadata=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch NFTs from Alchemy');
    }
    
    const data = await response.json();
    
    if (!data.ownedNfts || data.ownedNfts.length === 0) {
      return [];
    }
    
    // Try to fetch fresh metadata, fall back to Alchemy's cached data
    const nftPromises = data.ownedNfts.map(async (alchemyNft: any) => {
      const tokenId = alchemyNft.tokenId || alchemyNft.id?.tokenId || '';
      if (!tokenId) return null;
      
      // Try fresh metadata first
      const freshMetadata = await fetchFreshMetadata(tokenId);
      if (freshMetadata) {
        return parseMetadataToNFT(tokenId, freshMetadata);
      }
      
      // Fallback to Alchemy's cached data
      console.warn(`[Fallback] Token ${tokenId}: Using Alchemy cached data`);
      const metadata = alchemyNft.raw?.metadata || alchemyNft.metadata || {};
      const image = metadata.image || alchemyNft.image?.cachedUrl || alchemyNft.image?.originalUrl || '';
      
      const getAttribute = (traitType: string): string => {
        const attrs = metadata.attributes || [];
        const attr = attrs.find((a: any) => 
          a.trait_type?.toLowerCase() === traitType.toLowerCase()
        );
        return attr?.value || '';
      };
      
      const interferenceValue = getAttribute('Interference');
      const hasInterference = interferenceValue !== '' && 
        interferenceValue.toLowerCase() !== 'none' && 
        interferenceValue.toLowerCase() !== 'false';
      
      return {
        tokenId,
        name: metadata.name || `NODES #${tokenId}`,
        image,
        innerState: getAttribute('Inner State'),
        grid: getAttribute('Grid'),
        gradient: getAttribute('Gradient'),
        glow: getAttribute('Glow'),
        interference: hasInterference,
        metadata: {
          name: metadata.name || '',
          description: metadata.description || '',
          image,
          attributes: metadata.attributes || [],
        },
      } as NodeNFT;
    });
    
    const nfts = await Promise.all(nftPromises);
    return nfts.filter((nft): nft is NodeNFT => nft !== null);
    
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}

/**
 * Get single NFT metadata (fresh from contract API)
 */
export async function getNFTMetadata(tokenId: string): Promise<NodeNFT | null> {
  try {
    const metadata = await fetchFreshMetadata(tokenId);
    if (!metadata) return null;
    return parseMetadataToNFT(tokenId, metadata);
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

export function analyzeFullSets(nfts: NodeNFT[]): {
  status: FullSetStatus[];
  completeSets: number;
  missingStates: string[];
} {
  const stateMap = new Map<string, { count: number; tokenIds: string[] }>();
  
  // Initialize all states
  INNER_STATES.forEach(state => {
    stateMap.set(state, { count: 0, tokenIds: [] });
  });
  
  // Count NFTs per Inner State
  nfts.forEach(nft => {
    const state = nft.innerState;
    if (state && stateMap.has(state)) {
      const current = stateMap.get(state)!;
      current.count++;
      current.tokenIds.push(nft.tokenId);
    }
  });
  
  const status: FullSetStatus[] = INNER_STATES.map(state => {
    const data = stateMap.get(state)!;
    return {
      innerState: state,
      owned: data.count > 0,
      count: data.count,
      tokenIds: data.tokenIds,
    };
  });
  
  const missingStates = status.filter(s => !s.owned).map(s => s.innerState);
  
  // Calculate complete sets (min across all owned states)
  const minCount = Math.min(...status.map(s => s.count));
  const completeSets = minCount > 0 && missingStates.length === 0 ? minCount : 0;
  
  return {
    status,
    completeSets,
    missingStates,
  };
}

export async function getCollectionStats() {
  try {
    const response = await fetch(
      `${ALCHEMY_BASE_URL}/getContractMetadata?contractAddress=${NODES_CONTRACT}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch collection stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching collection stats:', error);
    return null;
  }
}
