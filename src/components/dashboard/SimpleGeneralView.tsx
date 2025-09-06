"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, Plus, Building2 } from 'lucide-react';
import { Task } from '@/lib/firebase/firestore';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';

interface SimpleGeneralViewProps {
  companies: CompanyEnhanced[];
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCompleteTask?: (e: React.MouseEvent, task: Task) => void;
  onCompanyClick?: (company: CompanyEnhanced) => void;
}

export function SimpleGeneralView({
  companies,
  tasks,
  onTaskClick,
  onCompleteTask,
  onCompanyClick
}: SimpleGeneralViewProps) {
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [selectedCompanyForTask, setSelectedCompanyForTask] = useState<CompanyEnhanced | null>(null);

  // Filter only active tasks
  const activeTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');

  // Debug logs
  console.log('🔍 SimpleGeneralView Debug:', {
    companiesCount: companies.length,
    tasksCount: tasks.length,
    activeTasksCount: activeTasks.length,
    companies: companies.map(c => ({ id: c.id, name: c.name })),
    activeTasks: activeTasks.map(t => ({ id: t.id, title: t.title, companyId: t.companyId, status: t.status }))
  });

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
      return format(dateObj, 'dd/MM', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const handleCreateTask = (company: CompanyEnhanced) => {
    setSelectedCompanyForTask(company);
    setCreateTaskModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateTaskModalOpen(false);
    setSelectedCompanyForTask(null);
  };

  // Group tasks by company
  const tasksByCompany = companies.reduce((acc, company) => {
    acc[company.id] = activeTasks.filter(task => task.companyId === company.id);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Vista General
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tabla con empresas en columnas y tareas en filas
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {activeTasks.length} tareas activas en {companies.length} empresas
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Debug Info:</h3>
        <p className="text-sm text-yellow-700">
          Empresas: {companies.length} | Tareas activas: {activeTasks.length}
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          Empresas: {companies.map(c => c.name).join(', ')}
        </p>
      </div>

      {/* Companies as Cards (Fallback if no companies) */}
      {companies.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No hay empresas disponibles</h3>
            <p className="text-sm">No se encontraron empresas para mostrar en la vista general.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Companies Header */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {companies.map((company) => (
              <div key={company.id} className="flex-shrink-0">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 min-w-[200px]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: company.color || '#3b82f6' }}
                      />
                      <h3 
                        className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600"
                        onClick={() => onCompanyClick?.(company)}
                      >
                        {company.name}
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCreateTask(company)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-2">
                    {tasksByCompany[company.id]?.length || 0} tareas
                  </div>
                  
                  {/* Tasks for this company */}
                  <div className="space-y-2">
                    {(tasksByCompany[company.id] || []).slice(0, 3).map((task) => {
                      const dueDate = firestoreDateToDate(task.dueDate);
                      const isOverdue = dueDate && dueDate < new Date();
                      
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => onTaskClick?.(task)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getStatusIcon(task.status)}
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {task.title}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {/* Priority */}
                            {task.priority && (
                              <Badge className={`text-xs px-1.5 py-0.5 ${getPriorityColor(task.priority)}`}>
                                {task.priority === 'urgent' ? 'U' : task.priority === 'high' ? 'A' : task.priority === 'medium' ? 'M' : 'B'}
                              </Badge>
                            )}
                            
                            {/* Due date */}
                            {dueDate && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                isOverdue 
                                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' 
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {formatDate(dueDate)}
                              </span>
                            )}
                            
                            {/* Complete button */}
                            {task.status !== 'completed' && onCompleteTask && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCompleteTask(e, task);
                                }}
                                className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                title="Marcar como completada"
                              >
                                <CheckCircle className="h-3 w-3 text-gray-400 hover:text-green-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {(tasksByCompany[company.id] || []).length > 3 && (
                      <div className="text-center py-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{(tasksByCompany[company.id] || []).length - 3} más tareas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createTaskModalOpen}
        onClose={handleCloseCreateModal}
        initialCompanyId={selectedCompanyForTask?.id}
        onTaskCreated={() => {
          handleCloseCreateModal();
          // The parent component should reload tasks
        }}
      />
    </div>
  );
}
