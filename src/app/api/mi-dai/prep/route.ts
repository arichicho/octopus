import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import type { ContextEvent, ContextPack, ContextEmailThread, ContextTask, ContextDocSummary } from '@/types/daily-plan';
import { generatePrep as generatePrepService } from '@/lib/server/ai/prep-service';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { MiDAIPreferences } from '@/types/midai';
import { DEFAULT_MIDAI_PREFERENCES } from '@/types/midai';

function tokenize(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/[()\[\],.:;!¿?]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 3);
}

function extractEmail(addr: string): string {
  const m = /<([^>]+)>/.exec(addr);
  return (m ? m[1] : addr).trim().toLowerCase();
}

function hasAny(haystack: string[], needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

function domainOf(email: string): string | null {
  const e = (email || '').toLowerCase();
  const m = e.match(/@([^>\s]+)>?$/);
  return m ? m[1] : (e.includes('@') ? e.split('@')[1] : null);
}

function relevantTasks(event: ContextEvent, tasks: ContextTask[], limit = 8, prefs?: MiDAIPreferences): ContextTask[] {
  const titleTokens = tokenize(event.title || '');
  const ids = new Set<string>();
  const scored: Array<{ t: ContextTask; score: number }> = [];
  for (const t of tasks || []) {
    if ((t.status || 'open') === 'done') continue;
    const tTokens = tokenize(t.title);
    let s = 0;
    if (hasAny(tTokens, titleTokens)) s += 3;
    if ((t.tags || []).some((tag) => titleTokens.includes(tag.toLowerCase()))) s += 2;
    if (t.priority === 'H') s += 2;
    if (t.dueDate) s += 1;
    if (prefs) {
      const text = (t.title || '').toLowerCase();
      if (prefs.keywordsUp.some((k) => text.includes(k.toLowerCase()))) s += 2;
      if (prefs.keywordsDown.some((k) => text.includes(k.toLowerCase()))) s -= 3;
      if (t.companyId && prefs.companiesBoost[t.companyId]) s += prefs.companiesBoost[t.companyId];
    }
    if (s > 0) scored.push({ t, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  const out: ContextTask[] = [];
  for (const { t } of scored) {
    if (ids.has(t.id)) continue;
    out.push(t);
    ids.add(t.id);
    if (out.length >= limit) break;
  }
  return out;
}

function relevantEmails(event: ContextEvent, threads: ContextEmailThread[], limit = 8, prefs?: MiDAIPreferences): ContextEmailThread[] {
  const titleTokens = tokenize(event.title || '');
  const attendeeEmails = (event.attendees || []).map((a) => (a.email || '').toLowerCase());
  const scored: Array<{ e: ContextEmailThread; score: number }> = [];
  for (const th of threads || []) {
    const subjTokens = tokenize(th.subject || '');
    const fromEmail = extractEmail(th.lastFrom || '');
    let s = 0;
    if (hasAny(subjTokens, titleTokens)) s += 3;
    if (attendeeEmails.includes(fromEmail)) s += 3;
    if ((th.unansweredDays || 0) > 0) s += 1; // priorizar hilos sin respuesta
    if (prefs) {
      const dom = domainOf(fromEmail);
      if (dom && prefs.emailDomainsUp.includes(dom)) s += 2;
      if (dom && prefs.emailDomainsDown.includes(dom)) s -= 3;
      if (prefs.participantsBoost[fromEmail]) s += prefs.participantsBoost[fromEmail];
      const subj = (th.subject || '').toLowerCase();
      if (prefs.keywordsUp.some((k) => subj.includes(k.toLowerCase()))) s += 1;
      if (prefs.keywordsDown.some((k) => subj.includes(k.toLowerCase()))) s -= 2;
    }
    if (s > 0) scored.push({ e: th, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.e);
}

function relevantDocs(event: ContextEvent, docs: ContextDocSummary[], limit = 8, prefs?: MiDAIPreferences): ContextDocSummary[] {
  const titleTokens = tokenize(event.title || '');
  const scored: Array<{ d: ContextDocSummary; score: number; modified?: number }> = [];
  for (const d of docs || []) {
    const nameTokens = tokenize(d.title || '');
    let s = 0;
    if (hasAny(nameTokens, titleTokens)) s += 2;
    if ((d.type || '').toLowerCase().includes('minuta')) s += 1;
    if (prefs) {
      const typ = (d.type || '').toLowerCase();
      if (prefs.docTypesBoost[typ]) s += prefs.docTypesBoost[typ];
      const title = (d.title || '').toLowerCase();
      if (prefs.keywordsUp.some((k) => title.includes(k.toLowerCase()))) s += 1;
      if (prefs.keywordsDown.some((k) => title.includes(k.toLowerCase()))) s -= 2;
    }
    if (s > 0) scored.push({ d, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.d);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { event, context }: { event: ContextEvent; context: ContextPack } = await req.json();
    if (!event || !context) return NextResponse.json({ error: 'Missing event/context' }, { status: 400 });
    // Cargar preferencias del usuario
    let prefs: MiDAIPreferences = DEFAULT_MIDAI_PREFERENCES;
    try {
      const db = getFirestore();
      if (db) {
        const snap = await db.collection('midai_preferences').doc(auth.uid).get();
        if (snap.exists) prefs = { ...prefs, ...(snap.data() as any) };
      }
    } catch {}

    const maxItems = prefs.maxRelatedItems || 8;

    // Reducir el contexto a lo relevante por título/participantes + preferencias
    const filtered: ContextPack = {
      ...context,
      tasks: relevantTasks(event, context.tasks || [], maxItems, prefs),
      emailThreads: relevantEmails(event, context.emailThreads || [], maxItems, prefs),
      docs: relevantDocs(event, context.docs || [], maxItems, prefs),
    };
    const result = await generatePrepService(event as any, filtered);
    return NextResponse.json(result);
  } catch (e) {
    console.error('Mi dAI prep error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
