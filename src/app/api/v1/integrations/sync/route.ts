import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type } = await request.json();
    if (!['gmail','calendar','drive'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const db = getFirestore();
    if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    const snap = await db
      .collection('googleIntegrations')
      .where('userId', '==', auth.uid)
      .where('type', '==', type)
      .limit(1)
      .get();
    if (snap.empty) return NextResponse.json({ error: 'Integration not found' }, { status: 404 });

    const ref = snap.docs[0].ref;
    await ref.update({ lastSync: new Date(), updatedAt: new Date() });

    // Aquí iría la lógica real de sincronización con la API de Google
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Integration sync error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

