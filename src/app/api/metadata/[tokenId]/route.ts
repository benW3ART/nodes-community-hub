import { NextRequest, NextResponse } from 'next/server';

const METADATA_API_URL = 'https://nodes-metadata-api.10amstudios.xyz/metadata';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  
  try {
    const response = await fetch(`${METADATA_API_URL}/${tokenId}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch metadata: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Cache for 1 minute
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error(`[Metadata Proxy] Token ${tokenId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
