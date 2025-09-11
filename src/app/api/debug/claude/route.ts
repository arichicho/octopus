import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasEnv = !!process.env.CLAUDE_API_KEY;
    const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    return NextResponse.json({
      hasEnv,
      model,
      now: new Date().toISOString(),
      // Never return the key
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

