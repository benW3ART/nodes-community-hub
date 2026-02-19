import { NextRequest, NextResponse } from 'next/server';

const LEGACY_BASE_URL = 'https://storage.googleapis.com/node-nft/innerstate';

export async function GET(request: NextRequest) {
  const tokenId = request.nextUrl.searchParams.get('tokenId');

  if (!tokenId || !/^\d+$/.test(tokenId)) {
    return NextResponse.json({ error: 'Valid numeric tokenId required' }, { status: 400 });
  }

  // Try GIF first
  const gifUrl = `${LEGACY_BASE_URL}/${tokenId}.gif`;
  try {
    const gifResponse = await fetch(gifUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    if (gifResponse.ok) {
      return NextResponse.json({
        url: gifUrl,
        format: 'gif',
        proxyUrl: `/api/proxy-gif?url=${encodeURIComponent(gifUrl)}`,
      });
    }
  } catch {
    // GIF not found or timeout, try PNG
  }

  // Fallback to PNG
  const pngUrl = `${LEGACY_BASE_URL}/${tokenId}.png`;
  try {
    const pngResponse = await fetch(pngUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    if (pngResponse.ok) {
      return NextResponse.json({
        url: pngUrl,
        format: 'png',
        proxyUrl: `/api/proxy-gif?url=${encodeURIComponent(pngUrl)}`,
      });
    }
  } catch {
    // PNG not found either
  }

  return NextResponse.json(
    { url: null, format: null, error: 'No legacy image found' },
    { status: 404 }
  );
}
