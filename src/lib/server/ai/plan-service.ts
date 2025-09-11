import type { ContextPack, DailyPlanResponse, DailyPlannerSettings, ContextTask } from '@/types/daily-plan';
import { callClaude } from './client';

async function optimizeViaMicroservice(context: ContextPack): Promise<DailyPlanResponse | null> {
  try {
    const use = process.env.MIDAI_USE_OPTIMIZER === 'true';
    const base = process.env.MIDAI_SERVICE_URL || process.env.MIDAI_OPTIMIZER_URL || '';
    if (!use || !base) return null;
    const url = `${base.replace(/\/$/, '')}/optimize-plan`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
      // keep small timeout to avoid blocking request cycle
      // @ts-ignore
      next: { revalidate: 0 },
    } as any);
    if (!res.ok) return null;
    const plan = await res.json();
    if (!plan || !Array.isArray(plan.blocks)) return null;
    return plan as DailyPlanResponse;
  } catch (e) {
    console.warn('Optimizer microservice error:', e);
    return null;
  }
}

function safeParseJSON<T = any>(text: string): T | null {
  try { return JSON.parse(text); } catch {
    const s = text.indexOf('{');
    const e = text.lastIndexOf('}');
    if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e+1)); } catch {} }
    return null;
  }
}

function toISO(d: Date) { return d.toISOString(); }
function dateOn(dayISO: string, hhmm: string): Date { const [h,m]=hhmm.split(':').map(Number); const d=new Date(dayISO); d.setHours(h,m,0,0); return d; }
function minutesBetween(a: Date, b: Date) { return Math.max(0, Math.round((b.getTime()-a.getTime())/60000)); }

function naivePlan(context: ContextPack): DailyPlanResponse {
  const { dateISO, settings, tasks, events } = context;
  const blocks: DailyPlanResponse['blocks'] = [];
  
  // Clasificar eventos inteligentemente
  for (const e of events || []) {
    const title = e.title || 'Evento';
    
    // Detectar vuelos
    const isFlight = /^[A-Z]{2}\s*\d+\s+[A-Z]{3}-[A-Z]{3}$/.test(title) || 
                     /vuelo/i.test(title) || 
                     /flight/i.test(title) ||
                     /AM\s*\d+/.test(title) ||
                     /Aerolíneas/i.test(title);
    
    // Detectar shows/eventos
    const isShow = /^[A-Za-z\s]+ en [A-Za-z\s]+$/.test(title) || 
                   title.toLowerCase().includes('show') || 
                   title.toLowerCase().includes('concierto') ||
                   title.toLowerCase().includes('evento');
    
    // Detectar viajes
    const isTravel = /viaje/i.test(title) || 
                     /travel/i.test(title) ||
                     /trip/i.test(title);
    
    if (isFlight || isTravel) {
      // Vuelos/viajes no bloquean tiempo
      blocks.push({ 
        id: 'travel-'+e.id, 
        type: 'event', 
        status: 'fixed', 
        start: e.start, 
        end: e.end, 
        title: title, 
        reason: 'Vuelo/viaje (no bloquea tiempo)', 
        confidence: 1, 
        relations: { meetingId: e.id }
      });
    } else if (isShow) {
      // Shows/eventos no bloquean tiempo
      blocks.push({ 
        id: 'event-'+e.id, 
        type: 'event', 
        status: 'fixed', 
        start: e.start, 
        end: e.end, 
        title: title, 
        reason: 'Show/evento (no bloquea tiempo)', 
        confidence: 1, 
        relations: { meetingId: e.id }
      });
    } else {
      // Reuniones reales
      blocks.push({ 
        id: 'meeting-'+e.id, 
        type: 'meeting', 
        status: 'fixed', 
        start: e.start, 
        end: e.end, 
        title: title, 
        reason: 'Reunión del calendario', 
        confidence: 1, 
        relations: { meetingId: e.id }
      });
    }
  }
  
  // Sistema de puntuación inteligente
  const w = settings.scoring?.weights || {} as any;
  const score = (t: ContextTask) => {
    let s = 0;
    
    // Prioridad alta
    if (t.priority === 'H') s += w.priorityHigh || 5;
    
    // Urgencia por vencimiento
    if (t.dueDate) {
      const dd = new Date(t.dueDate);
      const td = new Date(dateISO);
      const diff = Math.floor((dd.getTime() - td.getTime()) / 86400000);
      if (diff <= 0) s += w.dueToday || 10; // Vencidas HOY = máxima prioridad
      else if (diff === 1) s += w.dueTomorrow || 7; // Vencen MAÑANA
      else if (diff <= 3) s += w.dueSoon || 3; // Vencen pronto
    }
    
    // Impacto en ingresos
    if ((t.tags || []).some(x => ['ingresos', 'cliente', 'venta'].includes(String(x).toLowerCase()))) {
      s += w.revenueTag || 4;
    }
    
    // Tareas cortas para quickwins
    if ((t.estimateMinutes || 0) <= (settings.quickWins?.maxMinutes || 15)) {
      s += w.shortEstimate || 1;
    }
    
    return s;
  };
  
  const sorted = [...(tasks || [])]
    .filter(t => (t.status || 'open') !== 'done')
    .sort((a, b) => score(b) - score(a));
  
  const dayStart = dateOn(dateISO, settings.workingHours.start);
  const dayEnd = dateOn(dateISO, settings.workingHours.end);
  
  // Solo ocupar tiempo de reuniones reales (no eventos, shows, vuelos)
  const occupied = (events || [])
    .filter(e => {
      if (e.allDay) return false; // Eventos de día completo no bloquean
      
      const title = e.title || '';
      
      // No bloquear: shows, vuelos, viajes
      const isShow = /^[A-Za-z\s]+ en [A-Za-z\s]+$/.test(title);
      const isFlight = /^[A-Z]{2}\s*\d+\s+[A-Z]{3}-[A-Z]{3}$/.test(title) || 
                       /vuelo/i.test(title) || 
                       /flight/i.test(title) ||
                       /AM\s*\d+/.test(title) ||
                       /Aerolíneas/i.test(title);
      const isTravel = /viaje/i.test(title) || 
                       /travel/i.test(title) ||
                       /trip/i.test(title);
      
      return !isShow && !isFlight && !isTravel;
    })
    .map(e => ({
      start: new Date(new Date(e.start).getTime() - (settings.buffers?.prepMinutes || 15) * 60000),
      end: new Date(new Date(e.end).getTime() + (settings.buffers?.postMinutes || 10) * 60000)
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  
  function* freeSlots(min: number) {
    let c = new Date(dayStart);
    for (const o of occupied) {
      if (o.start > c) {
        const gap = minutesBetween(c, o.start);
        if (gap >= min) yield { start: c, end: o.start };
      }
      if (o.end > c) c = new Date(o.end);
    }
    if (dayEnd > c) {
      const gap = minutesBetween(c, dayEnd);
      if (gap >= min) yield { start: c, end: dayEnd };
    }
  }
  
  // Programar tareas en huecos disponibles
  for (const slot of freeSlots(settings.blocks?.minBlockMinutes || 10)) {
    let c = new Date(slot.start);
    while (c < slot.end && blocks.length < (settings.plan?.maxBlocks || 20)) {
      const remaining = minutesBetween(c, slot.end);
      
      // Buscar tarea apropiada para el tiempo disponible
      let next = null;
      let blockType = 'quickwin';
      
      if (remaining >= 90) {
        // Hueco grande: buscar tarea larga para trabajo profundo
        next = sorted.find(t => (t.estimateMinutes || 30) >= 90);
        if (next) blockType = 'focus';
      }
      
      if (!next && remaining >= 30) {
        // Hueco mediano: tarea de seguimiento
        next = sorted.find(t => (t.estimateMinutes || 30) >= 30 && (t.estimateMinutes || 30) <= remaining);
        if (next) blockType = 'followup';
      }
      
      if (!next) {
        // Hueco pequeño: tarea rápida
        next = sorted.find(t => (t.estimateMinutes || 30) <= Math.min(remaining, 30));
        if (next) blockType = 'quickwin';
      }
      
      if (!next) break;
      
      const est = Math.min(next.estimateMinutes || 30, remaining);
      const end = new Date(c.getTime() + est * 60000);
      
      // Verificar que no sea horario nocturno para trabajo profundo
      const hour = c.getHours();
      if (blockType === 'focus' && (hour < 8 || hour > 22)) {
        blockType = 'followup'; // Cambiar a seguimiento si es muy temprano/tarde
      }
      
      blocks.push({
        id: `${blockType}-${next.id}`,
        type: blockType as any,
        status: 'suggested',
        start: toISO(c),
        end: toISO(end),
        title: next.title,
        reason: `Programado automáticamente (${blockType})`,
        confidence: 0.6,
        relations: { taskId: next.id }
      });
      
      const idx = sorted.findIndex(t => t.id === next.id);
      if (idx >= 0) sorted.splice(idx, 1);
      c = end;
    }
  }
  
  return {
    date: context.dateISO.slice(0, 10),
    summary: {
      meetingsCount: (events || []).filter(e => {
        const title = e.title || '';
        const isShow = /^[A-Za-z\s]+ en [A-Za-z\s]+$/.test(title);
        const isFlight = /^[A-Z]{2}\s*\d+\s+[A-Z]{3}-[A-Z]{3}$/.test(title) || 
                         /vuelo/i.test(title) || 
                         /flight/i.test(title) ||
                         /AM\s*\d+/.test(title) ||
                         /Aerolíneas/i.test(title);
        const isTravel = /viaje/i.test(title) || 
                         /travel/i.test(title) ||
                         /trip/i.test(title);
        return !isShow && !isFlight && !isTravel;
      }).length,
      freeMinutes: 0,
      criticalCount: Math.min(3, (tasks || []).filter(t => t.priority === 'H').length),
      notes: 'Plan generado con heurística inteligente (sin IA)'
    },
    blocks: blocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    followUps: [],
    warnings: ['IA no disponible: usando planificador básico mejorado']
  };
}

function buildSystemPrompt(): string {
  return (
    'Eres un planificador ejecutivo inteligente para "Mi Día". Devuelve SOLO JSON válido según ResponseSchema.\n\n' +
    'REGLAS CRÍTICAS DE HORARIOS:\n' +
    '1. NUNCA programes trabajo profundo (focus) entre 10:00 PM y 8:00 AM\n' +
    '2. NUNCA programes preparación (prep) DESPUÉS de una reunión - solo ANTES\n' +
    '3. Las reuniones son bloques "meeting" con status "fixed"\n' +
    '4. La preparación debe ser ANTES de la reunión, no después\n' +
    '5. Usa buffers: prep antes de reuniones. Evita crear bloques "post" por defecto; solo sugiérelos cuando haya acciones explícitas de salida (decisiones, tareas críticas) y exista tiempo.\n' +
    '6. Respeta horarios de trabajo y no inventes datos\n\n' +
    'LÓGICA DE TRABAJO PROFUNDO:\n' +
    '- focus: SOLO para bloques de 90+ minutos consecutivos\n' +
    '- NUNCA dividas trabajo profundo en múltiples bloques de 30min\n' +
    '- Prioriza tareas por: urgencia (vencimiento) + importancia (prioridad H) + impacto (tags ingresos/cliente)\n' +
    '- Si no hay 90+ min consecutivos, usa quickwin o followup en su lugar\n\n' +
    'CLASIFICACIÓN DE EVENTOS:\n' +
    '- "Artista en Ciudad" = evento/show, NO reunión\n' +
    '- "AM 029 EZE-CDMEX" = vuelo/viaje, NO reunión\n' +
    '- "Vuelo", "Flight", "Viaje" = viaje, NO reunión\n' +
    '- "Reunión de X" = meeting real\n' +
    '- "Llamada con Y" = meeting real\n' +
    '- Shows/eventos/vuelos = tipo "event" (no bloquean tiempo)\n\n' +
    'TIPOS DE BLOQUES:\n' +
    '- meeting: Reuniones fijas del calendario\n' +
    '- event: Shows/eventos (no bloquean tiempo)\n' +
    '- prep: Preparación ANTES de reuniones (5-15 min antes)\n' +
    '- post: Seguimiento DESPUÉS de reuniones (5-10 min) SOLO si hay acciones claras que realizar. No lo generes para todas las reuniones.\n' +
    '- focus: Trabajo profundo (SOLO 90+ min consecutivos)\n' +
    '- quickwin: Tareas rápidas (5-30 min)\n' +
    '- followup: Seguimientos y llamadas (30-60 min)\n\n' +
    'PRIORIZACIÓN INTELIGENTE:\n' +
    '1. Tareas vencidas HOY (dueDate <= hoy) = máxima prioridad\n' +
    '2. Tareas vencidas MAÑANA = alta prioridad\n' +
    '3. Tareas con prioridad H = alta prioridad\n' +
    '4. Tareas con tags "ingresos", "cliente" = alta prioridad\n' +
    '5. Tareas cortas (≤30min) = quickwin\n' +
    '6. Tareas largas (≥90min) = focus (solo si hay tiempo consecutivo)\n\n' +
    'ResponseSchema: {"date":"YYYY-MM-DD","summary":{"meetingsCount":0,"freeMinutes":0,"criticalCount":0,"notes":"string"},"blocks":[{"id":"string","type":"meeting|event|prep|post|focus|followup|call|quickwin","status":"suggested|fixed|accepted","start":"ISO-8601","end":"ISO-8601","title":"string","reason":"string","confidence":0.0,"relations":{"taskId":"string|null","meetingId":"string|null","personIds":["string"],"companyId":"string|null","docId":"string|null"}}],"followUps":[{"personId":"string","companyId":"string|null","channel":"email|call","subject":"string","reason":"string","urgency":1,"suggestedWindow":{"start":"ISO-8601","end":"ISO-8601"},"draft":{"subject":"string","body":"string"}}],"warnings":["string"]}'
  );
}

function buildUserPrompt(context: ContextPack): string {
  const { dateISO, settings, events, tasks, emailThreads, docs, peopleIndex } = context;
  return JSON.stringify({ date: dateISO, settings, events, tasks, emailThreads, docs, peopleIndex });
}

export async function generatePlan(context: ContextPack): Promise<{ plan: DailyPlanResponse; warnings: string[] }>{
  // 0) Try external optimizer if enabled
  const optimized = await optimizeViaMicroservice(context);
  if (optimized) return { plan: optimized, warnings: optimized.warnings || [] };

  // 1) Try Claude if available
  if (!process.env.CLAUDE_API_KEY) {
    const fallback = naivePlan(context);
    return { plan: fallback, warnings: fallback.warnings || [] };
  }
  const system = buildSystemPrompt();
  const user = buildUserPrompt(context);
  const ai = await callClaude({ system, user, maxTokens: 4000, temperature: 0.2 });
  if (!ai.ok || !ai.text) {
    const fallback = naivePlan(context);
    const warn = [`IA error${ai.status? ' '+ai.status:''}: ${ai.error || 'unknown'}`];
    fallback.warnings = [...(fallback.warnings||[]), ...warn];
    return { plan: fallback, warnings: fallback.warnings || warn };
  }
  const json = safeParseJSON<DailyPlanResponse>(ai.text);
  if (!json || !Array.isArray(json.blocks)) {
    const fallback = naivePlan(context);
    fallback.warnings = [...(fallback.warnings||[]), 'parse_error'];
    return { plan: fallback, warnings: fallback.warnings };
  }
  return { plan: json, warnings: json.warnings || [] };
}
