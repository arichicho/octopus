"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Music, BarChart3, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface MusicTrendsLoadingProgressProps {
  territory: string;
  period: string;
  onComplete?: () => void;
}

interface LoadingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  duration: number;
  description: string;
}

export function MusicTrendsLoadingProgress({ territory, period, onComplete }: MusicTrendsLoadingProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps: LoadingStep[] = [
    {
      id: 'fetching-data',
      label: 'Obteniendo datos',
      icon: <Music className="w-5 h-5" />,
      duration: 2000,
      description: `Cargando Top 200 de ${territory} (${period})`
    },
    {
      id: 'processing-metrics',
      label: 'Procesando métricas',
      icon: <BarChart3 className="w-5 h-5" />,
      duration: 1500,
      description: 'Calculando movimientos y tendencias'
    },
    {
      id: 'generating-insights',
      label: 'Generando insights',
      icon: <Zap className="w-5 h-5" />,
      duration: 1800,
      description: 'Analizando patrones y alertas'
    },
    {
      id: 'finalizing',
      label: 'Finalizando',
      icon: <CheckCircle className="w-5 h-5" />,
      duration: 1000,
      description: 'Preparando visualizaciones'
    }
  ];

  useEffect(() => {
    let stepProgress = 0;
    let currentStepIndex = 0;
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    
    const interval = setInterval(() => {
      stepProgress += 50; // Update every 50ms
      
      // Calculate overall progress
      const overallProgress = Math.min(95, (stepProgress / totalDuration) * 100);
      setProgress(overallProgress);
      
      // Update current step
      let accumulatedDuration = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulatedDuration += steps[i].duration;
        if (stepProgress <= accumulatedDuration) {
          setCurrentStep(i);
          break;
        }
      }
      
      // Complete when we reach 95%
      if (overallProgress >= 95) {
        clearInterval(interval);
        setTimeout(() => {
          setProgress(100);
          setIsComplete(true);
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }, 200);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  const currentStepData = steps[currentStep];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Cargando Music Trends
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analizando datos de {territory} ({period})
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Current Step */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-shrink-0">
                {currentStepData.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {currentStepData.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentStepData.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* Steps Overview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pasos del proceso:
            </h4>
            <div className="space-y-1">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 text-sm ${
                    index < currentStep
                      ? 'text-green-600 dark:text-green-400'
                      : index === currentStep
                      ? 'text-purple-600 dark:text-purple-400 font-medium'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {index < currentStep ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : index === currentStep ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-3 h-3 border border-current rounded-full" />
                    )}
                  </div>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Completion Message */}
          {isComplete && (
            <div className="text-center space-y-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-green-800 dark:text-green-200 font-medium">
                ¡Datos cargados exitosamente!
              </p>
              <p className="text-sm text-green-600 dark:text-green-300">
                Redirigiendo al dashboard...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
