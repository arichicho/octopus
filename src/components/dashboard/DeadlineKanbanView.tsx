'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { TaskStatus } from '@/types/task';
import { Task } from '@/lib/firebase/firestore';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { DroppableWeekColumn } from '@/components/tasks/DroppableWeekColumn';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { DragDropProvider } from '@/lib/context/DragDropContext';
import { TaskNotification } from '@/components/ui/task-notification';
import { useState } from 'react';

interface DeadlineKanbanViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
  getStatusIcon: (status: TaskStatus) => React.ReactElement;
  getStatusColor: (status: TaskStatus) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
}

interface DeadlineWeek {
  id: string;
  title: string;
  description: string;
  color: string;
  headerColor: string;
  badgeColor: string;
  startDate: Date | null;
  endDate: Date | null;
  filterFn: (task: Task) => boolean;
}

export function DeadlineKanbanView({
  tasks,
  onTaskClick,
  onCompleteTask,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue
}: DeadlineKanbanViewProps) {
  const { updateTask } = useTaskStore();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    dueDate?: Date;
  } | null>(null);

  const handleTaskDrop = async (taskId: string, newDueDate: Date | null) => {
    try {
      await updateTask(taskId, { dueDate: newDueDate });
      
      setNotification({
        type: 'success',
        title: 'Tarea Actualizada',
        message: 'La fecha de vencimiento se ha actualizado correctamente.',
        dueDate: newDueDate
      });
    } catch (error) {
      setNotification({
        type: 'error',
        title: 'Error al Actualizar',
        message: 'No se pudo actualizar la fecha de vencimiento. Inténtalo de nuevo.'
      });
    }
  };
  const getDeadlineWeeks = (): DeadlineWeek[] => {
    const today = new Date();
    const weeks: DeadlineWeek[] = [];
    
    // Esta semana (hoy hasta domingo)
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Lunes
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Domingo
    
    weeks.push({
      id: 'this-week',
      title: 'Esta Semana',
      description: `${format(thisWeekStart, 'dd/MM', { locale: es })} - ${format(thisWeekEnd, 'dd/MM', { locale: es })}`,
      color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      headerColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      startDate: thisWeekStart,
      endDate: thisWeekEnd,
      filterFn: (task) => {
        if (!task.dueDate) return false;
        const dueDate = firestoreDateToDate(task.dueDate);
        return isWithinInterval(dueDate, { start: thisWeekStart, end: thisWeekEnd });
      }
    });
    
    // Siguientes 3 semanas (eliminamos la semana +4)
    for (let i = 1; i <= 3; i++) {
      const start = addWeeks(thisWeekStart, i);
      const end = addWeeks(thisWeekEnd, i);
      
      const colors = [
        { color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800', header: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
        { color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800', header: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
        { color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800', header: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
      ];
      
      weeks.push({
        id: `week-${i}`,
        title: `Semana +${i}`,
        description: `${format(start, 'dd/MM', { locale: es })} - ${format(end, 'dd/MM', { locale: es })}`,
        color: colors[i - 1].color,
        headerColor: colors[i - 1].header,
        badgeColor: colors[i - 1].header,
        startDate: start,
        endDate: end,
        filterFn: (task) => {
          if (!task.dueDate) return false;
          const dueDate = firestoreDateToDate(task.dueDate);
          return isWithinInterval(dueDate, { start, end });
        }
      });
    }
    
    // Sin fecha
    weeks.push({
      id: 'no-date',
      title: 'Sin Fecha',
      description: 'Tareas sin fecha de vencimiento',
      color: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800',
      headerColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      startDate: null,
      endDate: null,
      filterFn: (task) => !task.dueDate
    });
    
    return weeks;
  };

  const deadlineWeeks = getDeadlineWeeks();

  const getTasksByWeek = (week: DeadlineWeek) => {
    return tasks.filter(week.filterFn);
  };

  const getDaysRemaining = (dueDate: Date) => {
    const today = new Date();
    // Reset time to start of day for accurate comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffTime = dueDateStart.getTime() - todayStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <DragDropProvider>
      <div className="space-y-6">
        {/* Instrucciones de Drag & Drop */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              💡 Drag & Drop Activo
            </h3>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Arrastra las tareas entre las columnas de semanas para reprogramarlas. Las fechas se actualizarán automáticamente.
          </p>
        </div>
        
        {/* Semana actual - ancho completo */}
        {(() => {
          const thisWeek = deadlineWeeks.find(week => week.id === 'this-week');
          const thisWeekTasks = thisWeek ? getTasksByWeek(thisWeek) : [];
          
          return thisWeek ? (
            <div className="w-full">
              <DroppableWeekColumn
                key={thisWeek.id}
                week={thisWeek}
                tasks={thisWeekTasks}
                onTaskClick={onTaskClick}
                onCompleteTask={onCompleteTask}
                onTaskDrop={handleTaskDrop}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                getDaysRemaining={getDaysRemaining}
                isCurrentWeek={true}
              />
            </div>
          ) : null;
        })()}
        
        {/* Semanas futuras - en columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deadlineWeeks
            .filter(week => week.id !== 'this-week' && week.id !== 'no-date')
            .map((week) => {
              const weekTasks = getTasksByWeek(week);
              
              return (
                <DroppableWeekColumn
                  key={week.id}
                  week={week}
                  tasks={weekTasks}
                  onTaskClick={onTaskClick}
                  onCompleteTask={onCompleteTask}
                  onTaskDrop={handleTaskDrop}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  formatDate={formatDate}
                  isOverdue={isOverdue}
                  getDaysRemaining={getDaysRemaining}
                />
              );
            })}
        </div>
        
        {/* Tareas sin fecha - ancho completo por debajo */}
        {(() => {
          const noDateWeek = deadlineWeeks.find(week => week.id === 'no-date');
          const noDateTasks = noDateWeek ? getTasksByWeek(noDateWeek) : [];
          
          return noDateWeek ? (
            <div className="w-full">
              <DroppableWeekColumn
                key={noDateWeek.id}
                week={noDateWeek}
                tasks={noDateTasks}
                onTaskClick={onTaskClick}
                onCompleteTask={onCompleteTask}
                onTaskDrop={handleTaskDrop}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                getDaysRemaining={getDaysRemaining}
                isNoDateSection={true}
              />
            </div>
          ) : null;
        })()}
      </div>
      
      {/* Notificaciones */}
      {notification && (
        <TaskNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          dueDate={notification.dueDate}
          onClose={() => setNotification(null)}
        />
      )}
    </DragDropProvider>
  );
}
