"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useCompanyEnhancedStore } from "@/lib/store/useCompanyEnhancedStore";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { TaskModal } from "@/components/modals/TaskModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Building2, 
  Star, 
  Clock, 
  CalendarDays, 
  Calendar, 
  Users, 
  List,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
import { CompanyEnhanced } from "@/types/company-enhanced";
import { getCompany } from "@/lib/firebase/companies";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { firestoreDateToDate } from "@/lib/utils/dateUtils";
import { PriorityKanbanView } from "@/components/dashboard/PriorityKanbanView";
import { StatusWorkflowView } from "@/components/dashboard/StatusWorkflowView";
import { DeadlineKanbanView } from "@/components/dashboard/DeadlineKanbanView";
import { TaskListView } from "@/components/dashboard/TaskListView";
import { TeamAssignmentView } from "@/components/dashboard/TeamAssignmentView";
import { CalendarTimelineView } from "@/components/dashboard/CalendarTimelineView";
import { CompanyIcon } from "@/components/companies/CompanyIcon";

export default function GeneralViewPage() {
  const { user } = useAuth();
  const { tasks, loadTasks, updateTask } = useTaskStore();
  const { companies, fetchCompanies } = useCompanyEnhancedStore();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [activeView, setActiveView] = useState<'priority' | 'status' | 'deadlines' | 'calendar' | 'team' | 'list'>('list');
  // Local cache for companies referenced by tasks but not in user filter
  const [extraCompanies, setExtraCompanies] = useState<CompanyEnhanced[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    // Load core data
    loadTasks(user.uid);
    fetchCompanies(user.uid);
  }, [user?.uid, loadTasks, fetchCompanies]);

  // Filter companies to only show user's companies
  const userCompanies = useMemo(() => {
    if (!user?.uid) return [];
    
    // First, try to get companies by UID
    let filtered = companies.filter((c: any) => c.createdBy === user.uid);
    
    // If no companies found by UID, try by email
    if (filtered.length === 0) {
      filtered = companies.filter((c: any) => c.createdBy === user.email);
    }
    
    return filtered;
  }, [companies, user?.uid, user?.email]);

  // Companies available in the General view (union of filtered + fetched extras)
  const companiesForView = useMemo(() => {
    const map = new Map<string, CompanyEnhanced>();
    [...userCompanies, ...extraCompanies].forEach(c => c?.id && map.set(c.id, c));
    return Array.from(map.values());
  }, [userCompanies, extraCompanies]);

  // All active tasks from all companies
  const allActiveTasks = useMemo(() => {
    const filtered = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    console.log('🔍 Debug allActiveTasks:', {
      totalTasks: tasks.length,
      activeTasks: filtered.length,
      tasks: filtered.map(t => ({ id: t.id, title: t.title, status: t.status, companyId: t.companyId }))
    });
    return filtered;
  }, [tasks]);

  // Ensure we have company info for all tasks shown
  useEffect(() => {
    const ensureCompanies = async () => {
      const ids = Array.from(new Set(allActiveTasks.map((t) => t.companyId).filter(Boolean)));
      const existing = new Set(companiesForView.map((c) => c.id));
      const missing = ids.filter((id) => !existing.has(id));
      if (missing.length === 0) return;
      const fetched = await Promise.all(missing.map((id) => getCompany(id)));
      const valid = (fetched.filter(Boolean) as CompanyEnhanced[]);
      if (valid.length > 0) {
        setExtraCompanies(prev => {
          const map = new Map<string, CompanyEnhanced>();
          [...prev, ...valid].forEach(c => c?.id && map.set(c.id, c));
          return Array.from(map.values());
        });
      }
    };
    if (allActiveTasks.length > 0) ensureCompanies();
  }, [allActiveTasks, companiesForView]);

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

  const handleOpenEditModal = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedTask(undefined);
    setIsEditModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setQuickAddOpen(true);
  };

  const handleCloseCreateModal = () => {
    setQuickAddOpen(false);
  };

  // Get company name for a task
  const getCompanyName = (companyId: string) => {
    const company = companiesForView.find(c => c.id === companyId);
    return company?.name || 'Empresa desconocida';
  };

  // Get company color for a task
  const getCompanyColor = (companyId: string) => {
    const company = companiesForView.find(c => c.id === companyId);
    return company?.color || '#3b82f6';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Vista General
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Todas las tareas de todas las empresas
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
        {allActiveTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              ¡No hay tareas pendientes!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Todas las tareas están completadas
            </p>
            <Button onClick={handleOpenCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Nueva Tarea
            </Button>
          </div>
        ) : (
          <div className="w-full">
            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tareas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allActiveTasks.length}</p>
                  </div>
                  <List className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Empresas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{userCompanies.length}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Progreso</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {allActiveTasks.filter(t => t.status === 'in_progress').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {allActiveTasks.filter(t => t.status === 'pending').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Menú de vistas */}
            <div className="mb-6">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Vistas de Tareas
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selecciona cómo quieres visualizar todas tus tareas
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
                    </button>
                  ))}
                </div>
              </div>
              
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
                tasks={allActiveTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
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
                tasks={allActiveTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
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
                tasks={allActiveTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
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
                tasks={allActiveTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
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
                tasks={allActiveTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
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
                tasks={allActiveTasks}
                onTaskClick={handleOpenEditModal}
                onCompleteTask={handleCompleteTask}
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
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal 
        isOpen={quickAddOpen} 
        onClose={handleCloseCreateModal} 
        onTaskCreated={(result) => {
          console.log('Task created:', result);
        }}
      />
      <TaskModal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal} 
        task={selectedTask}
        mode="edit"
      />
    </div>
  );
}
