"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Calendar, User, Building2, Tag, Clock, AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import Link from 'next/link';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { tasks, loadTasks, restoreTask } = useTaskStore();
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('📊 History - Loading tasks for user:', user.email, 'UID:', user.uid);
        await loadTasks(user.uid);
        console.log('📊 History - Tasks loaded:', tasks.length);
      } catch (error) {
        console.error('Error loading history data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, loadTasks]);

  const handleRestoreTask = async (taskId: string) => {
    try {
      setRestoring(taskId);
      const result = await restoreTask(taskId);
      
      if (result.success) {
        // Show success message (you could add a toast notification here)
        console.log('✅ Task restored:', result.message);
        // Optionally reload tasks to ensure UI is updated
        if (user) {
          await loadTasks(user.uid);
        }
      } else {
        // Show error message
        console.error('❌ Failed to restore task:', result.message);
        alert(result.message); // Simple alert for now, could be replaced with toast
      }
    } catch (error) {
      console.error('❌ Error restoring task:', error);
      alert('Error al restaurar la tarea. Inténtalo de nuevo.');
    } finally {
      setRestoring(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En Progreso';
      case 'review':
        return 'Esperando Respuesta';
      case 'cancelled':
        return 'Cancelada';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Pendiente'; // Fallback para cualquier caso inesperado
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      default:
        return 'Baja';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Historial</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar tareas completadas y canceladas
  const completedTasks = tasks.filter(task => 
    task.status === 'completed' || task.status === 'cancelled'
  );

  console.log('📊 History - Total tasks:', tasks.length);
  console.log('📊 History - Completed tasks:', completedTasks.length);
  console.log('📊 History - Tasks data:', tasks);

  // Agrupar por fecha de completado
  const tasksByDate = completedTasks.reduce((acc, task) => {
    let dateKey = 'Sin fecha';
    
    if (task.status === 'completed' && task.completedAt) {
      const completedDate = firestoreDateToDate(task.completedAt);
      if (completedDate) {
        dateKey = format(completedDate, 'dd/MM/yyyy', { locale: es });
      }
    } else if (task.status === 'cancelled') {
      dateKey = 'Canceladas';
    }
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Ordenar fechas
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
    if (a === 'Sin fecha') return 1;
    if (b === 'Sin fecha') return -1;
    if (a === 'Canceladas') return 1;
    if (b === 'Canceladas') return -1;
    return new Date(b.split('/').reverse().join('-')).getTime() - new Date(a.split('/').reverse().join('-')).getTime();
  });

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Historial</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Tareas completadas y canceladas
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {completedTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No hay tareas completadas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {date} ({tasksByDate[date].length} tareas)
                </h2>
                
                <div className="grid gap-4">
                  {tasksByDate[date].map((task) => {
                    const dueDate = firestoreDateToDate(task.dueDate);
                    return (
                      <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(task.status)}
                                <h3 className="font-semibold text-lg">{task.title}</h3>
                                <Badge className={getPriorityColor(task.priority)}>
                                  {getPriorityText(task.priority)}
                                </Badge>
                                <Badge className={getStatusColor(task.status)}>
                                  {getStatusText(task.status)}
                                </Badge>
                              </div>
                              
                              {task.description && (
                                <p className="text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                              )}
                              
                              <div className="space-y-2">
                                {/* Asignado a */}
                                {task.assignedTo && task.assignedTo.length > 0 && (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Asignado a:</span>
                                    <span className="font-medium">{task.assignedTo.join(', ')}</span>
                                  </div>
                                )}

                                {/* Fecha de vencimiento */}
                                {dueDate && (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Vencía:</span>
                                    <span className="font-medium">
                                      {format(dueDate, 'dd/MM/yyyy', { locale: es })}
                                    </span>
                                  </div>
                                )}

                                {/* Fecha de completado */}
                                {task.status === 'completed' && task.completedAt && (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <CheckSquare className="h-4 w-4 text-green-600" />
                                    <span className="text-muted-foreground">Completada:</span>
                                    <span className="font-medium text-green-600">
                                      {format(firestoreDateToDate(task.completedAt) || new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </span>
                                  </div>
                                )}

                                {/* Tags */}
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Tags:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {task.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Restore Button */}
                            <div className="ml-4 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreTask(task.id)}
                                disabled={restoring === task.id}
                                className="flex items-center gap-2"
                              >
                                {restoring === task.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    Restaurando...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="h-4 w-4" />
                                    Restaurar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
