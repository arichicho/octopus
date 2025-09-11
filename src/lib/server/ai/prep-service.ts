import type { ContextEvent, ContextPack, MeetingPrep } from '@/types/daily-plan';
import { callClaude } from './client';

function safeParseJSON<T=any>(text: string): T | null {
  try { return JSON.parse(text); } catch { const s=text.indexOf('{'); const e=text.lastIndexOf('}'); if (s>=0&&e>s){ try {return JSON.parse(text.slice(s,e+1));}catch{}} return null; }
}

function fallbackPrep(event: ContextEvent, context: ContextPack, warning?: string): MeetingPrep {
  return {
    meetingId: event.id,
    contextSummary: `Reunión: ${event.title}.`,
    checklists: [
      { title: 'Objetivo claro y éxito esperado' },
      { title: 'Decisiones necesarias hoy' },
      { title: 'Bloqueos y riesgos a tratar' },
      { title: 'Revisar tareas abiertas relacionadas' },
      { title: 'Definir próximos pasos y responsables' },
    ],
    links: [ ...(event.onlineMeetingUrl ? [{ label: 'Enlace a la reunión', url: event.onlineMeetingUrl }] : []) ],
    relatedTasks: (context.tasks||[]).slice(0,5).map(t=>({ id:t.id!, title:t.title, priority:t.priority, dueDate:t.dueDate||null })),
    relatedEmails: (context.emailThreads||[]).slice(0,5).map(e=>({ threadId:e.threadId, subject:e.subject, lastFrom:e.lastFrom, lastMessageAt:e.lastMessageAt })),
    relatedDocs: (context.docs||[]).slice(0,5).map(d=>({ docId:d.docId, title:d.title })),
    warnings: warning? [warning] : undefined,
  };
}

export async function generatePrep(event: ContextEvent, context: ContextPack): Promise<MeetingPrep> {
  if (!process.env.CLAUDE_API_KEY) return fallbackPrep(event, context, 'no_api_key');
  const system = 'Eres un asistente ejecutivo. Devuelve SOLO JSON válido con el esquema PrepSchema. Checklist 5–8 puntos.';
  const user = JSON.stringify({ event, relatedCandidates: { tasks: (context as any).tasks, emailThreads: (context as any).emailThreads, docs: (context as any).docs }, settings: context.settings });
  const ai = await callClaude({ system, user, maxTokens: 1500, temperature: 0.2 });
  if (!ai.ok || !ai.text) return fallbackPrep(event, context, `ai_error${ai.status? '_'+ai.status:''}`);
  const json = safeParseJSON<MeetingPrep>(ai.text);
  if (!json || !json.meetingId) return fallbackPrep(event, context, 'parse_error');
  return json;
}
