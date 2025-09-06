"use client";

import { Task } from "@/lib/firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { firestoreDateToDate } from "@/lib/utils/dateUtils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TaskListCardProps {
  title: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCompleteTask?: (e: React.MouseEvent, task: Task) => void;
}

export default function TaskListCard({ title, tasks, onTaskClick, onCompleteTask }: TaskListCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 text-blue-600" />;
      case 'pending':
        return <AlertTriangle className="h-3 w-3 text-orange-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
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

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-200/70 dark:border-gray-800/70 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{tasks.length}</div>
      </div>
      <div className="p-2">
        {tasks.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Sin tareas
          </div>
        ) : (
          <ul className="space-y-1">
            {tasks.slice(0, 8).map((t) => {
              const dueDate = firestoreDateToDate(t.dueDate);
              const isOverdue = dueDate && dueDate < new Date();
              
              return (
                <li 
                  key={t.id} 
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => onTaskClick?.(t)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(t.status)}
                    <span className="truncate text-sm text-gray-900 dark:text-gray-100">{t.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-auto">
                    {/* Tags */}
                    {t.tags && t.tags.length > 0 && (
                      <div className="flex gap-1">
                        {t.tags.slice(0, 1).map((tag: string) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="text-[10px] px-1 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {t.tags.length > 1 && (
                          <span className="text-[10px] text-gray-500">+{t.tags.length - 1}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Priority */}
                    {t.priority && (
                      <Badge className={`text-[10px] px-1.5 py-0.5 ${getPriorityColor(t.priority)}`}>
                        {t.priority === 'urgent' ? 'U' : t.priority === 'high' ? 'A' : t.priority === 'medium' ? 'M' : 'B'}
                      </Badge>
                    )}
                    
                    {/* Due date */}
                    {dueDate && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isOverdue 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {formatDate(dueDate)}
                      </span>
                    )}
                    
                    {/* Complete button */}
                    {t.status !== 'completed' && onCompleteTask && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteTask(e, t);
                        }}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Marcar como completada"
                      >
                        <CheckCircle className="h-3 w-3 text-gray-400 hover:text-green-600" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
            {tasks.length > 8 && (
              <li className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                +{tasks.length - 8} más...
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

