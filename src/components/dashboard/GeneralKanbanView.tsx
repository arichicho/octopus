'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import { Task } from '@/lib/firebase/firestore';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { CompanyIcon } from '@/components/companies/CompanyIcon';
import { useTaskView } from '@/hooks/useTaskView';
import { getActiveTasks } from '@/lib/utils/taskUtils';
import { TaskViewHeader } from '@/components/dashboard/shared/TaskViewHeader';
import { TaskStatsCards } from '@/components/dashboard/shared/TaskStatsCards';
import { ViewSelector } from '@/components/dashboard/shared/ViewSelector';
import { ViewContentRenderer } from '@/components/dashboard/shared/ViewContentRenderer';

interface GeneralKanbanViewProps {
  companies: CompanyEnhanced[];
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCompleteTask?: (e: React.MouseEvent, task: Task) => void;
  onCompanyClick?: (company: CompanyEnhanced) => void;
}

/**
 * General Kanban View - Shows all tasks from all companies with filtering
 * Refactored to use centralized utilities and shared components
 */
export function GeneralKanbanView({
  companies,
  tasks,
  onTaskClick,
  onCompleteTask,
  onCompanyClick
}: GeneralKanbanViewProps) {
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [selectedCompanyForTask, setSelectedCompanyForTask] = useState<CompanyEnhanced | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Filter tasks
  const activeTasks = getActiveTasks(tasks);
  const filteredTasks = selectedCompanyId
    ? activeTasks.filter(t => t.companyId === selectedCompanyId)
    : activeTasks;

  // Use centralized task view hook
  const { activeView, setActiveView, viewConfigs, helpers } = useTaskView({
    tasks: filteredTasks,
    companies
  });

  // Handlers
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

  // Calculate stats
  const companiesWithTasks = companies.filter(company =>
    filteredTasks.some(task => task.companyId === company.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <TaskViewHeader
        title="Vista General"
        subtitle="Todas las tareas de todas las empresas"
        onCreateTask={() => openCreateForCompany(null)}
      />

      {/* Stats Summary */}
      <TaskStatsCards tasks={filteredTasks} companiesCount={companiesWithTasks} />

      {/* Company Selector (filter) */}
      {companies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Empresas</h3>
            <span className="text-xs text-gray-500 hidden sm:inline">Filtra por empresa</span>
          </div>
          <div className="flex gap-2 py-1 horizontal-scroll scrollbar-hide">
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
                  onClick={() => {
                    const newId = selectedCompanyId === c.id ? null : c.id;
                    setSelectedCompanyId(newId);
                    if (onCompanyClick && newId) {
                      onCompanyClick(c);
                    }
                  }}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateForCompany(c.id);
                    }}
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

      {/* View Selector */}
      <ViewSelector
        viewConfigs={viewConfigs}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* View Content */}
      <ViewContentRenderer
        activeView={activeView}
        tasks={filteredTasks}
        helpers={helpers}
        showCompanyInfo={true}
        onTaskClick={onTaskClick || (() => {})}
        onCompleteTask={onCompleteTask || ((e) => e.stopPropagation())}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createTaskModalOpen}
        onClose={handleCloseCreateModal}
        initialCompanyId={selectedCompanyForTask?.id || selectedCompanyId || undefined}
        onTaskCreated={() => {
          handleCloseCreateModal();
        }}
      />
    </div>
  );
}
