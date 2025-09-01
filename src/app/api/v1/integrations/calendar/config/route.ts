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
      .where('type', '==', 'calendar')
      .limit(1)
      .get();

    if (snap.empty) return NextResponse.json(null);

    const doc = snap.docs[0];
    const data = doc.data() || {};
    const resp = {
      id: doc.id,
      calendarId: data.calendarId || '',
      name: data.name || '',
      primary: !!data.primary,
      syncEnabled: typeof data.syncEnabled === 'boolean' ? data.syncEnabled : false,
      eventSync: (['all', 'selected', 'none'].includes(data.eventSync) ? data.eventSync : 'all') as 'all'|'selected'|'none',
    };
    return NextResponse.json(resp);
  } catch (e) {
    console.error('Calendar GET config error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const allowed: any = {};
    if (typeof body.calendarId === 'string') allowed.calendarId = body.calendarId;
    if (typeof body.name === 'string') allowed.name = body.name;
    if (typeof body.primary === 'boolean') allowed.primary = body.primary;
    if (typeof body.syncEnabled === 'boolean') allowed.syncEnabled = body.syncEnabled;
    if (['all', 'selected', 'none'].includes(body.eventSync)) allowed.eventSync = body.eventSync;

    const db = getFirestore();
    if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    const snap = await db
      .collection('googleIntegrations')
      .where('userId', '==', auth.uid)
      .where('type', '==', 'calendar')
      .limit(1)
      .get();

    if (snap.empty) return NextResponse.json({ error: 'Integration not found' }, { status: 404 });

    const ref = snap.docs[0].ref;
    await ref.update({ ...allowed, updatedAt: new Date() });

    const updated = await ref.get();
    const data = updated.data() || {};
    const resp = {
      id: updated.id,
      calendarId: data.calendarId || '',
      name: data.name || '',
      primary: !!data.primary,
      syncEnabled: typeof data.syncEnabled === 'boolean' ? data.syncEnabled : false,
      eventSync: (['all', 'selected', 'none'].includes(data.eventSync) ? data.eventSync : 'all') as 'all'|'selected'|'none',
    };
    return NextResponse.json(resp);
  } catch (e) {
    console.error('Calendar PUT config error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

