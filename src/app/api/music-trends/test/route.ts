import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { Territory } from '@/types/music';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territory = (searchParams.get('territory') as Territory) || 'argentina';
    const period = (searchParams.get('period') as 'daily' | 'weekly') || 'weekly';

    console.log(`🧪 Testing SpotifyCharts API for ${territory} ${period}`);

    // Test the SpotifyCharts API
    const testResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/music-trends/spotify-charts?territory=${territory}&period=${period}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'test'}`,
        'Content-Type': 'application/json'
      }
    });

    const testResult = await testResponse.json();

    // Test Chartmetric API (if available)
    let chartmetricTest = null;
    if (process.env.CHARTMETRIC_API_KEY) {
      try {
        const chartmetricResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/music-trends/chartmetric?action=search&title=test&artist=test`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'test'}`,
            'Content-Type': 'application/json'
          }
        });
        chartmetricTest = await chartmetricResponse.json();
      } catch (error) {
        chartmetricTest = { error: 'Chartmetric test failed' };
      }
    }

    // Test Claude AI
    let claudeTest = null;
    try {
      const claudeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/music-trends/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'test'}`,
          'Content-Type': 'application/json'
        }
      });
      claudeTest = await claudeResponse.json();
    } catch (error) {
      claudeTest = { error: 'Claude test failed' };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        spotifyCharts: {
          success: testResult.success,
          tracksCount: testResult.data?.length || 0,
          source: testResult.source || 'unknown',
          error: testResult.error || null,
          sampleTrack: testResult.data?.[0] || null
        },
        chartmetric: {
          configured: !!process.env.CHARTMETRIC_API_KEY,
          test: chartmetricTest
        },
        claude: {
          test: claudeTest
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasClaudeKey: !!process.env.CLAUDE_API_KEY,
        hasChartmetricKey: !!process.env.CHARTMETRIC_API_KEY,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      }
    });
  } catch (error) {
    console.error('Error in Music Trends test:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
