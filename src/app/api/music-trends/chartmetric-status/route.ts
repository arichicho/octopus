import { NextRequest, NextResponse } from 'next/server';
import { testChartmetricConnection } from '@/lib/services/chartmetric-client';

export async function GET(request: NextRequest) {
  try {
    // Test Chartmetric connection without authentication for status check
    const result = await testChartmetricConnection();
    
    return NextResponse.json({
      success: true,
      chartmetric: result,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Error in Chartmetric status check:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
