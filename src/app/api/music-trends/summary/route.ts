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

    console.log(`📊 Generating summary for ${territory} ${period}`);

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

    // Step 3: Generate analyses
    const moversAnalysis = musicAnalysisEngine.analyzeMovers(tracksWithFeatures, territory, period, new Date());
    const entriesAnalysis = musicAnalysisEngine.analyzeEntries(tracksWithFeatures, territory, period, new Date());
    const streamsAnalysis = musicAnalysisEngine.analyzeStreams(tracksWithFeatures, territory, period, new Date());
    const labelAnalysis = musicAnalysisEngine.analyzeLabelDistributor(tracksWithFeatures, territory, period, new Date());
    const risingArtistsAnalysis = musicAnalysisEngine.analyzeRisingArtists(tracksWithFeatures, territory, period, new Date());

    // Step 4: Calculate executive KPIs
    const kpis = musicAnalysisEngine.calculateExecutiveKPIs(
      entriesAnalysis,
      streamsAnalysis,
      labelAnalysis,
      risingArtistsAnalysis,
      territory,
      period,
      new Date()
    );

    // Step 5: Calculate streams aggregates
    const streamsAggregates = musicAnalysisEngine.calculateStreamsAggregates(tracksWithFeatures, territory, period, new Date());

    const summaryData = {
      kpis,
      streams: streamsAggregates,
      entries: entriesAnalysis,
      movers: moversAnalysis,
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: summaryData,
      metadata: {
        territory,
        period,
        totalTracks: tracksWithFeatures.length,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
