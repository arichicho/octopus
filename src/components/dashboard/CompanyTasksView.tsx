'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, Calendar, Plus, ArrowLeft, Building2 } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { TaskModal } from '@/components/modals/TaskModal';

export function CompanyTasksView() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  const { companies, fetchCompanies } = useCompanyEnhancedStore();
  const { tasks, loadTasks, updateTask } = useTaskStore();

  const company = companies.find(c => c.id === companyId);
  const companyTasks = tasks.filter(task => task.companyId === companyId);
  const pendingTasks = companyTasks.filter(task => task.status !== 'completed');

  useEffect(() => {
    fetchCompanies();
    loadTasks();
  }, [fetchCompanies, loadTasks]);

  // Handle hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('company=')) {
        const id = hash.split('=')[1];
        setCompanyId(id);
      } else {
        setCompanyId(null);
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
    window.location.hash = '';
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
            Volver al Tablero
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
            Volver al Tablero
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
              <span>Volver al Tablero</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg" 
                style={{ backgroundColor: company.color }}
              >
                {company.logoUrl ? (
                  <img 
                    src={company.logoUrl} 
                    alt={`Logo de ${company.name}`}
                    className="w-10 h-10 object-cover rounded-full"
                  />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pendingTasks.map((task) => {
              const dueDate = firestoreDateToDate(task.dueDate);
              
              return (
                <Card 
                  key={task.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                    isOverdue(dueDate) 
                      ? 'border-red-200 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleOpenEditModal(task as any)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {getStatusIcon(task.status)}
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                            {task.title}
                          </h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                          onClick={(e) => handleCompleteTask(e, task as any)}
                          title="Marcar como completada"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </Badge>
                        {task.tags && task.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      {dueDate && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span className={isOverdue(dueDate) ? 'text-red-600 font-medium' : ''}>
                            {isOverdue(dueDate) ? 'Vencida: ' : 'Vence: '}
                            {formatDate(dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
