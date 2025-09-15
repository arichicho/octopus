import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { Territory } from '@/types/music';
import { getMusicInsightsOrchestrator } from '@/lib/services/music-insights-orchestrator';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const period = searchParams.get('period') as 'daily' | 'weekly';
    const forceRefresh = searchParams.get('force') === 'true';

    if (!territory || !period) {
      return NextResponse.json(
        { error: 'Missing territory or period parameter' },
        { status: 400 }
      );
    }

    const orchestrator = getMusicInsightsOrchestrator();

    let result;
    if (forceRefresh) {
      console.log(`🔄 Force refreshing insights for ${territory} ${period}`);
      result = await orchestrator.forceRefreshInsights(territory, period);
    } else {
      result = await orchestrator.getInsights(territory, period);
    }

    return NextResponse.json({
      success: true,
      data: result.insights,
      metadata: {
        fromCache: result.fromCache,
        generatedAt: result.generatedAt,
        nextUpdate: result.nextUpdate,
        territory,
        period
      }
    });

  } catch (error) {
    console.error('Error in insights API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, territory, period } = body;

    const orchestrator = getMusicInsightsOrchestrator();

    if (action === 'status') {
      // Get insights status across all territories
      const status = await orchestrator.getInsightsStatus();
      return NextResponse.json({
        success: true,
        data: status
      });
    }

    if (action === 'refresh' && territory && period) {
      // Force refresh specific insights
      const result = await orchestrator.forceRefreshInsights(territory, period);
      return NextResponse.json({
        success: true,
        data: result.insights,
        metadata: {
          fromCache: result.fromCache,
          generatedAt: result.generatedAt,
          nextUpdate: result.nextUpdate
        }
      });
    }

    if (action === 'schedule') {
      // Schedule automatic updates
      await orchestrator.scheduleUpdates();
      return NextResponse.json({
        success: true,
        message: 'Updates scheduled successfully'
      });
    }

    if (action === 'cleanup') {
      // Clean up old insights
      await orchestrator.cleanup();
      return NextResponse.json({
        success: true,
        message: 'Cleanup completed successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in insights POST API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}