import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsData } from '@/lib/services/spotify-charts-scraper';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const period = searchParams.get('period') as 'daily' | 'weekly';

    if (!territory || !period) {
      return NextResponse.json(
        { error: 'Missing territory or period parameter' },
        { status: 400 }
      );
    }

    console.log(`🎵 Fetching real Spotify charts data for ${territory} ${period}`);

    try {
      // Try to get real data from Spotify API
      const realData = await getRealSpotifyChartsData(territory, period);
      
      if (realData.tracks.length > 0) {
        console.log(`✅ Got ${realData.tracks.length} real tracks from Spotify API`);
        
        return NextResponse.json({
          success: true,
          data: realData.tracks,
          territory: realData.territory,
          period: realData.period,
          lastUpdated: realData.date,
          source: 'spotify-api',
          totalTracks: realData.totalTracks
        });
      } else {
        throw new Error('No tracks returned from Spotify API');
      }
    } catch (spotifyError) {
      console.error('Spotify API error:', spotifyError);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch real Spotify data',
        details: spotifyError instanceof Error ? spotifyError.message : 'Unknown error',
        suggestion: 'Please configure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error in real Spotify charts API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
