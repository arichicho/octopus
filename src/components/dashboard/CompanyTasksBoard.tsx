'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Building2,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  GripVertical,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  Building,
  Factory,
  Briefcase,
  Store,
  Home,
  Warehouse,
  Landmark,
  School,
  Hospital,
  Plane,
  Ship,
  Truck,
  Rocket,
  Globe,
  Zap,
  Coffee,
  ShoppingBag,
  Heart,
  Cpu
} from 'lucide-react';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { Task } from '@/lib/firebase/firestore';
import { TaskStatus } from '@/types/task';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { TaskModal } from '@/components/modals/TaskModal';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { CompanyIcon } from '@/components/companies/CompanyIcon';

import { Timestamp } from 'firebase/firestore';

interface CompanyTasksBoardProps {
  className?: string;
}

// Sortable company card component
interface SortableCompanyCardProps {
  company: CompanyEnhanced;
  tasks: Task[];
  isCollapsed: boolean;
  onToggleCollapse: (companyId: string) => void;
  onOpenCreateModal: (company: CompanyEnhanced) => void;
  onOpenEditModal: (task: Task, company: CompanyEnhanced) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
  onOpenCompanyTasksModal: (company: CompanyEnhanced) => void;
  getStatusIcon: (status: TaskStatus) => React.ReactElement;
  getStatusColor: (status: TaskStatus) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
  getCompanyStats: (companyId: string) => any;
  getCompanyIcon: (company: CompanyEnhanced) => React.ReactElement;
  taskSortOrder: Record<string, 'priority' | 'dueDate' | 'createdAt' | 'manual'>;
  setTaskSortOrder: React.Dispatch<React.SetStateAction<Record<string, 'priority' | 'dueDate' | 'createdAt' | 'manual'>>>;
}

const SortableCompanyCard = ({
  company,
  tasks,
  isCollapsed,
  onToggleCollapse,
  onOpenCreateModal,
  onOpenEditModal,
  onCompleteTask,
  onOpenCompanyTasksModal,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue,
  getCompanyStats,
  getCompanyIcon,
  taskSortOrder,
  setTaskSortOrder,
}: SortableCompanyCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stats = getCompanyStats(company.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-80 lg:w-96'
      }`}
      {...attributes}
    >
      <Card className={`h-full border-l-4 transition-all duration-200 hover:shadow-lg ${
        isCollapsed ? 'bg-gray-50 dark:bg-gray-800' : ''
      } ${isDragging ? 'shadow-2xl ring-2 ring-blue-500' : ''}`} 
      style={{ borderLeftColor: company.color }}>
        <CardHeader className={`pb-3 ${isCollapsed ? 'p-3' : ''}`}>
          <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col space-y-2' : ''}`}>
            <div className={`flex items-center space-x-3 ${isCollapsed ? 'flex-col space-y-2' : ''}`}>
              {/* Drag handle */}
              <div 
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                title="Arrastrar para reordenar"
              >
                <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-active:text-blue-500 transition-colors" />
              </div>
              <CompanyIcon
                logoUrl={company.logoUrl}
                defaultIcon={company.defaultIcon}
                name={company.name}
                size={isCollapsed ? 'sm' : 'sm'}
                color={company.color}
                className="flex-shrink-0"
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <CardTitle 
                    className="text-lg truncate cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => onOpenCompanyTasksModal(company)}
                    title="Ver todas las tareas pendientes"
                  >
                    {company.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {stats.completedThisWeek} completadas esta semana
                  </CardDescription>
                </div>
              )}
            </div>
            <div className={`flex items-center space-x-2 ${isCollapsed ? 'flex-col space-y-1' : ''}`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleCollapse(company.id)}
                className={`${isCollapsed ? 'h-8 w-8' : 'h-6 w-6'} p-0 hover:bg-gray-100 dark:hover:bg-gray-700`}
                aria-label={isCollapsed ? "Expandir empresa" : "Contraer empresa"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
              {!isCollapsed && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Más opciones"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {!isCollapsed && (
            <>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stats.total} tareas
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  aria-label="Agregar Pendiente"
                  onClick={() => onOpenCreateModal(company)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Filtros de ordenamiento */}
              <div className="flex items-center space-x-1 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs ${taskSortOrder[company.id] === 'priority' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setTaskSortOrder(prev => ({ ...prev, [company.id]: 'priority' }))}
                  title="Ordenar por prioridad"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Prioridad
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs ${taskSortOrder[company.id] === 'dueDate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setTaskSortOrder(prev => ({ ...prev, [company.id]: 'dueDate' }))}
                  title="Ordenar por fecha de vencimiento"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Fecha
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs ${taskSortOrder[company.id] === 'createdAt' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setTaskSortOrder(prev => ({ ...prev, [company.id]: 'createdAt' }))}
                  title="Ordenar por fecha de creación"
                >
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  Creada
                </Button>
              </div>
              <Progress 
                value={stats.progress} 
                className="mt-2" 
                style={{ 
                  '--progress-color': company.color 
                } as React.CSSProperties}
              />
            </>
          )}
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              {(() => {
                const sortOrder = taskSortOrder[company.id] || 'priority';
                let sortedTasks = tasks.filter(task => task.status !== 'completed');
                
                // Aplicar ordenamiento según el filtro seleccionado
                sortedTasks = sortedTasks.sort((a: Task, b: Task) => {
                  switch (sortOrder) {
                    case 'priority':
                      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
                      const aPriority = priorityOrder[a.priority] || 3;
                      const bPriority = priorityOrder[b.priority] || 3;
                      
                      if (aPriority !== bPriority) {
                        return aPriority - bPriority;
                      }
                      
                      const aDate = firestoreDateToDate(a.dueDate) || new Date(0);
                      const bDate = firestoreDateToDate(b.dueDate) || new Date(0);
                      return aDate.getTime() - bDate.getTime();
                      
                    case 'dueDate':
                      const aDueDate = firestoreDateToDate(a.dueDate) || new Date(0);
                      const bDueDate = firestoreDateToDate(b.dueDate) || new Date(0);
                      return aDueDate.getTime() - bDueDate.getTime();
                      
                    case 'createdAt':
                      const aCreated = firestoreDateToDate(a.createdAt) || new Date(0);
                      const bCreated = firestoreDateToDate(b.createdAt) || new Date(0);
                      return bCreated.getTime() - aCreated.getTime(); // Más recientes primero
                      
                    default:
                      return 0;
                  }
                });
                
                return sortedTasks;
              })()
                .map((task: Task) => {
                  const dueDate = firestoreDateToDate(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onOpenEditModal(task, company)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                        isOverdue(dueDate) 
                          ? 'border-red-200 bg-red-50 dark:bg-red-900/20 hover:border-red-300' 
                          : 'border-gray-200 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {getStatusIcon(task.status)}
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                              {task.title}
                            </h4>
                          </div>
                          {task.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => onCompleteTask(e, task)}
                              className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700 text-green-600"
                              aria-label="Marcar como completada"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
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
                        </div>
                        
                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.map((tag: string) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              
              {tasks.filter(task => task.status !== 'completed').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm">No hay tareas pendientes</p>
                  <p className="text-xs text-gray-400 mt-1">¡Excelente trabajo!</p>
                </div>
              )}
            </div>
          </CardContent>
        )}

        {/* Estado contraído - mostrar solo el icono y contador */}
        {isCollapsed && (
          <CardContent className="pt-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {tasks.filter(task => task.status !== 'completed').length}
              </div>
              <div className="text-xs text-gray-500">pendientes</div>
              {stats.overdue > 0 && (
                <div className="mt-2">
                  <div className="text-lg font-bold text-red-600">
                    {stats.overdue}
                  </div>
                  <div className="text-xs text-red-500">vencidas</div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export const CompanyTasksBoard = ({ className }: CompanyTasksBoardProps) => {
  const { companies, reorderCompanies } = useCompanyEnhancedStore();
  const { tasks, loading, updateTask } = useTaskStore();
  const [collapsedCompanies, setCollapsedCompanies] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyEnhanced | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const router = useRouter();
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [taskSortOrder, setTaskSortOrder] = useState<Record<string, 'priority' | 'dueDate' | 'createdAt' | 'manual'>>(() => {
    // Inicializar con 'priority' para todas las empresas
    const initialOrder: Record<string, 'priority' | 'dueDate' | 'createdAt' | 'manual'> = {};
    companies.forEach(company => {
      if (company.id) {
        initialOrder[company.id] = 'priority';
      }
    });
    return initialOrder;
  });

  // Actualizar taskSortOrder cuando cambien las empresas
  useEffect(() => {
    const newOrder: Record<string, 'priority' | 'dueDate' | 'createdAt' | 'manual'> = {};
    companies.forEach(company => {
      if (company.id) {
        newOrder[company.id] = taskSortOrder[company.id] || 'priority';
      }
    });
    setTaskSortOrder(newOrder);
  }, [companies]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = companies.findIndex((company) => company.id === active.id);
      const newIndex = companies.findIndex((company) => company.id === over?.id);

      const reorderedCompanies = arrayMove(companies, oldIndex, newIndex);
      reorderCompanies(reorderedCompanies);
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
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

  const getTasksByCompany = () => {
    const tasksByCompany: Record<string, Task[]> = {};
    
    companies.forEach(company => {
      if (company.id) {
        let companyTasks = tasks.filter(task => task.companyId === company.id);
        const sortOrder = taskSortOrder[company.id] || 'priority';
        
        // Ordenar tareas según el criterio seleccionado
        companyTasks = companyTasks.sort((a, b) => {
          switch (sortOrder) {
            case 'priority':
              const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
              const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
              const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 3;
              if (aPriority !== bPriority) return aPriority - bPriority;
              // Si tienen la misma prioridad, ordenar por fecha de vencimiento
              const aDate = firestoreDateToDate(a.dueDate) || new Date(0);
              const bDate = firestoreDateToDate(b.dueDate) || new Date(0);
              return aDate.getTime() - bDate.getTime();
              
            case 'dueDate':
              const aDueDate = firestoreDateToDate(a.dueDate) || new Date(0);
              const bDueDate = firestoreDateToDate(b.dueDate) || new Date(0);
              return aDueDate.getTime() - bDueDate.getTime();
              
            case 'createdAt':
              const aCreated = firestoreDateToDate(a.createdAt) || new Date(0);
              const bCreated = firestoreDateToDate(b.createdAt) || new Date(0);
              return bCreated.getTime() - aCreated.getTime(); // Más recientes primero
              
            case 'manual':
            default:
              return 0; // Mantener orden manual
          }
        });
        
        tasksByCompany[company.id] = companyTasks;
      }
    });
    
    return tasksByCompany;
  };

  const getCompanyIcon = (company: CompanyEnhanced) => {
    const iconMap: Record<string, React.ReactElement> = {
      Building: <Building className="h-5 w-5" />,
      Building2: <Building2 className="h-5 w-5" />,
      Factory: <Factory className="h-5 w-5" />,
      Briefcase: <Briefcase className="h-5 w-5" />,
      Store: <Store className="h-5 w-5" />,
      Home: <Home className="h-5 w-5" />,
      Warehouse: <Warehouse className="h-5 w-5" />,
      Landmark: <Landmark className="h-5 w-5" />,
      School: <School className="h-5 w-5" />,
      Hospital: <Hospital className="h-5 w-5" />,
      Plane: <Plane className="h-5 w-5" />,
      Ship: <Ship className="h-5 w-5" />,
      Truck: <Truck className="h-5 w-5" />,
      Rocket: <Rocket className="h-5 w-5" />,
      Globe: <Globe className="h-5 w-5" />,
      Zap: <Zap className="h-5 w-5" />,
      Coffee: <Coffee className="h-5 w-5" />,
      ShoppingBag: <ShoppingBag className="h-5 w-5" />,
      Heart: <Heart className="h-5 w-5" />,
      Cpu: <Cpu className="h-5 w-5" />,
    };
    
    return iconMap[company.defaultIcon] || <Building2 className="h-5 w-5" />;
  };

  const getCompanyStats = (companyId: string) => {
    const companyTasks = tasks.filter(task => task.companyId === companyId);
    const total = companyTasks.length;
    
    // Calcular el inicio de la semana actual (lunes)
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = domingo, 1 = lunes, etc.
    startOfWeek.setDate(now.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calcular el fin de la semana actual (domingo)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Tareas completadas esta semana
    const completedThisWeek = companyTasks.filter(task => {
      if (task.status !== 'completed' || !task.completedAt) return false;
      const completedDate = firestoreDateToDate(task.completedAt);
      return completedDate >= startOfWeek && completedDate <= endOfWeek;
    }).length;
    
    // Tareas pendientes
    const pending = companyTasks.filter(task => task.status === 'pending').length;
    const inProgress = companyTasks.filter(task => task.status === 'in_progress').length;
    
    // Tareas vencidas
    const overdue = companyTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = firestoreDateToDate(task.dueDate);
      return task.status !== 'completed' && dueDate < new Date();
    }).length;
    
    return {
      total,
      completedThisWeek,
      pending,
      inProgress,
      overdue,
      progress: total > 0 ? Math.round((completedThisWeek / total) * 100) : 0
    };
  };

  const formatDate = (date: Date | any) => {
    try {
      // Si no hay fecha o es null/undefined, retornar vacío
      if (!date || date === null || date === undefined) {
        return '';
      }
      
      const dateObj = firestoreDateToDate(date);
      
      // Verificar si la fecha es válida y no es la fecha por defecto (31/12/1969)
      if (isNaN(dateObj.getTime()) || dateObj.getFullYear() === 1969) {
        return '';
      }
      
      return dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const isOverdue = (dueDate: Date | null | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const toggleCompanyCollapse = (companyId: string) => {
    const newCollapsed = new Set(collapsedCompanies);
    if (newCollapsed.has(companyId)) {
      newCollapsed.delete(companyId);
    } else {
      newCollapsed.add(companyId);
    }
    setCollapsedCompanies(newCollapsed);
  };

  const handleOpenCreateModal = (company: CompanyEnhanced) => {
    setSelectedCompany(company);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (task: Task, company: CompanyEnhanced) => {
    setSelectedTask(task);
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedCompany(undefined);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTask(undefined);
    setSelectedCompany(undefined);
  };

  const handleOpenCompanyTasksPage = (company: CompanyEnhanced) => {
    console.log('🔗 CompanyTasksBoard - Opening company tasks page for:', company.name, company.id);
    // Usar router.push para mejor compatibilidad móvil
    router.push(`/dashboard#company=${company.id}`);
  };

  const handleCompleteTask = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation(); // Prevent opening edit modal
    try {
      await updateTask(task.id!, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const tasksByCompany = getTasksByCompany();

  // Inicializar empresas seleccionadas si está vacío
  React.useEffect(() => {
    if (selectedCompanies.size === 0 && companies.length > 0) {
      const allCompanyIds = new Set(companies.map(company => company.id));
      setSelectedCompanies(allCompanyIds);
    }
  }, [companies, selectedCompanies.size]);

  // Filtrar empresas basado en las empresas seleccionadas
  const filteredCompanies = companies.filter(company => 
    selectedCompanies.has(company.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Tablero de Pendientes por Empresa
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Gestiona tus tareas organizadas por empresa
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden lg:block">
              💡 Arrastra las empresas por el ícono <GripVertical className="inline h-3 w-3" /> para reordenar
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar:</span>
              <div className="flex items-center space-x-2">
                {companies.map(company => {
                  const isSelected = selectedCompanies.has(company.id);
                  return (
                    <button
                      key={company.id}
                      onClick={() => {
                        const newSelected = new Set(selectedCompanies);
                        if (isSelected) {
                          newSelected.delete(company.id);
                        } else {
                          newSelected.add(company.id);
                        }
                        setSelectedCompanies(newSelected);
                      }}
                      className="relative group transition-all duration-200 transform hover:scale-110"
                      title={`${isSelected ? 'Ocultar' : 'Mostrar'} ${company.name}`}
                    >
                                          <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
                        ${isSelected 
                          ? 'shadow-lg' 
                          : 'shadow-md hover:shadow-lg opacity-40 grayscale'
                        }
                      `}
                      style={{ backgroundColor: isSelected ? company.color : '#9CA3AF' }}
                    >
                      <CompanyIcon
                        logoUrl={company.logoUrl}
                        defaultIcon={company.defaultIcon}
                        name={company.name}
                        size="sm"
                        color={isSelected ? company.color : '#FFFFFF'}
                        className="w-6 h-6"
                      />
                    </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {company.name}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                      

                    </button>
                  );
                })}
              </div>
            </div>
            
            <Badge variant="outline" className="text-xs">
              {filteredCompanies.length} de {companies.length} empresas
            </Badge>
            
            {selectedCompanies.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCompanies(new Set())}
                className="h-8 px-3 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View - Stacked Cards */}
      <div className="block lg:hidden space-y-4">
        {filteredCompanies.map(company => {
          const companyTasks = tasksByCompany[company.id] || [];
          const stats = getCompanyStats(company.id);
          const isCollapsed = collapsedCompanies.has(company.id);
          
          return (
            <Card 
              key={company.id} 
              className="border-l-4 transition-all duration-200 hover:shadow-lg"
              style={{ borderLeftColor: company.color }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CompanyIcon
                      logoUrl={company.logoUrl}
                      defaultIcon={company.defaultIcon}
                      name={company.name}
                      size="sm"
                      color={company.color}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle 
                        className="text-lg truncate cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handleOpenCompanyTasksPage(company)}
                        title="Ver todas las tareas pendientes"
                      >
                        {company.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {stats.completedThisWeek} completadas esta semana
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCompanyCollapse(company.id)}
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label={isCollapsed ? "Expandir empresa" : "Contraer empresa"}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Más opciones"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {stats.total} tareas
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    aria-label="Agregar Pendiente"
                    onClick={() => handleOpenCreateModal(company)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Progress 
                  value={stats.progress} 
                  className="mt-2" 
                  style={{ 
                    '--progress-color': company.color 
                  } as React.CSSProperties}
                />
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="pt-0">
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                    {companyTasks
                      .filter(task => task.status !== 'completed')
                      .sort((a: Task, b: Task) => {
                        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
                        const aPriority = priorityOrder[a.priority] || 3;
                        const bPriority = priorityOrder[b.priority] || 3;
                        
                        if (aPriority !== bPriority) {
                          return aPriority - bPriority;
                        }
                        
                        const aDate = firestoreDateToDate(a.dueDate) || new Date(0);
                        const bDate = firestoreDateToDate(b.dueDate) || new Date(0);
                        return aDate.getTime() - bDate.getTime();
                      })
                      .map((task: Task) => {
                        const dueDate = firestoreDateToDate(task.dueDate);
                        return (
                          <div
                            key={task.id}
                            onClick={() => handleOpenEditModal(task, company)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                              isOverdue(dueDate) 
                                ? 'border-red-200 bg-red-50 dark:bg-red-900/20 hover:border-red-300' 
                                : 'border-gray-200 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  {getStatusIcon(task.status)}
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                    {task.title}
                                  </h4>
                                </div>
                                {task.status !== 'completed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleCompleteTask(e, task)}
                                    className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700 text-green-600"
                                    aria-label="Marcar como completada"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {task.description}
                              </p>
                              
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center space-x-1 flex-wrap">
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
                              </div>
                              
                              {/* Tags */}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {task.tags.map((tag: string) => (
                                    <Badge 
                                      key={tag} 
                                      variant="outline" 
                                      className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    
                    {companyTasks.filter(task => task.status !== 'completed').length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm">No hay tareas pendientes</p>
                        <p className="text-xs text-gray-400 mt-1">¡Excelente trabajo!</p>
                      </div>
                    )}
                    

                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Desktop View - Kanban Board with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredCompanies.map(company => company.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="hidden lg:flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            {filteredCompanies.map(company => {
              const companyTasks = tasksByCompany[company.id] || [];
              const isCollapsed = collapsedCompanies.has(company.id);
              
              return (
                <SortableCompanyCard
                  key={company.id}
                  company={company}
                  tasks={companyTasks}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={toggleCompanyCollapse}
                  onOpenCreateModal={handleOpenCreateModal}
                  onOpenEditModal={handleOpenEditModal}
                  onCompleteTask={handleCompleteTask}
                  onOpenCompanyTasksModal={handleOpenCompanyTasksPage}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  formatDate={formatDate}
                  isOverdue={isOverdue}
                  getCompanyStats={getCompanyStats}
                  getCompanyIcon={getCompanyIcon}
                  taskSortOrder={taskSortOrder}
                  setTaskSortOrder={setTaskSortOrder}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {companies.length === 0 ? 'No hay empresas configuradas' : 'No hay empresas seleccionadas'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {companies.length === 0 
              ? 'Crea tu primera empresa para comenzar a gestionar tareas'
              : 'Selecciona empresas en el filtro para ver sus tareas'
            }
          </p>
          <Button className="hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 mr-2" />
            Crear Empresa
          </Button>
        </div>
      )}
      
      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        initialCompanyId={selectedCompany?.id}
        onTaskCreated={(result) => {
          // Handle successful task creation
          console.log('Task created:', result);
        }}
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        company={selectedCompany}
        task={selectedTask as any}
        mode="edit"
      />


    </div>
  );
};
