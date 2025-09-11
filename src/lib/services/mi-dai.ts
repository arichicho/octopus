import type { ContextPack, DailyPlanResponse, DailyPlannerSettings, MeetingPrep } from '@/types/daily-plan';
import { auth } from '@/lib/firebase/config';

async function authHeader() {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class MiDAIService {
  static async getContext(dateISO?: string) {
    const params = dateISO ? `?date=${encodeURIComponent(dateISO)}` : '';
    const res = await fetch(`/api/mi-dai/context${params}`, { headers: await authHeader() });
    if (!res.ok) throw new Error('No se pudo obtener el contexto de Mi dAI');
    return res.json();
  }

  static async generatePlan(context: Omit<ContextPack, 'settings'> & { settings: DailyPlannerSettings }): Promise<DailyPlanResponse> {
    const res = await fetch('/api/mi-dai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(context),
    });
    if (!res.ok) {
      throw new Error('No se pudo generar el plan de Mi dAI');
    }
    return res.json();
  }

  static async getInsights(context: ContextPack) {
    const res = await fetch('/api/mi-dai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(context),
    });
    if (!res.ok) throw new Error('No se pudieron generar insights');
    return res.json();
  }

  static async getMeetingPrep(payload: { event: any; context: any }): Promise<MeetingPrep> {
    const res = await fetch('/api/mi-dai/prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('No se pudo generar el prep de reunión');
    return res.json();
  }

  static async runOrchestrator(dateISO?: string) {
    const params = dateISO ? `?date=${encodeURIComponent(dateISO)}` : '';
    const res = await fetch(`/api/mi-dai/run${params}`, { headers: await authHeader() });
    if (!res.ok) throw new Error('No se pudo ejecutar el orquestador');
    return res.json();
  }
}
