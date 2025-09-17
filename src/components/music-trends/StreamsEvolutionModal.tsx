"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { X, TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { Territory } from '@/types/music';

interface EvolutionDataPoint {
  date: string;
  week_number: number;
  year: number;
  top10_streams: number;
  top50_streams: number;
  top200_streams: number;
}

interface EvolutionStats {
  period: {
    start: string;
    end: string;
    weeks: number;
  };
  growth: {
    top10: { absolute: number; percent: number };
    top50: { absolute: number; percent: number };
    top200: { absolute: number; percent: number };
  };
}

interface StreamsEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  territory: Territory;
  period: 'daily' | 'weekly';
  tier: 'top10' | 'top50' | 'top200';
}

export function StreamsEvolutionModal({ isOpen, onClose, territory, period, tier }: StreamsEvolutionModalProps) {
  const [data, setData] = useState<EvolutionDataPoint[]>([]);
  const [stats, setStats] = useState<EvolutionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchEvolutionData();
    }
  }, [isOpen, territory, period]);

  const fetchEvolutionData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/music-trends/evolution?territory=${territory}&period=${period}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch evolution data: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data.evolution);
        setStats(result.data.stats);
      } else {
        throw new Error(result.error || 'Failed to fetch evolution data');
      }
    } catch (error) {
      console.error('Error fetching evolution data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTierLabel = (tier: string): string => {
    const labels = {
      'top10': 'Top 10',
      'top50': 'Top 50',
      'top200': 'Top 200'
    };
    return labels[tier as keyof typeof labels] || tier;
  };

  const getTierData = (tier: string): string => {
    const fields = {
      'top10': 'top10_streams',
      'top50': 'top50_streams',
      'top200': 'top200_streams'
    };
    return fields[tier as keyof typeof fields] || 'top200_streams';
  };

  const getTierColor = (tier: string): string => {
    const colors = {
      'top10': '#3B82F6', // Blue
      'top50': '#10B981', // Green
      'top200': '#8B5CF6'  // Purple
    };
    return colors[tier as keyof typeof colors] || '#8B5CF6';
  };

  const getTierStats = (tier: string) => {
    if (!stats) return null;
    const statKeys = {
      'top10': stats.growth.top10,
      'top50': stats.growth.top50,
      'top200': stats.growth.top200
    };
    return statKeys[tier as keyof typeof statKeys] || stats.growth.top200;
  };

  const territoryNames = {
    'argentina': 'Argentina',
    'spanish': 'España',
    'mexico': 'México',
    'global': 'Global'
  };

  // Calculate moving averages
  const calculateMovingAverage = (data: number[], windowSize: number): (number | null)[] => {
    return data.map((_, index) => {
      if (index < windowSize - 1) {
        return null; // Not enough data points
      }
      const slice = data.slice(index - windowSize + 1, index + 1);
      const sum = slice.reduce((acc, val) => acc + val, 0);
      return sum / windowSize;
    });
  };

  const rawStreams = data.map(point => point[getTierData(tier) as keyof EvolutionDataPoint] as number);
  const ma4 = calculateMovingAverage(rawStreams, 4);
  const ma12 = calculateMovingAverage(rawStreams, 12);

  const chartData = data.map((point, index) => ({
    date: formatDate(point.date),
    fullDate: point.date,
    streams: point[getTierData(tier) as keyof EvolutionDataPoint] as number,
    ma4: ma4[index],
    ma12: ma12[index],
    week: `Semana ${point.week_number}`
  }));

  const tierStats = getTierStats(tier);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Evolución {getTierLabel(tier)} Streams
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {territoryNames[territory as keyof typeof territoryNames]}
                </Badge>
                <Badge variant="outline">
                  {period === 'weekly' ? 'Semanal' : 'Diario'}
                </Badge>
                {stats && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {stats.period.weeks} semanas
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando datos de evolución...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {!isLoading && !error && data.length > 0 && (
          <div className="space-y-6">
            {/* Stats Summary */}
            {tierStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Período</div>
                  <div className="font-semibold">
                    {stats?.period.start ? formatDate(stats.period.start) : ''} - {stats?.period.end ? formatDate(stats.period.end) : ''}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Crecimiento Total</div>
                  <div className={`font-semibold flex items-center justify-center gap-1 ${
                    tierStats.percent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tierStats.percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {tierStats.percent >= 0 ? '+' : ''}{tierStats.percent.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Cambio Absoluto</div>
                  <div className={`font-semibold ${
                    tierStats.absolute >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tierStats.absolute >= 0 ? '+' : ''}{formatNumber(tierStats.absolute)}
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="bg-white rounded-lg border p-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tickFormatter={formatNumber}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (value === null) return ['N/A', name];
                        return [formatNumber(value), name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `${data.week} (${data.fullDate})`;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="streams"
                      stroke={getTierColor(tier)}
                      strokeWidth={2}
                      dot={{ fill: getTierColor(tier), strokeWidth: 2, r: 4 }}
                      name={`${getTierLabel(tier)} Streams`}
                    />
                    <Line
                      type="monotone"
                      dataKey="ma4"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Media Móvil 4 sem"
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ma12"
                      stroke="#EF4444"
                      strokeWidth={2}
                      strokeDasharray="10 5"
                      dot={false}
                      name="Media Móvil 12 sem"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Datos Históricos
                </h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3">Fecha</th>
                      <th className="text-left p-3">Semana</th>
                      <th className="text-right p-3">Streams</th>
                      <th className="text-right p-3">MA 4s</th>
                      <th className="text-right p-3">MA 12s</th>
                      <th className="text-right p-3">Cambio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((point, index) => {
                      const prevStreams = index > 0 ? chartData[index - 1].streams : point.streams;
                      const change = index > 0 ? point.streams - prevStreams : 0;
                      const changePercent = index > 0 && prevStreams > 0 ? ((change / prevStreams) * 100) : 0;

                      return (
                        <tr key={point.fullDate} className="border-b">
                          <td className="p-3">{point.fullDate}</td>
                          <td className="p-3">{point.week}</td>
                          <td className="p-3 text-right font-mono">{formatNumber(point.streams)}</td>
                          <td className="p-3 text-right font-mono text-orange-600">
                            {point.ma4 ? formatNumber(point.ma4) : '-'}
                          </td>
                          <td className="p-3 text-right font-mono text-red-600">
                            {point.ma12 ? formatNumber(point.ma12) : '-'}
                          </td>
                          <td className={`p-3 text-right font-mono ${
                            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {index === 0 ? '-' : `${change >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay datos históricos disponibles para este territorio y período.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}