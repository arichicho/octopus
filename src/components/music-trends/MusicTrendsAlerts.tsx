"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Star,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { MusicAlert } from '@/types/music';

interface MusicTrendsAlertsProps {
  territory: 'argentina' | 'spain' | 'mexico' | 'global';
  period: 'daily' | 'weekly';
}

export function MusicTrendsAlerts({ territory, period }: MusicTrendsAlertsProps) {
  const [alerts, setAlerts] = useState<MusicAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'jump' | 'drop' | 'debut' | 'risk'>('all');

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
          trackId: 'track-1',
          trackTitle: 'Viral Hit',
          artist: 'TikTok Sensation',
          territory,
          period,
          date: new Date(),
          message: 'Salto significativo: +33 posiciones (45 → 12)',
          severity: 'high',
          read: false
        },
        {
          id: '2',
          type: 'debut',
          trackId: 'track-2',
          trackTitle: 'New Artist Debut',
          artist: 'Emerging Artist',
          territory,
          period,
          date: new Date(),
          message: 'Debut en posición 8',
          severity: 'medium',
          read: false
        },
        {
          id: '3',
          type: 'drop',
          trackId: 'track-3',
          trackTitle: 'Fading Track',
          artist: 'Veteran Artist',
          territory,
          period,
          date: new Date(),
          message: 'Caída significativa: -44 posiciones (23 → 67)',
          severity: 'high',
          read: false
        }
      ];
      
      setAlerts(mockAlerts);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'jump':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'drop':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'debut':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'risk':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge variant="outline">Desconocida</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'jump':
        return 'Salto';
      case 'drop':
        return 'Caída';
      case 'debut':
        return 'Debut';
      case 'risk':
        return 'Riesgo';
      default:
        return 'Alerta';
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filter);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas del Top 200
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAlertsData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtrar por tipo:</span>
            <div className="flex gap-1">
              {(['all', 'jump', 'drop', 'debut', 'risk'] as const).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                >
                  {filterType === 'all' ? 'Todas' : getTypeLabel(filterType)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts list */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay alertas para mostrar</p>
            <p className="text-sm text-gray-400 mt-2">
              {filter === 'all' 
                ? 'No se detectaron movimientos significativos en el Top 200'
                : `No hay alertas de tipo "${getTypeLabel(filter)}" en el Top 200`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`${alert.read ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {alert.trackTitle}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(alert.type)}
                        </Badge>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <p className="text-gray-600 mb-2">
                        {alert.artist}
                      </p>
                      <p className="text-sm text-gray-700 mb-3">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {alert.date.toLocaleDateString('es-AR')} {alert.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>{alert.territory.toUpperCase()} {alert.period.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAlerts(prev => prev.map(a => 
                          a.id === alert.id ? { ...a, read: !a.read } : a
                        ));
                      }}
                    >
                      {alert.read ? 'Marcar como no leída' : 'Marcar como leída'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.type === 'jump').length}
              </p>
              <p className="text-sm text-gray-600">Saltos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.type === 'drop').length}
              </p>
              <p className="text-sm text-gray-600">Caídas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {alerts.filter(a => a.type === 'debut').length}
              </p>
              <p className="text-sm text-gray-600">Debuts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {alerts.filter(a => a.type === 'risk').length}
              </p>
              <p className="text-sm text-gray-600">Riesgos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}