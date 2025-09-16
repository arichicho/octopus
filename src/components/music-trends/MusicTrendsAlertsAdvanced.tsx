"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Music, 
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  BellOff
} from 'lucide-react';
import { Territory } from '@/types/music';
import { Alert, AlertRule } from '@/types/music-analysis';

interface MusicTrendsAlertsAdvancedProps {
  territory: Territory;
  period: 'daily' | 'weekly';
}

interface AlertsData {
  alerts: Alert[];
  rules: AlertRule[];
  statistics: {
    total: number;
    bySeverity: { [key: string]: number };
    byType: { [key: string]: number };
    byTerritory: { [key: string]: number };
    acknowledged: number;
    unacknowledged: number;
  };
  lastUpdated: Date;
}

export function MusicTrendsAlertsAdvanced({ territory, period }: MusicTrendsAlertsAdvancedProps) {
  const [data, setData] = useState<AlertsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    acknowledged: '',
    search: ''
  });
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchAlertsData();
  }, [territory, period]);

  const fetchAlertsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/music-trends/alerts?territory=${territory}&period=${period}&t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch alerts data');
      }
    } catch (error) {
      console.error('Error fetching alerts data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeAlerts = async (alertIds: string[]) => {
    try {
      const response = await fetch('/api/music-trends/alerts/acknowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alertIds })
      });

      if (response.ok) {
        // Refresh data
        await fetchAlertsData();
        setSelectedAlerts([]);
      }
    } catch (error) {
      console.error('Error acknowledging alerts:', error);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'jump': return <TrendingUp className="w-4 h-4" />;
      case 'drop': return <TrendingDown className="w-4 h-4" />;
      case 'debut': return <Music className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'data_quality': return <XCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'jump': return 'text-green-600';
      case 'drop': return 'text-red-600';
      case 'debut': return 'text-blue-600';
      case 'risk': return 'text-orange-600';
      case 'data_quality': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredAlerts = data?.alerts.filter(alert => {
    if (filters.severity && alert.severity !== filters.severity) return false;
    if (filters.type && alert.type !== filters.type) return false;
    if (filters.acknowledged !== '' && alert.acknowledged.toString() !== filters.acknowledged) return false;
    if (filters.search && !alert.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando alertas...</span>
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
              <h3 className="font-medium">Error loading alerts data</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button 
            onClick={fetchAlertsData} 
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
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No alerts data available</p>
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
            Sistema de Alertas
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
            onClick={fetchAlertsData} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alertas</p>
                <p className="text-2xl font-bold">{data.statistics.total}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">No Leídas</p>
                <p className="text-2xl font-bold text-red-600">{data.statistics.unacknowledged}</p>
              </div>
              <BellOff className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leídas</p>
                <p className="text-2xl font-bold text-green-600">{data.statistics.acknowledged}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alta Prioridad</p>
                <p className="text-2xl font-bold text-red-600">{data.statistics.bySeverity.high || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Severidad</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                <option value="jump">Saltos</option>
                <option value="drop">Caídas</option>
                <option value="debut">Debuts</option>
                <option value="risk">Riesgo</option>
                <option value="data_quality">Calidad de Datos</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <select
                value={filters.acknowledged}
                onChange={(e) => setFilters({ ...filters, acknowledged: e.target.value })}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                <option value="false">No Leídas</option>
                <option value="true">Leídas</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Buscar</label>
              <Input
                placeholder="Buscar en mensajes..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAlerts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedAlerts.length} alertas seleccionadas
              </span>
              <Button
                onClick={() => acknowledgeAlerts(selectedAlerts)}
                variant="outline"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Leídas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay alertas que coincidan con los filtros</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={alert.acknowledged ? 'opacity-75' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(alert.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAlerts([...selectedAlerts, alert.id]);
                        } else {
                          setSelectedAlerts(selectedAlerts.filter(id => id !== alert.id));
                        }
                      }}
                      className="mt-1"
                    />
                    
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getTypeColor(alert.type)}>
                          {alert.type.toUpperCase()}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            LEÍDA
                          </Badge>
                        )}
                      </div>
                      
                      <p className="font-medium text-gray-900 mb-1">{alert.message}</p>
                      
                      {alert.track_name && (
                        <div className="text-sm text-gray-600 mb-2">
                          <p><strong>Track:</strong> {alert.track_name}</p>
                          {alert.artists && <p><strong>Artista:</strong> {alert.artists}</p>}
                          {alert.position && <p><strong>Posición:</strong> #{alert.position}</p>}
                          {alert.previous_position && <p><strong>Posición Anterior:</strong> #{alert.previous_position}</p>}
                          {alert.delta_position && <p><strong>Cambio:</strong> {alert.delta_position > 0 ? '+' : ''}{alert.delta_position} posiciones</p>}
                          {alert.streams && <p><strong>Streams:</strong> {alert.streams.toLocaleString()}</p>}
                          {alert.delta_streams_pct && <p><strong>Cambio Streams:</strong> {alert.delta_streams_pct > 0 ? '+' : ''}{alert.delta_streams_pct.toFixed(1)}%</p>}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {alert.created_at.toLocaleString()}
                        </span>
                        <span>{alert.territory.toUpperCase()} • {alert.period.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {!alert.acknowledged && (
                      <Button
                        onClick={() => acknowledgeAlerts([alert.id])}
                        variant="outline"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Leer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Reglas de Alertas Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.rules.map((rule) => (
              <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{rule.name}</h4>
                  <Badge variant={rule.enabled ? "default" : "secondary"}>
                    {rule.enabled ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Umbral: {rule.threshold}</span>
                  <span className={`px-2 py-1 rounded ${
                    rule.severity === 'high' ? 'bg-red-100 text-red-800' :
                    rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rule.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
