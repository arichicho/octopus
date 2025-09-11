import { NextRequest, NextResponse } from 'next/server';
import { healthPing, hasApiKey } from '@/lib/server/ai/client';

export async function GET(req: NextRequest) {
  try {
    const ping = await healthPing();
    return NextResponse.json({
      hasEnv: ping.hasEnv,
      ok: ping.ok,
      status: ping.status,
      error: ping.error,
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      now: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ hasEnv: hasApiKey(), ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

