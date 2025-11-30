"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useCompanyEnhancedStore } from "@/lib/store/useCompanyEnhancedStore";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { TaskModal } from "@/components/modals/TaskModal";
import { Button } from "@/components/ui/button";
import { CheckCircle, Plus } from "lucide-react";
import { Task } from "@/types/task";
import { CompanyEnhanced } from "@/types/company-enhanced";
import { getCompany } from "@/lib/firebase/companies";
import { useTaskView } from "@/hooks/useTaskView";
import { filterUserCompanies, mergeCompaniesForView } from "@/lib/managers/CompanyFilterManager";
import { TaskViewHeader } from "@/components/dashboard/shared/TaskViewHeader";
import { TaskStatsCards } from "@/components/dashboard/shared/TaskStatsCards";
import { ViewSelector } from "@/components/dashboard/shared/ViewSelector";
import { ViewContentRenderer } from "@/components/dashboard/shared/ViewContentRenderer";

/**
 * General View Page - Shows all tasks from all companies
 * Refactored to use centralized utilities and shared components
 */
export default function GeneralViewPage() {
  const { user } = useAuth();
  const { tasks, loadTasks, updateTask } = useTaskStore();
  const { companies, fetchCompanies } = useCompanyEnhancedStore();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [extraCompanies, setExtraCompanies] = useState<CompanyEnhanced[]>([]);

  // Use centralized task view hook
  const { activeView, setActiveView, viewConfigs, activeTasks, helpers } = useTaskView({
    tasks,
    companies: useMemo(() => {
      const userCompanies = filterUserCompanies(companies, {
        userId: user?.uid,
        userEmail: user?.email
      });
      return mergeCompaniesForView(userCompanies, extraCompanies);
    }, [companies, extraCompanies, user?.uid, user?.email])
  });

  // Load data on mount
  useEffect(() => {
    if (!user?.uid) return;
    loadTasks(user.uid);
    fetchCompanies(user.uid);
  }, [user?.uid, loadTasks, fetchCompanies]);

  // Filter companies to only show user's companies
  const userCompanies = useMemo(() => {
    return filterUserCompanies(companies, {
      userId: user?.uid,
      userEmail: user?.email
    });
  }, [companies, user?.uid, user?.email]);

  // Companies available in the General view (union of filtered + fetched extras)
  const companiesForView = useMemo(() => {
    return mergeCompaniesForView(userCompanies, extraCompanies);
  }, [userCompanies, extraCompanies]);

  // Ensure we have company info for all tasks shown
  useEffect(() => {
    const ensureCompanies = async () => {
      const ids = Array.from(new Set(activeTasks.map((t) => t.companyId).filter(Boolean)));
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
    if (activeTasks.length > 0) ensureCompanies();
  }, [activeTasks, companiesForView]);

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

  const handleOpenEditModal = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedTask(undefined);
    setIsEditModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <TaskViewHeader
        title="Vista General"
        subtitle="Todas las tareas de todas las empresas"
        onCreateTask={() => setQuickAddOpen(true)}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTasks.length === 0 ? (
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
            <Button onClick={() => setQuickAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Nueva Tarea
            </Button>
          </div>
        ) : (
          <div className="w-full">
            {/* Stats */}
            <TaskStatsCards tasks={activeTasks} companiesCount={userCompanies.length} />

            {/* View Selector */}
            <ViewSelector
              viewConfigs={viewConfigs}
              activeView={activeView}
              onViewChange={setActiveView}
              description="Selecciona cómo quieres visualizar todas tus tareas"
            />

            {/* View Content */}
            <ViewContentRenderer
              activeView={activeView}
              tasks={activeTasks}
              helpers={helpers}
              showCompanyInfo={true}
              onTaskClick={handleOpenEditModal}
              onCompleteTask={handleCompleteTask}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onTaskCreated={() => {
          if (user?.uid) loadTasks(user.uid);
          setQuickAddOpen(false);
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
