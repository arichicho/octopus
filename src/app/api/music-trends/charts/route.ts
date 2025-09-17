import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromKworb } from '@/lib/services/kworb-spotifycharts-scraper';
import { MusicTrendsStorage } from '@/lib/services/music-trends-storage';

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

    console.log(`📊 Getting charts data for ${territory} ${period} (prefer storage)`);
    // Try Firestore storage first
    const stored = await MusicTrendsStorage.getLatestChartData(territory, period);
    const tracks = stored?.tracks && stored.tracks.length > 0
      ? stored.tracks as any[]
      : (await getRealSpotifyChartsDataFromKworb(territory, period)).tracks as any[];

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
          source: stored ? 'storage' : 'kworb'
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

    console.log(`✅ Successfully returning ${chartData.length} tracks from ${stored ? 'storage' : 'kworb'}`);

    return NextResponse.json({
      success: true,
      data: chartData,
      metadata: {
        territory,
        period,
        totalTracks: chartData.length,
        generatedAt: new Date().toISOString(),
        source: stored ? 'storage' : 'kworb'
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
