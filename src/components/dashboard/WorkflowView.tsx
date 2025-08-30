'use client';

import { useTaskStore } from '@/lib/store/useTaskStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  Zap
} from 'lucide-react';
import { format, subDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';

export const WorkflowView = () => {
  const { tasks } = useTaskStore();

  // Tasks started this week
  const thisWeek = tasks.filter(task => {
    if (!task.createdAt) return false;
    const startDate = firestoreDateToDate(task.createdAt);
    if (!startDate) return false;
    const today = new Date();
    const weekAgo = subDays(today, 7);
    return isWithinInterval(startDate, { start: weekAgo, end: today });
  });

  // Tasks completed in last 7 days
  const completedThisWeek = tasks.filter(task => {
    if (task.status !== 'completed' || !task.updatedAt) return false;
    const completedDate = firestoreDateToDate(task.updatedAt);
    if (!completedDate) return false;
    const today = new Date();
    const weekAgo = subDays(today, 7);
    return isWithinInterval(completedDate, { start: weekAgo, end: today });
  });

  // Bottlenecks (tasks in progress for more than 3 days)
  const bottlenecks = tasks.filter(task => {
    if (task.status !== 'in_progress' || !task.createdAt) return false;
    const startDate = firestoreDateToDate(task.createdAt);
    if (!startDate) return false;
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 3;
  });

  // Upcoming milestones (tasks due in next 14 days)
  const upcomingMilestones = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = firestoreDateToDate(task.dueDate);
    if (!dueDate) return false;
    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    return isWithinInterval(dueDate, { start: today, end: twoWeeksFromNow }) && task.status !== 'completed';
  }).sort((a, b) => {
    const dateA = firestoreDateToDate(a.dueDate);
    const dateB = firestoreDateToDate(b.dueDate);
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    return dateA.getTime() - dateB.getTime();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iniciadas Esta Semana</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{thisWeek.length}</div>
            <p className="text-xs text-muted-foreground">
              Nuevas tareas creadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas Esta Semana</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedThisWeek.length}</div>
            <p className="text-xs text-muted-foreground">
              Tareas finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuellos de Botella</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{bottlenecks.length}</div>
            <p className="text-xs text-muted-foreground">
              &gt; 3 días en progreso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Hitos</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{upcomingMilestones.length}</div>
            <p className="text-xs text-muted-foreground">
              En próximos 14 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Cuellos de Botella</span>
            </CardTitle>
            <CardDescription>
              Tareas que llevan más de 3 días en progreso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottlenecks.slice(0, 5).map((task) => {
                                 const startDate = firestoreDateToDate(task.createdAt);
                 const today = new Date();
                 const daysInProgress = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-orange-900 dark:text-orange-100">{task.title}</h4>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        {daysInProgress} días en progreso • {task.progress}% completado
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={task.progress} className="w-20 h-2" />
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Próximos Hitos</span>
          </CardTitle>
          <CardDescription>
            Tareas importantes que vencen en los próximos 14 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingMilestones.slice(0, 8).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge variant="outline">
                      {task.status}
                    </Badge>
                  </div>
                                     <p className="text-sm text-muted-foreground mt-1">
                     Vence: {(() => {
                       const dueDate = firestoreDateToDate(task.dueDate);
                       return dueDate ? format(dueDate, 'EEEE, d \'de\' MMMM', { locale: es }) : 'Sin fecha';
                     })()}
                   </p>
                  {task.progress > 0 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Progress value={task.progress} className="w-32 h-2" />
                      <span className="text-xs text-muted-foreground">
                        {task.progress}% completado
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                </div>
              </div>
            ))}
            {upcomingMilestones.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No hay hitos próximos
                </h3>
                <p className="text-sm text-muted-foreground">
                  No hay tareas importantes que venzan en los próximos 14 días
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Progreso Semanal</span>
            </CardTitle>
            <CardDescription>
              Resumen de actividad de esta semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tareas iniciadas</span>
                <Badge variant="outline">{thisWeek.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tareas completadas</span>
                <Badge variant="outline">{completedThisWeek.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tasa de completitud</span>
                <Badge variant="outline">
                  {thisWeek.length > 0 ? Math.round((completedThisWeek.length / thisWeek.length) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Actividad Reciente</span>
            </CardTitle>
            <CardDescription>
              Últimas tareas completadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedThisWeek.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                                         <p className="text-xs text-muted-foreground">
                       Completada {(() => {
                         const updatedAt = firestoreDateToDate(task.updatedAt);
                         return updatedAt ? format(updatedAt, 'dd/MM/yyyy', { locale: es }) : 'Fecha desconocida';
                       })()}
                     </p>
                  </div>
                </div>
              ))}
              {completedThisWeek.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay tareas completadas esta semana
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
