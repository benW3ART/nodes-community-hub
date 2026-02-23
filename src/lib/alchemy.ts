import { ALCHEMY_API_KEY, NODES_CONTRACT, INNER_STATES } from './constants';
import { getCachedNFTs, setCachedNFTs } from './nft-cache';
import type { NodeNFT, FullSetStatus } from '@/types/nft';

const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

// Use our proxy API to avoid CORS issues (browser → our server → metadata API)
const METADATA_API_URL = '/api/metadata';

// In-memory cache: avoids re-fetching when navigating between pages in the same session.
// Holds { address, nfts, tokenIds, timestamp }.
// TTL: 2 minutes — after that we re-check token IDs from Alchemy (lightweight).
let memoryCache: {
  address: string;
  nfts: NodeNFT[];
  tokenIds: string[];
  timestamp: number;
} | null = null;
const MEMORY_CACHE_TTL = 2 * 60 * 1000;

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

/**
 * Fetch fresh metadata directly from the contract's tokenURI API
 */
async function fetchFreshMetadata(tokenId: string): Promise<FreshMetadata | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${METADATA_API_URL}/${tokenId}`, {
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Metadata API] Token ${tokenId}: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
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
    networkStatus: getAttribute('Network Status') || undefined,
    metadata: {
      name: metadata.name || '',
      description: metadata.description || '',
      image: metadata.image || '',
      attributes: metadata.attributes || [],
    },
  };
}

/**
 * Process items in batches with a delay between batches
 */
async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return results;
}

/**
 * Fetch only the list of owned token IDs from Alchemy (lightweight, no metadata).
 * This is the cheapest possible Alchemy call.
 */
async function fetchOwnedTokenIds(ownerAddress: string): Promise<string[]> {
  const response = await fetch(
    `${ALCHEMY_BASE_URL}/getNFTsForOwner?owner=${ownerAddress}&contractAddresses[]=${NODES_CONTRACT}&withMetadata=false`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch NFTs from Alchemy');
  }

  const data = await response.json();
  if (!data.ownedNfts || data.ownedNfts.length === 0) {
    return [];
  }

  return data.ownedNfts
    .map((nft: { tokenId?: string; id?: { tokenId?: string } }) =>
      nft.tokenId || nft.id?.tokenId || ''
    )
    .filter(Boolean);
}

/**
 * Fetch metadata for a list of token IDs and return NodeNFT objects.
 */
async function fetchMetadataForTokens(tokenIds: string[]): Promise<NodeNFT[]> {
  const nfts = await processBatch(tokenIds, 5, async (tokenId) => {
    const metadata = await fetchFreshMetadata(tokenId);
    if (metadata) return parseMetadataToNFT(tokenId, metadata);
    return null;
  });
  return nfts.filter((nft): nft is NodeNFT => nft !== null);
}

/**
 * Get NFTs for an owner with smart caching.
 *
 * Cache strategy:
 * 1. In-memory cache (2min TTL) — instant return during same-session navigation
 * 2. localStorage cache (persistent, versioned) — survives page refreshes
 * 3. On cache hit, only fetch token IDs (lightweight) to check for changes
 * 4. Only fetch metadata for NEW tokens — existing tokens use cached metadata
 * 5. Bump CACHE_VERSION in nft-cache.ts when a new interference drops
 */
export async function getNFTsForOwner(ownerAddress: string): Promise<NodeNFT[]> {
  const normalizedAddress = ownerAddress.toLowerCase();

  try {
    // Layer 1: In-memory cache — return immediately if fresh
    if (
      memoryCache &&
      memoryCache.address === normalizedAddress &&
      Date.now() - memoryCache.timestamp < MEMORY_CACHE_TTL
    ) {
      console.log(`[NFTs] Memory cache hit for ${normalizedAddress.slice(0, 8)}...`);
      return memoryCache.nfts;
    }

    // Layer 2: Fetch owned token IDs (1 lightweight Alchemy call, no metadata)
    const currentTokenIds = await fetchOwnedTokenIds(ownerAddress);

    if (currentTokenIds.length === 0) {
      memoryCache = { address: normalizedAddress, nfts: [], tokenIds: [], timestamp: Date.now() };
      return [];
    }

    // Layer 3: Check localStorage cache
    const cached = getCachedNFTs(ownerAddress);

    if (cached) {
      const cachedIdSet = new Set(cached.tokenIds);
      const currentIdSet = new Set(currentTokenIds);

      const newIds = currentTokenIds.filter(id => !cachedIdSet.has(id));
      const removedIds = cached.tokenIds.filter(id => !currentIdSet.has(id));

      if (newIds.length === 0 && removedIds.length === 0) {
        // No changes — return cached data
        console.log(`[NFTs] Cache hit for ${normalizedAddress.slice(0, 8)}... (${cached.nfts.length} NFTs, no changes)`);
        memoryCache = { address: normalizedAddress, nfts: cached.nfts, tokenIds: currentTokenIds, timestamp: Date.now() };
        return cached.nfts;
      }

      // Partial update: fetch metadata only for new tokens
      console.log(`[NFTs] Partial update for ${normalizedAddress.slice(0, 8)}...: +${newIds.length} new, -${removedIds.length} removed`);

      const newNfts = newIds.length > 0 ? await fetchMetadataForTokens(newIds) : [];
      const keptNfts = cached.nfts.filter(nft => currentIdSet.has(nft.tokenId));
      const allNfts = [...keptNfts, ...newNfts];

      setCachedNFTs(ownerAddress, allNfts, currentTokenIds);
      memoryCache = { address: normalizedAddress, nfts: allNfts, tokenIds: currentTokenIds, timestamp: Date.now() };
      return allNfts;
    }

    // Layer 4: No cache at all — fetch everything (first visit or after cache version bump)
    console.log(`[NFTs] Full fetch for ${normalizedAddress.slice(0, 8)}... (${currentTokenIds.length} tokens)`);

    const allNfts = await fetchMetadataForTokens(currentTokenIds);

    setCachedNFTs(ownerAddress, allNfts, currentTokenIds);
    memoryCache = { address: normalizedAddress, nfts: allNfts, tokenIds: currentTokenIds, timestamp: Date.now() };
    return allNfts;

  } catch (error) {
    console.error('Error fetching NFTs:', error);

    // On error, try to return cached data if available
    const cached = getCachedNFTs(ownerAddress);
    if (cached) {
      console.log(`[NFTs] Returning stale cache after error`);
      return cached.nfts;
    }

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

  INNER_STATES.forEach(state => {
    stateMap.set(state, { count: 0, tokenIds: [] });
  });

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
  const minCount = Math.min(...status.map(s => s.count));
  const completeSets = minCount > 0 && missingStates.length === 0 ? minCount : 0;

  return { status, completeSets, missingStates };
}
