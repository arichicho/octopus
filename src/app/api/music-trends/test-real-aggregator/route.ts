import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromAggregator } from '@/lib/services/real-data-aggregator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Testing real data aggregator for REAL SpotifyCharts data - ${territory} ${period}`);

    const result = await getRealSpotifyChartsDataFromAggregator(territory, period);

    return NextResponse.json({
      success: true,
      data: result.tracks.slice(0, 20), // Only first 20 tracks for testing
      territory: result.territory,
      period: result.period,
      totalTracks: result.totalTracks,
      source: 'real-data-aggregator'
    });

  } catch (error) {
    console.error('Error in test real aggregator:', error);
    return NextResponse.json(
      { error: 'Failed to get data from real aggregator', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
