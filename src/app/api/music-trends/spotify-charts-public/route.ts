import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsData } from '@/lib/services/spotify-charts-scraper';

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

    console.log(`🎵 Fetching real Spotify data for ${territory} ${period}`);
    
    // Use the real Spotify API service
    const realData = await getRealSpotifyChartsData(territory, period);
    
    const result = {
      success: true,
      data: realData.tracks,
      territory: realData.territory,
      period: realData.period,
      source: 'kworb-scraper',
      lastUpdated: realData.date
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching real Spotify data:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch real data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
