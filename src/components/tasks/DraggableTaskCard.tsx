'use client';

import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '@/lib/firebase/firestore';
import { TaskStatus } from '@/types/task';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDragDrop } from '@/lib/context/DragDropContext';

interface DraggableTaskCardProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
  getStatusIcon: (status: any) => React.ReactElement;
  getStatusColor: (status: any) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
  weekId?: string;
  priorityId?: string;
  statusId?: string;
  userId?: string;
}

export function DraggableTaskCard({
  task,
  onTaskClick,
  onCompleteTask,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue,
  weekId,
  priorityId,
  statusId,
  userId
}: DraggableTaskCardProps) {
  const { dragState, startDrag, stopDrag } = useDragDrop();
  const [isBeingDragged, setIsBeingDragged] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const dueDate = firestoreDateToDate(task.dueDate);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    console.log('🔄 DraggableTaskCard: Starting drag for task:', task.title);
    setIsBeingDragged(true);
    startDrag(task, weekId, priorityId, statusId, userId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    console.log('🔄 DraggableTaskCard: Ending drag for task:', task.title);
    setIsBeingDragged(false);
    stopDrag();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevenir que el click se ejecute cuando se inicia el drag
    if (e.button === 0) { // Solo botón izquierdo
      const startX = e.clientX;
      const startY = e.clientY;
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = Math.abs(moveEvent.clientX - startX);
        const deltaY = Math.abs(moveEvent.clientY - startY);
        
        // Si el mouse se movió más de 5px, considerar como drag
        if (deltaX > 5 || deltaY > 5) {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        }
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onTaskClick(task)}
      onMouseDown={handleMouseDown}
      className={`
        group relative p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all
        ${isBeingDragged 
          ? 'opacity-50 scale-95 shadow-lg border-blue-300 bg-blue-50 dark:bg-blue-900/20' 
          : 'hover:shadow-lg hover:scale-[1.02]'
        }
        ${isOverdue(dueDate) 
          ? 'border-red-200 bg-red-50 dark:bg-red-900/20 hover:border-red-300 shadow-sm' 
          : 'border-gray-200 bg-white dark:bg-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
        }
      `}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-1 flex-1 min-w-0">
            {getStatusIcon(task.status)}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate cursor-pointer">
                    {task.title}
                  </h4>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{task.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {task.status !== 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-green-100 hover:text-green-600"
              onClick={(e) => onCompleteTask(e, task)}
              title="Marcar como completada"
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
            {task.priority === 'urgent' ? 'Urgente' :
             task.priority === 'high' ? 'Alta' :
             task.priority === 'medium' ? 'Media' : 'Baja'}
          </Badge>
          
          {dueDate && (
            <div className="flex items-center space-x-1 text-xs">
              <Calendar className={`h-3 w-3 ${isOverdue(dueDate) ? 'text-red-500' : 'text-gray-500'}`} />
              <span className={isOverdue(dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}>
                {formatDate(dueDate)}
              </span>
            </div>
          )}
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
        
        {/* Indicador de drag */}
        <div className="flex items-center justify-center pt-1">
          <div className="w-6 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
        </div>
        
        {/* Indicador de que es arrastrable */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
