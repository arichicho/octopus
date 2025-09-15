import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { Territory } from '@/types/music';
import { fetchSpotifyCharts } from '../spotify-charts/route';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Testing insights pipeline for ${territory} ${period}`);

    // Step 1: Test chart data fetching
    console.log('Step 1: Fetching chart data...');
    const chartResponse = await fetchSpotifyCharts(territory, period);
    const chartData = chartResponse.data || chartResponse;
    console.log(`✅ Chart data fetched: ${chartData.length} tracks`);

    // Step 2: Test basic analysis
    console.log('Step 2: Basic analysis...');
    const totalTracks = chartData.length;
    const totalStreams = chartData.reduce((sum: number, track: any) => sum + (track.streams || 0), 0);
    const newEntries = chartData.filter((track: any) => track.isNewEntry).length;
    const reEntries = chartData.filter((track: any) => track.isReEntry).length;
    const newPeaks = chartData.filter((track: any) => track.isNewPeak).length;

    console.log(`✅ Analysis complete: ${totalTracks} tracks, ${totalStreams.toLocaleString()} total streams`);

    // Step 3: Test insights generation (simplified)
    console.log('Step 3: Generating simplified insights...');
    const insights = {
      chartData: {
        totalTracks,
        totalStreams,
        summary: {
          marketDynamics: {
            newEntries,
            reEntries,
            newPeaks,
            turnoverRate: ((newEntries + reEntries) / totalTracks * 100).toFixed(1)
          },
          topGenres: [
            { genre: 'Pop', count: Math.floor(totalTracks * 0.3), percentage: 30 },
            { genre: 'Reggaeton', count: Math.floor(totalTracks * 0.25), percentage: 25 },
            { genre: 'Hip Hop', count: Math.floor(totalTracks * 0.2), percentage: 20 },
            { genre: 'Rock', count: Math.floor(totalTracks * 0.15), percentage: 15 },
            { genre: 'Electronic', count: Math.floor(totalTracks * 0.1), percentage: 10 }
          ],
          topLabels: [
            { label: 'Universal Music', count: Math.floor(totalTracks * 0.3), percentage: 30 },
            { label: 'Sony Music', count: Math.floor(totalTracks * 0.25), percentage: 25 },
            { label: 'Warner Music', count: Math.floor(totalTracks * 0.2), percentage: 20 },
            { label: 'Independent', count: Math.floor(totalTracks * 0.25), percentage: 25 }
          ]
        }
      },
      strategicInsights: {
        executiveSummary: `Análisis del Top ${totalTracks} de ${territory.toUpperCase()} ${period.toUpperCase()}: Se observan ${newEntries} nuevas entradas y ${newPeaks} nuevos picos. El mercado muestra una rotación del ${((newEntries + reEntries) / totalTracks * 100).toFixed(1)}%.`,
        keyFindings: [
          {
            type: 'jump',
            title: 'Mayor Salto',
            description: `Track con mayor ascenso en el chart`,
            data: { change: 15, position: 25 },
            confidence: 85,
            impact: 'medium',
            actionable: true
          },
          {
            type: 'drop',
            title: 'Mayor Caída',
            description: `Track con mayor descenso en el chart`,
            data: { change: -12, position: 45 },
            confidence: 80,
            impact: 'medium',
            actionable: true
          }
        ],
        recommendations: [
          {
            type: 'opportunity',
            title: 'Oportunidad de Mercado',
            description: 'Identificar tracks emergentes en posiciones 50-100',
            data: {}
          }
        ],
        alerts: [
          {
            type: 'significant-jump',
            title: 'Salto Significativo',
            description: 'Track con ascenso notable detectado',
            severity: 'medium',
            data: {}
          }
        ]
      },
      trackInsights: chartData.slice(0, 10).map((track: any, index: number) => ({
        id: track.id,
        type: 'trend',
        title: track.title,
        artist: track.artist,
        position: track.position,
        change: track.previousPosition ? track.previousPosition - track.position : 0,
        streams: track.streams,
        weeksOnChart: track.weeksOnChart,
        peakPosition: track.peakPosition,
        insights: {
          genre: ['Pop', 'Reggaeton', 'Hip Hop', 'Rock', 'Electronic'][index % 5],
          origin: ['Argentina', 'México', 'España', 'Global'][index % 4],
          label: ['Universal Music', 'Sony Music', 'Warner Music', 'Independent'][index % 4],
          socialMetrics: {
            spotifyFollowers: Math.floor(Math.random() * 1000000) + 100000,
            instagramFollowers: Math.floor(Math.random() * 500000) + 50000,
            tiktokFollowers: Math.floor(Math.random() * 200000) + 20000,
            totalReach: Math.floor(Math.random() * 2000000) + 200000
          }
        }
      }))
    };

    console.log('✅ Simplified insights generated successfully');

    return NextResponse.json({
      success: true,
      data: insights,
      metadata: {
        territory,
        period,
        totalTracks,
        totalStreams,
        generatedAt: new Date().toISOString(),
        testMode: true
      }
    });

  } catch (error) {
    console.error('Error in test insights API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate test insights',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
