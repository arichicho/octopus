import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromKworb } from '@/lib/services/kworb-spotifycharts-scraper';

interface SummaryData {
  kpis: {
    debuts: number;
    reentries: number;
    turnover_rate: number;
    top10_share: number;
    top50_share: number;
    top200_share: number;
    track_of_the_week: {
      track_name: string;
      artists: string;
      position: number;
      delta_streams: number;
    };
  };
  streams: {
    current: {
      top10: number;
      top50: number;
      top200: number;
    };
    growth_pct: {
      vs_previous: {
        top10: number;
        top50: number;
        top200: number;
      };
    };
  };
  entries: {
    debut_count: number;
    reentry_count: number;
    exit_count: number;
    turnover_new_pct: number;
    turnover_reentry_pct: number;
    turnover_exit_pct: number;
  };
  movers: {
    volatility_index: number;
  };
  lastUpdated: Date;
}

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

    console.log(`📊 Generating summary data for ${territory} ${period}`);

    // Get current charts data
    const currentData = await getRealSpotifyChartsDataFromKworb(territory, period);
    const tracks = currentData.tracks;

    if (tracks.length === 0) {
      console.warn('No tracks data available for summary');
      return NextResponse.json({
        success: true,
        data: generateEmptySummary(),
        metadata: {
          territory,
          period,
          generatedAt: new Date().toISOString(),
          source: 'empty'
        }
      });
    }

    // Calculate summary statistics
    const summaryData = calculateSummaryFromTracks(tracks, territory, period);

    console.log(`✅ Generated summary with ${tracks.length} tracks`);

    return NextResponse.json({
      success: true,
      data: summaryData,
      metadata: {
        territory,
        period,
        totalTracks: tracks.length,
        generatedAt: new Date().toISOString(),
        source: 'kworb'
      }
    });

  } catch (error) {
    console.error('Error generating summary data:', error);

    return NextResponse.json({
      success: true,
      data: generateEmptySummary(),
      metadata: {
        territory: 'global',
        period: 'weekly',
        generatedAt: new Date().toISOString(),
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

function calculateSummaryFromTracks(tracks: any[], territory: Territory, period: 'daily' | 'weekly'): SummaryData {
  // Count new entries and re-entries
  const debuts = tracks.filter(t => t.isNewEntry).length;
  const reentries = tracks.filter(t => t.isReEntry).length;

  // Calculate total streams for different tiers
  const top10Streams = tracks.slice(0, 10).reduce((sum, track) => sum + (track.streams || 0), 0);
  const top50Streams = tracks.slice(0, 50).reduce((sum, track) => sum + (track.streams || 0), 0);
  const top200Streams = tracks.reduce((sum, track) => sum + (track.streams || 0), 0);

  // Calculate shares
  const top10Share = top200Streams > 0 ? top10Streams / top200Streams : 0;
  const top50Share = top200Streams > 0 ? top50Streams / top200Streams : 0;

  // Calculate turnover rate
  const totalTurnover = debuts + reentries;
  const turnoverRate = tracks.length > 0 ? (totalTurnover / tracks.length) * 100 : 0;

  // Find track of the week (highest position change or highest streams for new entries)
  let trackOfTheWeek = tracks[0]; // Default to #1
  if (debuts > 0) {
    trackOfTheWeek = tracks.find(t => t.isNewEntry) || tracks[0];
  }

  // Calculate volatility index (average position changes)
  const positionChanges = tracks
    .filter(t => t.previousPosition && t.position)
    .map(t => Math.abs(t.previousPosition - t.position));
  const volatilityIndex = positionChanges.length > 0
    ? positionChanges.reduce((sum, change) => sum + change, 0) / positionChanges.length
    : 0;

  // Estimate exits (for demo purposes, we'll use a calculation based on turnover)
  const estimatedExits = Math.max(0, totalTurnover - 10); // Rough estimate

  return {
    kpis: {
      debuts,
      reentries,
      turnover_rate: turnoverRate,
      top10_share: top10Share,
      top50_share: top50Share,
      top200_share: 1.0, // Always 100% for top 200
      track_of_the_week: {
        track_name: trackOfTheWeek.title || 'Unknown Track',
        artists: trackOfTheWeek.artist || 'Unknown Artist',
        position: trackOfTheWeek.position || 1,
        delta_streams: trackOfTheWeek.streams || 0
      }
    },
    streams: {
      current: {
        top10: top10Streams,
        top50: top50Streams,
        top200: top200Streams
      },
      growth_pct: {
        vs_previous: {
          top10: Math.random() * 10 - 5, // Mock data for now
          top50: Math.random() * 8 - 4,
          top200: Math.random() * 6 - 3
        }
      }
    },
    entries: {
      debut_count: debuts,
      reentry_count: reentries,
      exit_count: estimatedExits,
      turnover_new_pct: tracks.length > 0 ? (debuts / tracks.length) * 100 : 0,
      turnover_reentry_pct: tracks.length > 0 ? (reentries / tracks.length) * 100 : 0,
      turnover_exit_pct: tracks.length > 0 ? (estimatedExits / tracks.length) * 100 : 0
    },
    movers: {
      volatility_index: volatilityIndex
    },
    lastUpdated: new Date()
  };
}

function generateEmptySummary(): SummaryData {
  return {
    kpis: {
      debuts: 0,
      reentries: 0,
      turnover_rate: 0,
      top10_share: 0,
      top50_share: 0,
      top200_share: 0,
      track_of_the_week: {
        track_name: 'No Data',
        artists: 'No Data',
        position: 0,
        delta_streams: 0
      }
    },
    streams: {
      current: {
        top10: 0,
        top50: 0,
        top200: 0
      },
      growth_pct: {
        vs_previous: {
          top10: 0,
          top50: 0,
          top200: 0
        }
      }
    },
    entries: {
      debut_count: 0,
      reentry_count: 0,
      exit_count: 0,
      turnover_new_pct: 0,
      turnover_reentry_pct: 0,
      turnover_exit_pct: 0
    },
    movers: {
      volatility_index: 0
    },
    lastUpdated: new Date()
  };
}
