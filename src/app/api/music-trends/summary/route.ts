import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { getRealSpotifyChartsDataFromKworb } from '@/lib/services/kworb-spotifycharts-scraper';
import { historicalDataCollector } from '@/lib/services/historical-data-collector';

interface SummaryData {
  kpis: {
    debuts: number;
    reentries: number;
    turnover_rate: number;
    top10_share: number;
    top50_share: number;
    top200_share: number;
    concentration_index: number;
    track_of_the_week: {
      track_name: string;
      artists: string;
      position: number;
      delta_streams: number;
    };
  };
  streams: {
    current: {
      top10: number;
      top50: number;
      top200: number;
    };
    growth_pct: {
      vs_previous: {
        top10: number;
        top50: number;
        top200: number;
      };
    };
  };
  entries: {
    debut_count: number;
    reentry_count: number;
    exit_count: number;
    turnover_new_pct: number;
    turnover_reentry_pct: number;
    turnover_exit_pct: number;
  };
  movers: {
    volatility_index: number;
  };
  lastUpdated: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const period = searchParams.get('period') as 'daily' | 'weekly';

    if (!territory || !period) {
      return NextResponse.json(
        { success: false, error: 'Missing territory or period parameter' },
        { status: 400 }
      );
    }

    if (!['argentina', 'spanish', 'mexico', 'global'].includes(territory)) {
      return NextResponse.json(
        { success: false, error: 'Invalid territory' },
        { status: 400 }
      );
    }

    if (!['daily', 'weekly'].includes(period)) {
      return NextResponse.json(
        { success: false, error: 'Invalid period' },
        { status: 400 }
      );
    }

    console.log(`📊 Generating summary data for ${territory} ${period}`);

    // Get latest historical data instead of scraping Kworb
    const latestHistoricalData = await getLatestHistoricalData(territory, period);

    if (!latestHistoricalData) {
      console.warn('No historical data available, falling back to Kworb scraping');
      const currentData = await getRealSpotifyChartsDataFromKworb(territory, period);
      const tracks = currentData.tracks;

      if (tracks.length === 0) {
        console.warn('No tracks data available from Kworb either');
        return NextResponse.json({
          success: true,
          data: generateEmptySummary(),
          metadata: {
            territory,
            period,
            generatedAt: new Date().toISOString(),
            source: 'empty'
          }
        });
      }

      // Calculate summary from Kworb data
      const summaryData = await calculateSummaryFromTracks(tracks, territory, period);
      return NextResponse.json({
        success: true,
        data: summaryData,
        metadata: {
          territory,
          period,
          totalTracks: tracks.length,
          generatedAt: new Date().toISOString(),
          source: 'kworb_fallback'
        }
      });
    }

    const tracks = latestHistoricalData.tracks;

    if (tracks.length === 0) {
      console.warn('No tracks data available for summary');
      return NextResponse.json({
        success: true,
        data: generateEmptySummary(),
        metadata: {
          territory,
          period,
          generatedAt: new Date().toISOString(),
          source: 'empty'
        }
      });
    }

    // Using historical data - no need to store current data

    // Calculate summary statistics
    const summaryData = await calculateSummaryFromTracks(tracks, territory, period);

    console.log(`✅ Generated summary with ${tracks.length} tracks`);

    return NextResponse.json({
      success: true,
      data: summaryData,
      metadata: {
        territory,
        period,
        totalTracks: tracks.length,
        generatedAt: new Date().toISOString(),
        source: 'historical_data',
        dataDate: latestHistoricalData.date
      }
    });

  } catch (error) {
    console.error('Error generating summary data:', error);

    return NextResponse.json({
      success: true,
      data: generateEmptySummary(),
      metadata: {
        territory: 'global',
        period: 'weekly',
        generatedAt: new Date().toISOString(),
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

async function calculateSummaryFromTracks(tracks: any[], territory: Territory, period: 'daily' | 'weekly'): Promise<SummaryData> {
  // Count new entries and re-entries
  const debuts = tracks.filter(t => t.isNewEntry).length;
  const reentries = tracks.filter(t => t.isReEntry).length;

  // Calculate total streams for different tiers
  const top10Streams = tracks.slice(0, 10).reduce((sum, track) => sum + (track.streams || 0), 0);
  const top50Streams = tracks.slice(0, 50).reduce((sum, track) => sum + (track.streams || 0), 0);
  const top200Streams = tracks.reduce((sum, track) => sum + (track.streams || 0), 0);

  // Debug logs for stream calculations
  console.log(`📊 Stream calculations for ${territory} ${period}:`);
  console.log(`  Top 10 streams: ${top10Streams.toLocaleString()}`);
  console.log(`  Top 50 streams: ${top50Streams.toLocaleString()}`);
  console.log(`  Top 200 streams: ${top200Streams.toLocaleString()}`);

  // Calculate shares
  const top10Share = top200Streams > 0 ? top10Streams / top200Streams : 0;
  const top50Share = top200Streams > 0 ? top50Streams / top200Streams : 0;

  console.log(`  Top 10 share: ${(top10Share * 100).toFixed(2)}%`);
  console.log(`  Top 50 share: ${(top50Share * 100).toFixed(2)}%`);

  // Validation checks
  if (top10Share > top50Share) {
    console.warn(`⚠️ Data validation issue: Top 10 share (${(top10Share * 100).toFixed(2)}%) > Top 50 share (${(top50Share * 100).toFixed(2)}%)`);
  }

  if (top10Share < 0.01) { // Less than 1%
    console.warn(`⚠️ Data validation issue: Top 10 share seems unusually low (${(top10Share * 100).toFixed(2)}%)`);
  }

  if (top50Share < 0.15) { // Less than 15%
    console.warn(`⚠️ Data validation issue: Top 50 share seems unusually low (${(top50Share * 100).toFixed(2)}%)`);
  }

  // Log some sample track data for debugging
  console.log(`📝 Sample track data (first 3 tracks):`);
  tracks.slice(0, 3).forEach((track, i) => {
    console.log(`  #${track.position}: "${track.title}" by "${track.artist}" - ${track.streams?.toLocaleString() || 0} streams`);
  });

  // Calculate turnover rate
  const totalTurnover = debuts + reentries;
  const turnoverRate = tracks.length > 0 ? (totalTurnover / tracks.length) * 100 : 0;

  // Find track of the week (highest position change or highest streams for new entries)
  let trackOfTheWeek = tracks[0]; // Default to #1
  if (debuts > 0) {
    trackOfTheWeek = tracks.find(t => t.isNewEntry) || tracks[0];
  }

  // Calculate volatility index (average position changes)
  const positionChanges = tracks
    .filter(t => t.previousPosition && t.position)
    .map(t => Math.abs(t.previousPosition - t.position));
  const volatilityIndex = positionChanges.length > 0
    ? positionChanges.reduce((sum, change) => sum + change, 0) / positionChanges.length
    : 0;

  // Calculate concentration index (Top 5 concentration ratio)
  const top5Streams = tracks.slice(0, 5).reduce((sum, track) => sum + (track.streams || 0), 0);
  const concentrationIndex = top200Streams > 0 ? (top5Streams / top200Streams) * 100 : 0;

  console.log(`📊 Concentration index: ${concentrationIndex.toFixed(2)}% (Top 5: ${top5Streams.toLocaleString()} / Total: ${top200Streams.toLocaleString()})`);

  // Estimate exits (for demo purposes, we'll use a calculation based on turnover)
  const estimatedExits = Math.max(0, totalTurnover - 10); // Rough estimate

  return {
    kpis: {
      debuts,
      reentries,
      turnover_rate: turnoverRate,
      top10_share: top10Share,
      top50_share: top50Share,
      top200_share: 1.0, // Always 100% for top 200
      concentration_index: concentrationIndex,
      track_of_the_week: {
        track_name: trackOfTheWeek.title || 'Unknown Track',
        artists: trackOfTheWeek.artist || 'Unknown Artist',
        position: trackOfTheWeek.position || 1,
        delta_streams: trackOfTheWeek.streams || 0
      }
    },
    streams: {
      current: {
        top10: top10Streams,
        top50: top50Streams,
        top200: top200Streams
      },
      growth_pct: {
        vs_previous: await calculateGrowthRates(territory, period, {
          top10: top10Streams,
          top50: top50Streams,
          top200: top200Streams
        })
      }
    },
    entries: {
      debut_count: debuts,
      reentry_count: reentries,
      exit_count: estimatedExits,
      turnover_new_pct: tracks.length > 0 ? (debuts / tracks.length) * 100 : 0,
      turnover_reentry_pct: tracks.length > 0 ? (reentries / tracks.length) * 100 : 0,
      turnover_exit_pct: tracks.length > 0 ? (estimatedExits / tracks.length) * 100 : 0
    },
    movers: {
      volatility_index: volatilityIndex
    },
    lastUpdated: new Date()
  };
}

async function calculateGrowthRates(
  territory: Territory,
  period: 'daily' | 'weekly',
  currentStreams: { top10: number; top50: number; top200: number }
): Promise<{ top10: number; top50: number; top200: number }> {
  try {
    console.log(`📈 Calculating growth rates for ${territory} ${period}`);

    // Get 12-week average data for comparison
    const averageData = await get12WeekAverageData(territory, period);

    if (!averageData) {
      console.log('⚠️ No 12-week average data available, returning null values');
      // Return null-like values that will be handled by the frontend as "N/A"
      return {
        top10: 999999, // Special value to indicate "no data"
        top50: 999999,
        top200: 999999
      };
    }

    // Calculate growth vs 12-week average (current week vs average of last 12 weeks)
    const top10Growth = averageData.top10 > 0
      ? ((currentStreams.top10 - averageData.top10) / averageData.top10) * 100
      : 0;

    const top50Growth = averageData.top50 > 0
      ? ((currentStreams.top50 - averageData.top50) / averageData.top50) * 100
      : 0;

    const top200Growth = averageData.top200 > 0
      ? ((currentStreams.top200 - averageData.top200) / averageData.top200) * 100
      : 0;

    console.log(`  🎯 Growth vs 12-week average:`);
    console.log(`     Top 10: ${top10Growth.toFixed(2)}% (current: ${currentStreams.top10.toLocaleString()}, avg: ${averageData.top10.toLocaleString()})`);
    console.log(`     Top 50: ${top50Growth.toFixed(2)}% (current: ${currentStreams.top50.toLocaleString()}, avg: ${averageData.top50.toLocaleString()})`);
    console.log(`     Top 200: ${top200Growth.toFixed(2)}% (current: ${currentStreams.top200.toLocaleString()}, avg: ${averageData.top200.toLocaleString()})`);

    return {
      top10: top10Growth,
      top50: top50Growth,
      top200: top200Growth
    };

  } catch (error) {
    console.error('Error calculating growth rates:', error);
    return {
      top10: 999999, // Special value to indicate error
      top50: 999999,
      top200: 999999
    };
  }
}

async function get12WeekAverageData(
  territory: Territory,
  period: 'daily' | 'weekly'
): Promise<{ top10: number; top50: number; top200: number } | null> {
  try {
    console.log(`📊 Calculating 12-week average for ${territory} ${period}`);

    // Read historical data directly from file to bypass any loading issues
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'historical-charts.json');

    if (!fs.existsSync(dataPath)) {
      console.log(`❌ Historical data file not found: ${dataPath}`);
      return null;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const allEntries = Object.values(data) as any[];

    // Filter for this territory and period
    const territoryData = allEntries
      .filter(entry => entry.territory === territory && entry.period === period)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`📈 Found ${territoryData.length} weeks of data for ${territory}`);

    if (territoryData.length < 12) {
      console.log(`⚠️ Insufficient historical data (${territoryData.length} weeks), need at least 12 weeks`);
      return null;
    }

    // Get last 12 weeks (excluding the most recent week which would be current)
    const last12Weeks = territoryData.slice(-13, -1); // Last 13, excluding current = last 12

    if (last12Weeks.length < 12) {
      console.log(`⚠️ Not enough historical weeks (${last12Weeks.length}/12)`);
      return null;
    }

    // Calculate averages for the last 12 weeks
    const totalTop10 = last12Weeks.reduce((sum: number, week: any) => sum + (week.aggregatedData?.top10_streams || 0), 0);
    const totalTop50 = last12Weeks.reduce((sum: number, week: any) => sum + (week.aggregatedData?.top50_streams || 0), 0);
    const totalTop200 = last12Weeks.reduce((sum: number, week: any) => sum + (week.aggregatedData?.top200_streams || 0), 0);

    const avgTop10 = totalTop10 / 12;
    const avgTop50 = totalTop50 / 12;
    const avgTop200 = totalTop200 / 12;

    console.log(`✅ 12-week averages calculated:`);
    console.log(`   Top 10: ${avgTop10.toLocaleString()} streams`);
    console.log(`   Top 50: ${avgTop50.toLocaleString()} streams`);
    console.log(`   Top 200: ${avgTop200.toLocaleString()} streams`);
    console.log(`   Period: ${last12Weeks[0].date.slice(0, 10)} to ${last12Weeks[11].date.slice(0, 10)}`);

    return {
      top10: avgTop10,
      top50: avgTop50,
      top200: avgTop200
    };

  } catch (error) {
    console.error('Error calculating 12-week average:', error);
    return null;
  }
}

// Removed getEstimatedGrowthRate - we now use real data or show N/A

function generateEmptySummary(): SummaryData {
  return {
    kpis: {
      debuts: 0,
      reentries: 0,
      turnover_rate: 0,
      top10_share: 0,
      top50_share: 0,
      top200_share: 0,
      concentration_index: 0,
      track_of_the_week: {
        track_name: 'No Data',
        artists: 'No Data',
        position: 0,
        delta_streams: 0
      }
    },
    streams: {
      current: {
        top10: 0,
        top50: 0,
        top200: 0
      },
      growth_pct: {
        vs_previous: {
          top10: 0,
          top50: 0,
          top200: 0
        }
      }
    },
    entries: {
      debut_count: 0,
      reentry_count: 0,
      exit_count: 0,
      turnover_new_pct: 0,
      turnover_reentry_pct: 0,
      turnover_exit_pct: 0
    },
    movers: {
      volatility_index: 0
    },
    lastUpdated: new Date()
  };
}

/**
 * Get the latest historical data for a territory and period
 */
async function getLatestHistoricalData(
  territory: Territory,
  period: 'daily' | 'weekly'
): Promise<any | null> {
  try {
    console.log(`📊 Getting latest historical data for ${territory} ${period}`);

    // Read historical data directly from file
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'historical-charts.json');

    if (!fs.existsSync(dataPath)) {
      console.log(`❌ Historical data file not found: ${dataPath}`);
      return null;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const allEntries = Object.values(data) as any[];

    // Filter for this territory and period, then sort by date
    const territoryData = allEntries
      .filter(entry => entry.territory === territory && entry.period === period)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`📈 Found ${territoryData.length} historical entries for ${territory}`);

    if (territoryData.length === 0) {
      console.log(`⚠️ No historical data found for ${territory} ${period}`);
      return null;
    }

    // Get the most recent entry
    const latestEntry = territoryData[territoryData.length - 1];
    console.log(`✅ Using latest entry from ${latestEntry.date} with ${latestEntry.tracks.length} tracks`);

    return latestEntry;

  } catch (error) {
    console.error('Error getting latest historical data:', error);
    return null;
  }
}
