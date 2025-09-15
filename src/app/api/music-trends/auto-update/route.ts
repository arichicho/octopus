import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { Territory } from '@/types/music';

// Auto-update system for music trends
async function triggerAutoUpdate(territory: Territory, period: 'daily' | 'weekly') {
  try {
    console.log(`🔄 Triggering auto-update for ${territory} ${period}`);
    
    // Fetch latest chart data
    const chartResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/music-trends/spotify-charts?territory=${territory}&period=${period}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        'Content-Type': 'application/json'
      }
    });

    if (!chartResponse.ok) {
      throw new Error(`Failed to fetch chart data: ${chartResponse.status}`);
    }

    const chartData = await chartResponse.json();
    
    if (!chartData.success) {
      throw new Error(`Chart data fetch failed: ${chartData.error}`);
    }

    // Enrich with Chartmetric data
    const enrichedResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/music-trends/chartmetric`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tracks: chartData.data
      })
    });

    let enrichedData = chartData.data;
    if (enrichedResponse.ok) {
      const enrichedResult = await enrichedResponse.json();
      if (enrichedResult.success) {
        enrichedData = enrichedResult.data;
      }
    }

    // Generate insights with Claude
    const insightsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/music-trends/insights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chartData: enrichedData,
        territory,
        period
      })
    });

    let insights = null;
    if (insightsResponse.ok) {
      const insightsResult = await insightsResponse.json();
      if (insightsResult.success) {
        insights = insightsResult.data;
      }
    }

    // Store in Firestore
    await storeMusicData(territory, period, enrichedData, insights);

    return {
      success: true,
      territory,
      period,
      tracksCount: enrichedData.length,
      insightsGenerated: !!insights,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`Error in auto-update for ${territory} ${period}:`, error);
    return {
      success: false,
      territory,
      period,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

async function storeMusicData(territory: Territory, period: 'daily' | 'weekly', chartData: any[], insights: any) {
  try {
    // TODO: Implement Firestore storage
    // This would store the data in collections like:
    // - music_charts/{territory}/{period}/{date}
    // - music_insights/{territory}/{period}/{date}
    // - music_tracks/{trackId}
    // - music_artists/{artistId}
    
    console.log(`📊 Storing music data for ${territory} ${period}:`, {
      tracksCount: chartData.length,
      hasInsights: !!insights
    });
    
    // Placeholder for Firestore implementation
    return true;
  } catch (error) {
    console.error('Error storing music data:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const period = searchParams.get('period') as 'daily' | 'weekly';
    const all = searchParams.get('all') === 'true';

    if (all) {
      // Update all territories and periods
      const territories: Territory[] = ['argentina', 'spain', 'mexico', 'global'];
      const periods: ('daily' | 'weekly')[] = ['daily', 'weekly'];
      
      const results = [];
      for (const t of territories) {
        for (const p of periods) {
          const result = await triggerAutoUpdate(t, p);
          results.push(result);
        }
      }
      
      return NextResponse.json({
        success: true,
        results,
        timestamp: new Date()
      });
    }

    if (!territory || !period) {
      return NextResponse.json(
        { error: 'Missing territory or period parameter' },
        { status: 400 }
      );
    }

    const result = await triggerAutoUpdate(territory, period);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in auto-update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { territory, period, force } = body;

    if (!territory || !period) {
      return NextResponse.json(
        { error: 'Missing territory or period parameter' },
        { status: 400 }
      );
    }

    const result = await triggerAutoUpdate(territory, period);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in auto-update POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
