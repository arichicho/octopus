import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { musicDataIngestion } from '@/lib/services/music-data-ingestion';
import { musicAnalysisEngine } from '@/lib/services/music-analysis-engine';

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

    console.log(`🧠 Generating advanced insights for ${territory} ${period}`);

    // Step 1: Ingest data
    const tracks = await musicDataIngestion.ingestData(territory, period);
    
    if (tracks.length === 0) {
      return NextResponse.json(
        { error: 'No data available for the specified territory and period' },
        { status: 404 }
      );
    }

    // Step 2: Calculate advanced features
    const tracksWithFeatures = await musicDataIngestion.calculateAdvancedFeatures(tracks, territory, period);

    // Step 3: Generate all analyses
    const moversAnalysis = musicAnalysisEngine.analyzeMovers(tracksWithFeatures, territory, period, new Date());
    const entriesAnalysis = musicAnalysisEngine.analyzeEntries(tracksWithFeatures, territory, period, new Date());
    const peaksAnalysis = musicAnalysisEngine.analyzePeaks(tracksWithFeatures, territory, period, new Date());
    const streamsAnalysis = musicAnalysisEngine.analyzeStreams(tracksWithFeatures, territory, period, new Date());
    const collaborationsAnalysis = musicAnalysisEngine.analyzeCollaborations(tracksWithFeatures, territory, period, new Date());
    const momentumAnalysis = musicAnalysisEngine.analyzeMomentum(tracksWithFeatures, territory, period, new Date());
    const genreOriginAnalysis = musicAnalysisEngine.analyzeGenreOrigin(tracksWithFeatures, territory, period, new Date());
    const labelDistributorAnalysis = musicAnalysisEngine.analyzeLabelDistributor(tracksWithFeatures, territory, period, new Date());
    const risingArtistsAnalysis = musicAnalysisEngine.analyzeRisingArtists(tracksWithFeatures, territory, period, new Date());

    // Step 4: Generate watchlist (simplified for now)
    const watchlistAnalysis = {
      territory,
      period,
      date: new Date(),
      curated_watchlist: momentumAnalysis.momentum_leaderboard.slice(0, 10).map(track => ({
        track_id: track.track_id,
        track_name: track.track_name,
        artists: track.artists,
        momentum_score: track.momentum_score || 0,
        position: track.position,
        delta_position: track.delta_pos || 0,
        delta_streams_pct: track.delta_streams_pct || 0,
        delta_social_pct: 0, // TODO: Calculate when social data is available
        cross_territory_markets: 0, // TODO: Calculate when cross-territory data is available
        justification: [
          track.delta_pos && track.delta_pos < 0 ? 'Mejora de posición' : '',
          track.delta_streams_pct && track.delta_streams_pct > 0 ? 'Crecimiento de streams' : '',
          track.momentum_score && track.momentum_score > 80 ? 'Alto momentum' : '',
        ].filter(Boolean),
        predicted_top50_next_week: track.position <= 50 && (track.momentum_score || 0) > 70,
      })),
      backtest_results: [], // TODO: Implement backtesting
    };

    const insightsData = {
      movers: moversAnalysis,
      entries: entriesAnalysis,
      peaks: peaksAnalysis,
      streams: streamsAnalysis,
      collaborations: collaborationsAnalysis,
      momentum: momentumAnalysis,
      genreOrigin: genreOriginAnalysis,
      labelDistributor: labelDistributorAnalysis,
      risingArtists: risingArtistsAnalysis,
      watchlist: watchlistAnalysis,
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: insightsData,
      metadata: {
        territory,
        period,
        totalTracks: tracksWithFeatures.length,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error generating advanced insights:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate advanced insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
