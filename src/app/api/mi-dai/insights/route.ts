import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import type { ContextPack } from '@/types/daily-plan';
import { callClaude } from '@/lib/server/ai/client';

function simpleInsights(context: ContextPack): string[] {
  const out: string[] = [];
  const today = new Date(context.dateISO);
  const high = (context.tasks || []).filter(t => t.priority === 'H' && (t.status || 'open') !== 'done');
  if (high.length) out.push(`Tienes ${high.length} tareas críticas pendientes.`);
  const dueToday = (context.tasks || []).filter(t => t.dueDate && new Date(t.dueDate) <= today);
  if (dueToday.length) out.push(`${dueToday.length} tareas vencen hoy o están vencidas.`);
  const meetings = (context.events || []).filter(e => !e.allDay);
  if (meetings.length >= 4) out.push('Día con muchas reuniones: agenda bloques de foco breves.');
  const quickwins = (context.tasks || []).filter(t => (t.estimateMinutes || 0) > 0 && (t.estimateMinutes || 0) <= (context.settings.quickWins?.maxMinutes || 15));
  if (quickwins.length) out.push(`Hay ${quickwins.length} quick wins ideales para huecos cortos.`);
  return out;
}

function buildSystemPrompt() {
  return (
    'Eres un asesor ejecutivo. Devuelve SOLO JSON válido con insights y briefings rápidos para el día, a partir de calendario, emails, documentos y tareas. ' +
    'No incluyas texto fuera del JSON. Sé directo y accionable.\n' +
    'Schema: {"insights":["string"],"briefings":[{"title":"string","summary":"<=80 palabras","actions":["string"]}],"risks":["string"],"suggestions":["string"]}'
  );
}

function buildUserPrompt(context: ContextPack) {
  const payload = {
    date: context.dateISO,
    settings: context.settings,
    events: context.events,
    tasks: context.tasks,
    emailThreads: context.emailThreads,
    docs: context.docs,
    peopleIndex: context.peopleIndex,
  };
  return JSON.stringify(payload);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const context = (await req.json()) as ContextPack;

    // If Claude key available, get LLM insights; fallback to heuristics.
    if (process.env.CLAUDE_API_KEY) {
      const system = buildSystemPrompt();
      const user = buildUserPrompt(context);
      const res = await callClaude({ system, user, maxTokens: 1200, temperature: 0.2 });
      if (res.ok && res.text) {
        try {
          const json = JSON.parse(res.text);
          const insights = Array.isArray(json?.insights) ? json.insights : [];
          const briefings = Array.isArray(json?.briefings) ? json.briefings : [];
          const risks = Array.isArray(json?.risks) ? json.risks : [];
          const suggestions = Array.isArray(json?.suggestions) ? json.suggestions : [];
          return NextResponse.json({ insights, briefings, risks, suggestions });
        } catch {}
      }
    }

    const insights = simpleInsights(context);
    return NextResponse.json({ insights, briefings: [], risks: [], suggestions: [] });
  } catch (e) {
    console.error('Mi dAI insights error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
