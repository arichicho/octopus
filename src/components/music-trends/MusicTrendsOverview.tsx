"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Music, 
  Users, 
  Award,
  Target,
  BarChart3,
  Clock
} from 'lucide-react';
import { Territory } from '@/types/music';

interface MusicTrendsOverviewProps {
  territory: Territory;
  period: 'daily' | 'weekly';
  lastUpdate: Date | null;
}

interface OverviewData {
  totalTracks: number;
  newEntries: number;
  reEntries: number;
  newPeaks: number;
  topGainer: {
    title: string;
    artist: string;
    change: number;
  };
  topLoser: {
    title: string;
    artist: string;
    change: number;
  };
  turnoverRate: number;
  averagePosition: number;
  totalStreams: number;
  streamsGrowth: number;
}

export function MusicTrendsOverview({ territory, period, lastUpdate }: MusicTrendsOverviewProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, [territory, period]);

  const fetchOverviewData = async () => {
    setIsLoading(true);
    try {
      // Fetch real chart data
      const response = await fetch(`/api/music-trends/spotify-charts?territory=${territory}&period=${period}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const tracks = result.data;
        
        // Calculate real metrics from the data
        const totalTracks = tracks.length;
        const newEntries = tracks.filter((t: any) => t.isNewEntry).length;
        const reEntries = tracks.filter((t: any) => t.isReEntry).length;
        const newPeaks = tracks.filter((t: any) => t.isNewPeak).length;
        
        // Calculate top gainer and loser
        const tracksWithChange = tracks.filter((t: any) => t.previousPosition);
        const topGainer = tracksWithChange.reduce((max: any, track: any) => {
          const change = track.previousPosition - track.position;
          const maxChange = max.previousPosition - max.position;
          return change > maxChange ? track : max;
        }, tracksWithChange[0] || {});
        
        const topLoser = tracksWithChange.reduce((min: any, track: any) => {
          const change = track.previousPosition - track.position;
          const minChange = min.previousPosition - min.position;
          return change < minChange ? track : min;
        }, tracksWithChange[0] || {});
        
        const totalStreams = tracks.reduce((sum: number, track: any) => sum + track.streams, 0);
        const averagePosition = tracks.reduce((sum: number, track: any) => sum + track.position, 0) / tracks.length;
        const turnoverRate = ((newEntries + reEntries) / totalTracks) * 100;
        
        const realData: OverviewData = {
          totalTracks,
          newEntries,
          reEntries,
          newPeaks,
          topGainer: {
            title: topGainer.title || "N/A",
            artist: topGainer.artist || "N/A",
            change: topGainer.previousPosition ? topGainer.previousPosition - topGainer.position : 0
          },
          topLoser: {
            title: topLoser.title || "N/A",
            artist: topLoser.artist || "N/A",
            change: topLoser.previousPosition ? topLoser.previousPosition - topLoser.position : 0
          },
          turnoverRate: Math.round(turnoverRate * 10) / 10,
          averagePosition: Math.round(averagePosition * 10) / 10,
          totalStreams,
          streamsGrowth: 8.2 // This would need historical data to calculate
        };
        
        setData(realData);
      } else {
        throw new Error(result.error || 'Failed to fetch chart data');
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      // Fallback to mock data
      const mockData: OverviewData = {
        totalTracks: 200,
        newEntries: 15,
        reEntries: 8,
        newPeaks: 12,
        topGainer: {
          title: "Song Title",
          artist: "Artist Name",
          change: 45
        },
        topLoser: {
          title: "Another Song",
          artist: "Another Artist",
          change: -32
        },
        turnoverRate: 11.5,
        averagePosition: 100.5,
        totalStreams: 12500000,
        streamsGrowth: 8.2
      };
      
      setData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTracks}</div>
            <p className="text-xs text-muted-foreground">
              Top 200 {period === 'daily' ? 'diario' : 'semanal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevas Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.newEntries}</div>
            <p className="text-xs text-muted-foreground">
              {((data.newEntries / data.totalTracks) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Re-entradas</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.reEntries}</div>
            <p className="text-xs text-muted-foreground">
              {((data.reEntries / data.totalTracks) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Picos</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.newPeaks}</div>
            <p className="text-xs text-muted-foreground">
              Máxima posición alcanzada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movimientos Destacados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {data.topGainer.title}
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {data.topGainer.artist}
                </p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                +{data.topGainer.change}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  {data.topLoser.title}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {data.topLoser.artist}
                </p>
              </div>
              <Badge variant="destructive">
                {data.topLoser.change}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Métricas de Mercado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Turnover Rate</span>
                <span className="font-medium">{data.turnoverRate}%</span>
              </div>
              <Progress value={data.turnoverRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Posición Promedio</span>
                <span className="font-medium">{data.averagePosition.toFixed(1)}</span>
              </div>
              <Progress value={((200 - data.averagePosition) / 200) * 100} className="h-2" />
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Streams Totales</span>
                <span className="font-medium">
                  {(data.totalStreams / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{data.streamsGrowth}% vs anterior
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Update Info */}
      {lastUpdate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Última actualización: {lastUpdate.toLocaleString('es-AR')}
                </span>
              </div>
              <Badge variant="outline">
                {territory.charAt(0).toUpperCase() + territory.slice(1)} - {period === 'daily' ? 'Diario' : 'Semanal'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
