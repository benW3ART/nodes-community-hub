import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }
  
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Proxy GIF error:', error);
    return NextResponse.json({ error: 'Failed to fetch GIF' }, { status: 500 });
  }
}
