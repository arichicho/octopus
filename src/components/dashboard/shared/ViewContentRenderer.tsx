'use client';

import { memo } from 'react';
import { Task } from '@/types/task';
import { ViewType } from '@/lib/managers/ViewConfigManager';
import { PriorityKanbanView } from '@/components/dashboard/PriorityKanbanView';
import { StatusWorkflowView } from '@/components/dashboard/StatusWorkflowView';
import { DeadlineKanbanView } from '@/components/dashboard/DeadlineKanbanView';
import { TaskListView } from '@/components/dashboard/TaskListView';
import { TeamAssignmentView } from '@/components/dashboard/TeamAssignmentView';
import { CalendarTimelineView } from '@/components/dashboard/CalendarTimelineView';
import { TaskViewHelpers } from '@/hooks/useTaskView';

interface ViewContentRendererProps {
  activeView: ViewType;
  tasks: Task[];
  helpers: TaskViewHelpers;
  showCompanyInfo?: boolean;
  companyId?: string;
  onTaskClick: (task: Task) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
}

/**
 * Renders the appropriate view component based on activeView
 * Centralizes view rendering logic
 * Memoized to prevent unnecessary re-renders
 */
export const ViewContentRenderer = memo(function ViewContentRenderer({
  activeView,
  tasks,
  helpers,
  showCompanyInfo = false,
  companyId,
  onTaskClick,
  onCompleteTask
}: ViewContentRendererProps) {
  const commonProps = {
    tasks,
    onTaskClick,
    onCompleteTask,
    getStatusIcon: helpers.getStatusIcon,
    getStatusColor: helpers.getStatusColor,
    getPriorityColor: helpers.getPriorityColor,
    formatDate: helpers.formatDate,
    isOverdue: helpers.isOverdue,
    showCompanyInfo,
    getCompanyName: helpers.getCompanyName,
    getCompanyColor: helpers.getCompanyColor
  };

  switch (activeView) {
    case 'priority':
      return <PriorityKanbanView {...commonProps} />;
    
    case 'status':
      return <StatusWorkflowView {...commonProps} />;
    
    case 'deadlines':
      return <DeadlineKanbanView {...commonProps} />;
    
    case 'calendar':
      return <CalendarTimelineView {...commonProps} />;
    
    case 'team':
      return <TeamAssignmentView {...commonProps} companyId={companyId} />;
    
    case 'list':
    default:
      return <TaskListView {...commonProps} />;
  }
});

