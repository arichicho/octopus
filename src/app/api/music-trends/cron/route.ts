import { NextRequest, NextResponse } from 'next/server';
import { Territory, ChartData, Track } from '@/types/music';
import { getRealSpotifyChartsDataFromKworb } from '@/lib/services/kworb-spotifycharts-scraper';
import { MusicTrendsStorage } from '@/lib/services/music-trends-storage';

type Period = 'daily' | 'weekly';

function isCronAuthorized(req: NextRequest): boolean {
  // Allow in local/dev without secret
  if (process.env.NODE_ENV !== 'production') return true;

  // Allow if Vercel Cron header is present (scheduled invocations)
  const vercelCronHeader = req.headers.get('x-vercel-cron') || req.headers.get('x-vercel-scheduled');
  if (vercelCronHeader) return true;

  // Allow with shared secret via query param or header
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key') || req.headers.get('x-cron-secret') || '';
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_API_KEY || '';
  return !!secret && key === secret;
}

function getTerritories(param?: string): Territory[] {
  const all: Territory[] = ['argentina', 'spanish', 'mexico', 'global'];
  if (!param || param === 'all') return all;
  const single = param.toLowerCase() as Territory;
  return all.includes(single) ? [single] : all;
}

function getPeriods(param?: string): Period[] {
  if (!param || param === 'all') return ['daily', 'weekly'];
  return (param === 'daily' || param === 'weekly') ? [param] : ['daily', 'weekly'];
}

function toChartData(
  territory: Territory,
  period: Period,
  dateISO: string,
  tracks: any[]
): ChartData {
  const date = new Date(dateISO);
  const now = new Date();

  const normalizedTracks: Track[] = tracks.map((t: any) => ({
    id: t.spotifyId || `track-${territory}-${period}-${t.position}`,
    title: t.title,
    artist: t.artist,
    position: t.position,
    previousPosition: t.previousPosition,
    streams: Number(t.streams) || 0,
    previousStreams: t.previousStreams,
    peakPosition: t.peakPosition ?? t.position,
    weeksOnChart: t.weeksOnChart ?? 1,
    isNewEntry: !!t.isNewEntry,
    isReEntry: !!t.isReEntry,
    isNewPeak: !!t.isNewPeak,
    territory,
    date,
    period
  }));

  const totalStreams = normalizedTracks.reduce((sum, tr) => sum + (tr.streams || 0), 0);

  return {
    territory,
    period,
    date,
    tracks: normalizedTracks,
    totalStreams,
    lastUpdated: now,
    isUpToDate: true,
    updateStatus: 'current'
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territoryParam = searchParams.get('territory') || 'all';
    const periodParam = searchParams.get('period') || 'all';

    const territories = getTerritories(territoryParam);
    const periods = getPeriods(periodParam);

    const results: any[] = [];
    let successCount = 0;
    const startedAt = new Date();

    for (const territory of territories) {
      for (const period of periods) {
        try {
          console.log(`🕒 Cron scrape: ${territory} ${period}`);
          const data = await getRealSpotifyChartsDataFromKworb(territory, period);

          // Persist to Firestore
          const chartData = toChartData(territory, period, data.date, data.tracks);
          await MusicTrendsStorage.storeChartData(chartData);

          results.push({
            territory,
            period,
            total: data.totalTracks,
            stored: chartData.tracks.length,
            date: data.date,
            status: 'ok'
          });
          successCount++;

          // Gentle delay between requests to be polite
          await new Promise(r => setTimeout(r, 250));
        } catch (err) {
          console.error(`❌ Cron scrape failed for ${territory} ${period}:`, err);
          results.push({
            territory,
            period,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      startedAt,
      finishedAt: new Date(),
      successCount,
      totalJobs: territories.length * periods.length,
      results
    });
  } catch (error) {
    console.error('Error in cron route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

