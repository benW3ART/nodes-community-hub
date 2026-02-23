/**
 * Client-side NFT cache using localStorage.
 *
 * Caches NFT metadata per wallet address. Since metadata only changes
 * when a new interference drops (~every 3 months), we cache aggressively
 * and only re-fetch metadata for newly acquired tokens.
 *
 * Bump CACHE_VERSION when a new interference drops to force a full re-fetch.
 */

import type { NodeNFT } from '@/types/nft';

// =============================================
// Bump this when a new interference drops
// to force all users to re-fetch metadata.
// =============================================
export const CACHE_VERSION = 2;

interface CachedWalletData {
  version: number;
  nfts: NodeNFT[];
  tokenIds: string[];
  timestamp: number;
}

function cacheKey(address: string): string {
  return `nodes-nfts-${address.toLowerCase()}`;
}

export function getCachedNFTs(address: string): CachedWalletData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(address));
    if (!raw) return null;
    const data: CachedWalletData = JSON.parse(raw);
    if (data.version !== CACHE_VERSION) {
      // Version mismatch — interference dropped, clear stale data
      localStorage.removeItem(cacheKey(address));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCachedNFTs(address: string, nfts: NodeNFT[], tokenIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const data: CachedWalletData = {
      version: CACHE_VERSION,
      nfts,
      tokenIds,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey(address), JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

/**
 * Clear cache for all wallets. Call when a new interference drops.
 */
export function clearAllNFTCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('nodes-nfts-')) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch {
    // silent fail
  }
}
