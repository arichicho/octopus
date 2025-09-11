import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { DEFAULT_MIDAI_PREFERENCES, MiDAIPreferences } from '@/types/midai';

const COL = 'midai_preferences';

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getFirestore();
  if (!db) return NextResponse.json(DEFAULT_MIDAI_PREFERENCES);
  const ref = db.collection(COL).doc(auth.uid);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json(DEFAULT_MIDAI_PREFERENCES);
  return NextResponse.json({ ...DEFAULT_MIDAI_PREFERENCES, ...(snap.data() as any) });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Partial<MiDAIPreferences>;
  const db = getFirestore();
  if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const ref = db.collection(COL).doc(auth.uid);
  await ref.set({ ...body, updatedAt: new Date() }, { merge: true });
  const snap = await ref.get();
  return NextResponse.json({ ...DEFAULT_MIDAI_PREFERENCES, ...(snap.data() as any) });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

