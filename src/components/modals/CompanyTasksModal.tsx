'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertTriangle, Calendar, Plus } from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompanyTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyEnhanced | null;
  tasks: Task[];
  onOpenCreateModal: (company: CompanyEnhanced) => void;
  onOpenEditModal: (task: Task, company: CompanyEnhanced) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
}

const CompanyTasksModal: React.FC<CompanyTasksModalProps> = ({
  isOpen,
  onClose,
  company,
  tasks,
  onOpenCreateModal,
  onOpenEditModal,
  onCompleteTask,
}) => {
  if (!company) return null;

  const companyTasks = tasks.filter(task => task.companyId === company.id);
  const pendingTasks = companyTasks.filter(task => task.status !== 'completed');

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
      const dateObj = date instanceof Date ? date : (typeof date.toDate === 'function' ? date.toDate() : new Date(date));
      return format(dateObj, 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const isOverdue = (dueDate: Date | null | undefined) => {
    if (!dueDate) return false;
    try {
      const dateObj = dueDate instanceof Date ? dueDate : new Date(dueDate as any);
      return dateObj < new Date();
    } catch {
      return false;
    }
  };

  const handleCreateTask = () => {
    onOpenCreateModal(company);
    onClose();
  };

  const handleEditTask = (task: Task) => {
    onOpenEditModal(task, company);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] overflow-hidden">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                style={{ backgroundColor: company.color }}
              >
                {company.logoUrl ? (
                  <img 
                    src={company.logoUrl} 
                    alt={`Logo de ${company.name}`}
                    className="w-12 h-12 object-cover rounded-full"
                  />
                ) : (
                  company.name.charAt(0).toUpperCase()
                )}
              </div>
              <DialogTitle className="text-3xl font-bold">
                {company.name} - Tareas Pendientes
              </DialogTitle>
            </div>
            <Button
              onClick={handleCreateTask}
              size="lg"
              className="flex items-center space-x-2 px-6 py-3"
            >
              <Plus className="h-5 w-5" />
              <span>Nueva Tarea</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {pendingTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
                No hay tareas pendientes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                ¡Excelente trabajo! Todas las tareas están completadas.
              </p>
              <Button onClick={handleCreateTask} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Crear Primera Tarea
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {pendingTasks.map((task) => {
                const dueDate = task.dueDate ? (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate as any)) : null;
                
                return (
                  <Card
                    key={task.id}
                    className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 h-48 ${
                      isOverdue(dueDate) 
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleEditTask(task)}
                  >
                    <CardContent className="p-4 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {getStatusIcon(task.status)}
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                            {task.title}
                          </h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteTask(e, task);
                          }}
                          className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700 text-green-600"
                          aria-label="Marcar como completada"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-1">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 mt-auto">
                        <div className="flex items-center space-x-1">
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status === 'pending' ? 'Pendiente' :
                             task.status === 'in_progress' ? 'En Progreso' :
                             task.status === 'completed' ? 'Completada' : 'Cancelada'}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'urgent' ? 'Urgente' :
                             task.priority === 'high' ? 'Alta' :
                             task.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span className={isOverdue(dueDate) ? 'text-red-600 font-medium' : ''}>
                            {formatDate(dueDate)}
                          </span>
                        </div>
                        
                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 2).map((tag: string) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs px-1 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {task.tags.length > 2 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs px-1 py-0.5 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                              >
                                +{task.tags.length - 2}
                              </Badge>
                            )}
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
      </DialogContent>
    </Dialog>
  );
};

export default CompanyTasksModal;
