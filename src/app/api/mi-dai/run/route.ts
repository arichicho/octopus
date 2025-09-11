import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { runMiDAIOrchestrator } from '@/lib/server/agents/orchestrator';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const date = new URL(req.url).searchParams.get('date') || new Date().toISOString();
    const result = await runMiDAIOrchestrator({ uid: auth.uid, email: auth.email || undefined, dateISO: date });
    return NextResponse.json(result);
  } catch (e) {
    console.error('Mi dAI run error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

