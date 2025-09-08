import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getFirestore();
  if (!db) return new NextResponse(null, { status: 204 });
  try {
    const id = `${auth.uid}_calendar_config`;
    const snap = await db.collection('integrations_google_config').doc(id).get();
    if (!snap.exists) return new NextResponse(null, { status: 204 });
    return NextResponse.json(snap.data());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getFirestore();
  if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const body = await request.json();
  const id = `${auth.uid}_calendar_config`;
  const ref = db.collection('integrations_google_config').doc(id);
  await ref.set({ id, userId: auth.uid, updatedAt: new Date(), ...body }, { merge: true });
  const snap = await ref.get();
  return NextResponse.json(snap.data());
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
