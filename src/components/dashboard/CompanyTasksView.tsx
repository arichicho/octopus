'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Task } from '@/types/task';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { useHashNavigation } from '@/lib/hooks/useHashNavigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { TaskModal } from '@/components/modals/TaskModal';
import { CompanyIcon } from '@/components/companies/CompanyIcon';
import { useTaskView } from '@/hooks/useTaskView';
import { TaskViewHeader } from '@/components/dashboard/shared/TaskViewHeader';
import { ViewSelector } from '@/components/dashboard/shared/ViewSelector';
import { ViewContentRenderer } from '@/components/dashboard/shared/ViewContentRenderer';
import { getActiveTasks } from '@/lib/utils/taskUtils';

/**
 * Company Tasks View - Shows tasks for a specific company
 * Refactored to use centralized utilities and shared components
 */
export function CompanyTasksView() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  const { user } = useAuth();
  const { companies, fetchCompanies, selectedCompany, setSelectedCompany } = useCompanyEnhancedStore();
  const { tasks, loadTasks, updateTask, loading: tasksLoading } = useTaskStore();
  const { companyId, clearHash } = useHashNavigation();

  const company = selectedCompany || companies.find(c => c.id === companyId);
  const companyTasks = showAllCompanies
    ? tasks
    : tasks.filter(task => task.companyId === company?.id);
  const pendingTasks = getActiveTasks(companyTasks);

  // Use centralized task view hook
  const { activeView, setActiveView, viewConfigs, helpers } = useTaskView({
    tasks: pendingTasks,
    companies: showAllCompanies ? companies : []
  });

  // Load data when companyId changes
  useEffect(() => {
    if (companyId && user?.uid) {
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

  // Handlers
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
    // Clear hash navigation
    clearHash();
    // Clear selected company from store
    setSelectedCompany?.(null);
  };

  // Early returns for missing data
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
      <TaskViewHeader
        title={showAllCompanies ? 'Todas las Empresas' : company.name}
        subtitle={`${pendingTasks.length} tareas pendientes`}
        company={showAllCompanies ? undefined : company}
        showAllCompanies={showAllCompanies}
        onBack={handleBackToBoard}
        showBackButton={true}
        onCreateTask={handleOpenCreateModal}
      />

      {/* Company Selector */}
      {companies.length > 0 && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Empresas</h3>
            <span className="text-xs text-gray-500 hidden sm:inline">Filtra por empresa</span>
          </div>
          <div className="flex gap-2 py-1 horizontal-scroll scrollbar-hide">
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
              <Badge variant="secondary" className="text-xs">
                {getActiveTasks(tasks).length}
              </Badge>
            </button>
            {companies.map((c) => {
              const count = getActiveTasks(tasks.filter(t => t.companyId === c.id)).length;
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
              <CheckCircle className="h-4 w-4 mr-2" />
              Crear Nueva Tarea
            </Button>
          </div>
        ) : (
          <div className="w-full">
            {/* View Selector */}
            <ViewSelector
              viewConfigs={viewConfigs}
              activeView={activeView}
              onViewChange={setActiveView}
              description={`Selecciona cómo quieres visualizar las tareas de ${company.name}`}
            />

            {/* View Content */}
            <ViewContentRenderer
              activeView={activeView}
              tasks={pendingTasks}
              helpers={helpers}
              showCompanyInfo={showAllCompanies}
              companyId={company.id}
              onTaskClick={handleOpenEditModal}
              onCompleteTask={handleCompleteTask}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        initialCompanyId={company.id}
        onTaskCreated={() => {
          if (user?.uid) loadTasks(user.uid);
          handleCloseCreateModal();
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
