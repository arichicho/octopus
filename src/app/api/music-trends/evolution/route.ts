import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import fs from 'fs';
import path from 'path';

interface EvolutionDataPoint {
  date: string;
  week_number: number;
  year: number;
  top10_streams: number;
  top50_streams: number;
  top200_streams: number;
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

    if (!['argentina', 'spanish', 'mexico', 'global'].includes(territory)) {
      return NextResponse.json(
        { success: false, error: 'Invalid territory' },
        { status: 400 }
      );
    }

    console.log(`📊 Getting evolution data for ${territory} ${period}`);

    // Read historical data directly from file
    const dataPath = path.join(process.cwd(), 'data', 'historical-charts.json');

    if (!fs.existsSync(dataPath)) {
      console.log(`❌ Historical data file not found: ${dataPath}`);
      return NextResponse.json({
        success: false,
        error: 'Historical data not available'
      }, { status: 404 });
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const allEntries = Object.values(data) as any[];

    // Filter for this territory and period, then sort by date
    const territoryData = allEntries
      .filter(entry => entry.territory === territory && entry.period === period)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`📈 Found ${territoryData.length} weeks of evolution data for ${territory}`);

    if (territoryData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No historical data found for this territory'
      }, { status: 404 });
    }

    // Transform to evolution data points
    const evolutionData: EvolutionDataPoint[] = territoryData.map(entry => ({
      date: entry.date.slice(0, 10), // YYYY-MM-DD format
      week_number: entry.week_number,
      year: entry.year,
      top10_streams: entry.aggregatedData.top10_streams,
      top50_streams: entry.aggregatedData.top50_streams,
      top200_streams: entry.aggregatedData.top200_streams
    }));

    // Calculate some basic stats
    const latest = evolutionData[evolutionData.length - 1];
    const earliest = evolutionData[0];

    const totalGrowthTop10 = latest.top10_streams - earliest.top10_streams;
    const totalGrowthTop50 = latest.top50_streams - earliest.top50_streams;
    const totalGrowthTop200 = latest.top200_streams - earliest.top200_streams;

    const percentGrowthTop10 = earliest.top10_streams > 0
      ? ((totalGrowthTop10 / earliest.top10_streams) * 100)
      : 0;
    const percentGrowthTop50 = earliest.top50_streams > 0
      ? ((totalGrowthTop50 / earliest.top50_streams) * 100)
      : 0;
    const percentGrowthTop200 = earliest.top200_streams > 0
      ? ((totalGrowthTop200 / earliest.top200_streams) * 100)
      : 0;

    console.log(`✅ Evolution data prepared: ${evolutionData.length} data points`);
    console.log(`   Period: ${earliest.date} to ${latest.date}`);
    console.log(`   Top 200 growth: ${percentGrowthTop200.toFixed(1)}%`);

    return NextResponse.json({
      success: true,
      data: {
        evolution: evolutionData,
        stats: {
          period: {
            start: earliest.date,
            end: latest.date,
            weeks: evolutionData.length
          },
          growth: {
            top10: {
              absolute: totalGrowthTop10,
              percent: percentGrowthTop10
            },
            top50: {
              absolute: totalGrowthTop50,
              percent: percentGrowthTop50
            },
            top200: {
              absolute: totalGrowthTop200,
              percent: percentGrowthTop200
            }
          }
        }
      },
      metadata: {
        territory,
        period,
        dataPoints: evolutionData.length,
        generatedAt: new Date().toISOString(),
        source: 'real_historical_data'
      }
    });

  } catch (error) {
    console.error('Error getting evolution data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}