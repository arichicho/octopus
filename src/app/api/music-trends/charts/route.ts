import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromKworb } from '@/lib/services/kworb-spotifycharts-scraper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const period = searchParams.get('period') as 'daily' | 'weekly';

    if (!territory || !period) {
      return NextResponse.json(
        { success: false, error: 'Missing territory or period parameter' },
        { status: 400 }
      );
    }

    if (!['argentina', 'spanish', 'mexico', 'global'].includes(territory)) {
      return NextResponse.json(
        { success: false, error: 'Invalid territory' },
        { status: 400 }
      );
    }

    if (!['daily', 'weekly'].includes(period)) {
      return NextResponse.json(
        { success: false, error: 'Invalid period' },
        { status: 400 }
      );
    }

    console.log(`📊 Getting REAL charts data from Kworb for ${territory} ${period}`);

    // Get real data directly from Kworb scraper
    const kworbData = await getRealSpotifyChartsDataFromKworb(territory, period);
    const tracks = kworbData.tracks;

    if (tracks.length === 0) {
      console.warn('No data available from Kworb, returning empty array');
      return NextResponse.json({
        success: true,
        data: [],
        metadata: {
          territory,
          period,
          totalTracks: 0,
          generatedAt: new Date().toISOString(),
          source: 'kworb'
        }
      });
    }

    // The tracks from Kworb are already in the correct format
    const chartData = tracks.map((track, index) => ({
      id: track.spotifyId || `track-${track.position}`,
      title: track.title || 'Unknown Title',
      artist: track.artist || 'Unknown Artist',
      position: track.position || (index + 1),
      previousPosition: track.previousPosition,
      streams: track.streams || 0,
      previousStreams: track.previousStreams,
      peakPosition: track.peakPosition || track.position,
      weeksOnChart: track.weeksOnChart || 1,
      isNewEntry: track.isNewEntry || false,
      isReEntry: track.isReEntry || false,
      isNewPeak: track.isNewPeak || false,
      territory: track.territory || territory,
      period: track.period || period,
      date: track.date || new Date()
    }));

    console.log(`✅ Successfully returning ${chartData.length} tracks from Kworb`);

    return NextResponse.json({
      success: true,
      data: chartData,
      metadata: {
        territory,
        period,
        totalTracks: chartData.length,
        generatedAt: new Date().toISOString(),
        source: 'kworb'
      }
    });

  } catch (error) {
    console.error('Error getting charts data from Kworb:', error);

    // Return empty data instead of error to prevent frontend crash
    return NextResponse.json({
      success: true,
      data: [],
      metadata: {
        territory: 'global',
        period: 'weekly',
        totalTracks: 0,
        generatedAt: new Date().toISOString(),
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}
