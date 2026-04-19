import { NextRequest, NextResponse } from 'next/server';
import { readConvergenceConfig, writeConvergenceConfig } from '@/lib/convergence-config';

export async function GET() {
  try {
    const config = await readConvergenceConfig();
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { address?: unknown; revealAt?: unknown }
    | null;

  if (!body || typeof body.address !== 'string' || typeof body.revealAt !== 'string') {
    return NextResponse.json({ error: 'Missing address or revealAt' }, { status: 400 });
  }

  const whitelist = (process.env.ADMIN_WHITELIST || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!whitelist.includes(body.address.toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const config = await writeConvergenceConfig(body.revealAt);
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
