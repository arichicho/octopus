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
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [activeView, setActiveView] = useState<'priority' | 'status' | 'deadlines' | 'calendar' | 'team' | 'list'>('deadlines');

  const { companies, fetchCompanies } = useCompanyEnhancedStore();
  const { tasks, loadTasks, updateTask } = useTaskStore();

  const company = companies.find(c => c.id === companyId);
  const companyTasks = tasks.filter(task => task.companyId === companyId);
  const pendingTasks = companyTasks.filter(task => task.status !== 'completed');

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

  useEffect(() => {
    fetchCompanies();
    loadTasks();
  }, [fetchCompanies, loadTasks]);

  // Handle hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      console.log('🔍 CompanyTasksView - Hash changed:', hash);
      if (hash.startsWith('company=')) {
        const id = hash.split('=')[1];
        console.log('🏢 CompanyTasksView - Setting company ID:', id);
        setCompanyId(id);
      } else {
        console.log('❌ CompanyTasksView - No company ID in hash');
        setCompanyId(null);
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
    router.push('/dashboard');
  };

  if (!companyId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ID de empresa no proporcionado
          </h1>
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
            La empresa con ID {companyId} no existe
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
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleBackToBoard} 
              variant="ghost" 
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Button>
            <div className="flex items-center space-x-3">
              <CompanyIcon
                logoUrl={company.logoUrl}
                defaultIcon={company.defaultIcon}
                name={company.name}
                size="lg"
                color={company.color}
                className="flex-shrink-0"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {company.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {pendingTasks.length} tareas pendientes
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleOpenCreateModal} 
            size="lg" 
            className="flex items-center space-x-2 px-6 py-3"
          >
            <Plus className="h-5 w-5" />
            <span>Nueva Tarea</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {pendingTasks.length === 0 ? (
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
            {/* Debug info */}
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                🔍 Debug: Mostrando menú de vistas para {company.name} ({pendingTasks.length} tareas pendientes)
              </p>
            </div>
            
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
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {viewConfigs.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => setActiveView(view.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 rounded-lg transition-all duration-200 group relative ${
                        activeView === view.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                      title={view.description}
                    >
                      <view.icon className="h-4 w-4" />
                      <span className="text-xs font-medium text-center">{view.title}</span>
                      
                      {/* Tooltip para pantallas pequeñas */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 sm:hidden">
                        {view.description}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
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
                tasks={companyTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
              />
            )}
            
            {activeView === 'status' && (
              <StatusWorkflowView
                tasks={companyTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
              />
            )}
            
            {activeView === 'deadlines' && (
              <DeadlineKanbanView
                tasks={companyTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
              />
            )}
            
            {activeView === 'calendar' && (
              <CalendarTimelineView
                tasks={companyTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
              />
            )}
            
            {activeView === 'team' && (
              <TeamAssignmentView
                tasks={companyTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                companyId={company.id}
              />
            )}
            
            {activeView === 'list' && (
              <TaskListView
                tasks={companyTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
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
