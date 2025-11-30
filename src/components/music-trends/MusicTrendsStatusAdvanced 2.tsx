"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Database,
  Globe,
  Zap,
  Activity,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Territory } from '@/types/music';
import { DataQualityFlags } from '@/types/music-analysis';

interface MusicTrendsStatusAdvancedProps {
  territory: Territory;
  period: 'daily' | 'weekly';
}

interface StatusData {
  territories: {
    [key: string]: {
      daily: DataQualityFlags;
      weekly: DataQualityFlags;
    };
  };
  services: {
    kworb: {
      status: 'ok' | 'error' | 'timeout';
      lastCheck: Date;
      responseTime: number;
    };
    chartmetric: {
      status: 'ok' | 'error' | 'timeout' | 'rate_limited';
      lastCheck: Date;
      responseTime: number;
      tokenValid: boolean;
    };
    database: {
      status: 'ok' | 'error' | 'timeout';
      lastCheck: Date;
      responseTime: number;
      connectionCount: number;
    };
  };
  system: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    lastRestart: Date;
  };
  lastUpdated: Date;
}

export function MusicTrendsStatusAdvanced({ territory, period }: MusicTrendsStatusAdvancedProps) {
  const [data, setData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatusData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatusData, 30000);
    return () => clearInterval(interval);
  }, [territory, period]);

  const fetchStatusData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/music-trends/status?territory=${territory}&period=${period}&t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch status data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch status data');
      }
    } catch (error) {
      console.error('Error fetching status data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'timeout': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rate_limited': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'timeout': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rate_limited': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando estado del sistema...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-red-600">
            <XCircle className="w-5 h-5" />
            <div>
              <h3 className="font-medium">Error loading status data</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button 
            onClick={fetchStatusData} 
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
            <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No status data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTerritoryData = data.territories[territory]?.[period];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Estado del Sistema
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
            onClick={fetchStatusData} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold">{formatUptime(data.system.uptime)}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memoria</p>
                <p className="text-2xl font-bold">{formatBytes(data.system.memoryUsage)}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU</p>
                <p className="text-2xl font-bold">{data.system.cpuUsage.toFixed(1)}%</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Último Reinicio</p>
                <p className="text-sm font-bold">{new Date(data.system.lastRestart).toLocaleDateString()}</p>
              </div>
              <Server className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Estado de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kworb Service */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Kworb.net</h4>
                {getStatusIcon(data.services.kworb.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <Badge variant="outline" className={getStatusColor(data.services.kworb.status)}>
                    {data.services.kworb.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última verificación:</span>
                  <span>{new Date(data.services.kworb.lastCheck).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiempo respuesta:</span>
                  <span>{data.services.kworb.responseTime}ms</span>
                </div>
              </div>
            </div>

            {/* Chartmetric Service */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Chartmetric</h4>
                {getStatusIcon(data.services.chartmetric.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <Badge variant="outline" className={getStatusColor(data.services.chartmetric.status)}>
                    {data.services.chartmetric.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Token válido:</span>
                  <Badge variant={data.services.chartmetric.tokenValid ? "default" : "destructive"}>
                    {data.services.chartmetric.tokenValid ? "SÍ" : "NO"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última verificación:</span>
                  <span>{new Date(data.services.chartmetric.lastCheck).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiempo respuesta:</span>
                  <span>{data.services.chartmetric.responseTime}ms</span>
                </div>
              </div>
            </div>

            {/* Database Service */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Base de Datos</h4>
                {getStatusIcon(data.services.database.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <Badge variant="outline" className={getStatusColor(data.services.database.status)}>
                    {data.services.database.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conexiones:</span>
                  <span>{data.services.database.connectionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última verificación:</span>
                  <span>{new Date(data.services.database.lastCheck).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiempo respuesta:</span>
                  <span>{data.services.database.responseTime}ms</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality for Current Territory */}
      {currentTerritoryData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Calidad de Datos - {territory.charAt(0).toUpperCase() + territory.slice(1)} ({period === 'daily' ? 'Diario' : 'Semanal'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Completitud</span>
                  <Badge variant={currentTerritoryData.completeness_pct >= 90 ? "default" : "destructive"}>
                    {currentTerritoryData.completeness_pct.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {currentTerritoryData.actual_tracks}/{currentTerritoryData.expected_tracks} tracks
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Actualización</span>
                  <Badge variant={!currentTerritoryData.is_stale ? "default" : "destructive"}>
                    {currentTerritoryData.is_stale ? "DESACTUALIZADO" : "ACTUALIZADO"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {currentTerritoryData.staleness_hours.toFixed(1)}h desde última actualización
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Track IDs</span>
                  <Badge variant={currentTerritoryData.missing_track_ids === 0 ? "default" : "destructive"}>
                    {currentTerritoryData.missing_track_ids} faltantes
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {currentTerritoryData.fuzzy_matches} coincidencias aproximadas
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Calidad</span>
                  <Badge variant={!currentTerritoryData.data_quality_issues ? "default" : "destructive"}>
                    {currentTerritoryData.data_quality_issues ? "PROBLEMAS" : "OK"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {currentTerritoryData.data_anomalies.length} anomalías detectadas
                </p>
              </div>
            </div>

            {/* Data Anomalies */}
            {currentTerritoryData.data_anomalies.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Anomalías Detectadas:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {currentTerritoryData.data_anomalies.map((anomaly, index) => (
                    <li key={index}>• {anomaly}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Territories Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Resumen por Territorio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data.territories).map(([territoryKey, territoryData]) => (
              <div key={territoryKey} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-3 capitalize">{territoryKey}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diario:</span>
                    <Badge variant={territoryData.daily.completeness_pct >= 90 ? "default" : "destructive"}>
                      {territoryData.daily.completeness_pct.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Semanal:</span>
                    <Badge variant={territoryData.weekly.completeness_pct >= 90 ? "default" : "destructive"}>
                      {territoryData.weekly.completeness_pct.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Última actualización:</span>
                    <span className="text-xs">{new Date(territoryData.daily.last_update).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
