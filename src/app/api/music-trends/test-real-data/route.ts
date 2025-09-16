import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsData } from '@/lib/services/spotify-charts-scraper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Testing real data for ${territory} ${period}`);

    const result = await getRealSpotifyChartsData(territory, period);

    return NextResponse.json({
      success: true,
      data: result.tracks.slice(0, 10), // Only first 10 tracks
      territory: result.territory,
      period: result.period,
      totalTracks: result.totalTracks,
      source: 'test-real-data'
    });

  } catch (error) {
    console.error('Error in test real data API:', error);
    return NextResponse.json(
      { error: 'Failed to get real data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
