'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { TaskStatus } from '@/types/task';
import { Task } from '@/lib/firebase/firestore';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { DroppablePriorityColumn } from '@/components/tasks/DroppablePriorityColumn';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { DragDropProvider } from '@/lib/context/DragDropContext';
import { TaskNotification } from '@/components/ui/task-notification';

interface PriorityKanbanViewProps {
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

const priorityConfigs = [
  {
    id: 'urgent',
    title: 'Urgente',
    color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    headerColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  {
    id: 'high',
    title: 'Alta',
    color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    headerColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  {
    id: 'medium',
    title: 'Media',
    color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    headerColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  {
    id: 'low',
    title: 'Baja',
    color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    headerColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }
];

export function PriorityKanbanView({
  tasks,
  onTaskClick,
  onCompleteTask,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue,
  showCompanyInfo = false,
  getCompanyName,
  getCompanyColor
}: PriorityKanbanViewProps) {
  const { changeTaskPriority } = useTaskStore();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    priority?: string;
  } | null>(null);

  const handleTaskDrop = async (taskId: string, newPriority: string) => {
    try {
      const result = await changeTaskPriority(taskId, newPriority as "urgent" | "high" | "medium" | "low");
      
      if (result?.success) {
        setNotification({
          type: 'success',
          title: 'Prioridad cambiada exitosamente',
          message: `"${result.taskTitle}" ahora tiene prioridad ${result.newPriority}`,
          priority: result.newPriority
        });
      }
    } catch (error) {
      console.error('Error changing task priority:', error);
      setNotification({
        type: 'error',
        title: 'Error al cambiar prioridad',
        message: 'No se pudo actualizar la prioridad de la tarea'
      });
    }
  };

  const getTasksByPriority = (priority: string) => {
    return tasks.filter(task => task.priority === priority);
  };

  const getDaysRemaining = (dueDate: Date) => {
    const today = new Date();
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
              💡 Drag & Drop de Prioridades
            </h3>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Arrastra las tareas entre las columnas de prioridad para cambiar su nivel de urgencia.
          </p>
        </div>
        
        {/* Columnas de Prioridad */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto scrollbar-hide">
          {priorityConfigs.map((priority) => {
            const priorityTasks = getTasksByPriority(priority.id);
            
            return (
              <div key={priority.id} className="min-w-[280px] sm:min-w-0">
                <DroppablePriorityColumn
                  priority={priority}
                  tasks={priorityTasks}
                  onTaskClick={onTaskClick}
                  onCompleteTask={onCompleteTask}
                  onTaskDrop={handleTaskDrop}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  formatDate={formatDate}
                  isOverdue={isOverdue}
                  getDaysRemaining={getDaysRemaining}
                  showCompanyInfo={showCompanyInfo}
                  getCompanyName={getCompanyName}
                  getCompanyColor={getCompanyColor}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Notificaciones */}
      {notification && (
        <TaskNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </DragDropProvider>
  );
}
