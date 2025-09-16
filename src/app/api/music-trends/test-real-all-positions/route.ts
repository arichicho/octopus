import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataAllPositions } from '@/lib/services/real-spotifycharts-scraper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Testing REAL SpotifyCharts data for ALL 200 positions - ${territory} ${period}`);

    const result = await getRealSpotifyChartsDataAllPositions(territory, period);

    return NextResponse.json({
      success: true,
      data: result.tracks.slice(0, 20), // Only first 20 tracks for testing
      territory: result.territory,
      period: result.period,
      totalTracks: result.totalTracks,
      source: 'real-spotifycharts-scraper'
    });

  } catch (error) {
    console.error('Error in test real all positions API:', error);
    return NextResponse.json(
      { error: 'Failed to get real data for all positions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
