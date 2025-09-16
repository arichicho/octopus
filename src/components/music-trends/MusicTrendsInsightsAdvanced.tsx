"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Music, 
  Award, 
  Users, 
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Globe,
  Zap,
  Target,
  Activity,
  MapPin,
  Building,
  Star
} from 'lucide-react';
import { Territory } from '@/types/music';
import { 
  MoversAnalysis, 
  EntriesAnalysis, 
  PeaksAnalysis, 
  StreamsAnalysis, 
  CollaborationsAnalysis,
  MomentumAnalysis,
  GenreOriginAnalysis,
  LabelDistributorAnalysis,
  RisingArtistsAnalysis,
  WatchlistAnalysis
} from '@/types/music-analysis';

interface MusicTrendsInsightsAdvancedProps {
  territory: Territory;
  period: 'daily' | 'weekly';
}

interface InsightsData {
  movers: MoversAnalysis;
  entries: EntriesAnalysis;
  peaks: PeaksAnalysis;
  streams: StreamsAnalysis;
  collaborations: CollaborationsAnalysis;
  momentum: MomentumAnalysis;
  genreOrigin: GenreOriginAnalysis;
  labelDistributor: LabelDistributorAnalysis;
  risingArtists: RisingArtistsAnalysis;
  watchlist: WatchlistAnalysis;
  lastUpdated: Date;
}

export function MusicTrendsInsightsAdvanced({ territory, period }: MusicTrendsInsightsAdvancedProps) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsightsData();
  }, [territory, period]);

  const fetchInsightsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/music-trends/insights-advanced?territory=${territory}&period=${period}&t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch insights data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch insights data');
      }
    } catch (error) {
      console.error('Error fetching insights data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getChangeColor = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando insights avanzados...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <h3 className="font-medium">Error loading insights data</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button 
            onClick={fetchInsightsData} 
            variant="outline" 
            size="sm" 
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No insights data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Insights Avanzados
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {territory.charAt(0).toUpperCase() + territory.slice(1)} • {period === 'daily' ? 'Diario' : 'Semanal'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Actualizado: {new Date(data.lastUpdated).toLocaleTimeString()}
          </Badge>
          <Button 
            onClick={fetchInsightsData} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Insights Tabs */}
      <Tabs defaultValue="movers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="movers" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Movers
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            Entradas
          </TabsTrigger>
          <TabsTrigger value="momentum" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Momentum
          </TabsTrigger>
          <TabsTrigger value="genres" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Géneros
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Watchlist
          </TabsTrigger>
        </TabsList>

        {/* Movers Tab */}
        <TabsContent value="movers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Gainers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Top Subidas (Posición)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.movers.top_gainers.slice(0, 10).map((track, index) => (
                    <div key={track.track_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{track.track_name}</p>
                          <p className="text-xs text-gray-600">{track.artists}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="bg-green-600">
                          {track.delta_pos} pos
                        </Badge>
                        <p className="text-xs text-gray-500">#{track.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Losers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Top Caídas (Posición)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.movers.top_losers.slice(0, 10).map((track, index) => (
                    <div key={track.track_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{track.track_name}</p>
                          <p className="text-xs text-gray-600">{track.artists}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          +{track.delta_pos} pos
                        </Badge>
                        <p className="text-xs text-gray-500">#{track.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volatility Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Métricas de Volatilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{data.movers.mean_delta_pos.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Cambio Promedio</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{data.movers.median_delta_pos.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Cambio Mediano</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{data.movers.volatility_index.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Índice Volatilidad</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Debuts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-blue-600" />
                  Top Debuts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.entries.top_debuts.slice(0, 10).map((track, index) => (
                    <div key={track.track_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{track.track_name}</p>
                          <p className="text-xs text-gray-600">{track.artists}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="bg-blue-600">
                          #{track.position}
                        </Badge>
                        <p className="text-xs text-gray-500">{formatNumber(track.streams || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Relevant Re-entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Re-entradas Relevantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.entries.relevant_reentries.slice(0, 10).map((track, index) => (
                    <div key={track.track_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{track.track_name}</p>
                          <p className="text-xs text-gray-600">{track.artists}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="bg-green-600">
                          #{track.position}
                        </Badge>
                        <p className="text-xs text-gray-500">Re-entry</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Turnover Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Análisis de Rotación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{data.entries.debut_count}</p>
                  <p className="text-sm text-gray-600">Nuevos</p>
                  <p className="text-xs text-gray-500">{data.entries.turnover_new_pct.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{data.entries.reentry_count}</p>
                  <p className="text-sm text-gray-600">Re-entradas</p>
                  <p className="text-xs text-gray-500">{data.entries.turnover_reentry_pct.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{data.entries.exit_count}</p>
                  <p className="text-sm text-gray-600">Salidas</p>
                  <p className="text-xs text-gray-500">{data.entries.turnover_exit_pct.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Momentum Tab */}
        <TabsContent value="momentum" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Breakout Watchlist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Breakout Watchlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.momentum.breakout_watchlist.slice(0, 10).map((track, index) => (
                    <div key={track.track_id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{track.track_name}</p>
                          <p className="text-xs text-gray-600">{track.artists}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="bg-purple-600">
                          {track.momentum_score?.toFixed(0)} pts
                        </Badge>
                        <p className="text-xs text-gray-500">#{track.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Momentum Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Momentum Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.momentum.momentum_leaderboard.slice(0, 10).map((track, index) => (
                    <div key={track.track_id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{track.track_name}</p>
                          <p className="text-xs text-gray-600">{track.artists}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="bg-yellow-600">
                          {track.momentum_score?.toFixed(0)} pts
                        </Badge>
                        <p className="text-xs text-gray-500">#{track.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Genres Tab */}
        <TabsContent value="genres" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Genre Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Distribución por Género
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.genreOrigin.genre_distribution.slice(0, 10).map((genre, index) => (
                    <div key={genre.genre} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{genre.genre}</p>
                          <p className="text-xs text-gray-600">{genre.count} tracks</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {genre.percentage.toFixed(1)}%
                        </Badge>
                        <p className="text-xs text-gray-500">Pos. #{genre.avg_position.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Origin Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Distribución por Origen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.genreOrigin.origin_distribution.slice(0, 10).map((origin, index) => (
                    <div key={origin.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{origin.country}</p>
                          {origin.city && <p className="text-xs text-gray-600">{origin.city}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {origin.percentage.toFixed(1)}%
                        </Badge>
                        <p className="text-xs text-gray-500">{origin.count} tracks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Watchlist Tab */}
        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Watchlist Curada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.watchlist.curated_watchlist.slice(0, 10).map((item, index) => (
                  <div key={item.track_id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{item.track_name}</p>
                        <p className="text-sm text-gray-600">{item.artists}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.justification.map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="bg-yellow-600 mb-1">
                        {item.momentum_score.toFixed(0)} pts
                      </Badge>
                      <p className="text-sm text-gray-500">#{item.position}</p>
                      <p className="text-xs text-gray-400">
                        {item.predicted_top50_next_week ? 'Pred: Top 50' : 'Pred: Outside Top 50'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
