"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Music, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Clock,
  Globe,
  BarChart3,
  Users,
  Zap,
  CheckCircle
} from 'lucide-react';
import { Territory } from '@/types/music';
import { MusicTrendsSummary } from '@/components/music-trends/MusicTrendsSummary';
import { MusicTrendsOverviewLanding } from '@/components/music-trends/MusicTrendsOverviewLanding';
import { MusicTrendsCharts } from '@/components/music-trends/MusicTrendsCharts';
import { MusicTrendsInsightsAdvanced } from '@/components/music-trends/MusicTrendsInsightsAdvanced';
import { MusicTrendsAlertsAdvanced } from '@/components/music-trends/MusicTrendsAlertsAdvanced';
import { MusicTrendsStatusAdvanced } from '@/components/music-trends/MusicTrendsStatusAdvanced';
import { MusicTrendsLoadingProgress } from '@/components/music-trends/MusicTrendsLoadingProgress';

export default function MusicTrendsPage() {
  const [currentPeriod, setCurrentPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [currentTerritory, setCurrentTerritory] = useState<Territory>('argentina');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingProgress, setShowLoadingProgress] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'current' | 'delayed' | 'error'>('current');

  const territories: { value: Territory; label: string; flag: string }[] = [
    { value: 'argentina', label: 'Argentina', flag: '🇦🇷' },
    { value: 'spanish', label: 'España', flag: '🇪🇸' },
    { value: 'mexico', label: 'México', flag: '🇲🇽' },
    { value: 'global', label: 'Global', flag: '🌍' }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    setShowLoadingProgress(true);
    try {
      const response = await fetch('/api/music-trends/auto-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          territory: currentTerritory,
          period: currentPeriod
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLastUpdate(new Date());
          setUpdateStatus('current');
        } else {
          setUpdateStatus('error');
        }
      } else {
        setUpdateStatus('error');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setUpdateStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadingComplete = () => {
    setShowLoadingProgress(false);
  };

  // Show loading progress when territory or period changes
  useEffect(() => {
    setShowLoadingProgress(true);
    const timer = setTimeout(() => {
      setShowLoadingProgress(false);
    }, 6000); // 6 seconds total loading time

    return () => clearTimeout(timer);
  }, [currentTerritory, currentPeriod]);

  const getUpdateStatusBadge = () => {
    switch (updateStatus) {
      case 'current':
        return <Badge variant="default" className="bg-green-100 text-green-800">Actualizado</Badge>;
      case 'delayed':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Retrasado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  // Show loading progress overlay
  if (showLoadingProgress) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <MusicTrendsLoadingProgress
          territory={currentTerritory}
          period={currentPeriod}
          onComplete={handleLoadingComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Music Trends
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Análisis inteligente de tendencias musicales
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {getUpdateStatusBadge()}
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Update Status Alert */}
      {updateStatus === 'delayed' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Los datos no están actualizados. SpotifyCharts aún no ha publicado la actualización más reciente.
          </AlertDescription>
        </Alert>
      )}

      {updateStatus === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error al actualizar los datos. Por favor, intenta nuevamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Period and Territory Selectors */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentPeriod} onValueChange={(value) => setCurrentPeriod(value as 'daily' | 'weekly')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">Diario</TabsTrigger>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Territorio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {territories.map((territory) => (
                <Button
                  key={territory.value}
                  variant={currentTerritory === territory.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTerritory(territory.value)}
                  className="justify-start"
                >
                  <span className="mr-2">{territory.flag}</span>
                  {territory.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="global-overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="global-overview" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Estado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global-overview" className="space-y-4">
          <MusicTrendsOverviewLanding />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <MusicTrendsSummary 
            territory={currentTerritory}
            period={currentPeriod}
            lastUpdate={lastUpdate}
          />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <MusicTrendsCharts 
            territory={currentTerritory}
            period={currentPeriod}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <MusicTrendsInsightsAdvanced 
            territory={currentTerritory}
            period={currentPeriod}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <MusicTrendsAlertsAdvanced 
            territory={currentTerritory}
            period={currentPeriod}
          />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <MusicTrendsStatusAdvanced 
            territory={currentTerritory}
            period={currentPeriod}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
