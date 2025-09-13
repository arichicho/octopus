import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { PlanStorageService } from '@/lib/services/plan-storage';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const userId = auth.uid;

    switch (action) {
      case 'list':
        const availableDates = PlanStorageService.getAvailableDates(userId);
        return NextResponse.json({ dates: availableDates });

      case 'stats':
        const stats = PlanStorageService.getPlanStats(userId);
        return NextResponse.json(stats);

      case 'recent':
        const days = parseInt(searchParams.get('days') || '7');
        const recentPlans = PlanStorageService.getRecentPlans(userId, days);
        return NextResponse.json({ plans: recentPlans });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Plans API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, plan, context, planId, completedBlocks } = body;
    const userId = auth.uid;

    switch (action) {
      case 'save':
        if (!plan) {
          return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
        }
        PlanStorageService.savePlan(plan, userId, context);
        return NextResponse.json({ success: true });

      case 'update-completion':
        if (!planId || !completedBlocks) {
          return NextResponse.json({ error: 'Plan ID and completed blocks are required' }, { status: 400 });
        }
        PlanStorageService.updatePlanCompletion(planId, userId, completedBlocks);
        return NextResponse.json({ success: true });

      case 'delete':
        if (!planId) {
          return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }
        PlanStorageService.deletePlan(planId, userId);
        return NextResponse.json({ success: true });

      case 'clear':
        PlanStorageService.clearAllPlans(userId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Plans API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


