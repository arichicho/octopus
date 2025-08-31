'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Clock, AlertTriangle, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TaskStatus } from '@/types/task';
import { Task } from '@/lib/firebase/firestore';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
  getStatusIcon: (status: TaskStatus) => React.ReactElement;
  getStatusColor: (status: TaskStatus) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
}

type SortField = 'title' | 'priority' | 'status' | 'dueDate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function TaskListView({
  tasks,
  onTaskClick,
  onCompleteTask,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue
}: TaskListViewProps) {
  const [sortField, setSortField] = React.useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedTasks = () => {
    return [...tasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 3;
          break;
        case 'status':
          const statusOrder = { pending: 0, in_progress: 1, review: 2, completed: 3 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        case 'dueDate':
          aValue = firestoreDateToDate(a.dueDate) || new Date(0);
          bValue = firestoreDateToDate(b.dueDate) || new Date(0);
          break;
        case 'createdAt':
          aValue = firestoreDateToDate(a.createdAt) || new Date(0);
          bValue = firestoreDateToDate(b.createdAt) || new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const sortedTasks = getSortedTasks();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lista de Tareas ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('title')}
                  >
                    Tarea
                    {getSortIcon('title')}
                  </Button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('priority')}
                  >
                    Prioridad
                    {getSortIcon('priority')}
                  </Button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('status')}
                  >
                    Estado
                    {getSortIcon('status')}
                  </Button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('dueDate')}
                  >
                    Vence
                    {getSortIcon('dueDate')}
                  </Button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    onClick={() => handleSort('createdAt')}
                  >
                    Creada
                    {getSortIcon('createdAt')}
                  </Button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                  Tags
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium">No hay tareas</p>
                    <p className="text-sm">¡Excelente trabajo!</p>
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const dueDate = firestoreDateToDate(task.dueDate);
                  const createdDate = firestoreDateToDate(task.createdAt);
                  
                  return (
                    <tr
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(task.status)}
                          <div className="min-w-0 flex-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate cursor-pointer">
                                    {task.title}
                                  </h4>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-sm">{task.title}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority === 'urgent' ? 'Urgente' :
                           task.priority === 'high' ? 'Alta' :
                           task.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                          {task.status === 'pending' ? 'Pendiente' :
                           task.status === 'in_progress' ? 'En Progreso' :
                           task.status === 'completed' ? 'Completada' :
                           task.status === 'cancelled' ? 'Cancelada' : 'Desconocido'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {dueDate ? (
                          <div className="flex items-center space-x-1 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className={isOverdue(dueDate) ? 'text-red-600 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                              {formatDate(dueDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin fecha</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {createdDate ? (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(createdDate)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {task.tags && task.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 2).map((tag: string) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {task.tags.length > 2 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                              >
                                +{task.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {task.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                            onClick={(e) => onCompleteTask(e, task)}
                            title="Marcar como completada"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
