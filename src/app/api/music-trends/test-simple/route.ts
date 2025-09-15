import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory || 'argentina';
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    console.log(`🧪 Simple test for ${territory} ${period}`);

    // Simple test data
    const testData = {
      territory,
      period,
      totalTracks: 200,
      totalStreams: 50000000,
      timestamp: new Date().toISOString(),
      message: 'Simple test successful'
    };

    return NextResponse.json({
      success: true,
      data: testData
    });

  } catch (error) {
    console.error('Error in simple test API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run simple test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
