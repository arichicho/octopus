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

interface GeneralOverviewViewProps {
  companies: CompanyEnhanced[];
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCompleteTask?: (e: React.MouseEvent, task: Task) => void;
  onCompanyClick?: (company: CompanyEnhanced) => void;
}

export function GeneralOverviewView({
  companies,
  tasks,
  onTaskClick,
  onCompleteTask,
  onCompanyClick
}: GeneralOverviewViewProps) {
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [selectedCompanyForTask, setSelectedCompanyForTask] = useState<CompanyEnhanced | null>(null);

  // Filter only active tasks
  const activeTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');

  // Debug logs
  console.log('🔍 GeneralOverviewView Debug:', {
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

      {/* Table View - Companies as Columns, Tasks as Rows */}
      {companies.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No hay empresas disponibles</h3>
            <p className="text-sm">No se encontraron empresas para mostrar en la vista general.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tarea
                </th>
                {companies.map((company) => (
                  <th key={company.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform" 
                        style={{ backgroundColor: company.color || '#3b82f6' }}
                        onClick={() => onCompanyClick?.(company)}
                        title={`Ver ${company.name}`}
                      />
                      <span 
                        className="truncate max-w-[100px] cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => onCompanyClick?.(company)}
                        title={`Ver ${company.name}`}
                      >
                        {company.name}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleCreateTask(company)}
                        className="h-6 w-6 p-0 ml-1"
                        title={`Crear tarea para ${company.name}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {activeTasks.map((task) => {
                const dueDate = firestoreDateToDate(task.dueDate);
                const isOverdue = dueDate && dueDate < new Date();
                
                return (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => onTaskClick?.(task)}
                              title="Ver detalles de la tarea">
                          {task.title}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {/* Priority */}
                        {task.priority && (
                          <Badge className={`text-xs px-1.5 py-0.5 ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'urgent' ? 'Urgente' : 
                             task.priority === 'high' ? 'Alta' : 
                             task.priority === 'medium' ? 'Media' : 'Baja'}
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
                      </div>
                    </td>
                    {companies.map((company) => (
                      <td key={company.id} className="px-4 py-3 text-center">
                        {task.companyId === company.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                              {task.status === 'completed' ? 'Completada' :
                               task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                            </span>
                            {task.status !== 'completed' && onCompleteTask && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCompleteTask(e, task);
                                }}
                                className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                title="Marcar como completada"
                              >
                                <CheckCircle className="h-4 w-4 text-gray-400 hover:text-green-600" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            </table>
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
