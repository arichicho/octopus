'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { TaskStatus } from '@/types/task';
import { Task } from '@/lib/firebase/firestore';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { DroppableStatusColumn } from '@/components/tasks/DroppableStatusColumn';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { DragDropProvider } from '@/lib/context/DragDropContext';
import { TaskNotification } from '@/components/ui/task-notification';

interface StatusWorkflowViewProps {
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

const statusConfigs = [
  {
    id: 'pending' as TaskStatus,
    title: 'Pendiente',
    description: 'Tareas por iniciar',
    color: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800',
    headerColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    icon: AlertTriangle
  },
  {
    id: 'in_progress' as TaskStatus,
    title: 'En Progreso',
    description: 'Tareas en desarrollo',
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    headerColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    icon: Clock
  },
  {
    id: 'review' as TaskStatus,
    title: 'Revisión',
    description: 'Tareas en revisión',
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
    headerColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    icon: Clock
  },
  {
    id: 'completed' as TaskStatus,
    title: 'Completada',
    description: 'Tareas finalizadas',
    color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    headerColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle
  }
];

export function StatusWorkflowView({
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
}: StatusWorkflowViewProps) {
  const { changeTaskStatus } = useTaskStore();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    status?: string;
  } | null>(null);

  const handleTaskDrop = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const result = await changeTaskStatus(taskId, newStatus);
      
      if (result?.success) {
        setNotification({
          type: 'success',
          title: 'Estado cambiado exitosamente',
          message: `"${result.taskTitle}" ahora está ${result.newStatus}`,
          status: result.newStatus
        });
      }
    } catch (error) {
      console.error('Error changing task status:', error);
      setNotification({
        type: 'error',
        title: 'Error al cambiar estado',
        message: 'No se pudo actualizar el estado de la tarea'
      });
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
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
              💡 Drag & Drop de Estados
            </h3>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Arrastra las tareas entre las columnas de estado para cambiar su fase en el flujo de trabajo.
          </p>
        </div>
        
        {/* Columnas de Estado */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 horizontal-scroll scrollbar-hide">
          {statusConfigs.map((status) => {
            const statusTasks = getTasksByStatus(status.id);
            
            return (
              <div key={status.id} className="min-w-[280px] sm:min-w-0">
                <DroppableStatusColumn
                  status={status}
                  tasks={statusTasks}
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
