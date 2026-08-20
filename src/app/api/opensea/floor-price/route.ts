import { NextResponse } from 'next/server';
import { ALCHEMY_API_KEY, NODES_CONTRACT } from '@/lib/constants';

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';

// Server-side cache: 5 minute TTL
let cachedFloorPrice: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchFromOpenSea(): Promise<number | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (OPENSEA_API_KEY) headers['X-API-KEY'] = OPENSEA_API_KEY;
    const res = await fetch(
      'https://api.opensea.io/api/v2/collections/nodes-by-hunter/stats',
      { headers, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const floor = data?.total?.floor_price;
    return typeof floor === 'number' ? floor : null;
  } catch {
    return null;
  }
}

async function fetchFromAlchemy(): Promise<number | null> {
  if (!ALCHEMY_API_KEY) return null;
  try {
    const res = await fetch(
      `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getFloorPrice?contractAddress=${NODES_CONTRACT}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const floor = data?.openSea?.floorPrice ?? data?.looksRare?.floorPrice;
    return typeof floor === 'number' ? floor : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  if (cachedFloorPrice !== null && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ floorPrice: cachedFloorPrice, cached: true });
  }

  // Reservoir sunset Oct 2025. OpenSea stats work without a key; Alchemy is fallback.
  let floor = await fetchFromOpenSea();
  if (floor === null) {
    floor = await fetchFromAlchemy();
  }

  if (floor !== null) {
    cachedFloorPrice = floor;
    cacheTimestamp = now;
  }

  return NextResponse.json({
    floorPrice: floor,
    cached: false,
  });
}
