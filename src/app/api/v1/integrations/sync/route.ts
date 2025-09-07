import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

type GType = 'gmail' | 'calendar' | 'drive';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getFirestore();
  if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const { type }: { type: GType } = await request.json();
  if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 });

  try {
    const id = `${auth.uid}_${type}`;
    await db.collection('integrations_google_tokens').doc(id).set({ lastSync: new Date(), updatedAt: new Date() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
