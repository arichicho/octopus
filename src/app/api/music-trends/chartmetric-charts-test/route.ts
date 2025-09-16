import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getChartmetricClient } from '@/lib/services/chartmetric-client';
import { chartmetricChartsService } from '@/lib/services/chartmetric-charts';

export async function GET(request: NextRequest) {
  try {
    await verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'test';
    const territory = searchParams.get('territory') || 'argentina';
    const period = searchParams.get('period') || 'weekly';

    console.log(`🧪 Chartmetric Charts Test - Action: ${action}, Territory: ${territory}, Period: ${period}`);

    const client = getChartmetricClient();

    switch (action) {
      case 'test':
        // Test basic connection
        const connectionTest = await chartmetricChartsService.testChartsConnection();
        return NextResponse.json({
          success: true,
          action: 'test',
          result: connectionTest
        });

      case 'territories':
        // Get available territories
        try {
          const territories = await client.getChartTerritories();
          return NextResponse.json({
            success: true,
            action: 'territories',
            data: territories
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            action: 'territories',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      case 'charts':
        // Get Spotify charts for specific territory
        try {
          const charts = await client.getSpotifyCharts(territory, period as 'daily' | 'weekly', 20);
          return NextResponse.json({
            success: true,
            action: 'charts',
            territory,
            period,
            data: charts
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            action: 'charts',
            territory,
            period,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      case 'full-charts':
        // Get full charts data using our service
        try {
          const fullCharts = await chartmetricChartsService.getRealSpotifyChartsData(
            territory as 'argentina' | 'mexico' | 'spain' | 'global',
            period as 'daily' | 'weekly'
          );
          return NextResponse.json({
            success: true,
            action: 'full-charts',
            territory,
            period,
            data: fullCharts.tracks.slice(0, 10), // Only first 10 for testing
            totalTracks: fullCharts.totalTracks
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            action: 'full-charts',
            territory,
            period,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      case 'test-endpoints':
        // Test all possible Chartmetric endpoints
        try {
          const endpointResults = await client.testEndpoints();
          return NextResponse.json({
            success: true,
            action: 'test-endpoints',
            results: endpointResults
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            action: 'test-endpoints',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: test, territories, charts, or full-charts'
        });
    }

  } catch (error) {
    console.error('Error in Chartmetric Charts Test API:', error);
    return NextResponse.json(
      { error: 'Failed to test Chartmetric charts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
