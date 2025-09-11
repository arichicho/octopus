import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

type Action = 'up' | 'down' | 'pin' | 'unpin';
type ItemType = 'task' | 'email' | 'doc';

function tokenize(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/[()\[\],.:;!¿?]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 3);
}

function extractEmail(addr?: string): string | null {
  if (!addr) return null;
  const m = /<([^>]+)>/.exec(addr);
  return (m ? m[1] : addr).trim().toLowerCase();
}

function domainOf(email?: string | null): string | null {
  if (!email) return null;
  const e = email.toLowerCase();
  const m = e.match(/@([^>\s]+)>?$/);
  return m ? m[1] : (e.includes('@') ? e.split('@')[1] : null);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getFirestore();
    if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    const body = await req.json();
    const { itemType, action, meetingId, item } = body as {
      itemType: ItemType;
      action: Action;
      meetingId?: string;
      item?: Record<string, any>;
    };
    if (!itemType || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const prefRef = db.collection('midai_preferences').doc(auth.uid);
    const prefSnap = await prefRef.get();
    const prefs = (prefSnap.exists ? prefSnap.data() : {}) as any;

    const addToArraySet = (arr: any[], val: any) => {
      const set = new Set([...(arr || [])]);
      if (val !== null && val !== undefined && String(val).trim() !== '') set.add(val);
      return Array.from(set);
    };
    const removeFromArray = (arr: any[], val: any) => (arr || []).filter((x) => x !== val);

    const updates: any = { updatedAt: new Date() };

    if (action === 'pin' || action === 'unpin') {
      if (!meetingId || !item?.id) return NextResponse.json({ error: 'Missing meetingId or item.id' }, { status: 400 });
      const pinRef = db.collection('midai_pins').doc(`${auth.uid}_${meetingId}`);
      const pinSnap = await pinRef.get();
      const base = pinSnap.exists ? pinSnap.data() : { tasks: [], emails: [], docs: [], userId: auth.uid, meetingId };
      const key = itemType + 's';
      const list: string[] = base[key] || [];
      const exists = list.includes(item.id);
      const next = action === 'pin' ? (exists ? list : [...list, item.id]) : list.filter((x) => x !== item.id);
      await pinRef.set({ ...base, [key]: next, updatedAt: new Date() }, { merge: true });
    } else {
      // up/down → ajustar preferencias
      if (itemType === 'email') {
        const email = extractEmail(item?.from) || extractEmail(item?.lastFrom) || null;
        const dom = domainOf(email);
        if (action === 'up') {
          if (dom) updates.emailDomainsUp = addToArraySet(prefs.emailDomainsUp || [], dom);
          const toks = tokenize(item?.subject || '');
          const kw = (prefs.keywordsUp || []) as string[];
          updates.keywordsUp = Array.from(new Set([...kw, ...toks])).slice(0, 100);
          if (email) updates.participantsBoost = { ...(prefs.participantsBoost || {}), [email]: (prefs.participantsBoost?.[email] || 0) + 1 };
        } else if (action === 'down') {
          if (dom) updates.emailDomainsDown = addToArraySet(prefs.emailDomainsDown || [], dom);
          const toks = tokenize(item?.subject || '');
          const kwd = (prefs.keywordsDown || []) as string[];
          updates.keywordsDown = Array.from(new Set([...kwd, ...toks])).slice(0, 100);
          if (email) updates.participantsBoost = { ...(prefs.participantsBoost || {}), [email]: (prefs.participantsBoost?.[email] || 0) - 1 };
        }
      } else if (itemType === 'task') {
        const toks = Array.from(new Set([...tokenize(item?.title || ''), ...((item?.tags || []) as string[]).map((t) => String(t).toLowerCase())]));
        if (action === 'up') {
          updates.keywordsUp = Array.from(new Set([...(prefs.keywordsUp || []), ...toks])).slice(0, 100);
          if (item?.companyId) updates.companiesBoost = { ...(prefs.companiesBoost || {}), [item.companyId]: (prefs.companiesBoost?.[item.companyId] || 0) + 1 };
        } else if (action === 'down') {
          updates.keywordsDown = Array.from(new Set([...(prefs.keywordsDown || []), ...toks])).slice(0, 100);
          if (item?.companyId) updates.companiesBoost = { ...(prefs.companiesBoost || {}), [item.companyId]: (prefs.companiesBoost?.[item.companyId] || 0) - 1 };
        }
      } else if (itemType === 'doc') {
        const toks = tokenize(item?.title || item?.docTitle || '');
        if (action === 'up') {
          updates.keywordsUp = Array.from(new Set([...(prefs.keywordsUp || []), ...toks])).slice(0, 100);
          if (item?.type) updates.docTypesBoost = { ...(prefs.docTypesBoost || {}), [String(item.type).toLowerCase()]: (prefs.docTypesBoost?.[String(item.type).toLowerCase()] || 0) + 1 };
        } else if (action === 'down') {
          updates.keywordsDown = Array.from(new Set([...(prefs.keywordsDown || []), ...toks])).slice(0, 100);
          if (item?.type) updates.docTypesBoost = { ...(prefs.docTypesBoost || {}), [String(item.type).toLowerCase()]: (prefs.docTypesBoost?.[String(item.type).toLowerCase()] || 0) - 1 };
        }
      }
      await prefRef.set(updates, { merge: true });
    }

    // Log feedback
    try {
      const logRef = db.collection('mi_dai_feedback').doc();
      await logRef.set({ userId: auth.uid, at: new Date(), itemType, action, meetingId: meetingId || null, item: item || null });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('feedback error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

