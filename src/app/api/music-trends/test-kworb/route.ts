import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromKworb } from '@/lib/services/kworb-spotifycharts-scraper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Testing Kworb scraper for REAL SpotifyCharts data - ${territory} ${period}`);

    const result = await getRealSpotifyChartsDataFromKworb(territory, period);

    return NextResponse.json({
      success: true,
      data: result.tracks.slice(0, 20), // Only first 20 tracks for testing
      territory: result.territory,
      period: result.period,
      totalTracks: result.totalTracks,
      source: 'kworb-spotifycharts-scraper',
      timestamp: result.date
    });

  } catch (error) {
    console.error('Error in test Kworb API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get data from Kworb', details: errorMessage },
      { status: 500 }
    );
  }
}
