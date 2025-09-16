import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromKworb } from '@/lib/services/kworb-spotifycharts-scraper';
import { chartmetricLabelEnricher } from '@/lib/services/chartmetric-label-enricher';

interface InsightsData {
  movers: {
    top_gainers: Array<{
      track_id: string;
      track_name: string;
      artists: string;
      position: number;
      delta_pos: number;
    }>;
    top_losers: Array<{
      track_id: string;
      track_name: string;
      artists: string;
      position: number;
      delta_pos: number;
    }>;
    mean_delta_pos: number;
    median_delta_pos: number;
    volatility_index: number;
  };
  entries: {
    top_debuts: Array<{
      track_id: string;
      track_name: string;
      artists: string;
      position: number;
      streams?: number;
    }>;
    relevant_reentries: Array<{
      track_id: string;
      track_name: string;
      artists: string;
      position: number;
    }>;
    debut_count: number;
    reentry_count: number;
    exit_count: number;
    turnover_new_pct: number;
    turnover_reentry_pct: number;
    turnover_exit_pct: number;
  };
  momentum: {
    breakout_watchlist: Array<{
      track_id: string;
      track_name: string;
      artists: string;
      position: number;
      momentum_score?: number;
    }>;
    momentum_leaderboard: Array<{
      track_id: string;
      track_name: string;
      artists: string;
      position: number;
      momentum_score?: number;
    }>;
  };
  genreOrigin: {
    genre_distribution: Array<{
      genre: string;
      count: number;
      percentage: number;
      avg_position: number;
    }>;
    origin_distribution: Array<{
      country: string;
      city?: string;
      count: number;
      percentage: number;
    }>;
  };
  labelMarketShare: {
    major_labels: Array<{
      label: string;
      tracks_count: number;
      market_share_pct: number;
      avg_position: number;
      top10_tracks: number;
      total_streams: number;
    }>;
    independent_labels: Array<{
      label: string;
      tracks_count: number;
      market_share_pct: number;
      avg_position: number;
      streams: number;
    }>;
    market_concentration: {
      top3_labels_share: number;
      top5_labels_share: number;
      hhi_index: number; // Herfindahl-Hirschman Index
    };
  };
  watchlist: {
    curated_watchlist: Array<{
      track_id: string;
      track_name: string;
      artists: string;
      position: number;
      momentum_score: number;
      justification: string[];
      predicted_top50_next_week: boolean;
    }>;
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

    console.log(`🔍 Generating insights data for ${territory} ${period}`);

    // Get current charts data
    const currentData = await getRealSpotifyChartsDataFromKworb(territory, period);
    const tracks = currentData.tracks;

    if (tracks.length === 0) {
      console.warn('No tracks data available for insights');
      return NextResponse.json({
        success: true,
        data: generateEmptyInsights(),
        metadata: {
          territory,
          period,
          generatedAt: new Date().toISOString(),
          source: 'empty'
        }
      });
    }

    // Calculate insights from tracks data
    const insightsData = await calculateInsightsFromTracks(tracks, territory, period);

    console.log(`✅ Generated insights with ${tracks.length} tracks`);

    return NextResponse.json({
      success: true,
      data: insightsData,
      metadata: {
        territory,
        period,
        totalTracks: tracks.length,
        generatedAt: new Date().toISOString(),
        source: 'kworb'
      }
    });

  } catch (error) {
    console.error('Error generating insights data:', error);

    return NextResponse.json({
      success: true,
      data: generateEmptyInsights(),
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

async function calculateInsightsFromTracks(tracks: any[], territory: Territory, period: 'daily' | 'weekly'): Promise<InsightsData> {
  // Calculate movers (tracks with position changes)
  const tracksWithChanges = tracks.filter(t => t.previousPosition && t.position);
  const gainers = tracksWithChanges
    .filter(t => t.previousPosition > t.position) // Gained positions (lower number = better)
    .map(t => ({
      track_id: t.spotifyId || `track-${t.position}`,
      track_name: t.title || 'Unknown Track',
      artists: t.artist || 'Unknown Artist',
      position: t.position,
      delta_pos: t.previousPosition - t.position // Positive = gain
    }))
    .sort((a, b) => b.delta_pos - a.delta_pos)
    .slice(0, 15);

  const losers = tracksWithChanges
    .filter(t => t.previousPosition < t.position) // Lost positions (higher number = worse)
    .map(t => ({
      track_id: t.spotifyId || `track-${t.position}`,
      track_name: t.title || 'Unknown Track',
      artists: t.artist || 'Unknown Artist',
      position: t.position,
      delta_pos: t.position - t.previousPosition // Positive = loss
    }))
    .sort((a, b) => b.delta_pos - a.delta_pos)
    .slice(0, 15);

  // Calculate volatility metrics
  const positionDeltas = tracksWithChanges.map(t => Math.abs(t.previousPosition - t.position));
  const meanDelta = positionDeltas.length > 0 ? positionDeltas.reduce((sum, delta) => sum + delta, 0) / positionDeltas.length : 0;
  const sortedDeltas = positionDeltas.sort((a, b) => a - b);
  const medianDelta = sortedDeltas.length > 0 ? sortedDeltas[Math.floor(sortedDeltas.length / 2)] : 0;
  const volatilityIndex = meanDelta;

  // Debuts and re-entries
  const debuts = tracks.filter(t => t.isNewEntry);
  const reentries = tracks.filter(t => t.isReEntry);

  const topDebuts = debuts
    .map(t => ({
      track_id: t.spotifyId || `track-${t.position}`,
      track_name: t.title || 'Unknown Track',
      artists: t.artist || 'Unknown Artist',
      position: t.position,
      streams: t.streams
    }))
    .sort((a, b) => a.position - b.position)
    .slice(0, 15);

  const relevantReentries = reentries
    .map(t => ({
      track_id: t.spotifyId || `track-${t.position}`,
      track_name: t.title || 'Unknown Track',
      artists: t.artist || 'Unknown Artist',
      position: t.position
    }))
    .sort((a, b) => a.position - b.position)
    .slice(0, 15);

  // Momentum analysis (simulate based on position and streams)
  const momentumTracks = tracks
    .map(t => {
      const positionScore = (201 - t.position) / 200 * 50; // Higher position = higher score
      const streamsScore = Math.min((t.streams || 0) / 1000000 * 30, 30); // Normalize streams
      const newEntryBonus = t.isNewEntry ? 20 : 0;
      const momentum_score = positionScore + streamsScore + newEntryBonus;

      return {
        track_id: t.spotifyId || `track-${t.position}`,
        track_name: t.title || 'Unknown Track',
        artists: t.artist || 'Unknown Artist',
        position: t.position,
        momentum_score
      };
    })
    .sort((a, b) => b.momentum_score - a.momentum_score);

  const breakoutWatchlist = momentumTracks
    .filter(t => t.position > 50) // Outside top 50
    .slice(0, 15);

  const momentumLeaderboard = momentumTracks.slice(0, 15);

  // Mock genre and origin data (would come from enriched data in real implementation)
  const mockGenres = ['Pop', 'Reggaeton', 'Hip Hop', 'Rock', 'Electronic', 'Latin', 'R&B', 'Country'];
  const genreDistribution = mockGenres.map((genre, index) => ({
    genre,
    count: Math.floor(Math.random() * 20) + 5,
    percentage: Math.random() * 15 + 5,
    avg_position: Math.random() * 100 + 1
  })).sort((a, b) => b.percentage - a.percentage);

  const mockCountries = ['Argentina', 'España', 'México', 'Estados Unidos', 'Colombia', 'Chile', 'Perú'];
  const originDistribution = mockCountries.map((country, index) => ({
    country,
    city: index === 0 ? 'Buenos Aires' : undefined,
    count: Math.floor(Math.random() * 30) + 10,
    percentage: Math.random() * 20 + 10
  })).sort((a, b) => b.percentage - a.percentage);

  // Get real label data from Chartmetric
  console.log('🎵 Enriching tracks with Chartmetric label data...');
  const labelEnrichmentResult = await chartmetricLabelEnricher.enrichTracksWithLabels(tracks);
  const labelMarketShareData = labelEnrichmentResult.labelMarketShare;

  // Curated watchlist (top momentum tracks with justifications)
  const curatedWatchlist = momentumTracks
    .slice(0, 10)
    .map(track => {
      const justifications = [];
      if (track.momentum_score > 70) justifications.push('Alto momentum');
      if (track.position <= 50) justifications.push('Top 50');
      if (tracks.find(t => t.spotifyId === track.track_id)?.isNewEntry) justifications.push('Nueva entrada');
      if (track.position > 100) justifications.push('Subiendo rápido');

      return {
        ...track,
        justification: justifications.length > 0 ? justifications : ['Tendencia positiva'],
        predicted_top50_next_week: track.momentum_score > 60
      };
    });

  // Calculate exit estimate
  const estimatedExits = Math.max(0, debuts.length + reentries.length - 5);

  return {
    movers: {
      top_gainers: gainers,
      top_losers: losers,
      mean_delta_pos: meanDelta,
      median_delta_pos: medianDelta,
      volatility_index: volatilityIndex
    },
    entries: {
      top_debuts: topDebuts,
      relevant_reentries: relevantReentries,
      debut_count: debuts.length,
      reentry_count: reentries.length,
      exit_count: estimatedExits,
      turnover_new_pct: tracks.length > 0 ? (debuts.length / tracks.length) * 100 : 0,
      turnover_reentry_pct: tracks.length > 0 ? (reentries.length / tracks.length) * 100 : 0,
      turnover_exit_pct: tracks.length > 0 ? (estimatedExits / tracks.length) * 100 : 0
    },
    momentum: {
      breakout_watchlist: breakoutWatchlist,
      momentum_leaderboard: momentumLeaderboard
    },
    genreOrigin: {
      genre_distribution: genreDistribution,
      origin_distribution: originDistribution
    },
    labelMarketShare: labelMarketShareData,
    watchlist: {
      curated_watchlist: curatedWatchlist
    },
    lastUpdated: new Date()
  };
}

function generateEmptyInsights(): InsightsData {
  return {
    movers: {
      top_gainers: [],
      top_losers: [],
      mean_delta_pos: 0,
      median_delta_pos: 0,
      volatility_index: 0
    },
    entries: {
      top_debuts: [],
      relevant_reentries: [],
      debut_count: 0,
      reentry_count: 0,
      exit_count: 0,
      turnover_new_pct: 0,
      turnover_reentry_pct: 0,
      turnover_exit_pct: 0
    },
    momentum: {
      breakout_watchlist: [],
      momentum_leaderboard: []
    },
    genreOrigin: {
      genre_distribution: [],
      origin_distribution: []
    },
    labelMarketShare: {
      major_labels: [],
      independent_labels: [],
      market_concentration: {
        top3_labels_share: 0,
        top5_labels_share: 0,
        hhi_index: 0
      }
    },
    watchlist: {
      curated_watchlist: []
    },
    lastUpdated: new Date()
  };
}


