'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, AlertTriangle, Plus, Building2, Star, Users, List, CalendarDays, Calendar } from 'lucide-react';
import { Task } from '@/lib/firebase/firestore';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { PriorityKanbanView } from '@/components/dashboard/PriorityKanbanView';
import { StatusWorkflowView } from '@/components/dashboard/StatusWorkflowView';
import { DeadlineKanbanView } from '@/components/dashboard/DeadlineKanbanView';
import { TaskListView } from '@/components/dashboard/TaskListView';
import { TeamAssignmentView } from '@/components/dashboard/TeamAssignmentView';
import { CalendarTimelineView } from '@/components/dashboard/CalendarTimelineView';
import { CompanyIcon } from '@/components/companies/CompanyIcon';

interface GeneralKanbanViewProps {
  companies: CompanyEnhanced[];
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCompleteTask?: (e: React.MouseEvent, task: Task) => void;
  onCompanyClick?: (company: CompanyEnhanced) => void;
}

export function GeneralKanbanView({
  companies,
  tasks,
  onTaskClick,
  onCompleteTask,
  onCompanyClick
}: GeneralKanbanViewProps) {
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [selectedCompanyForTask, setSelectedCompanyForTask] = useState<CompanyEnhanced | null>(null);
  const [activeView, setActiveView] = useState<'priority' | 'status' | 'deadlines' | 'calendar' | 'team' | 'list'>('list');
  // Filtro de empresa (chip selector)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Filter only active tasks
  const activeTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
  const filteredTasks = selectedCompanyId
    ? activeTasks.filter(t => t.companyId === selectedCompanyId)
    : activeTasks;

    // Debug logs
    console.log('🔍 GeneralKanbanView Debug:');
    console.log('  - companiesCount:', companies.length);
    console.log('  - tasksCount:', tasks.length);
    console.log('  - activeTasksCount:', activeTasks.length);
    console.log('  - selectedCompanyId:', selectedCompanyId);
    console.log('  - activeView:', activeView);
    console.log('  - showCompanyInfo:', true);
    console.log('  - companies:', companies.map(c => ({ id: c.id, name: c.name })));
    console.log('  - filteredTasks:', filteredTasks.map(t => ({ id: t.id, title: t.title, companyId: t.companyId, status: t.status })));

  // Configuración de las vistas disponibles
  const viewConfigs = [
    {
      id: 'priority' as const,
      title: 'Por Prioridad',
      icon: Star,
      description: 'Organiza tareas por nivel de urgencia'
    },
    {
      id: 'status' as const,
      title: 'Por Estado',
      icon: Clock,
      description: 'Flujo de trabajo por estado'
    },
    {
      id: 'deadlines' as const,
      title: 'Por Vencimientos',
      icon: CalendarDays,
      description: 'Organiza por fechas de vencimiento'
    },
    {
      id: 'calendar' as const,
      title: 'Calendario',
      icon: Calendar,
      description: 'Vista de calendario temporal'
    },
    {
      id: 'team' as const,
      title: 'Por Equipo',
      icon: Users,
      description: 'Organiza por responsables'
    },
    {
      id: 'list' as const,
      title: 'Lista',
      icon: List,
      description: 'Vista de lista simple'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'Sin fecha';
    try {
      const dateObj = firestoreDateToDate(date);
      return format(dateObj, 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const isOverdue = (dueDate: Date | null | undefined) => {
    if (!dueDate) return false;
    try {
      const dateObj = firestoreDateToDate(dueDate);
      return dateObj < new Date();
    } catch {
      return false;
    }
  };

  const handleCreateTask = (company: CompanyEnhanced) => {
    setSelectedCompanyForTask(company);
    setCreateTaskModalOpen(true);
  };

  // Abrir modal de creación usando el filtro activo o un ID explícito
  const openCreateForCompany = (companyId?: string | null) => {
    const id = companyId ?? selectedCompanyId;
    if (id) {
      const company = companies.find(c => c.id === id) || null;
      setSelectedCompanyForTask(company);
    } else {
      setSelectedCompanyForTask(null);
    }
    setCreateTaskModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateTaskModalOpen(false);
    setSelectedCompanyForTask(null);
  };

  // Helper functions for company info
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Empresa desconocida';
  };

  const getCompanyColor = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.color : '#6b7280';
  };

  // Calculate stats
  const totalTasks = filteredTasks.length;
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress').length;
  const companiesWithTasks = companies.filter(company => 
    filteredTasks.some(task => task.companyId === company.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Vista General
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Todas las tareas de todas las empresas
          </p>
        </div>
        <Button 
          onClick={() => openCreateForCompany(null)}
          size="sm"
          className="flex items-center space-x-2 px-4 py-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Nueva Tarea</span>
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTasks}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Tareas</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{companiesWithTasks}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Empresas</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{inProgressTasks}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">En Progreso</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingTasks}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pendientes</div>
        </div>
      </div>

      {/* Company Selector (filtro) */}
      {companies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Empresas</h3>
            <span className="text-xs text-gray-500 hidden sm:inline">Filtra por empresa</span>
          </div>
          <div className="flex gap-2 overflow-x-auto py-1 horizontal-scroll-container scrollbar-hide">
            <button
              onClick={() => setSelectedCompanyId(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors whitespace-nowrap flex-shrink-0 ${
                selectedCompanyId === null
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Mostrar todas las tareas"
            >
              <span className="text-sm">Todas</span>
              <Badge variant="secondary" className="text-xs">{activeTasks.length}</Badge>
            </button>
            {companies.map((c) => {
              const count = activeTasks.filter(t => t.companyId === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompanyId(prev => prev === c.id ? null : c.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors whitespace-nowrap flex-shrink-0 ${
                    selectedCompanyId === c.id
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={`Filtrar por ${c.name}`}
                >
                  <CompanyIcon
                    logoUrl={c.logoUrl}
                    defaultIcon={c.defaultIcon}
                    name={c.name}
                    size="sm"
                    color={c.color}
                  />
                  <span className="text-sm max-w-[160px] truncate">{c.name}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                  {/* Crear tarea directamente para esta empresa */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openCreateForCompany(c.id); }}
                    className="ml-1 inline-flex items-center justify-center h-6 w-6 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={`Crear tarea en ${c.name}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Info */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Empresas: {companies.length} • Tareas activas: {activeTasks.length}
        </p>
      </div>

      {/* View Tabs */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
        <div className="flex sm:grid sm:grid-cols-6 gap-1 overflow-x-auto horizontal-scroll-container scrollbar-hide">
          {viewConfigs.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex flex-col items-center justify-center space-y-1 p-2 sm:p-3 rounded-lg transition-all duration-200 group relative flex-shrink-0 min-w-[80px] sm:min-w-0 ${
                activeView === view.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title={view.description}
            >
              <view.icon className="h-4 w-4" />
              <span className="text-xs font-medium text-center leading-tight">{view.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Views */}
      {activeView === 'priority' && (
        <PriorityKanbanView
          tasks={filteredTasks}
          onTaskClick={onTaskClick}
          onCompleteTask={onCompleteTask}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          formatDate={formatDate}
          isOverdue={isOverdue}
          showCompanyInfo={true}
          getCompanyName={getCompanyName}
          getCompanyColor={getCompanyColor}
        />
      )}
      
      {activeView === 'status' && (
        <StatusWorkflowView
          tasks={filteredTasks}
          onTaskClick={onTaskClick}
          onCompleteTask={onCompleteTask}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          formatDate={formatDate}
          isOverdue={isOverdue}
          showCompanyInfo={true}
          getCompanyName={getCompanyName}
          getCompanyColor={getCompanyColor}
        />
      )}
      
      {activeView === 'deadlines' && (
        <DeadlineKanbanView
          tasks={filteredTasks}
          onTaskClick={onTaskClick}
          onCompleteTask={onCompleteTask}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          formatDate={formatDate}
          isOverdue={isOverdue}
          showCompanyInfo={true}
          getCompanyName={getCompanyName}
          getCompanyColor={getCompanyColor}
        />
      )}
      
      {activeView === 'calendar' && (
        <CalendarTimelineView
          tasks={filteredTasks}
          onTaskClick={onTaskClick}
          onCompleteTask={onCompleteTask}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          formatDate={formatDate}
          isOverdue={isOverdue}
          showCompanyInfo={true}
          getCompanyName={getCompanyName}
          getCompanyColor={getCompanyColor}
        />
      )}
      
      {activeView === 'team' && (
        <TeamAssignmentView
          tasks={filteredTasks}
          onTaskClick={onTaskClick}
          onCompleteTask={onCompleteTask}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          formatDate={formatDate}
          isOverdue={isOverdue}
          showCompanyInfo={true}
          getCompanyName={getCompanyName}
          getCompanyColor={getCompanyColor}
        />
      )}
      
      {activeView === 'list' && (
        <TaskListView
          tasks={filteredTasks}
          onTaskClick={onTaskClick || (() => {})}
          onCompleteTask={onCompleteTask || ((e) => e.stopPropagation())}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          formatDate={formatDate}
          isOverdue={isOverdue}
          showCompanyInfo={true}
          getCompanyName={getCompanyName}
          getCompanyColor={getCompanyColor}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createTaskModalOpen}
        onClose={handleCloseCreateModal}
        initialCompanyId={selectedCompanyForTask?.id || selectedCompanyId || undefined}
        onTaskCreated={() => {
          handleCloseCreateModal();
          // The parent component should reload tasks
        }}
      />
    </div>
  );
}
