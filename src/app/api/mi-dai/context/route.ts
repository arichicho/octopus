import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { DEFAULT_MI_DAI_SETTINGS } from '@/lib/config/mi-dai';
import type { ContextPack, ContextDocSummary, ContextEmailThread, ContextEvent, ContextTask, PeopleIndex } from '@/types/daily-plan';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { fetchGoogle } from '@/lib/server/google';

function startOfDayISO(dateISO: string) { const d = new Date(dateISO); d.setHours(0,0,0,0); return d.toISOString(); }
function endOfDayISO(dateISO: string) { const d = new Date(dateISO); d.setHours(23,59,59,999); return d.toISOString(); }

async function getTasksForUser(uid: string, email?: string | null): Promise<ContextTask[]> {
  const db = getFirestore();
  if (!db) return [];
  const tasks: Record<string, ContextTask> = {};
  async function addFromSnap(q: FirebaseFirestore.Query) {
    const snap = await q.get();
    snap.docs.forEach((doc) => {
      const d = doc.data() as any;
      tasks[doc.id] = {
        id: doc.id,
        title: d.title || 'Tarea',
        priority: (d.priority === 'urgent' || d.priority === 'high') ? 'H' : d.priority === 'medium' ? 'M' : 'L',
        dueDate: d.dueDate?.toDate ? d.dueDate.toDate().toISOString().slice(0, 10) : d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 10) : null,
        estimateMinutes: d.estimateMinutes || null,
        tags: d.tags || [],
        companyId: d.companyId || null,
        personIds: Array.isArray(d.assignedTo) ? d.assignedTo : [],
        status: d.status === 'completed' ? 'done' : d.status === 'cancelled' ? 'blocked' : 'open',
      } as ContextTask;
    });
  }
  const col = db.collection('tasks');
  await addFromSnap(col.where('assignedTo', 'array-contains', uid));
  await addFromSnap(col.where('createdBy', '==', uid));
  if (email) await addFromSnap(col.where('createdBy', '==', email));
  return Object.values(tasks);
}

async function getCalendarEvents(uid: string, dateISO: string): Promise<ContextEvent[]> {
  const timeMin = startOfDayISO(dateISO);
  const timeMax = endOfDayISO(dateISO);
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '50' });
  const json = await fetchGoogle<any>(uid, 'calendar', `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`);
  if (!json || !Array.isArray(json.items)) return [];
  return json.items
    .filter((e: any) => !e.cancelled)
    .map((e: any) => {
      const isAllDay = !!e.start?.date && !e.start?.dateTime;
      const start = e.start?.dateTime || (e.start?.date ? `${e.start.date}T09:00:00Z` : null);
      const end = e.end?.dateTime || (e.end?.date ? `${e.end.date}T09:30:00Z` : null);
      return {
        id: e.id,
        title: e.summary || 'Evento',
        start,
        end,
        allDay: isAllDay,
        attendees: (e.attendees || []).map((a: any) => ({ email: a.email })),
        isExternal: !!e.hangoutLink,
        location: e.location || null,
        onlineMeetingUrl: e.hangoutLink || e.conferenceData?.entryPoints?.[0]?.uri || null,
        companyId: null,
        personIds: [],
        status: 'fixed',
      } as ContextEvent;
    })
    .filter((e: ContextEvent) => !!e.start && !!e.end);
}

async function getGmailThreads(uid: string, lookbackDays: number): Promise<ContextEmailThread[]> {
  const q = `newer_than:${lookbackDays}d -in:chats`;
  const params = new URLSearchParams({ q, maxResults: '30' });
  const json = await fetchGoogle<any>(uid, 'gmail', `https://gmail.googleapis.com/gmail/v1/users/me/threads?${params.toString()}`);
  if (!json || !Array.isArray(json.threads)) return [];
  const details = await Promise.all(
    json.threads.slice(0, 20).map((t: any) => fetchGoogle<any>(uid, 'gmail', `https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata`))
  );
  const now = Date.now();
  return details.filter(Boolean).map((thr: any) => {
    const lastMsg = thr.messages?.[thr.messages.length - 1];
    const headers = (lastMsg?.payload?.headers || []) as Array<{ name: string; value: string }>;
    const dateHeader = headers.find((h) => h.name.toLowerCase() === 'date')?.value;
    const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from')?.value || '';
    const subjectHeader = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '';
    const lastAt = dateHeader ? new Date(dateHeader).toISOString() : new Date(parseInt(lastMsg?.internalDate || '0')).toISOString();
    const days = Math.max(0, Math.floor((now - new Date(lastAt).getTime()) / 86400000));
    return { threadId: thr.id, personIds: [], companyId: null, lastMessageAt: lastAt, lastFrom: fromHeader, subject: subjectHeader, unansweredDays: days } as ContextEmailThread;
  });
}

async function getDriveDocs(uid: string): Promise<ContextDocSummary[]> {
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.document' and (name contains 'minuta' or name contains 'nota')");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink,owners(emailAddress))');
  const json = await fetchGoogle<any>(uid, 'drive', `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=20&fields=${fields}&orderBy=modifiedTime desc`);
  if (!json || !Array.isArray(json.files)) return [];
  return json.files.map((f: any) => ({ docId: f.id, title: f.name, type: 'minuta', meetingId: null, personIds: [], companyId: null, decisions: [], openItems: [] } as ContextDocSummary));
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const date = new URL(req.url).searchParams.get('date') || new Date().toISOString();

    const tasks = await getTasksForUser(auth.uid, auth.email || null);
    const events = await getCalendarEvents(auth.uid, date).catch(() => []);
    const emailThreads = await getGmailThreads(auth.uid, DEFAULT_MI_DAI_SETTINGS.privacy.maxEmailLookbackDays).catch(() => []);
    const docs = await getDriveDocs(auth.uid).catch(() => []);
    const peopleIndex: PeopleIndex = {};

    const context: ContextPack = { dateISO: date, settings: DEFAULT_MI_DAI_SETTINGS, events, tasks, emailThreads, docs, peopleIndex };
    return NextResponse.json(context);
  } catch (e) {
    console.error('Mi dAI context error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

