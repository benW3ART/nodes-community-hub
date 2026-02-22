import { NextResponse } from 'next/server';

const NODES_CONTRACT = '0x95bc4c2e01c2e2d9e537e7a9fe58187e88dd8019';
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';

// Server-side cache: 5 minute TTL
let cachedFloorPrice: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchFromReservoir(): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api-base.reservoir.tools/collections/v7?id=${NODES_CONTRACT}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const floor = data?.collections?.[0]?.floorAsk?.price?.amount?.native;
    return typeof floor === 'number' ? floor : null;
  } catch {
    return null;
  }
}

async function fetchFromOpenSea(): Promise<number | null> {
  if (!OPENSEA_API_KEY) return null;
  try {
    const res = await fetch(
      'https://api.opensea.io/api/v2/collections/nodes-by-hunter/stats',
      {
        headers: { 'X-API-KEY': OPENSEA_API_KEY, Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const floor = data?.total?.floor_price;
    return typeof floor === 'number' ? floor : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  // Return cached value if fresh
  if (cachedFloorPrice !== null && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ floorPrice: cachedFloorPrice, cached: true });
  }

  // Try Reservoir first (free, no key needed), then OpenSea
  let floor = await fetchFromReservoir();
  if (floor === null) {
    floor = await fetchFromOpenSea();
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
