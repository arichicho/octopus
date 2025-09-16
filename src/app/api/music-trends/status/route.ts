import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { testChartmetricConnection } from '@/lib/services/chartmetric-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const period = searchParams.get('period') as 'daily' | 'weekly';

    if (!territory || !period) {
      return NextResponse.json(
        { error: 'Missing territory or period parameter' },
        { status: 400 }
      );
    }

    if (!['argentina', 'spanish', 'mexico', 'global'].includes(territory)) {
      return NextResponse.json(
        { error: 'Invalid territory' },
        { status: 400 }
      );
    }

    if (!['daily', 'weekly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period' },
        { status: 400 }
      );
    }

    console.log(`📊 Generating system status for ${territory} ${period}`);

    // Step 1: Check services
    const services = {
      kworb: {
        status: 'ok' as const,
        lastCheck: new Date(),
        responseTime: Math.floor(Math.random() * 200) + 50, // Mock response time
      },
      chartmetric: {
        status: 'ok' as const,
        lastCheck: new Date(),
        responseTime: Math.floor(Math.random() * 500) + 100, // Mock response time
        tokenValid: true,
      },
      database: {
        status: 'ok' as const,
        lastCheck: new Date(),
        responseTime: Math.floor(Math.random() * 100) + 20, // Mock response time
        connectionCount: Math.floor(Math.random() * 10) + 5,
      },
    };

    // Test Chartmetric connection
    try {
      const chartmetricTest = await testChartmetricConnection();
      services.chartmetric.status = chartmetricTest.success ? 'ok' : 'error';
      services.chartmetric.tokenValid = chartmetricTest.success;
    } catch (error) {
      services.chartmetric.status = 'error';
      services.chartmetric.tokenValid = false;
    }

    // Step 2: Get system metrics (mock for now)
    const system = {
      uptime: Math.floor(Math.random() * 86400 * 30) + 86400, // 1-30 days
      memoryUsage: Math.floor(Math.random() * 1000000000) + 500000000, // 500MB-1.5GB
      cpuUsage: Math.random() * 100, // 0-100%
      lastRestart: new Date(Date.now() - Math.random() * 86400 * 7 * 1000), // Last 7 days
    };

    // Step 3: Check data quality for all territories (simplified)
    const territories: any = {};
    const allTerritories: Territory[] = ['argentina', 'spanish', 'mexico', 'global'];
    const allPeriods: ('daily' | 'weekly')[] = ['daily', 'weekly'];

    for (const terr of allTerritories) {
      territories[terr] = {};
      for (const per of allPeriods) {
        // Mock data quality check for now
        territories[terr][per] = {
          expected_tracks: 200,
          actual_tracks: 200,
          completeness_pct: 100,
          last_update: new Date(),
          is_stale: false,
          staleness_hours: 0,
          missing_track_ids: 0,
          fuzzy_matches: 0,
          data_anomalies: [],
          spotify_charts_not_updated: false,
          incomplete_data: false,
          data_quality_issues: false,
        };
      }
    }

    const statusData = {
      territories,
      services,
      system,
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: statusData,
      metadata: {
        territory,
        period,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error generating system status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate system status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
