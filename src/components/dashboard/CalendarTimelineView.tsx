'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Clock, AlertTriangle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskStatus } from '@/types/task';
import { Task } from '@/lib/firebase/firestore';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isTomorrow, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarTimelineViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
  getStatusIcon: (status: TaskStatus) => React.ReactElement;
  getStatusColor: (status: TaskStatus) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
  showCompanyInfo?: boolean;
  getCompanyName?: (companyId: string) => string;
  getCompanyColor?: (companyId: string) => string;
}

export function CalendarTimelineView({
  tasks,
  onTaskClick,
  onCompleteTask,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue
}: CalendarTimelineViewProps) {
  const [currentWeek, setCurrentWeek] = React.useState(new Date());

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Domingo
    return eachDayOfInterval({ start, end });
  };

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = firestoreDateToDate(task.dueDate);
      return isSameDay(dueDate, date);
    });
  };

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    if (isYesterday(date)) return 'Ayer';
    return format(date, 'EEEE', { locale: es });
  };

  const getDayNumber = (date: Date) => {
    return format(date, 'd');
  };

  const getMonthLabel = (date: Date) => {
    return format(date, 'MMMM yyyy', { locale: es });
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const weekDays = getWeekDays();

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {getMonthLabel(currentWeek)}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Semana del {format(weekDays[0], 'dd/MM')} al {format(weekDays[6], 'dd/MM')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Hoy
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Calendario semanal */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <Card key={day.toISOString()} className={`${isCurrentDay ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${isCurrentDay ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {getDayLabel(day)}
                </CardTitle>
                <div className={`text-lg font-bold ${isCurrentDay ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {getDayNumber(day)}
                </div>
                {dayTasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Calendar className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs">Sin tareas</p>
                    </div>
                  ) : (
                    dayTasks.map((task) => {
                      const dueDate = firestoreDateToDate(task.dueDate);
                      
                      return (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className={`p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                            isOverdue(dueDate) 
                              ? 'border-red-200 bg-red-50 dark:bg-red-900/20 hover:border-red-300' 
                              : 'border-gray-200 bg-white dark:bg-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-1 flex-1 min-w-0">
                                {getStatusIcon(task.status)}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate cursor-pointer">
                                        {task.title}
                                      </h4>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <p className="text-sm">{task.title}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              {task.status !== 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-green-100 hover:text-green-600"
                                  onClick={(e) => onCompleteTask(e, task)}
                                  title="Marcar como completada"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority === 'urgent' ? 'Urgente' :
                                 task.priority === 'high' ? 'Alta' :
                                 task.priority === 'medium' ? 'Media' : 'Baja'}
                              </Badge>
                              
                              <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                {task.status === 'pending' ? 'Pendiente' :
                                 task.status === 'in_progress' ? 'En Progreso' :
                                 task.status === 'completed' ? 'Completada' : 'Cancelada'}
                              </Badge>
                            </div>
                            
                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.tags.slice(0, 1).map((tag: string) => (
                                  <Badge 
                                    key={tag} 
                                    variant="outline" 
                                    className="text-xs px-1 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {task.tags.length > 1 && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs px-1 py-0.5 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                  >
                                    +{task.tags.length - 1}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tareas sin fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Tareas sin fecha de vencimiento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.filter(task => !task.dueDate).map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getStatusIcon(task.status)}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate cursor-pointer">
                              {task.title}
                            </h4>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">{task.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {task.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                        onClick={(e) => onCompleteTask(e, task)}
                        title="Marcar como completada"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'urgent' ? 'Urgente' :
                       task.priority === 'high' ? 'Alta' :
                       task.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                    
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {task.status === 'pending' ? 'Pendiente' :
                       task.status === 'in_progress' ? 'En Progreso' :
                       task.status === 'completed' ? 'Completada' : 'Cancelada'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {tasks.filter(task => !task.dueDate).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No hay tareas sin fecha de vencimiento</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
