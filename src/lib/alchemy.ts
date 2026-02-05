import { ALCHEMY_API_KEY, NODES_CONTRACT, INNER_STATES } from './constants';
import type { NodeNFT, FullSetStatus } from '@/types/nft';

const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

// Alchemy API response types
interface AlchemyAttribute {
  trait_type?: string;
  value?: string;
}

interface AlchemyNFT {
  tokenId?: string;
  id?: { tokenId?: string };
  raw?: {
    metadata?: {
      name?: string;
      description?: string;
      image?: string;
      attributes?: AlchemyAttribute[];
    };
  };
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: AlchemyAttribute[];
  };
  image?: {
    cachedUrl?: string;
    originalUrl?: string;
  };
}

export async function getNFTsForOwner(ownerAddress: string): Promise<NodeNFT[]> {
  try {
    const response = await fetch(
      `${ALCHEMY_BASE_URL}/getNFTsForOwner?owner=${ownerAddress}&contractAddresses[]=${NODES_CONTRACT}&withMetadata=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch NFTs');
    }
    
    const data = await response.json();
    
    return data.ownedNfts.map((nft: AlchemyNFT) => parseNodeNFT(nft));
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}

export async function getNFTMetadata(tokenId: string): Promise<NodeNFT | null> {
  try {
    const response = await fetch(
      `${ALCHEMY_BASE_URL}/getNFTMetadata?contractAddress=${NODES_CONTRACT}&tokenId=${tokenId}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch NFT metadata');
    }
    
    const data = await response.json();
    return parseNodeNFT(data);
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

function parseNodeNFT(nft: AlchemyNFT): NodeNFT {
  const metadata = nft.raw?.metadata || nft.metadata || {};
  const attributes: AlchemyAttribute[] = metadata.attributes || [];
  
  const getAttribute = (traitType: string): string => {
    const attr = attributes.find((a: AlchemyAttribute) => 
      a.trait_type?.toLowerCase() === traitType.toLowerCase()
    );
    return attr?.value || '';
  };
  
  // Convert AlchemyAttribute to NFTAttribute (ensure required fields)
  const normalizedAttributes = attributes
    .filter(a => a.trait_type && a.value)
    .map(a => ({
      trait_type: a.trait_type!,
      value: a.value!,
    }));
  
  return {
    tokenId: nft.tokenId || nft.id?.tokenId || '',
    name: metadata.name || `NODES #${nft.tokenId}`,
    image: nft.image?.cachedUrl || nft.image?.originalUrl || metadata.image || '',
    innerState: getAttribute('Inner State'),
    grid: getAttribute('Grid'),
    gradient: getAttribute('Gradient'),
    glow: getAttribute('Glow'),
    interference: getAttribute('Interference') === 'true' || getAttribute('Interference') === '1',
    metadata: {
      name: metadata.name || '',
      description: metadata.description || '',
      image: metadata.image || '',
      attributes: normalizedAttributes,
    },
  };
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
