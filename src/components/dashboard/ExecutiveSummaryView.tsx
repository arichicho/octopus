'use client';

import { useTaskStore } from '@/lib/store/useTaskStore';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Users,
  BarChart3,
  Target
} from 'lucide-react';
import { format, addDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';

export const ExecutiveSummaryView = () => {
  const { tasks } = useTaskStore();
  const { companies } = useCompanyEnhancedStore();

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = firestoreDateToDate(t.dueDate);
    return dueDate && dueDate < new Date() && t.status !== 'completed';
  }).length;

  // Tasks due in next 7 days
  const nextWeekTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = firestoreDateToDate(task.dueDate);
    if (!dueDate) return false;
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return isWithinInterval(dueDate, { start: today, end: nextWeek }) && task.status !== 'completed';
  });

  // Tasks by company
  const tasksByCompany = companies.map(company => ({
    companyId: company.id!,
    companyName: company.name,
    count: tasks.filter(task => task.companyId === company.id).length,
    completed: tasks.filter(task => task.companyId === company.id && task.status === 'completed').length,
  }));

  // Tasks by priority
  const tasksByPriority = [
    { priority: 'urgent', count: tasks.filter(t => t.priority === 'urgent').length, color: 'text-red-600' },
    { priority: 'high', count: tasks.filter(t => t.priority === 'high').length, color: 'text-orange-600' },
    { priority: 'medium', count: tasks.filter(t => t.priority === 'medium').length, color: 'text-yellow-600' },
    { priority: 'low', count: tasks.filter(t => t.priority === 'low').length, color: 'text-green-600' },
  ];

  // Critical tasks (urgent + overdue)
  const criticalTasks = tasks.filter(task => 
    task.priority === 'urgent' || 
    (task.dueDate && (() => {
      const dueDate = firestoreDateToDate(task.dueDate);
      return dueDate && dueDate < new Date() && task.status !== 'completed';
    })())
  );

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 Días</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{nextWeekTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Vencen próximamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Completitud</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} de {totalTasks} tareas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              Con tareas activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by Company */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Tareas por Empresa</span>
          </CardTitle>
          <CardDescription>
            Distribución de tareas y progreso por empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasksByCompany.map((company) => {
              const completionRate = company.count > 0 
                ? Math.round((company.completed / company.count) * 100) 
                : 0;
              
              return (
                <div key={company.companyId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{company.companyName}</h4>
                      <Badge variant="outline">{company.count} tareas</Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Progress value={completionRate} className="flex-1" />
                      <span className="text-sm text-muted-foreground">
                        {completionRate}% completado
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tasks by Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Tareas por Prioridad</span>
            </CardTitle>
            <CardDescription>
              Distribución de tareas según su urgencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasksByPriority.map((item) => (
                <div key={item.priority} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                    <span className="capitalize">{item.priority}</span>
                  </div>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Critical Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Tareas Críticas</span>
            </CardTitle>
            <CardDescription>
              Tareas urgentes o vencidas que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 dark:text-red-100">{task.title}</h4>
                    {task.dueDate && (
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Vence: {(() => {
                          const dueDate = firestoreDateToDate(task.dueDate);
                          return dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: es }) : 'Fecha inválida';
                        })()}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    {task.priority}
                  </Badge>
                </div>
              ))}
              {criticalTasks.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No hay tareas críticas en este momento
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
