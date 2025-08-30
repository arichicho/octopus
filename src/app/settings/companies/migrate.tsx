'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, Database, Upload } from 'lucide-react';
import { migrateCompaniesToNewSystem, createSampleCompanies } from '@/lib/migration/migrateCompanies';

interface MigrationResult {
  success: boolean;
  migratedCount?: number;
  createdCount?: number;
  errors: string[];
}

export const CompanyMigrationPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const runMigration = async () => {
    setIsRunning(true);
    setMigrationResult(null);
    setProgress(0);
    
    try {
      setCurrentStep('Iniciando migración...');
      setProgress(25);
      
      const result = await migrateCompaniesToNewSystem('migration-admin');
      
      setProgress(100);
      setCurrentStep('Migración completada');
      setMigrationResult(result);
      
    } catch (error) {
      setMigrationResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Error desconocido durante la migración']
      });
    } finally {
      setIsRunning(false);
    }
  };

  const createSamples = async () => {
    setIsRunning(true);
    setMigrationResult(null);
    setProgress(0);
    
    try {
      setCurrentStep('Creando empresas de muestra...');
      setProgress(25);
      
      const result = await createSampleCompanies('sample-admin');
      
      setProgress(100);
      setCurrentStep('Creación de muestras completada');
      setMigrationResult({
        success: result.success,
        createdCount: result.createdCount,
        errors: result.errors
      });
      
    } catch (error) {
      setMigrationResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Error desconocido durante la creación de muestras']
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Migration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Migrar Datos Existentes</span>
            </CardTitle>
            <CardDescription>
              Migrar empresas del sistema anterior al nuevo formato con mejoras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Esta acción migrará todas las empresas hardcodeadas al nuevo sistema de gestión.
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Se mantendrán nombres y colores originales</li>
                <li>• Se asignarán iconos basados en la industria</li>
                <li>• Se agregará metadata y estructura mejorada</li>
              </ul>
            </div>
            
            <Button 
              onClick={runMigration} 
              disabled={isRunning}
              className="w-full"
            >
              <Database className="mr-2 h-4 w-4" />
              {isRunning ? 'Migrando...' : 'Ejecutar Migración'}
            </Button>
          </CardContent>
        </Card>

        {/* Sample Data Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Datos de Muestra</span>
            </CardTitle>
            <CardDescription>
              Crear empresas de ejemplo para probar el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Crear un conjunto de empresas de muestra con datos completos para testing.
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 6 empresas de diferentes industrias</li>
                <li>• Datos completos incluyendo contacto</li>
                <li>• Iconos y colores representativos</li>
              </ul>
            </div>
            
            <Button 
              onClick={createSamples} 
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isRunning ? 'Creando...' : 'Crear Datos de Muestra'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {migrationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {migrationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Resultado de la Operación</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {migrationResult.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {migrationResult.migratedCount !== undefined 
                    ? `✅ Migración exitosa: ${migrationResult.migratedCount} empresas migradas`
                    : `✅ Creación exitosa: ${migrationResult.createdCount} empresas creadas`
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  ❌ La operación falló. Revisa los errores a continuación.
                </AlertDescription>
              </Alert>
            )}

            {migrationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>Errores encontrados:</span>
                </h4>
                <div className="space-y-1">
                  {migrationResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription className="text-xs font-mono">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};