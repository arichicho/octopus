"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Music,
  Award,
  Users,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Territory } from '@/types/music';
import { ExecutiveKPIs, StreamsAggregates, EntriesAnalysis, MoversAnalysis } from '@/types/music-analysis';
import { StreamsEvolutionModal } from './StreamsEvolutionModal';

interface MusicTrendsSummaryProps {
  territory: Territory;
  period: 'daily' | 'weekly';
  lastUpdate?: Date | null;
}

interface SummaryData {
  kpis: ExecutiveKPIs;
  streams: StreamsAggregates;
  entries: EntriesAnalysis;
  movers: MoversAnalysis;
  lastUpdated: Date;
}

export function MusicTrendsSummary({ territory, period, lastUpdate }: MusicTrendsSummaryProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evolutionModal, setEvolutionModal] = useState<{
    isOpen: boolean;
    tier: 'top10' | 'top50' | 'top200';
  }>({
    isOpen: false,
    tier: 'top10'
  });

  useEffect(() => {
    fetchSummaryData();
  }, [territory, period]);

  const fetchSummaryData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/music-trends/summary?territory=${territory}&period=${period}&t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch summary data: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch summary data');
      }
    } catch (error) {
      console.error('Error fetching summary data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const openEvolutionModal = (tier: 'top10' | 'top50' | 'top200') => {
    setEvolutionModal({ isOpen: true, tier });
  };

  const closeEvolutionModal = () => {
    setEvolutionModal({ isOpen: false, tier: 'top10' });
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatPercentage = (num: number | undefined): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return 'N/A';
    }
    // Special value indicating no historical data
    if (num === 999999) {
      return 'N/A';
    }
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const safeToFixed = (num: number | undefined, decimals: number = 1): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0' + (decimals > 0 ? '.' + '0'.repeat(decimals) : '');
    }
    return num.toFixed(decimals);
  };

  const getChangeColor = (value: number): string => {
    if (value === 999999) return 'text-gray-400'; // N/A color
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (value: number) => {
    if (value === 999999) return <Clock className="w-4 h-4" />; // N/A icon
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return <BarChart3 className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
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
              <h3 className="font-medium">Error loading summary data</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button 
            onClick={fetchSummaryData} 
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
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No summary data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with last update */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Resumen Ejecutivo
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {territory.charAt(0).toUpperCase() + territory.slice(1)} • {period === 'daily' ? 'Diario' : 'Semanal'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Actualizado: {new Date(data.lastUpdated).toLocaleTimeString()}</span>
          </Badge>
          <Button 
            onClick={fetchSummaryData} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Debuts</p>
                <p className="text-2xl font-bold">{data.kpis.debuts}</p>
                <p className="text-xs text-gray-500">Nuevas entradas</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Re-entradas</p>
                <p className="text-2xl font-bold">{data.kpis.reentries}</p>
                <p className="text-xs text-gray-500">Reingresos</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Turnover Rate</p>
                <p className="text-2xl font-bold">{safeToFixed(data.kpis.turnover_rate, 1)}%</p>
                <p className="text-xs text-gray-500">Rotación total</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Volatilidad</p>
                <p className="text-2xl font-bold">{safeToFixed(data.movers.volatility_index, 1)}</p>
                <p className="text-xs text-gray-500">Índice de cambio</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streams Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle
              className="text-sm flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => openEvolutionModal('top10')}
            >
              <BarChart3 className="w-4 h-4" />
              Top 10 Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-medium">{formatNumber(data.streams.current.top10)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Share</span>
                <span className="font-medium">{safeToFixed((data.kpis.top10_share || 0) * 100, 1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">vs Promedio 12s</span>
                <span className={`text-sm flex items-center gap-1 ${getChangeColor(data.streams.growth_pct.vs_previous.top10)}`}>
                  {getChangeIcon(data.streams.growth_pct.vs_previous.top10)}
                  {formatPercentage(data.streams.growth_pct.vs_previous.top10)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle
              className="text-sm flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => openEvolutionModal('top50')}
            >
              <BarChart3 className="w-4 h-4" />
              Top 50 Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-medium">{formatNumber(data.streams.current.top50)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Share</span>
                <span className="font-medium">{safeToFixed((data.kpis.top50_share || 0) * 100, 1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">vs Promedio 12s</span>
                <span className={`text-sm flex items-center gap-1 ${getChangeColor(data.streams.growth_pct.vs_previous.top50)}`}>
                  {getChangeIcon(data.streams.growth_pct.vs_previous.top50)}
                  {formatPercentage(data.streams.growth_pct.vs_previous.top50)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle
              className="text-sm flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => openEvolutionModal('top200')}
            >
              <BarChart3 className="w-4 h-4" />
              Top 200 Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-medium">{formatNumber(data.streams.current.top200)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Share</span>
                <span className="font-medium">{safeToFixed((data.kpis.top200_share || 0) * 100, 1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">vs Promedio 12s</span>
                <span className={`text-sm flex items-center gap-1 ${getChangeColor(data.streams.growth_pct.vs_previous.top200)}`}>
                  {getChangeIcon(data.streams.growth_pct.vs_previous.top200)}
                  {formatPercentage(data.streams.growth_pct.vs_previous.top200)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Turnover Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Análisis de Rotación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Music className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{data.entries.debut_count}</p>
              <p className="text-sm text-gray-600">Nuevos</p>
              <p className="text-xs text-gray-500">{safeToFixed(data.entries.turnover_new_pct, 1)}% del total</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{data.entries.reentry_count}</p>
              <p className="text-sm text-gray-600">Re-entradas</p>
              <p className="text-xs text-gray-500">{safeToFixed(data.entries.turnover_reentry_pct, 1)}% del total</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{data.entries.exit_count}</p>
              <p className="text-sm text-gray-600">Salidas</p>
              <p className="text-xs text-gray-500">{safeToFixed(data.entries.turnover_exit_pct, 1)}% del total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track of the Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Tema de la Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{data.kpis.track_of_the_week.track_name}</h3>
              <p className="text-gray-600">{data.kpis.track_of_the_week.artists}</p>
              <p className="text-sm text-gray-500">Posición #{data.kpis.track_of_the_week.position}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                +{formatNumber(data.kpis.track_of_the_week.delta_streams)}
              </p>
              <p className="text-sm text-gray-500">streams adicionales</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolution Modal */}
      <StreamsEvolutionModal
        isOpen={evolutionModal.isOpen}
        onClose={closeEvolutionModal}
        territory={territory}
        period={period}
        tier={evolutionModal.tier}
      />
    </div>
  );
}
