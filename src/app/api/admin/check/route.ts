import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ authorized: false }, { status: 400 });
  }

  // Get whitelist from environment variable
  const whitelist = (process.env.ADMIN_WHITELIST || '')
    .split(',')
    .map(addr => addr.trim().toLowerCase())
    .filter(Boolean);

  const isAuthorized = whitelist.includes(address.toLowerCase());

  return NextResponse.json({ authorized: isAuthorized });
}
