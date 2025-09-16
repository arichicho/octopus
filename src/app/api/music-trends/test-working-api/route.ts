import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromWorkingAPI } from '@/lib/services/working-charts-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Testing working API for REAL SpotifyCharts data - ${territory} ${period}`);

    const result = await getRealSpotifyChartsDataFromWorkingAPI(territory, period);

    return NextResponse.json({
      success: true,
      data: result.tracks.slice(0, 20), // Only first 20 tracks for testing
      territory: result.territory,
      period: result.period,
      totalTracks: result.totalTracks,
      source: 'working-charts-api',
      timestamp: result.date
    });

  } catch (error) {
    console.error('Error in test working API:', error);
    return NextResponse.json(
      { error: 'Failed to get data from working API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
