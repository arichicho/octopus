import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { musicDataIngestion } from '@/lib/services/music-data-ingestion';

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

    console.log(`📊 Getting charts data for ${territory} ${period}`);

    // Get real data from music data ingestion
    const tracks = await musicDataIngestion.ingestData(territory, period);
    
    if (tracks.length === 0) {
      return NextResponse.json(
        { error: 'No data available for the specified territory and period' },
        { status: 404 }
      );
    }

    // Convert to the format expected by the frontend
    const chartData = tracks.map(track => ({
      id: track.track_id || `track-${track.position}`,
      title: track.track_name || 'Unknown Title',
      artist: track.artists || 'Unknown Artist',
      position: track.position,
      previousPosition: track.previous_position,
      streams: track.streams,
      previousStreams: track.previous_streams,
      peakPosition: track.peak_position,
      weeksOnChart: track.weeks_on_chart,
      isNewEntry: track.is_debut,
      isReEntry: track.is_reentry,
      isNewPeak: track.is_new_peak,
      territory: track.territory,
      period: track.period,
      date: track.date
    }));

    return NextResponse.json({
      success: true,
      data: chartData,
      metadata: {
        territory,
        period,
        totalTracks: tracks.length,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error getting charts data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get charts data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
