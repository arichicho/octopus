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
      id: track.id,
      title: track.title,
      artist: track.artist,
      position: track.position,
      previousPosition: track.previousPosition,
      streams: track.streams,
      previousStreams: track.previousStreams,
      peakPosition: track.peakPosition,
      weeksOnChart: track.weeksOnChart,
      isNewEntry: track.isNewEntry,
      isReEntry: track.isReEntry,
      isNewPeak: track.isNewPeak,
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
