import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { historicalDataCollector } from '@/lib/services/historical-data-collector';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const weeks = parseInt(searchParams.get('weeks') || '12');
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    if (!territory) {
      return NextResponse.json(
        { success: false, error: 'Missing territory parameter' },
        { status: 400 }
      );
    }

    if (!['argentina', 'spanish', 'mexico', 'global'].includes(territory)) {
      return NextResponse.json(
        { success: false, error: 'Invalid territory' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting historical data collection for ${territory} - ${weeks} weeks of ${period} data`);

    const historicalData = await historicalDataCollector.collectHistoricalData(
      territory,
      weeks,
      period
    );

    console.log(`✅ Historical data collection completed: ${historicalData.length} weeks collected`);

    return NextResponse.json({
      success: true,
      data: historicalData,
      metadata: {
        territory,
        period,
        weeks: historicalData.length,
        startDate: historicalData[0]?.date,
        endDate: historicalData[historicalData.length - 1]?.date,
        collectedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error collecting historical data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        collectedAt: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const period = searchParams.get('period') as 'daily' | 'weekly' || 'weekly';

    if (!territory) {
      return NextResponse.json(
        { success: false, error: 'Missing territory parameter' },
        { status: 400 }
      );
    }

    const storedData = historicalDataCollector.getAllStoredData(territory, period);

    return NextResponse.json({
      success: true,
      data: storedData,
      metadata: {
        territory,
        period,
        weeks: storedData.length,
        startDate: storedData[0]?.date,
        endDate: storedData[storedData.length - 1]?.date,
        retrievedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error retrieving historical data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}