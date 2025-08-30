'use client';

import { useTaskStore } from '@/lib/store/useTaskStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { format, isToday, isTomorrow, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';

export const MyDayView = () => {
  const { tasks } = useTaskStore();
  const { userProfile } = useAuth();

  const today = new Date();
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = firestoreDateToDate(task.dueDate);
    return dueDate && (isToday(dueDate) || isBefore(dueDate, startOfDay(new Date())));
  });

  const overdueTasks = todayTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = firestoreDateToDate(task.dueDate);
    return dueDate && isBefore(dueDate, startOfDay(new Date())) && task.status !== 'completed';
  });

  const todayDueTasks = todayTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = firestoreDateToDate(task.dueDate);
    return dueDate && isToday(dueDate) && task.status !== 'completed';
  });

  const completedToday = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = firestoreDateToDate(task.dueDate);
    return dueDate && isToday(dueDate) && task.status === 'completed';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Mi Día
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Organiza y prioriza tus tareas del día
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Calendar className="h-4 w-4 mr-2" />
            Hoy
          </Button>
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Para Hoy</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayDueTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Vencen hoy
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedToday.length}</div>
            <p className="text-xs text-muted-foreground">
              ¡Excelente trabajo!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Tareas Vencidas</span>
            </CardTitle>
            <CardDescription>
              Estas tareas requieren tu atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg gap-3">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
                      <h4 className="font-medium text-red-900 dark:text-red-100">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                       Vencida el {(() => {
                         const dueDate = firestoreDateToDate(task.dueDate);
                         return dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: es }) : 'Sin fecha';
                       })()}
                     </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Ver
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Tareas para Hoy</CardTitle>
              <CardDescription>
                {format(today, 'EEEE, d \'de\' MMMM', { locale: es })}
              </CardDescription>
            </div>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayDueTasks.length > 0 ? (
            <div className="space-y-3">
              {todayDueTasks.map((task) => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex flex-wrap gap-1">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 gap-2">
                       <div className="flex items-center space-x-1">
                         <Clock className="h-3 w-3 text-muted-foreground" />
                         <span className="text-xs text-muted-foreground">
                           {(() => {
                             const dueDate = firestoreDateToDate(task.dueDate);
                             return dueDate ? format(dueDate, 'HH:mm') : '--:--';
                           })()}
                         </span>
                       </div>
                      {task.progress > 0 && (
                        <div className="flex items-center space-x-2">
                          <Progress value={task.progress} className="w-20 h-2" />
                          <span className="text-xs text-muted-foreground">
                            {task.progress}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      Ver
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No hay tareas para hoy
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                ¡Excelente! Todas las tareas están al día
              </p>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Crear Nueva Tarea
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
