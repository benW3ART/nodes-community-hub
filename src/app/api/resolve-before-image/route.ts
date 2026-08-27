import { NextRequest, NextResponse } from 'next/server';
import { NODES_METADATA_API } from '@/lib/constants';

/**
 * Resolves the "before" image for a Refinement NFT.
 *
 * Unlike previous interferences — where the before image is the original
 * legacy art on GCS (see /api/resolve-legacy-image) — The Refinement exposes
 * the previous version through the tokenURI itself: `{tokenURI}/before`
 * returns the metadata of the art as it was before the interference.
 */
export async function GET(request: NextRequest) {
  const tokenId = request.nextUrl.searchParams.get('tokenId');

  if (!tokenId || !/^\d+$/.test(tokenId)) {
    return NextResponse.json({ error: 'Valid numeric tokenId required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${NODES_METADATA_API}/${tokenId}/before`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { url: null, format: null, error: `No before metadata (HTTP ${response.status})` },
        { status: 404 }
      );
    }

    const data = await response.json();
    // `image` is the art of the previous version; the other keys are defensive
    // fallbacks in case the /before payload uses a different naming.
    const url: string | undefined = data?.image || data?.image_url || data?.cleanimage;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { url: null, format: null, error: 'No image in before metadata' },
        { status: 404 }
      );
    }

    const format = /\.gif(\?|$)/i.test(url) ? 'gif' : 'png';

    return NextResponse.json(
      {
        url,
        format,
        proxyUrl: `/api/proxy-gif?url=${encodeURIComponent(url)}`,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
    );
  } catch (error) {
    console.error(`[Before Image] Token ${tokenId}:`, error);
    return NextResponse.json(
      { url: null, format: null, error: 'Failed to resolve before image' },
      { status: 404 }
    );
  }
}
