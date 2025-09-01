import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getFirestore();
    if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    const snap = await db
      .collection('googleIntegrations')
      .where('userId', '==', auth.uid)
      .where('type', '==', 'drive')
      .limit(1)
      .get();

    if (snap.empty) return NextResponse.json(null);

    const doc = snap.docs[0];
    const data = doc.data() || {};
    const resp = {
      id: doc.id,
      folderId: data.folderId || undefined,
      folderName: data.folderName || undefined,
      syncEnabled: typeof data.syncEnabled === 'boolean' ? data.syncEnabled : false,
      autoSync: typeof data.autoSync === 'boolean' ? data.autoSync : false,
    };
    return NextResponse.json(resp);
  } catch (e) {
    console.error('Drive GET config error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const allowed: any = {};
    if (typeof body.folderId === 'string') allowed.folderId = body.folderId;
    if (typeof body.folderName === 'string') allowed.folderName = body.folderName;
    if (typeof body.syncEnabled === 'boolean') allowed.syncEnabled = body.syncEnabled;
    if (typeof body.autoSync === 'boolean') allowed.autoSync = body.autoSync;

    const db = getFirestore();
    if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    const snap = await db
      .collection('googleIntegrations')
      .where('userId', '==', auth.uid)
      .where('type', '==', 'drive')
      .limit(1)
      .get();

    if (snap.empty) return NextResponse.json({ error: 'Integration not found' }, { status: 404 });

    const ref = snap.docs[0].ref;
    await ref.update({ ...allowed, updatedAt: new Date() });

    const updated = await ref.get();
    const data = updated.data() || {};
    const resp = {
      id: updated.id,
      folderId: data.folderId || undefined,
      folderName: data.folderName || undefined,
      syncEnabled: typeof data.syncEnabled === 'boolean' ? data.syncEnabled : false,
      autoSync: typeof data.autoSync === 'boolean' ? data.autoSync : false,
    };
    return NextResponse.json(resp);
  } catch (e) {
    console.error('Drive PUT config error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

