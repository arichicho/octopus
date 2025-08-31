'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Building2,
  CheckCircle,
  RotateCcw,
  Eye,
  CalendarDays,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskModal } from '@/components/modals/TaskModal';

interface TaskHistoryFilters {
  search: string;
  selectedCompanies: Set<string>;
  priority: string;
  sortBy: 'completedAt' | 'title' | 'priority' | 'company';
  sortOrder: 'asc' | 'desc';
}

export const TaskHistoryView: React.FC = () => {
  const { user } = useAuth();
  const { tasks, loading, loadTasks, updateTask } = useTaskStore();
  const { companies, fetchCompanies } = useCompanyEnhancedStore();
  const [filters, setFilters] = useState<TaskHistoryFilters>({
    search: '',
    selectedCompanies: new Set(),
    priority: '',
    sortBy: 'completedAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isUncompleteDialogOpen, setIsUncompleteDialogOpen] = useState(false);
  const [taskToUncomplete, setTaskToUncomplete] = useState<Task | null>(null);

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadTasks(user.uid);
      fetchCompanies(user.uid);
    }
  }, [user, loadTasks, fetchCompanies]);

  // Get completed tasks
  const completedTasks = tasks.filter(task => task.status === 'completed');

  // Filter tasks based on current filters
  const filteredTasks = completedTasks.filter(task => {
    const company = companies.find(c => c.id === task.companyId);
    
    // Search filter
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !task.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Company filter
    if (filters.selectedCompanies.size > 0 && !filters.selectedCompanies.has(task.companyId)) {
      return false;
    }

    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (filters.sortBy) {
      case 'completedAt':
        aValue = a.completedAt || new Date(0);
        bValue = b.completedAt || new Date(0);
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 3;
        break;
      case 'company':
        const companyA = companies.find(c => c.id === a.companyId);
        const companyB = companies.find(c => c.id === b.companyId);
        aValue = companyA?.name || '';
        bValue = companyB?.name || '';
        break;
      default:
        return 0;
    }

    if (filters.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Get priority color
  const getPriorityColor = (priority: TaskPriority) => {
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

  // Handle uncomplete task
  const handleUncompleteTask = async (task: Task) => {
    try {
      await updateTask(task.id!, {
        status: 'pending',
        completedAt: undefined,
        updatedAt: new Date(),
      });
      setIsUncompleteDialogOpen(false);
      setTaskToUncomplete(null);
    } catch (error) {
      console.error('Error uncompleting task:', error);
    }
  };

  // Format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'No completada';
    const dateObj = firestoreDateToDate(date);
    if (!dateObj) return 'Fecha inválida';
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Historial de Tareas Completadas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Revisa todas las tareas que has completado
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {completedTasks.length} tareas completadas
          </Badge>
          <Badge variant="outline">
            {filteredTasks.length} filtradas
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <CardTitle className="text-lg">Filtros</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar en títulos y descripciones..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Company Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Empresas</label>
                <div className="flex flex-wrap gap-2">
                  {companies.map(company => {
                    const isSelected = filters.selectedCompanies.has(company.id);
                    const companyTasks = completedTasks.filter(task => task.companyId === company.id);
                    return (
                      <div
                        key={company.id}
                        onClick={() => {
                          const newSelected = new Set(filters.selectedCompanies);
                          if (isSelected) {
                            newSelected.delete(company.id);
                          } else {
                            newSelected.add(company.id);
                          }
                          setFilters(prev => ({ ...prev, selectedCompanies: newSelected }));
                        }}
                        className={`
                          flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all
                          ${isSelected 
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: company.color }}
                        />
                        <span className="text-sm font-medium">{company.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {companyTasks.length}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Prioridad</label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las prioridades</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completedAt">Fecha de completado</SelectItem>
                    <SelectItem value="title">Título</SelectItem>
                    <SelectItem value="priority">Prioridad</SelectItem>
                    <SelectItem value="company">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-sm font-medium mb-2 block">Orden</label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value: 'asc' | 'desc') => setFilters(prev => ({ ...prev, sortOrder: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Más reciente primero</SelectItem>
                    <SelectItem value="asc">Más antigua primero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando historial...</p>
          </div>
        </div>
      ) : sortedTasks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay tareas completadas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {completedTasks.length === 0 
                ? 'Aún no has completado ninguna tarea'
                : 'No hay tareas que coincidan con los filtros aplicados'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map(task => {
            const company = companies.find(c => c.id === task.companyId);
            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {task.title}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        {/* Company */}
                        {company && (
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <Badge variant="outline" className="text-xs">
                              {company.name}
                            </Badge>
                          </div>
                        )}

                        {/* Priority */}
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'urgent' ? 'Urgente' :
                             task.priority === 'high' ? 'Alta' :
                             task.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>

                        {/* Completed Date */}
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Completada: {task.completedAt ? formatDate(task.completedAt instanceof Date ? task.completedAt : task.completedAt.toDate()) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {task.tags.map(tag => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            Vencía: {(() => {
                              const dueDate = firestoreDateToDate(task.dueDate);
                              return dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: es }) : 'Fecha inválida';
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task as any);
                          setIsTaskModalOpen(true);
                        }}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTaskToUncomplete(task as any);
                          setIsUncompleteDialogOpen(true);
                        }}
                        className="flex items-center space-x-1 text-orange-600 hover:text-orange-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Deshacer</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          company={companies.find(c => c.id === selectedTask.companyId)}
          task={selectedTask}
          mode="edit"
        />
      )}

      {/* Uncomplete Confirmation Dialog */}
      <Dialog open={isUncompleteDialogOpen} onOpenChange={setIsUncompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deshacer tarea completada</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres marcar esta tarea como no completada? 
              Esto la moverá de vuelta al estado "Pendiente".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUncompleteDialogOpen(false);
                setTaskToUncomplete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => taskToUncomplete && handleUncompleteTask(taskToUncomplete)}
            >
              Deshacer Completado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
