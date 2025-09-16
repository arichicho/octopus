import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromRealTimeAPI } from '@/lib/services/real-time-charts-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Testing real-time API for REAL SpotifyCharts data - ${territory} ${period}`);

    const result = await getRealSpotifyChartsDataFromRealTimeAPI(territory, period);

    return NextResponse.json({
      success: true,
      data: result.tracks.slice(0, 20), // Only first 20 tracks for testing
      territory: result.territory,
      period: result.period,
      totalTracks: result.totalTracks,
      source: 'real-time-charts-api',
      timestamp: result.date
    });

  } catch (error) {
    console.error('Error in test real-time API:', error);
    
    // Check if it's a "no data available" error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('No real data available')) {
      return NextResponse.json({
        success: false,
        error: 'No real data available',
        message: errorMessage,
        territory: searchParams.get('territory') || 'argentina',
        period: searchParams.get('period') || 'weekly',
        data: [],
        totalTracks: 0
      }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to get data from real-time API', details: errorMessage },
      { status: 500 }
    );
  }
}
