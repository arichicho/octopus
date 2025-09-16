import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getLiveSpotifyChartsData } from '@/lib/services/live-spotifycharts-scraper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Testing LIVE scraper for REAL SpotifyCharts data - ${territory} ${period}`);

    const result = await getLiveSpotifyChartsData(territory, period);

    return NextResponse.json({
      success: true,
      data: result.tracks.slice(0, 20), // Only first 20 tracks for testing
      territory: result.territory,
      period: result.period,
      totalTracks: result.totalTracks,
      source: 'live-spotifycharts-scraper',
      timestamp: result.date
    });

  } catch (error) {
    console.error('Error in test live scraper:', error);
    return NextResponse.json(
      { error: 'Failed to get LIVE data from SpotifyCharts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
