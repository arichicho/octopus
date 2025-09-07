import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';

function looksLikeClaudeKey(key: string) {
  return typeof key === 'string' && key.startsWith('sk-ant-') && key.length > 20;
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { apiKey } = await request.json();
    const valid = looksLikeClaudeKey(apiKey || '') || !!process.env.CLAUDE_API_KEY;
    return NextResponse.json({ valid: !!valid });
  } catch (e) {
    return NextResponse.json({ valid: false });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

