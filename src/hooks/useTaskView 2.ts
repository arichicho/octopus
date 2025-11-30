import { useState, useMemo } from 'react';
import { Task } from '@/types/task';
import { ViewType, getDefaultView, getAllViewConfigs, ViewConfig } from '@/lib/managers/ViewConfigManager';
import {
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatTaskDate,
  isTaskOverdue,
  getActiveTasks
} from '@/lib/utils/taskUtils';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { getCompanyName, getCompanyColor } from '@/lib/managers/CompanyFilterManager';

/**
 * Hook for managing task view state and utilities
 * Centralizes view-related logic shared across components
 */
export interface UseTaskViewOptions {
  tasks: Task[];
  companies?: CompanyEnhanced[];
  defaultView?: ViewType;
}

export interface TaskViewHelpers {
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
  getCompanyName?: (companyId: string) => string;
  getCompanyColor?: (companyId: string) => string;
}

export function useTaskView(options: UseTaskViewOptions) {
  const { tasks, companies = [], defaultView } = options;

  const [activeView, setActiveView] = useState<ViewType>(defaultView || getDefaultView());
  const viewConfigs = getAllViewConfigs();

  // Get active tasks
  const activeTasks = useMemo(() => getActiveTasks(tasks), [tasks]);

  // Company helpers (only if companies provided)
  const companyHelpers = useMemo(() => {
    if (companies.length === 0) return undefined;
    
    return {
      getCompanyName: (companyId: string) => getCompanyName(companyId, companies),
      getCompanyColor: (companyId: string) => getCompanyColor(companyId, companies)
    };
  }, [companies]);

  // Task view helpers
  const helpers: TaskViewHelpers = useMemo(() => ({
    getStatusIcon,
    getStatusColor,
    getPriorityColor,
    formatDate: formatTaskDate,
    isOverdue: isTaskOverdue,
    ...companyHelpers
  }), [companyHelpers]);

  return {
    activeView,
    setActiveView,
    viewConfigs,
    activeTasks,
    helpers
  };
}

