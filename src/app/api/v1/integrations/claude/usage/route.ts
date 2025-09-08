import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ currentUsage: 0, usageLimit: null, lastUsed: null, _warning: 'Firestore not available; returning default usage' });
  }

  try {
    const id = `${auth.uid}_claude_usage`;
    const ref = db.collection('integrations_claude_usage').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      const payload = { id, userId: auth.uid, currentUsage: 0, usageLimit: null, lastUsed: null, updatedAt: new Date(), createdAt: new Date() };
      await ref.set(payload);
      return NextResponse.json({ currentUsage: 0, usageLimit: null, lastUsed: null });
    }
    const data = snap.data() || {};
    return NextResponse.json({ currentUsage: data.currentUsage || 0, usageLimit: data.usageLimit ?? null, lastUsed: data.lastUsed ?? null });
  } catch (e: any) {
    return NextResponse.json({ currentUsage: 0, usageLimit: null, lastUsed: null, _warning: 'Firestore error; returning default usage', _error: e?.message || String(e) });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
