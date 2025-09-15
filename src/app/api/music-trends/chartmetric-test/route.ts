import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { testChartmetricConnection, getChartmetricClient } from '@/lib/services/chartmetric-client';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'connection') {
      // Test basic connection
      const result = await testChartmetricConnection();
      return NextResponse.json(result);
    }

    if (action === 'search') {
      // Test search functionality
      const client = getChartmetricClient();
      if (!client) {
        return NextResponse.json({
          success: false,
          error: 'Chartmetric client not configured'
        });
      }

      try {
        const searchResult = await client.searchArtists('Bad Bunny', 3);
        return NextResponse.json({
          success: true,
          data: searchResult,
          message: 'Search test successful'
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Search test failed'
        });
      }
    }

    if (action === 'token') {
      // Test token refresh
      const client = getChartmetricClient();
      if (!client) {
        return NextResponse.json({
          success: false,
          error: 'Chartmetric client not configured'
        });
      }

      try {
        // Force token refresh by making a request
        const result = await client.searchArtists('test', 1);
        return NextResponse.json({
          success: true,
          data: result,
          message: 'Token refresh test successful'
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Token refresh test failed'
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: connection, search, or token'
    });

  } catch (error) {
    console.error('Error in Chartmetric test API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
