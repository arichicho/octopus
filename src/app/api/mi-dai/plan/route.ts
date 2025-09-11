import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { DEFAULT_MI_DAI_SETTINGS } from '@/lib/config/mi-dai';
import type { ContextPack, DailyPlannerSettings, ContextTask, ContextEvent } from '@/types/daily-plan';
import { generatePlan as generatePlanService } from '@/lib/server/ai/plan-service';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Partial<ContextPack> & { dateISO?: string };
    const dateISO = body?.dateISO || new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
    const settings: DailyPlannerSettings = (body?.settings as any) || DEFAULT_MI_DAI_SETTINGS;
    const events: ContextEvent[] = (body?.events as any) || [];
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

    const context: ContextPack = { dateISO, settings, events, tasks, emailThreads, docs, peopleIndex };
    const { plan } = await generatePlanService(context);
    return NextResponse.json(plan);
  } catch (e) {
    console.error('Mi dAI plan error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

