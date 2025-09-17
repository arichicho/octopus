import { NextRequest, NextResponse } from 'next/server';
import { Territory } from '@/types/music';
import { MusicTrendsStorage } from '@/lib/services/music-trends-storage';
import { getRealSpotifyChartsDataFromKworb } from '@/lib/services/kworb-spotifycharts-scraper';

type Period = 'daily' | 'weekly';
const TERRITORIES: Territory[] = ['argentina', 'spanish', 'mexico', 'global'];

interface OverviewResponse {
  period: Period;
  generatedAt: string;
  territories: Record<string, {
    topStreams: { top10: number; top50: number; top200: number };
    concentration: { top5Share: number; hhiTracks: number };
    totalTracks: number;
    lastUpdated?: string;
  }>;
  crossTerritory: {
    sharedCount: number;
    sharedTracks: Array<{
      id: string;
      title: string;
      artist: string;
      territories: Territory[];
      avgPosition: number;
      maxSpread: number;
    }>;
    intersection: Record<string, Record<string, { count: number; jaccard: number }>>;
  };
  timeseries?: Record<string, Array<{ date: string; top200: number }>>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as Period) || 'weekly';
    const windowParam = searchParams.get('window') || (period === 'weekly' ? '12w' : '30d');
    const seriesPoints = parseWindow(windowParam, period);

    // 1) Load current snapshots per territory (prefer storage; fallback Kworb)
    const snapshots: Record<string, any[]> = {};
    for (const t of TERRITORIES) {
      const stored = await MusicTrendsStorage.getLatestChartData(t, period).catch(() => null);
      if (stored?.tracks?.length) {
        snapshots[t] = stored.tracks as any[];
      } else {
        const kw = await getRealSpotifyChartsDataFromKworb(t, period).catch(() => ({ tracks: [] }));
        snapshots[t] = kw.tracks as any[];
      }
    }

    // 2) Territory metrics
    const territories: OverviewResponse['territories'] = {};
    for (const t of TERRITORIES) {
      const tracks = snapshots[t] || [];
      const top10 = sumStreams(tracks.slice(0, 10));
      const top50 = sumStreams(tracks.slice(0, 50));
      const top200 = sumStreams(tracks);
      const top5 = sumStreams(tracks.slice(0, 5));
      const top5Share = top200 > 0 ? top5 / top200 : 0;
      const hhiTracks = calcHHIFromTracks(tracks); // proxy de concentración por track share
      territories[t] = {
        topStreams: { top10, top50, top200 },
        concentration: { top5Share, hhiTracks },
        totalTracks: tracks.length,
        lastUpdated: new Date().toISOString(),
      };
    }

    // 3) Cross-territory intersections + shared tracks (a partir del snapshot actual)
    const { sharedTracks, intersection } = computeCrossTerritory(snapshots);

    // 4) Timeseries (best-effort) usando archivo historical si existe
    const timeseries = buildTimeSeriesFromHistorical(period, seriesPoints);

    const resp: OverviewResponse = {
      period,
      generatedAt: new Date().toISOString(),
      territories,
      crossTerritory: {
        sharedCount: sharedTracks.length,
        sharedTracks: sharedTracks.slice(0, 50),
        intersection,
      },
      timeseries,
    };

    return NextResponse.json({ success: true, data: resp });
  } catch (error) {
    console.error('Error in overview API:', error);
    return NextResponse.json({ success: false, error: 'Failed to build overview' }, { status: 500 });
  }
}

function sumStreams(tracks: any[]): number {
  return tracks.reduce((s, t) => s + (Number(t.streams) || 0), 0);
}

function calcHHIFromTracks(tracks: any[]): number {
  const total = sumStreams(tracks);
  if (total <= 0) return 0;
  // Proxy: HHI de shares por track (no por label). 0–10000 como en competencia.
  const shares = tracks.map((t) => (Number(t.streams) || 0) / total);
  const hhi = shares.reduce((sum, p) => sum + (p * p), 0) * 10000;
  return Math.round(hhi);
}

function keyForTrack(t: any): string {
  if (t.spotifyId) return `sp:${t.spotifyId}`;
  const norm = (s: string) => (s || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  return `tx:${norm(t.title)}|${norm(t.artist)}`;
}

function computeCrossTerritory(snapshots: Record<string, any[]>) {
  const presentByKey: Map<string, { base: any; territories: Territory[]; positions: number[] } > = new Map();

  for (const t of TERRITORIES) {
    const tracks = snapshots[t] || [];
    for (const tr of tracks) {
      const k = keyForTrack(tr);
      if (!presentByKey.has(k)) {
        presentByKey.set(k, { base: tr, territories: [t], positions: [tr.position || 999] });
      } else {
        const entry = presentByKey.get(k)!;
        if (!entry.territories.includes(t)) {
          entry.territories.push(t);
          entry.positions.push(tr.position || 999);
        }
      }
    }
  }

  const shared = Array.from(presentByKey.values())
    .filter((e) => e.territories.length >= 2)
    .map((e) => ({
      id: e.base.spotifyId || keyForTrack(e.base),
      title: e.base.title,
      artist: e.base.artist,
      territories: e.territories as Territory[],
      avgPosition: Math.round(e.positions.reduce((a, b) => a + b, 0) / e.positions.length),
      maxSpread: Math.max(...e.positions) - Math.min(...e.positions),
    }))
    .sort((a, b) => a.avgPosition - b.avgPosition);

  // Intersection matrix (conteo y jaccard)
  const sets: Record<string, Set<string>> = {};
  for (const t of TERRITORIES) {
    const list = snapshots[t] || [];
    sets[t] = new Set(list.map((tr) => keyForTrack(tr)));
  }
  const intersection: Record<string, Record<string, { count: number; jaccard: number }>> = {};
  for (const a of TERRITORIES) {
    intersection[a] = {} as any;
    for (const b of TERRITORIES) {
      const A = sets[a], B = sets[b];
      const inter = A && B ? intersectCount(A, B) : 0;
      const union = A && B ? A.size + B.size - inter : 0;
      const j = union > 0 ? inter / union : 0;
      intersection[a][b] = { count: inter, jaccard: Number(j.toFixed(3)) };
    }
  }

  return { sharedTracks: shared, intersection };
}

function intersectCount(a: Set<string>, b: Set<string>): number {
  let c = 0;
  for (const x of a) if (b.has(x)) c++;
  return c;
}

function parseWindow(win: string, period: Period): number {
  const m = win.match(/(\d+)([dw])/i);
  if (!m) return period === 'weekly' ? 12 : 30;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit === 'w') return n; // weeks
  if (unit === 'd') return n; // days (used only if daily)
  return period === 'weekly' ? 12 : 30;
}

function buildTimeSeriesFromHistorical(period: Period, points: number): Record<string, Array<{ date: string; top200: number }>> | undefined {
  try {
    // Load file if exists
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'historical-charts.json');
    if (!fs.existsSync(dataPath)) return undefined;
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const allEntries = Object.values(data) as any[];

    const out: Record<string, Array<{ date: string; top200: number }>> = {};
    for (const t of TERRITORIES) {
      const series = allEntries
        .filter((e) => e.territory === t && e.period === period)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-points)
        .map((e) => ({ date: e.date, top200: Number(e.aggregatedData?.top200_streams) || 0 }));
      out[t] = series;
    }
    return out;
  } catch (e) {
    console.warn('Timeseries build failed:', e instanceof Error ? e.message : e);
    return undefined;
  }
}

