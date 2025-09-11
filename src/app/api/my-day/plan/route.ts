import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { DEFAULT_MY_DAY_SETTINGS } from '@/lib/config/my-day';
import type {
  ContextPack,
  DailyPlanResponse,
  DailyPlannerSettings,
  ContextTask,
  ContextEvent,
} from '@/types/daily-plan';
import { generatePlan as generatePlanService } from '@/lib/server/ai/plan-service';

// Utilities
function toISO(date: Date): string {
  return date.toISOString();
}

function safeParseJSON<T = any>(text: string): T | null {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON object from text
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

// Convert HH:mm to a Date on given base day in provided timezone (approx; server-side uses UTC)
function dateOn(dayISO: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(dayISO);
  d.setHours(h, m, 0, 0);
  return d;
}

function clampToWorkingHours(start: Date, end: Date, settings: DailyPlannerSettings, dayISO: string) {
  const dayStart = dateOn(dayISO, settings.workingHours.start);
  const dayEnd = dateOn(dayISO, settings.workingHours.end);
  const s = new Date(Math.max(start.getTime(), dayStart.getTime()));
  const e = new Date(Math.min(end.getTime(), dayEnd.getTime()));
  if (e <= s) return null;
  return { start: s, end: e };
}

// Very small heuristic planner used as fallback when IA is not available
function naivePlanner(context: ContextPack): DailyPlanResponse {
  const { dateISO, settings, tasks, events } = context;
  const blocks: DailyPlanResponse['blocks'] = [];

  // Meetings as fixed blocks
  const fixedMeetings = (events || []).map((e) => ({
    id: `meeting-${e.id}`,
    type: 'meeting' as const,
    status: 'fixed' as const,
    start: e.start,
    end: e.end,
    title: e.title || 'Reunión',
    reason: e.allDay ? 'Evento de día completo (no bloquea tiempo)' : 'Evento del calendario',
    confidence: 1,
    relations: { meetingId: e.id, personIds: e.personIds || [], companyId: e.companyId || null },
  }));
  blocks.push(...fixedMeetings);

  // Sort tasks using a simple score
  const toScore = (t: ContextTask) => {
    const w = context.settings.scoring.weights || {} as any;
    let score = 0;
    if (t.priority === 'H') score += w.priorityHigh || 3;
    if (t.dueDate) {
      const due = new Date(t.dueDate);
      const today = new Date(dateISO);
      const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
      if (diff <= 0) score += w.dueToday || 3;
      else if (diff === 1) score += w.dueTomorrow || 2;
    }
    if ((t.tags || []).includes('ingresos') || (t.tags || []).includes('cliente')) score += w.revenueTag || 2;
    if ((t.estimateMinutes || 0) <= context.settings.quickWins.maxMinutes) score += w.shortEstimate || 1;
    return score;
  };

  const sortedTasks = [...(tasks || [])]
    .filter((t) => (t.status || 'open') !== 'done')
    .sort((a, b) => toScore(b) - toScore(a));

  const dayStart = dateOn(dateISO, settings.workingHours.start);
  const dayEnd = dateOn(dateISO, settings.workingHours.end);

  // Build a list of occupied intervals (meetings with buffers)
  const occupied: Array<{ start: Date; end: Date }> = (events || [])
    .filter((e) => !e.allDay)
    .map((e) => ({
      start: new Date(new Date(e.start).getTime() - settings.buffers.prepMinutes * 60000),
      end: new Date(new Date(e.end).getTime() + settings.buffers.postMinutes * 60000),
    }));
  occupied.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Helper to find next free slot of X minutes
  function* freeSlots(minMinutes: number): Generator<{ start: Date; end: Date }> {
    let cursor = new Date(dayStart);
    for (const o of occupied) {
      const free = clampToWorkingHours(cursor, o.start, settings, dateISO);
      if (free) {
        const gap = minutesBetween(free.start, free.end);
        if (gap >= minMinutes) yield { start: free.start, end: free.end };
      }
      if (o.end > cursor) cursor = new Date(o.end);
    }
    const tail = clampToWorkingHours(cursor, dayEnd, settings, dateISO);
    if (tail) {
      const gap = minutesBetween(tail.start, tail.end);
      if (gap >= minMinutes) yield tail;
    }
  }

  const pushBlock = (
    type: DailyPlanResponse['blocks'][number]['type'],
    start: Date,
    end: Date,
    title: string,
    reason: string,
    taskId?: string
  ) => {
    blocks.push({
      id: `${type}-${taskId || Math.random().toString(36).slice(2)}`,
      type,
      status: 'suggested',
      start: toISO(start),
      end: toISO(end),
      title,
      reason,
      confidence: 0.55,
      relations: { taskId: taskId || undefined },
    });
  };

  // Schedule quick wins into short gaps; deep work into long gaps
  for (const slot of freeSlots(settings.blocks.minBlockMinutes)) {
    let cursor = new Date(slot.start);
    while (cursor < slot.end && blocks.length < context.settings.plan.maxBlocks) {
      const remaining = minutesBetween(cursor, slot.end);
      const nextTask = sortedTasks.find((t) => {
        const est = t.estimateMinutes || (t.priority === 'H' ? 60 : 30);
        if (remaining < Math.min(settings.blocks.minBlockMinutes, est)) return false;
        // Prefer small tasks for small gaps, big tasks for larger gaps
        if (remaining <= settings.quickWins.maxMinutes) return (est || 10) <= settings.quickWins.maxMinutes;
        if (remaining >= settings.deepWork.minMinutes) return (est || 60) >= Math.min(settings.deepWork.minMinutes, remaining);
        return (est || 30) <= remaining;
      });
      if (!nextTask) break;
      const est = Math.min(
        nextTask.estimateMinutes || (nextTask.priority === 'H' ? 60 : 30),
        remaining
      );
      const end = new Date(cursor.getTime() + est * 60000);
      pushBlock(
        est <= settings.quickWins.maxMinutes ? 'quickwin' : 'focus',
        cursor,
        end,
        nextTask.title,
        'Programado automáticamente (fallback)',
        nextTask.id
      );
      // Remove scheduled task once
      const idx = sortedTasks.findIndex((t) => t.id === nextTask.id);
      if (idx >= 0) sortedTasks.splice(idx, 1);
      cursor = end;
    }
  }

  const meetingsCount = fixedMeetings.length;
  const freeMinutes = Math.max(0, minutesBetween(dayStart, dayEnd) - occupied.reduce((a, i) => a + minutesBetween(i.start, i.end), 0));
  const criticalCount = Math.min(3, (tasks || []).filter((t) => t.priority === 'H').length);

  return {
    date: context.dateISO.slice(0, 10),
    summary: { meetingsCount, freeMinutes, criticalCount, notes: 'Plan generado con heurística básica (sin IA)'} ,
    blocks: blocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    followUps: [],
    warnings: ['IA no disponible: usando planificador básico'],
  };
}

function buildSystemPrompt(): string {
  return (
    'Eres un planificador ejecutivo para “Mi Día”. Tu tarea es construir un plan ejecutable y realista a partir de tareas, calendario, emails y documentos. ' +
    'Responde SIEMPRE con UN ÚNICO objeto JSON válido, sin texto adicional, que cumpla exactamente el esquema ResponseSchema. ' +
    'No inventes datos: si faltan, refleja la incertidumbre con un `confidence` bajo y explica en `reason`.\n\n' +
    'Reglas de planificación (todas parametrizables y provistas en el mensaje del usuario):\n' +
    '- Respeta `workingHours` y `timezone`. No programes fuera de horario.\n' +
    '- Inserta buffers: `prepMinutes` antes de reuniones. Evita bloques "post" por defecto; sólo sugiérelos si hay acciones claras de seguimiento y disponibilidad de tiempo.\n' +
    '- Usa `slotGranularityMinutes` para redondear horarios y `minBlockMinutes` como tamaño mínimo de bloque.\n' +
    '- Clasifica tareas por un “score” usando `settings.scoring.weights`.\n' +
    '- Huecos cortos: prioriza quick wins y follow-ups. Huecos largos: deep work.\n' +
    '- Llamadas sólo dentro de `calls.allowedHours`.\n' +
    '- Limita follow-ups y aplica umbrales de antigüedad.\n' +
    '- No dupliques contenido; sin solapamientos; reuniones `fixed`.\n\n' +
    'ResponseSchema: {"date":"YYYY-MM-DD","summary":{"meetingsCount":0,"freeMinutes":0,"criticalCount":0,"notes":"string"},"blocks":[{"id":"string","type":"meeting|prep|post|focus|followup|call|quickwin","status":"suggested|fixed|accepted","start":"ISO-8601","end":"ISO-8601","title":"string","reason":"string","confidence":0.0,"relations":{"taskId":"string|null","meetingId":"string|null","personIds":["string"],"companyId":"string|null","docId":"string|null"}}],"followUps":[{"personId":"string","companyId":"string|null","channel":"email|call","subject":"string","reason":"string","urgency":1,"suggestedWindow":{"start":"ISO-8601","end":"ISO-8601"},"draft":{"subject":"string","body":"string"}}],"warnings":["string"]}'
  );
}

function buildUserPrompt(context: ContextPack): string {
  const { dateISO, settings, events, tasks, emailThreads, docs, peopleIndex } = context;
  const payload = {
    date: dateISO,
    timezone: settings.timezone,
    workingHours: settings.workingHours,
    buffers: settings.buffers,
    blocks: settings.blocks,
    quickWins: settings.quickWins,
    deepWork: settings.deepWork,
    calls: settings.calls,
    followUps: settings.followUps,
    plan: settings.plan,
    privacy: settings.privacy,
    scoring: settings.scoring,
    events,
    tasks,
    emailThreads,
    docs,
    peopleIndex,
  };
  return (
    '# Contexto y Settings (no hardcode)\n' +
    JSON.stringify(payload)
  );
}

// (Integration selection is handled inside the AI service via env key)

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Partial<ContextPack> & { dateISO?: string };
    const dateISO = body?.dateISO || new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
    const settings: DailyPlannerSettings = (body?.settings as any) || DEFAULT_MY_DAY_SETTINGS;
    const events: ContextEvent[] = (body?.events as any) || [];
    // Normalize tasks (map priorities if coming from app schema)
    const tasks: ContextTask[] = ((body?.tasks as any) || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      priority: t.priority || 'M',
      dueDate: t.dueDate || null,
      estimateMinutes: t.estimateMinutes || null,
      tags: t.tags || [],
      companyId: t.companyId || null,
      personIds: t.personIds || [],
      status: t.status || 'open',
    }));
    const emailThreads = (body?.emailThreads as any) || [];
    const docs = (body?.docs as any) || [];
    const peopleIndex = (body?.peopleIndex as any) || {};

    const context: ContextPack = {
      dateISO,
      settings,
      events,
      tasks,
      emailThreads,
      docs,
      peopleIndex,
    };

    const { plan } = await generatePlanService(context);
    return NextResponse.json(plan satisfies DailyPlanResponse);
  } catch (e) {
    console.error('Daily plan route error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
