import type { ContextPack, DailyPlanResponse } from '@/types/daily-plan';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { fetchGoogle } from '@/lib/server/google';
import { DEFAULT_MI_DAI_SETTINGS } from '@/lib/config/mi-dai';
import { generatePlan as generatePlanService } from '@/lib/server/ai/plan-service';
import { callClaude } from '@/lib/server/ai/client';
import { memUpsert, memSearch } from './memory';

export type AgentLog = { at: string; agent: string; message: string; data?: any };

export interface OrchestratorResult {
  plan: DailyPlanResponse;
  context: ContextPack;
  insights?: { insights: string[]; briefings?: any[]; risks?: string[]; suggestions?: string[] };
  artifacts: Record<string, any>;
  logs: AgentLog[];
}

async function getTasksForUser(uid: string, email?: string | null) {
  const db = getFirestore();
  if (!db) return [];
  const tasks: Record<string, any> = {};
  async function addFromSnap(q: FirebaseFirestore.Query) {
    const snap = await q.get();
    snap.docs.forEach((doc) => { tasks[doc.id] = { id: doc.id, ...(doc.data() as any) }; });
  }
  const col = db.collection('tasks');
  await addFromSnap(col.where('assignedTo', 'array-contains', uid));
  await addFromSnap(col.where('createdBy', '==', uid));
  if (email) await addFromSnap(col.where('createdBy', '==', email));
  // Map to ContextTask shape
  return Object.values(tasks).map((d: any) => ({
    id: d.id,
    title: d.title || 'Tarea',
    priority: (d.priority === 'urgent' || d.priority === 'high') ? 'H' : d.priority === 'medium' ? 'M' : 'L',
    dueDate: d.dueDate?.toDate ? d.dueDate.toDate().toISOString().slice(0, 10) : d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 10) : null,
    estimateMinutes: d.estimateMinutes || null,
    tags: d.tags || [],
    companyId: d.companyId || null,
    personIds: Array.isArray(d.assignedTo) ? d.assignedTo : [],
    status: d.status === 'completed' ? 'done' : d.status === 'cancelled' ? 'blocked' : 'open',
  }));
}

async function getCalendarEvents(uid: string, dateISO: string) {
  const d1 = new Date(dateISO); d1.setHours(0,0,0,0);
  const d2 = new Date(dateISO); d2.setHours(23,59,59,999);
  const params = new URLSearchParams({ timeMin: d1.toISOString(), timeMax: d2.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '50' });
  const json = await fetchGoogle<any>(uid, 'calendar', `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`);
  if (!json || !Array.isArray(json.items)) return [];
  return json.items
    .filter((e: any) => !e.cancelled)
    .map((e: any) => ({
      id: e.id,
      title: e.summary || 'Evento',
      start: e.start?.dateTime || (e.start?.date ? `${e.start.date}T09:00:00Z` : null),
      end: e.end?.dateTime || (e.end?.date ? `${e.end.date}T09:30:00Z` : null),
      allDay: !!e.start?.date && !e.start?.dateTime,
      attendees: (e.attendees || []).map((a: any) => ({ email: a.email })),
      isExternal: !!e.hangoutLink,
      location: e.location || null,
      onlineMeetingUrl: e.hangoutLink || e.conferenceData?.entryPoints?.[0]?.uri || null,
      companyId: null,
      personIds: [],
      status: 'fixed' as const,
    }))
    .filter((e: any) => !!e.start && !!e.end);
}

async function getGmailThreads(uid: string, lookbackDays: number) {
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
    return { threadId: thr.id, personIds: [], companyId: null, lastMessageAt: lastAt, lastFrom: fromHeader, subject: subjectHeader, unansweredDays: days };
  });
}

async function getDriveDocs(uid: string) {
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.document' and (name contains 'minuta' or name contains 'nota')");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink,owners(emailAddress))');
  const json = await fetchGoogle<any>(uid, 'drive', `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=20&fields=${fields}&orderBy=modifiedTime desc`);
  if (!json || !Array.isArray(json.files)) return [];
  return json.files.map((f: any) => ({ docId: f.id, title: f.name, type: 'minuta', meetingId: null, personIds: [], companyId: null, decisions: [], openItems: [] }));
}

function log(logs: AgentLog[], agent: string, message: string, data?: any) {
  logs.push({ at: new Date().toISOString(), agent, message, data });
}

export async function runMiDAIOrchestrator(params: { uid: string; email?: string | null; dateISO?: string }): Promise<OrchestratorResult> {
  const logs: AgentLog[] = [];
  const dateISO = params.dateISO || new Date().toISOString();
  log(logs, 'orchestrator', 'start', { dateISO });

  // 1) Gatherers
  const [tasks, events, emailThreads, docs] = await Promise.all([
    getTasksForUser(params.uid, params.email).then(r => { log(logs,'TasksAgent','fetched', { count: r.length }); return r; }),
    getCalendarEvents(params.uid, dateISO).then(r => { log(logs,'CalendarAgent','fetched', { count: r.length }); return r; }),
    getGmailThreads(params.uid, DEFAULT_MI_DAI_SETTINGS.privacy.maxEmailLookbackDays).then(r => { log(logs,'EmailAgent','fetched', { count: r.length }); return r; }),
    getDriveDocs(params.uid).then(r => { log(logs,'DocsAgent','fetched', { count: r.length }); return r; }),
  ]);

  const context: ContextPack = {
    dateISO,
    settings: DEFAULT_MI_DAI_SETTINGS,
    events: events as any,
    tasks: tasks as any,
    emailThreads: emailThreads as any,
    docs: docs as any,
    peopleIndex: {},
  };
  log(logs, 'orchestrator', 'context_ready');

  // 1.5) Memoria vectorial básica (opcional)
  try {
    const memoryItems = [
      ...(tasks || []).slice(0,100).map((t:any) => ({ id: `task:${t.id}`, text: `Tarea: ${t.title} prioridad ${t.priority} tags ${(t.tags||[]).join(',')}` })),
      ...(docs || []).slice(0,100).map((d:any) => ({ id: `doc:${d.docId}`, text: `Doc: ${d.title}` })),
      ...(emailThreads || []).slice(0,100).map((e:any) => ({ id: `email:${e.threadId}`, text: `Email: ${e.subject} de ${e.lastFrom}` })),
    ];
    const up = await memUpsert(memoryItems);
    log(logs, 'MemoryAgent', 'upsert', { upserted: up.upserted });
  } catch (e) {
    log(logs, 'MemoryAgent', 'upsert_error', { error: String(e) });
  }

  // 2) Reason over insights (Claude if available)
  let insights: OrchestratorResult['insights'] | undefined = undefined;
  if (process.env.CLAUDE_API_KEY) {
    const system = 'Eres un orquestador ejecutivo. Devuelve SOLO JSON {"insights":[],"suggestions":[],"risks":[],"briefings":[{"title":"","summary":"","actions":[]}]} a partir del contexto. Breve y accionable.';
    const user = JSON.stringify({ date: dateISO, events, tasks, emailThreads, docs });
    const ai = await callClaude({ system, user, maxTokens: 1200, temperature: 0.2 });
    if (ai.ok && ai.text) {
      try { const j = JSON.parse(ai.text); insights = { insights: j.insights||[], briefings: j.briefings||[], risks: j.risks||[], suggestions: j.suggestions||[] }; } catch (e) { log(logs,'LLM','parse_error', { text: ai.text?.slice(0,200) }); }
    } else {
      log(logs,'LLM','error', { status: ai.status, error: ai.error });
    }
  }

  // 3) Planner (Claude plan-service or heuristic fallback)
  const { plan } = await generatePlanService(context);
  log(logs, 'PlannerAgent', 'plan_generated', { blocks: plan.blocks.length });

  // 4) Memory hits relacionados a reuniones (para enriquecer prep/insights)
  try {
    const meetings = (context.events || []).filter((e:any) => !e.allDay).slice(0,3);
    const hits: Record<string, any[]> = {};
    for (const m of meetings) {
      const res = await memSearch(m.title || '', 5);
      hits[m.id] = res;
    }
    (plan as any).memoryHits = hits;
    log(logs, 'MemoryAgent', 'search', { meetings: meetings.length });
  } catch (e) {
    log(logs, 'MemoryAgent', 'search_error', { error: String(e) });
  }

  // Return artifacts
  const artifacts: Record<string, any> = { tasks, events, emailThreads, docs };
  log(logs, 'orchestrator', 'done');
  return { plan, context, insights, artifacts, logs };
}
