import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getGoogleConfig } from '@/lib/config/integrations';
import { encrypt } from '@/lib/server/crypto';

type GType = 'gmail' | 'calendar' | 'drive';

async function exchangeCode(code: string) {
  const cfg = getGoogleConfig();
  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getFirestore();
  if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const { type, authCode }: { type: GType; authCode: string } = await request.json();
  if (!type || !authCode) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  try {
    const token = await exchangeCode(authCode);
    const now = Date.now();
    const expiresAt = token.expires_in ? new Date(now + token.expires_in * 1000) : null;

    const id = `${auth.uid}_${type}`;
    const ref = db.collection('integrations_google_tokens').doc(id);
    await ref.set(
      {
        id,
        userId: auth.uid,
        type,
        status: 'connected',
        accessToken: token.access_token ? encrypt(token.access_token) : undefined,
        refreshToken: token.refresh_token ? encrypt(token.refresh_token) : undefined,
        expiresAt,
        scope: token.scope,
        scopes: typeof token.scope === 'string' ? token.scope.split(' ') : [],
        updatedAt: new Date(),
        createdAt: new Date(),
      },
      { merge: true }
    );

    // Create default per-service config if missing
    const cfgId = `${auth.uid}_${type}_config`;
    const cfgRef = db.collection('integrations_google_config').doc(cfgId);
    const cfgSnap = await cfgRef.get();
    if (!cfgSnap.exists) {
      if (type === 'gmail') {
        await cfgRef.set({ id: cfgId, userId: auth.uid, email: auth.email || '', labels: [], syncEnabled: true, createdAt: new Date(), updatedAt: new Date() });
      } else if (type === 'calendar') {
        await cfgRef.set({ id: cfgId, userId: auth.uid, calendarId: 'primary', name: 'Primary', primary: true, syncEnabled: true, eventSync: 'all', createdAt: new Date(), updatedAt: new Date() });
      } else if (type === 'drive') {
        await cfgRef.set({ id: cfgId, userId: auth.uid, folderId: null, folderName: null, syncEnabled: true, autoSync: false, createdAt: new Date(), updatedAt: new Date() });
      }
    }

    return NextResponse.json({
      id,
      userId: auth.uid,
      type,
      status: 'connected',
      scopes: typeof token.scope === 'string' ? token.scope.split(' ') : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to connect' }, { status: 500 });
  }
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
