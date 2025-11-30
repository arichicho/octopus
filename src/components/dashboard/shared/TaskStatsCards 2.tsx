'use client';

import { memo, useMemo } from 'react';
import { List, Building2, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '@/types/task';

interface TaskStatsCardsProps {
  tasks: Task[];
  companiesCount?: number;
}

/**
 * Shared stats cards component for task views
 * Memoized to prevent unnecessary re-renders
 */
export const TaskStatsCards = memo(function TaskStatsCards({ tasks, companiesCount }: TaskStatsCardsProps) {
  const stats = useMemo(() => ({
    totalTasks: tasks.length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length
  }), [tasks]);
  
  const { totalTasks, inProgressTasks, pendingTasks } = stats;

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tareas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTasks}</p>
          </div>
          <List className="h-8 w-8 text-blue-600" />
        </div>
      </div>
      {companiesCount !== undefined && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Empresas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{companiesCount}</p>
            </div>
            <Building2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Progreso</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{inProgressTasks}</p>
          </div>
          <Clock className="h-8 w-8 text-orange-600" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingTasks}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
      </div>
    </div>
  );
});

