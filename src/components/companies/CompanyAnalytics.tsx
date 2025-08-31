'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  Calendar, 
  Target,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Archive
} from 'lucide-react';
import { CompanyEnhanced, CompanyStatus, industryOptions } from '@/types/company-enhanced';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompanyAnalyticsProps {
  companies: CompanyEnhanced[];
}

export function CompanyAnalytics({ companies }: CompanyAnalyticsProps) {
  // Calcular estadísticas
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active' && !c.isDeleted);
  const inactiveCompanies = companies.filter(c => c.status === 'inactive' && !c.isDeleted);
  const archivedCompanies = companies.filter(c => c.status === 'archived' && !c.isDeleted);
  const deletedCompanies = companies.filter(c => c.isDeleted);

  // Estadísticas por industria
  const industryStats = companies.reduce((acc, company) => {
    if (company.industry) {
      acc[company.industry] = (acc[company.industry] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Top industrias
  const topIndustries = Object.entries(industryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Estadísticas por país
  const countryStats = companies.reduce((acc, company) => {
    if (company.address?.country) {
      acc[company.address.country] = (acc[company.address.country] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Top países
  const topCountries = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Empresas creadas en los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCompanies = companies.filter(company => {
    const createdAt = company.createdAt instanceof Date ? company.createdAt : company.createdAt.toDate();
    return createdAt >= thirtyDaysAgo;
  });

  // Empresas creadas en los últimos 7 días
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const veryRecentCompanies = companies.filter(company => {
    const createdAt = company.createdAt instanceof Date ? company.createdAt : company.createdAt.toDate();
    return createdAt >= sevenDaysAgo;
  });

  // Crecimiento mensual
  const monthlyGrowth = ((recentCompanies.length / Math.max(totalCompanies - recentCompanies.length, 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Análisis de Empresas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Estadísticas y métricas de rendimiento
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Última actualización: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
        </Badge>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Empresas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalCompanies}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {recentCompanies.length} nuevas este mes
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Empresas Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeCompanies.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {((activeCompanies.length / totalCompanies) * 100).toFixed(1)}% del total
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Crecimiento Mensual</p>
                <p className={`text-2xl font-bold ${parseFloat(monthlyGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlyGrowth}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {veryRecentCompanies.length} nuevas esta semana
                </p>
              </div>
              {parseFloat(monthlyGrowth) >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Empresas Inactivas</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {inactiveCompanies.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Requieren atención
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Distribución por Estado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Activas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{activeCompanies.length}</span>
                  <span className="text-xs text-gray-500">
                    ({((activeCompanies.length / totalCompanies) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Progress value={(activeCompanies.length / totalCompanies) * 100} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Inactivas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{inactiveCompanies.length}</span>
                  <span className="text-xs text-gray-500">
                    ({((inactiveCompanies.length / totalCompanies) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Progress value={(inactiveCompanies.length / totalCompanies) * 100} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm">Archivadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{archivedCompanies.length}</span>
                  <span className="text-xs text-gray-500">
                    ({((archivedCompanies.length / totalCompanies) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Progress value={(archivedCompanies.length / totalCompanies) * 100} className="h-2" />
            </div>

            {deletedCompanies.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Eliminadas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{deletedCompanies.length}</span>
                    <span className="text-xs text-gray-500">
                      ({((deletedCompanies.length / totalCompanies) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <Progress value={(deletedCompanies.length / totalCompanies) * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Industrias */}
        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Top Industrias</span>
          </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topIndustries.length > 0 ? (
              topIndustries.map(([industry, count]) => {
                const industryLabel = industryOptions.find(i => i.value === industry)?.label || industry;
                const percentage = ((count / totalCompanies) * 100).toFixed(1);
                
                return (
                  <div key={industry} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{industryLabel}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{count}</span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                    <Progress value={parseFloat(percentage)} className="h-2" />
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No hay datos de industrias disponibles
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribución Geográfica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Distribución Geográfica</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCountries.length > 0 ? (
              topCountries.map(([country, count]) => {
                const percentage = ((count / totalCompanies) * 100).toFixed(1);
                
                return (
                  <div key={country} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{country}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{count}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 col-span-full">
                No hay datos geográficos disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Actividad Reciente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{veryRecentCompanies.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Nuevas esta semana</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{recentCompanies.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Nuevas este mes</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{inactiveCompanies.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Requieren atención</div>
              </div>
            </div>

            {/* Tendencias */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Tendencias</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Crecimiento mensual</span>
                  <div className="flex items-center space-x-2">
                    {parseFloat(monthlyGrowth) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${parseFloat(monthlyGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthlyGrowth}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tasa de activación</span>
                  <span className="text-sm font-medium text-green-600">
                    {((activeCompanies.length / totalCompanies) * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tasa de retención</span>
                  <span className="text-sm font-medium text-blue-600">
                    {((activeCompanies.length / Math.max(totalCompanies - deletedCompanies.length, 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
