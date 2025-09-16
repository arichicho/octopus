import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromThirdParty } from '@/lib/services/third-party-charts-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Testing third-party API for REAL SpotifyCharts data - ${territory} ${period}`);

    const result = await getRealSpotifyChartsDataFromThirdParty(territory, period);

    return NextResponse.json({
      success: true,
      data: result.tracks.slice(0, 20), // Only first 20 tracks for testing
      territory: result.territory,
      period: result.period,
      totalTracks: result.totalTracks,
      source: 'third-party-api'
    });

  } catch (error) {
    console.error('Error in test third-party API:', error);
    return NextResponse.json(
      { error: 'Failed to get data from third-party API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
