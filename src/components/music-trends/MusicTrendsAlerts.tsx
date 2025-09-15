"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  Clock,
  Filter,
  Bell
} from 'lucide-react';
import { Territory, MusicAlert } from '@/types/music';

interface MusicTrendsAlertsProps {
  territory: Territory;
  period: 'daily' | 'weekly';
}

export function MusicTrendsAlerts({ territory, period }: MusicTrendsAlertsProps) {
  const [alerts, setAlerts] = useState<MusicAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    fetchAlertsData();
  }, [territory, period]);

  const fetchAlertsData = async () => {
    setIsLoading(true);
    try {
      // Fetch real chart data to generate alerts from Top 200
      const timestamp = Date.now();
      const response = await fetch(`/api/music-trends/spotify-charts?territory=${territory}&period=${period}&t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const tracks = result.data;
        
        // Generate alerts from real data (Top 200)
        const realAlerts: MusicAlert[] = [];
        
        // Alert 1: Significant jumps (>10 positions)
        const significantJumps = tracks.filter((track: any) => 
          track.previousPosition && (track.previousPosition - track.position) > 10
        ).slice(0, 5);
        
        significantJumps.forEach((track: any, index: number) => {
          const change = track.previousPosition - track.position;
          realAlerts.push({
            id: `jump-${index}`,
            type: 'jump',
            trackId: track.id,
            trackTitle: track.title,
            artist: track.artist,
            territory,
            period,
            date: new Date(track.date),
            message: `Salto significativo: +${change} posiciones (${track.previousPosition} → ${track.position})`,
            severity: change > 20 ? 'high' : 'medium',
            read: false
          });
        });
        
        // Alert 2: New entries in Top 50
        const top50NewEntries = tracks.filter((track: any) => 
          track.isNewEntry && track.position <= 50
        ).slice(0, 5);
        
        top50NewEntries.forEach((track: any, index: number) => {
          realAlerts.push({
            id: `debut-${index}`,
            type: 'debut',
            trackId: track.id,
            trackTitle: track.title,
            artist: track.artist,
            territory,
            period,
            date: new Date(track.date),
            message: `Debut en posición ${track.position}`,
            severity: track.position <= 10 ? 'high' : 'medium',
            read: false
          });
        });
        
        // Alert 3: Significant drops (>20 positions from Top 50)
        const significantDrops = tracks.filter((track: any) => 
          track.previousPosition && 
          track.previousPosition <= 50 && 
          (track.position - track.previousPosition) > 20
        ).slice(0, 5);
        
        significantDrops.forEach((track: any, index: number) => {
          const change = track.position - track.previousPosition;
          realAlerts.push({
            id: `drop-${index}`,
            type: 'drop',
            trackId: track.id,
            trackTitle: track.title,
            artist: track.artist,
            territory,
            period,
            date: new Date(track.date),
            message: `Caída significativa: -${change} posiciones (${track.previousPosition} → ${track.position})`,
            severity: 'high',
            read: false
          });
        });
        
        // Alert 4: Risk of dropping out (positions 180-200)
        const riskTracks = tracks.filter((track: any) => 
          track.position >= 180 && track.position <= 200
        ).slice(0, 3);
        
        riskTracks.forEach((track: any, index: number) => {
          realAlerts.push({
            id: `risk-${index}`,
            type: 'risk',
            trackId: track.id,
            trackTitle: track.title,
            artist: track.artist,
            territory,
            period,
            date: new Date(track.date),
            message: `Riesgo de salir del Top 200 (posición ${track.position})`,
            severity: 'medium',
            read: false
          });
        });
        
        setAlerts(realAlerts);
      } else {
        throw new Error(result.error || 'Failed to fetch chart data');
      }
    } catch (error) {
      console.error('Error fetching alerts data:', error);
      // Fallback to mock data if API fails
      const mockAlerts: MusicAlert[] = [
        {
          id: '1',
          type: 'jump',
          severity: 'high',
          track: {
            id: 'track-1',
            title: 'Viral Hit',
            artist: 'TikTok Sensation',
            position: 12,
            previousPosition: 45,
            streams: 2500000,
            weeksOnChart: 3,
            isNewEntry: false,
            isReEntry: false,
            isNewPeak: true,
            territory,
            period,
            date: new Date()
          },
          message: 'Salto significativo: +33 posiciones',
          value: 33,
          threshold: 10,
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'debut',
          severity: 'medium',
          track: {
            id: 'track-2',
            title: 'New Artist Debut',
            artist: 'Emerging Artist',
            position: 8,
            streams: 1800000,
            weeksOnChart: 1,
            isNewEntry: true,
            isReEntry: false,
            isNewPeak: true,
            territory,
            period,
            date: new Date()
          },
          message: 'Debut en Top 10',
          value: 8,
          threshold: 10,
          createdAt: new Date()
        },
        {
          id: '3',
          type: 'drop',
          severity: 'high',
          track: {
            id: 'track-3',
            title: 'Fading Track',
            artist: 'Veteran Artist',
            position: 67,
            previousPosition: 23,
            streams: 800000,
            weeksOnChart: 12,
            isNewEntry: false,
            isReEntry: false,
            isNewPeak: false,
            territory,
            period,
            date: new Date()
          },
          message: 'Caída significativa: -44 posiciones',
          value: -44,
          threshold: -20,
          createdAt: new Date()
        },
        {
          id: '4',
          type: 'peak',
          severity: 'medium',
          track: {
            id: 'track-4',
            title: 'Peak Performance',
            artist: 'Chart Topper',
            position: 5,
            previousPosition: 7,
            streams: 3200000,
            weeksOnChart: 8,
            isNewEntry: false,
            isReEntry: false,
            isNewPeak: true,
            territory,
            period,
            date: new Date()
          },
          message: 'Nuevo pico alcanzado',
          value: 5,
          threshold: 0,
          createdAt: new Date()
        },
        {
          id: '5',
          type: 'risk',
          severity: 'low',
          track: {
            id: 'track-5',
            title: 'At Risk Track',
            artist: 'Declining Artist',
            position: 185,
            previousPosition: 150,
            streams: 200000,
            weeksOnChart: 15,
            isNewEntry: false,
            isReEntry: false,
            isNewPeak: false,
            territory,
            period,
            date: new Date()
          },
          message: 'Riesgo de salir del Top 200',
          value: 185,
          threshold: 180,
          createdAt: new Date()
        }
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching alerts data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type: MusicAlert['type']) => {
    switch (type) {
      case 'jump':
        return <TrendingUp className="w-4 h-4" />;
      case 'drop':
        return <TrendingDown className="w-4 h-4" />;
      case 'debut':
        return <Award className="w-4 h-4" />;
      case 'peak':
        return <Award className="w-4 h-4" />;
      case 'risk':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertColor = (severity: MusicAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getSeverityBadge = (severity: MusicAlert['severity']) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Baja</Badge>;
      default:
        return <Badge variant="outline">Desconocida</Badge>;
    }
  };

  const getTypeBadge = (type: MusicAlert['type']) => {
    switch (type) {
      case 'jump':
        return <Badge variant="default" className="bg-green-100 text-green-800">Salto</Badge>;
      case 'drop':
        return <Badge variant="destructive">Caída</Badge>;
      case 'debut':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Debut</Badge>;
      case 'peak':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Pico</Badge>;
      case 'risk':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Riesgo</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.severity === filter
  );

  const alertStats = {
    total: alerts.length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{alertStats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Alta</p>
                <p className="text-2xl font-bold text-red-600">{alertStats.high}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Media</p>
                <p className="text-2xl font-bold text-yellow-600">{alertStats.medium}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Baja</p>
                <p className="text-2xl font-bold text-blue-600">{alertStats.low}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas ({alertStats.total})
            </Button>
            <Button
              variant={filter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('high')}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Alta ({alertStats.high})
            </Button>
            <Button
              variant={filter === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('medium')}
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              Media ({alertStats.medium})
            </Button>
            <Button
              variant={filter === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('low')}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Baja ({alertStats.low})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay alertas para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${getAlertColor(alert.severity)}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeBadge(alert.type)}
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {alert.track.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {alert.track.artist} • Posición #{alert.track.position}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.createdAt.toLocaleString('es-AR')}
                        </span>
                        {alert.track.previousPosition && (
                          <span>
                            Anterior: #{alert.track.previousPosition}
                          </span>
                        )}
                        <span>
                          Streams: {(alert.track.streams / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {alert.value > 0 ? '+' : ''}{alert.value}
                      </div>
                      <div className="text-xs text-gray-500">
                        vs umbral: {alert.threshold}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
