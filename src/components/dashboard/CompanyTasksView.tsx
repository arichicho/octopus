'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, AlertTriangle, Calendar, Plus, ArrowLeft, Building2, Star, Users, List, CalendarDays } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { useHashNavigation } from '@/lib/hooks/useHashNavigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { TaskModal } from '@/components/modals/TaskModal';
import { CompanyIcon } from '@/components/companies/CompanyIcon';
import { PriorityKanbanView } from '@/components/dashboard/PriorityKanbanView';
import { StatusWorkflowView } from '@/components/dashboard/StatusWorkflowView';
import { DeadlineKanbanView } from '@/components/dashboard/DeadlineKanbanView';
import { TaskListView } from '@/components/dashboard/TaskListView';
import { TeamAssignmentView } from '@/components/dashboard/TeamAssignmentView';
import { CalendarTimelineView } from '@/components/dashboard/CalendarTimelineView';

export function CompanyTasksView() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [activeView, setActiveView] = useState<'priority' | 'status' | 'deadlines' | 'calendar' | 'team' | 'list'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  const { user } = useAuth();
  const { companies, fetchCompanies, loading: companiesLoading, selectedCompany } = useCompanyEnhancedStore();
  const { tasks, loadTasks, updateTask, loading: tasksLoading } = useTaskStore();
  const { companyId, clearHash } = useHashNavigation();

  const company = selectedCompany || companies.find(c => c.id === companyId);
  const companyTasks = showAllCompanies 
    ? tasks 
    : tasks.filter(task => task.companyId === company?.id);
  const pendingTasks = companyTasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');

  // Configuración de las vistas disponibles
  const viewConfigs = [
    {
      id: 'list' as const,
      title: 'Lista',
      icon: List,
      description: 'Vista de lista simple'
    },
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
    }
  ];



  // Load data when companyId changes
  useEffect(() => {
    if (companyId && user?.uid) {
      console.log('🔄 CompanyTasksView - Loading data for company:', companyId, 'user:', user.uid);
      setIsLoading(true);
      Promise.all([
        fetchCompanies(user.uid),
        loadTasks(user.uid)
      ]).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [companyId, user?.uid, fetchCompanies, loadTasks]);

  // Debug logs
  useEffect(() => {
    console.log('🔍 CompanyTasksView - Component state:', {
      companyId,
      company: company?.name,
      companyTasks: companyTasks.length,
      pendingTasks: pendingTasks.length,
      activeView,
      mounted: true
    });
  }, [companyId, company, companyTasks.length, pendingTasks.length, activeView]);

  const getStatusIcon = (status: TaskStatus) => {
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

  const getStatusColor = (status: TaskStatus) => {
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

  const getDaysRemaining = (dueDate: Date) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffTime = dueDateStart.getTime() - todayStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  const handleCompleteTask = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    try {
      await updateTask(task.id!, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleOpenEditModal = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedTask(undefined);
    setIsEditModalOpen(false);
  };

  const handleBackToBoard = () => {
    console.log('🚨🚨🚨 CompanyTasksView - DEPLOY VERSION 3.0 - Back to dashboard clicked');
    console.log('🚨🚨🚨 CompanyTasksView - Current URL before:', window.location.href);
    console.log('🚨🚨🚨 CompanyTasksView - Current hash before:', window.location.hash);
    
    try {
      // Navegación directa sin depender del hook
      console.log('🚨🚨🚨 CompanyTasksView - Clearing hash');
      window.location.hash = '';
      console.log('🚨🚨🚨 CompanyTasksView - New hash after:', window.location.hash);
      console.log('🚨🚨🚨 CompanyTasksView - New URL after:', window.location.href);
    } catch (error) {
      console.error('🚨🚨🚨 CompanyTasksView - Error clearing hash:', error);
    }
  };

  if (!companyId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Selecciona una empresa
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Haz clic en una empresa del tablero para ver sus tareas
          </p>
          <Button onClick={handleBackToBoard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Empresa no encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            La empresa con ID {companyId} no existe o no tienes permisos para acceder
          </p>
          <Button onClick={handleBackToBoard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Button 
              onClick={handleBackToBoard} 
              variant="ghost" 
              size="sm"
              className="flex items-center space-x-2 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver al Dashboard</span>
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {showAllCompanies ? (
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              ) : (
                <CompanyIcon
                  logoUrl={company.logoUrl}
                  defaultIcon={company.defaultIcon}
                  name={company.name}
                  size="md"
                  color={company.color}
                  className="flex-shrink-0"
                />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {showAllCompanies ? 'Todas las Empresas' : company.name}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {pendingTasks.length} tareas pendientes
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleOpenCreateModal} 
            size="sm"
            className="flex items-center space-x-2 px-4 py-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Nueva Tarea</span>
          </Button>
        </div>
      </div>

      {/* Company Selector */}
      {companies.length > 0 && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Empresas</h3>
            <span className="text-xs text-gray-500 hidden sm:inline">Filtra por empresa</span>
          </div>
          <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
            <button
              onClick={() => setShowAllCompanies(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors whitespace-nowrap flex-shrink-0 ${
                showAllCompanies
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Mostrar todas las tareas"
            >
              <span className="text-sm">Todas</span>
              <Badge variant="secondary" className="text-xs">{tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length}</Badge>
            </button>
            {companies.map((c) => {
              const count = tasks.filter(t => t.companyId === c.id && t.status !== 'completed' && t.status !== 'cancelled').length;
              return (
                <button
                  key={c.id}
                  onClick={() => setShowAllCompanies(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors whitespace-nowrap flex-shrink-0 ${
                    !showAllCompanies && company?.id === c.id
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={`Mostrar tareas de ${c.name}`}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: c.color || '#3b82f6' }}
                  />
                  <span className="text-sm">{c.name}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-spin">
              <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Cargando tareas...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Por favor, espera mientras se cargan los datos de {company.name}
            </p>
          </div>
        ) : pendingTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              ¡No hay tareas pendientes!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Todas las tareas de {company.name} están completadas
            </p>
            <Button onClick={handleOpenCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Nueva Tarea
            </Button>
          </div>
                ) : (
          <div className="w-full">
            
            {/* Menú de vistas mejorado */}
            <div className="mb-6">
              {/* Título del menú de vistas */}
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Vistas de Tareas
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selecciona cómo quieres visualizar las tareas de {company.name}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
                <div className="flex sm:grid sm:grid-cols-6 gap-1 overflow-x-auto scrollbar-hide">
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
              
              {/* Indicador de vista activa */}
              <div className="mt-3 flex items-center justify-center">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Vista: {viewConfigs.find(v => v.id === activeView)?.title}</span>
                </div>
              </div>
            </div>
            
            {/* Contenido de las vistas */}
            {activeView === 'priority' && (
              <PriorityKanbanView
                tasks={pendingTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                showCompanyInfo={showAllCompanies}
                getCompanyName={getCompanyName}
                getCompanyColor={getCompanyColor}
              />
            )}
            
            {activeView === 'status' && (
              <StatusWorkflowView
                tasks={pendingTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                showCompanyInfo={showAllCompanies}
                getCompanyName={getCompanyName}
                getCompanyColor={getCompanyColor}
              />
            )}
            
            {activeView === 'deadlines' && (
              <DeadlineKanbanView
                tasks={pendingTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                showCompanyInfo={showAllCompanies}
                getCompanyName={getCompanyName}
                getCompanyColor={getCompanyColor}
              />
            )}
            
            {activeView === 'calendar' && (
              <CalendarTimelineView
                tasks={pendingTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                showCompanyInfo={showAllCompanies}
                getCompanyName={getCompanyName}
                getCompanyColor={getCompanyColor}
              />
            )}
            
            {activeView === 'team' && (
              <TeamAssignmentView
                tasks={pendingTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                companyId={company.id}
                showCompanyInfo={showAllCompanies}
                getCompanyName={getCompanyName}
                getCompanyColor={getCompanyColor}
              />
            )}
            
            {activeView === 'list' && (
              <TaskListView
                tasks={pendingTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                showCompanyInfo={showAllCompanies}
                getCompanyName={getCompanyName}
                getCompanyColor={getCompanyColor}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={handleCloseCreateModal} 
        initialCompanyId={company.id}
        onTaskCreated={(result) => {
          console.log('Task created:', result);
        }}
      />
      <TaskModal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal} 
        company={company}
        task={selectedTask}
        mode="edit"
      />
    </div>
  );
}
