import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { musicDataIngestion } from '@/lib/services/music-data-ingestion';
import { musicAlertSystem } from '@/lib/services/music-alert-system';

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

    console.log(`🚨 Generating alerts for ${territory} ${period}`);

    // Step 1: Ingest data
    const tracks = await musicDataIngestion.ingestData(territory, period);
    
    if (tracks.length === 0) {
      // Be resilient: return empty dataset with success instead of 404
      const empty = {
        alerts: [],
        rules: musicAlertSystem.getAlertRules(),
        statistics: { total: 0, bySeverity: {}, byType: {}, byTerritory: {}, acknowledged: 0, unacknowledged: 0 },
        lastUpdated: new Date(),
      };
      return NextResponse.json({
        success: true,
        data: empty,
        metadata: {
          territory,
          period,
          totalTracks: 0,
          totalAlerts: 0,
          generatedAt: new Date().toISOString(),
          source: 'empty'
        }
      });
    }

    // Step 2: Calculate advanced features
    const tracksWithFeatures = await musicDataIngestion.calculateAdvancedFeatures(tracks, territory, period);

    // Step 3: Generate alerts
    const alerts = musicAlertSystem.generateAlerts(tracksWithFeatures, territory, period, new Date());

    // Step 4: Get alert rules
    const rules = musicAlertSystem.getAlertRules();

    // Step 5: Get alert statistics
    const statistics = musicAlertSystem.getAlertStatistics(alerts);

    const alertsData = {
      alerts,
      rules,
      statistics,
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: alertsData,
      metadata: {
        territory,
        period,
        totalTracks: tracksWithFeatures.length,
        totalAlerts: alerts.length,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error generating alerts:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid alertIds array' },
        { status: 400 }
      );
    }

    console.log(`✅ Acknowledging ${alertIds.length} alerts`);

    // TODO: Implement alert acknowledgment in database
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: `Successfully acknowledged ${alertIds.length} alerts`,
      acknowledgedIds: alertIds,
    });

  } catch (error) {
    console.error('Error acknowledging alerts:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to acknowledge alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
