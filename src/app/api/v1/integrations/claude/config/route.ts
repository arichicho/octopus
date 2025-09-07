import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getClaudeConfig } from '@/lib/config/integrations';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getFirestore();
  if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  try {
    const id = `${auth.uid}_claude_config`;
    const ref = db.collection('integrations_claude_config').doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      const cfg = getClaudeConfig();
      const payload = {
        id,
        userId: auth.uid,
        enabled: !!cfg.apiKey,
        model: cfg.defaultModel,
        maxTokens: cfg.maxTokens,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await ref.set(payload);
      return NextResponse.json(payload);
    }

    return NextResponse.json(snap.data());
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getFirestore();
  if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const body = await request.json();
  const { model, maxTokens, enabled } = body || {};

  try {
    const id = `${auth.uid}_claude_config`;
    const ref = db.collection('integrations_claude_config').doc(id);
    const updates: any = { updatedAt: new Date() };
    if (typeof model === 'string') updates.model = model;
    if (typeof maxTokens === 'number') updates.maxTokens = maxTokens;
    if (typeof enabled === 'boolean') updates.enabled = enabled;

    await ref.set({ id, userId: auth.uid, createdAt: new Date(), ...updates }, { merge: true });
    const snap = await ref.get();
    return NextResponse.json(snap.data());
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update config' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

