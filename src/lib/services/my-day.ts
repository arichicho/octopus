import type { ContextPack, DailyPlanResponse, DailyPlannerSettings } from '@/types/daily-plan';
import { auth } from '@/lib/firebase/config';

async function authHeader() {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class MyDayService {
  static async getContext(dateISO?: string) {
    const params = dateISO ? `?date=${encodeURIComponent(dateISO)}` : '';
    const res = await fetch(`/api/my-day/context${params}`, { headers: await authHeader() });
    if (!res.ok) throw new Error('No se pudo obtener el contexto');
    return res.json();
  }

  static async generatePlan(context: Omit<ContextPack, 'settings'> & { settings: DailyPlannerSettings }): Promise<DailyPlanResponse> {
    const res = await fetch('/api/my-day/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(context),
    });
    if (!res.ok) {
      throw new Error('No se pudo generar el plan');
    }
    return res.json();
  }

  static async getMeetingPrep(payload: { event: any; context: any }) {
    const res = await fetch('/api/my-day/prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('No se pudo generar el prep de reunión');
    return res.json();
  }

  // Plan storage methods
  static async savePlan(plan: DailyPlanResponse, context?: any) {
    const res = await fetch('/api/my-day/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ action: 'save', plan, context }),
    });
    if (!res.ok) throw new Error('No se pudo guardar el plan');
    return res.json();
  }

  static async getPlanForDate(date: string) {
    const res = await fetch(`/api/my-day/plans/${date}`, { headers: await authHeader() });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('No se pudo obtener el plan');
    }
    return res.json();
  }

  static async getAvailableDates() {
    const res = await fetch('/api/my-day/plans?action=list', { headers: await authHeader() });
    if (!res.ok) throw new Error('No se pudo obtener las fechas disponibles');
    const data = await res.json();
    return data.dates;
  }

  static async getPlanStats() {
    const res = await fetch('/api/my-day/plans?action=stats', { headers: await authHeader() });
    if (!res.ok) throw new Error('No se pudo obtener las estadísticas');
    return res.json();
  }

  static async getRecentPlans(days: number = 7) {
    const res = await fetch(`/api/my-day/plans?action=recent&days=${days}`, { headers: await authHeader() });
    if (!res.ok) throw new Error('No se pudo obtener los planes recientes');
    const data = await res.json();
    return data.plans;
  }

  static async updatePlanCompletion(planId: string, completedBlocks: string[]) {
    const res = await fetch('/api/my-day/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ action: 'update-completion', planId, completedBlocks }),
    });
    if (!res.ok) throw new Error('No se pudo actualizar el plan');
    return res.json();
  }

  static async deletePlan(planId: string) {
    const res = await fetch('/api/my-day/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ action: 'delete', planId }),
    });
    if (!res.ok) throw new Error('No se pudo eliminar el plan');
    return res.json();
  }

  static async clearAllPlans() {
    const res = await fetch('/api/my-day/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ action: 'clear' }),
    });
    if (!res.ok) throw new Error('No se pudo limpiar los planes');
    return res.json();
  }
}
