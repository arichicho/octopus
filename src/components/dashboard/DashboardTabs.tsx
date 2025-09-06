'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Target, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Users, 
  Building2,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

// Importar las vistas
import { MyDayView } from './MyDayView';
import { WorkflowView } from './WorkflowView';
import { ExecutiveSummaryView } from './ExecutiveSummaryView';
import { TaskListView } from './TaskListView';
import { StatusWorkflowView } from './StatusWorkflowView';
import { PriorityKanbanView } from './PriorityKanbanView';
import { DeadlineKanbanView } from './DeadlineKanbanView';
import { TeamAssignmentView } from './TeamAssignmentView';
import { CalendarTimelineView } from './CalendarTimelineView';
import { CompanyTasksView } from './CompanyTasksView';

export type ViewType = 
  | 'overview'
  | 'my-day'
  | 'workflow'
  | 'tasks'
  | 'kanban-status'
  | 'kanban-priority'
  | 'kanban-deadline'
  | 'team'
  | 'calendar'
  | 'companies'
  | 'executive';

interface TabConfig {
  id: ViewType;
  label: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType;
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Vista General',
    icon: Home,
    component: () => <div>Vista General (Dashboard actual)</div>
  },
  {
    id: 'my-day',
    label: 'Mi Día',
    icon: Target,
    component: MyDayView
  },
  {
    id: 'workflow',
    label: 'Flujo de Trabajo',
    icon: TrendingUp,
    component: WorkflowView
  },
  {
    id: 'tasks',
    label: 'Lista de Tareas',
    icon: CheckSquare,
    component: TaskListView
  },
  {
    id: 'kanban-status',
    label: 'Kanban por Estado',
    icon: BarChart3,
    component: StatusWorkflowView
  },
  {
    id: 'kanban-priority',
    label: 'Kanban por Prioridad',
    icon: AlertTriangle,
    component: PriorityKanbanView
  },
  {
    id: 'kanban-deadline',
    label: 'Kanban por Fecha',
    icon: Clock,
    component: DeadlineKanbanView
  },
  {
    id: 'team',
    label: 'Asignación de Equipo',
    icon: Users,
    component: TeamAssignmentView
  },
  {
    id: 'calendar',
    label: 'Calendario',
    icon: Calendar,
    component: CalendarTimelineView
  },
  {
    id: 'companies',
    label: 'Tareas por Empresa',
    icon: Building2,
    component: CompanyTasksView
  },
  {
    id: 'executive',
    label: 'Resumen Ejecutivo',
    icon: BarChart3,
    component: ExecutiveSummaryView
  }
];

interface DashboardTabsProps {
  defaultView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  overviewComponent?: React.ComponentType;
}

export function DashboardTabs({ defaultView = 'overview', onViewChange, overviewComponent }: DashboardTabsProps) {
  const [activeView, setActiveView] = useState<ViewType>(defaultView);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    onViewChange?.(view);
  };

  const activeTab = tabs.find(tab => tab.id === activeView);
  const ActiveComponent = activeView === 'overview' && overviewComponent ? overviewComponent : activeTab?.component;

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewChange(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 rounded-none border-b-2 transition-all
                  ${isActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap text-sm font-medium">
                  {tab.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
