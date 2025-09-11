import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import type { ContextEvent, ContextPack, DailyPlanResponse, MeetingPrep } from '@/types/daily-plan';
import { generatePrep as generatePrepService } from '@/lib/server/ai/prep-service';

function safeParseJSON<T = any>(text: string): T | null {
  try { return JSON.parse(text); } catch { return null; }
}

// AI selection handled in service via env key

function buildPrepSystemPrompt() {
  return (
    'Eres un asistente ejecutivo que prepara reuniones. Devuelve SIEMPRE un ÚNICO objeto JSON válido que cumpla el PrepSchema. ' +
    'No agregues texto fuera del JSON. Sé conciso y accionable.\n' +
    'Reglas: usa el idioma y zona horaria provistos; si privacy.redactPII=true, redacta PII. ' +
    'Resumen ≤ 80 palabras. Checklist 5–8 puntos priorizados. ' +
    'Incluye hasta los límites solicitados (maxTasks/maxEmails/maxDocs). No inventes datos: deja listas vacías y registra un warning.\n\n' +
    'PrepSchema: {"meetingId":"string","contextSummary":"string","checklists":[{"title":"string","done":false}],"links":[{"label":"string","url":"string"}],"relatedTasks":[{"id":"string","title":"string","priority":"H|M|L","dueDate":"YYYY-MM-DD|null"}],"relatedEmails":[{"threadId":"string","subject":"string","lastFrom":"string","lastMessageAt":"ISO-8601"}],"relatedDocs":[{"docId":"string","title":"string","url":"string|null"}],"talkingPoints":["string"],"decisions":["string"],"risks":["string"],"openQuestions":["string"],"prepEstimateMinutes":0,"warnings":["string"]}'
  );
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { event, context }: { event: ContextEvent; context: ContextPack } = await req.json();
    if (!event || !context) return NextResponse.json({ error: 'Missing event/context' }, { status: 400 });

    // Pre-filter related items heuristically
    const attendees = (event.attendees || []).map((a) => a.email.toLowerCase());
    const titleTokens = (event.title || '').toLowerCase().split(/\s+/).filter(Boolean);

    const relatedTasks = (context.tasks || []).filter((t) => {
      const inTitle = titleTokens.some((tok) => t.title.toLowerCase().includes(tok));
      const tagged = (t.tags || []).some((tag) => titleTokens.includes(tag.toLowerCase()));
      return inTitle || tagged;
    }).slice(0, 10);

    const relatedEmails = (context.emailThreads || []).filter((th) => {
      const from = (th.lastFrom || '').toLowerCase();
      const subj = (th.subject || '').toLowerCase();
      const hitPerson = attendees.some((a) => from.includes(a));
      const hitTitle = titleTokens.some((tok) => subj.includes(tok));
      return hitPerson || hitTitle;
    }).slice(0, 10);

    const relatedDocs = (context.docs || []).filter((d) => {
      const name = (d.title || '').toLowerCase();
      return titleTokens.some((tok) => name.includes(tok));
    }).slice(0, 10);

    const result = await generatePrepService(event as any, context);
    return NextResponse.json(result);
  } catch (e) {
    console.error('Meeting prep route error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
