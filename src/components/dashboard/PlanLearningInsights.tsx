"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MyDayService } from '@/lib/services/my-day';
import { TrendingUp, Clock, Target, Calendar } from 'lucide-react';

interface PlanStats {
  totalPlans: number;
  averageBlocksPerPlan: number;
  mostCommonBlockTypes: Record<string, number>;
  averageCompletionRate: number;
  preferredWorkingHours: { start: string; end: string };
}

interface PlanLearningInsightsProps {
  className?: string;
}

export function PlanLearningInsights({ className }: PlanLearningInsightsProps) {
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const planStats = await MyDayService.getPlanStats();
      setStats(planStats);
    } catch (error) {
      console.error('Error loading plan stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Insights de Aprendizaje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Cargando insights...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalPlans === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Insights de Aprendizaje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-gray-500 mb-2">No hay datos suficientes</div>
            <div className="text-xs text-gray-400">Genera más planes para ver insights</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMostCommonBlockType = () => {
    if (Object.keys(stats.mostCommonBlockTypes).length === 0) return null;
    
    const entries = Object.entries(stats.mostCommonBlockTypes);
    const sorted = entries.sort(([,a], [,b]) => b - a);
    return sorted[0];
  };

  const getBlockTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'meeting': 'Reuniones',
      'focus': 'Trabajo Profundo',
      'quickwin': 'Quick Wins',
      'prep': 'Preparación',
      'post': 'Seguimiento',
      'followup': 'Follow-ups',
      'call': 'Llamadas',
      'event': 'Eventos'
    };
    return labels[type] || type;
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const mostCommonBlock = getMostCommonBlockType();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Insights de Aprendizaje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen general */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalPlans}</div>
            <div className="text-xs text-blue-600">Planes generados</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className={`text-2xl font-bold ${getCompletionRateColor(stats.averageCompletionRate)}`}>
              {Math.round(stats.averageCompletionRate * 100)}%
            </div>
            <div className="text-xs text-green-600">Tasa de completado</div>
          </div>
        </div>

        {/* Patrones de trabajo */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Patrones de Trabajo</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Bloques promedio por día:</span>
              <Badge variant="outline">{Math.round(stats.averageBlocksPerPlan)}</Badge>
            </div>
            
            {mostCommonBlock && (
              <div className="flex justify-between items-center text-sm">
                <span>Tipo de actividad más común:</span>
                <Badge variant="secondary">
                  {getBlockTypeLabel(mostCommonBlock[0])} ({mostCommonBlock[1]})
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Recomendaciones</span>
          </div>
          
          <div className="space-y-2 text-xs">
            {stats.averageCompletionRate < 0.6 && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-2 border-yellow-400">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">
                  Considera reducir la carga de trabajo
                </div>
                <div className="text-yellow-700 dark:text-yellow-300">
                  Tu tasa de completado es baja. Intenta con menos bloques por día.
                </div>
              </div>
            )}
            
            {stats.averageBlocksPerPlan > 8 && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-400">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  Día muy ocupado
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  Tienes muchos bloques por día. Considera priorizar mejor.
                </div>
              </div>
            )}
            
            {mostCommonBlock && mostCommonBlock[0] === 'meeting' && (
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-2 border-purple-400">
                <div className="font-medium text-purple-800 dark:text-purple-200">
                  Muchas reuniones
                </div>
                <div className="text-purple-700 dark:text-purple-300">
                  Considera bloques de trabajo profundo entre reuniones.
                </div>
              </div>
            )}
            
            {stats.averageCompletionRate >= 0.8 && (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-2 border-green-400">
                <div className="font-medium text-green-800 dark:text-green-200">
                  ¡Excelente productividad!
                </div>
                <div className="text-green-700 dark:text-green-300">
                  Mantén este ritmo. Tu planificación está funcionando bien.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Horario preferido */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Horario de Trabajo</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stats.preferredWorkingHours.start} - {stats.preferredWorkingHours.end}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


