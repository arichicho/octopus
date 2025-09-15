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
  Zap,
  Database,
  Globe,
  Clock
} from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  dependencies: {
    claude: {
      hasApiKey: boolean;
      health: {
        hasEnv: boolean;
        ok: boolean;
        status?: number;
        error?: string;
      };
      model: string;
    };
    chartmetric: {
      hasApiKey: boolean;
      configured: boolean;
      test?: {
        success: boolean;
        error?: string;
        data?: any;
      };
    };
    firestore: {
      configured: boolean;
      projectId: string;
    };
    scheduler: {
      timezone: string;
      dailyTime: string;
      weeklyTime: string;
    };
  };
}

export function MusicTrendsHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/music-trends/health');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Saludable</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degradado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getDependencyStatus = (hasKey: boolean, isHealthy?: boolean) => {
    if (isHealthy !== undefined) {
      return isHealthy ? 'healthy' : 'error';
    }
    return hasKey ? 'healthy' : 'error';
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-red-600">Error al verificar el estado del sistema</p>
            <p className="text-sm text-gray-600">{error}</p>
            <Button onClick={fetchHealth} disabled={isLoading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-600">Verificando estado del sistema...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(health.status)}
            Estado del Sistema
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(health.status)}
            <Button onClick={fetchHealth} disabled={isLoading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Claude AI */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium">Claude AI</p>
              <p className="text-sm text-gray-600">
                {health.dependencies.claude.model}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(getDependencyStatus(health.dependencies.claude.hasApiKey, health.dependencies.claude.health.ok))}
            {health.dependencies.claude.health.error && (
              <p className="text-xs text-red-600 mt-1">
                {health.dependencies.claude.health.error}
              </p>
            )}
          </div>
        </div>

        {/* Chartmetric */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Chartmetric</p>
              <p className="text-sm text-gray-600">
                Enriquecimiento de datos
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(getDependencyStatus(health.dependencies.chartmetric.hasApiKey, health.dependencies.chartmetric.test?.success))}
            {!health.dependencies.chartmetric.hasApiKey && (
              <p className="text-xs text-yellow-600 mt-1">
                Refresh token requerido
              </p>
            )}
            {health.dependencies.chartmetric.test?.error && (
              <p className="text-xs text-red-600 mt-1">
                {health.dependencies.chartmetric.test.error}
              </p>
            )}
          </div>
        </div>

        {/* Firestore */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Firestore</p>
              <p className="text-sm text-gray-600">
                {health.dependencies.firestore.projectId}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(getDependencyStatus(health.dependencies.firestore.configured))}
          </div>
        </div>

        {/* Scheduler */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-medium">Scheduler</p>
              <p className="text-sm text-gray-600">
                {health.dependencies.scheduler.timezone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Configurado
            </Badge>
            <div className="text-xs text-gray-500 mt-1">
              Diario: {health.dependencies.scheduler.dailyTime} | 
              Semanal: {health.dependencies.scheduler.weeklyTime}
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="pt-2 border-t text-xs text-gray-500">
          Última verificación: {new Date(health.timestamp).toLocaleString('es-AR')}
        </div>
      </CardContent>
    </Card>
  );
}
