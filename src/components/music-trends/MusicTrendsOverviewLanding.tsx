"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Globe, RefreshCw, Share2, Layers, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

type Territory = 'argentina' | 'spanish' | 'mexico' | 'global';

interface OverviewData {
  period: 'daily' | 'weekly';
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

export function MusicTrendsOverviewLanding() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [normalize, setNormalize] = useState<boolean>(false);

  useEffect(() => {
    fetchOverview();
  }, [period]);

  async function fetchOverview() {
    setIsLoading(true);
    setError(null);
    try {
      const ts = Date.now();
      const res = await fetch(`/api/music-trends/overview?period=${period}&t=${ts}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      if (!j.success) throw new Error(j.error || 'Unknown error');
      setData(j.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  }

  const fmt = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}K` : String(n);
  const pct = (p: number) => `${(p*100).toFixed(1)}%`;

  const labelOf: Record<Territory, string> = {
    argentina: 'Argentina',
    spanish: 'España',
    mexico: 'México',
    global: 'Global',
  };

  const seriesColors: Record<Territory, string> = {
    argentina: '#2563eb', // blue-600
    spanish: '#f59e0b',   // amber-500
    mexico: '#10b981',    // emerald-500
    global: '#8b5cf6',    // violet-500
  };

  function buildChartData(): Array<{ date: string } & Partial<Record<Territory, number>>> {
    if (!data?.timeseries) return [];
    const dates = new Set<string>();
    (Object.keys(data.timeseries) as Territory[]).forEach((t) => {
      (data.timeseries![t] || []).forEach((pt) => dates.add(pt.date));
    });
    const sorted = Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Compute base for normalization
    const base: Partial<Record<Territory, number>> = {};
    if (normalize) {
      (Object.keys(data.timeseries) as Territory[]).forEach((t) => {
        const arr = data.timeseries![t] || [];
        const firstNonZero = arr.find((x) => (x.top200 || 0) > 0);
        base[t] = firstNonZero?.top200 || 0;
      });
    }

    return sorted.map((d) => {
      const row: any = { date: d };
      (Object.keys(data.timeseries!) as Territory[]).forEach((t) => {
        const point = (data.timeseries![t] || []).find((x) => x.date === d);
        const val = point?.top200 || 0;
        if (normalize) {
          const b = base[t!] || 0;
          row[t] = b > 0 ? (val / b) * 100 : 0;
        } else {
          row[t] = val;
        }
      });
      return row;
    });
  }

  function heatColor(v: number): string {
    // v in [0,1] → blue to green scale
    const x = Math.max(0, Math.min(1, v));
    const r = Math.round(30 + 20 * x);
    const g = Math.round(120 + 100 * x);
    const b = Math.round(200 - 120 * x);
    return `rgb(${r},${g},${b})`;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-gray-600"><Globe className="w-5 h-5"/>Cargando overview...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-red-600">Error cargando overview: {error}</div>
            <Button onClick={fetchOverview} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2"/>Reintentar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const territories = ['argentina','spanish','mexico','global'] as Territory[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center"><Globe className="w-6 h-6 text-white"/></div>
          <div>
            <h2 className="text-2xl font-bold">Overview Global</h2>
            <p className="text-sm text-gray-600">Comparativo de Argentina, España, México y Global</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{period === 'weekly' ? 'Semanal' : 'Diario'}</Badge>
          <Button size="sm" variant="outline" onClick={() => setPeriod(period === 'weekly' ? 'daily' : 'weekly')}>
            Cambiar a {period === 'weekly' ? 'Diario' : 'Semanal'}
          </Button>
          <Button size="sm" variant="outline" onClick={fetchOverview}><RefreshCw className="w-4 h-4 mr-2"/>Actualizar</Button>
        </div>
      </div>

      {/* KPI Cards por territorio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {territories.map((t) => {
          const tData = data.territories[t];
          return (
            <Card key={t}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="capitalize">{labelOf[t]}</span>
                  <Layers className="w-4 h-4 text-gray-500"/>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>Top200</span><span className="font-semibold">{fmt(tData.topStreams.top200)}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Top50</span><span className="font-semibold">{fmt(tData.topStreams.top50)}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Top10</span><span className="font-semibold">{fmt(tData.topStreams.top10)}</span></div>
                <div className="flex items-center justify-between text-xs text-gray-600"><span>Top5 Share</span><span>{pct(tData.concentration.top5Share)}</span></div>
                <div className="flex items-center justify-between text-xs text-gray-600"><span>HHI (tracks)</span><span>{tData.concentration.hhiTracks}</span></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparative Streams (timeseries) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="w-5 h-5"/>Evolución Top200 (comparativa)</span>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{normalize ? 'Base 100' : 'Absoluto'}</Badge>
              <Button size="sm" variant="outline" onClick={() => setNormalize(!normalize)}>Normalizar</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.timeseries && Object.keys(data.timeseries).length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={buildChartData()} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                  <Tooltip formatter={(value: any) => (normalize ? `${(value as number).toFixed(0)}%` : fmt(value as number))} />
                  <Legend />
                  {territories.map((t) => (
                    <Line key={t} type="monotone" dataKey={t} name={labelOf[t]} stroke={seriesColors[t]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Sin histórico configurado (timeseries). Se mostrará cuando se carguen datos históricos.</div>
          )}
        </CardContent>
      </Card>

      {/* Shared Tracks + Intersection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="w-5 h-5"/>Tracks en múltiples territorios</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 mb-2">Total: {data.crossTerritory.sharedCount}</div>
            <div className="space-y-2">
              {data.crossTerritory.sharedTracks.slice(0, 10).map((tr) => (
                <div key={tr.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <div className="font-medium text-sm">{tr.title}</div>
                    <div className="text-xs text-gray-600">{tr.artist}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs">Pos. Prom: <span className="font-semibold">#{tr.avgPosition}</span></div>
                    <div className="text-xs">Territorios: {tr.territories.map((x) => x[0].toUpperCase()).join(', ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5"/>Intersección (Jaccard)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 text-xs font-semibold mb-1">
              <div></div>
              {territories.map(t => (<div key={t} className="text-center capitalize">{labelOf[t][0]}</div>))}
            </div>
            {territories.map((a) => (
              <div key={a} className="grid grid-cols-5 text-xs items-center">
                <div className="capitalize font-medium">{labelOf[a]}</div>
                {territories.map((b) => {
                  const cell = data.crossTerritory.intersection[a][b];
                  const bg = heatColor(cell.jaccard);
                  return (
                    <div key={`${a}-${b}`} className="text-center border p-1 rounded-sm" style={{ background: bg }}>
                      <div className="font-semibold text-white">{cell.jaccard}</div>
                      <div className="text-[10px] text-white/90">{cell.count}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MusicTrendsOverviewLanding;
