'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar } from 'lucide-react';
import { Task } from '@/lib/firebase/firestore';
import { useDragDrop } from '@/lib/context/DragDropContext';
import { DraggableTaskCard } from './DraggableTaskCard';

interface PriorityConfig {
  id: string;
  title: string;
  color: string;
  headerColor: string;
  badgeColor: string;
}

interface DroppablePriorityColumnProps {
  priority: PriorityConfig;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
  onTaskDrop: (taskId: string, newPriority: string) => Promise<void>;
  getStatusIcon: (status: any) => React.ReactElement;
  getStatusColor: (status: any) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
  getDaysRemaining: (dueDate: Date) => number;
}

export function DroppablePriorityColumn({
  priority,
  tasks,
  onTaskClick,
  onCompleteTask,
  onTaskDrop,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue,
  getDaysRemaining
}: DroppablePriorityColumnProps) {
  const { dragState, setDropPreview, clearDropPreview } = useDragDrop();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.isDragging && dragState.draggedTask) {
      setDropPreview(priority.id, priority.id);
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      clearDropPreview();
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    clearDropPreview();
    
    if (!dragState.isDragging || !dragState.draggedTask) {
      console.log('❌ No hay tarea siendo arrastrada');
      return;
    }
    
    // Evitar drop en la misma columna
    if (dragState.draggedFromPriority === priority.id) {
      console.log('❌ No se puede soltar en la misma columna de prioridad');
      return;
    }
    
    console.log('🔄 Dropping task:', dragState.draggedTask.title, 'to priority:', priority.id);
    
    try {
      setIsProcessingDrop(true);
      await onTaskDrop(dragState.draggedTask.id, priority.id);
      console.log('✅ Task priority changed successfully');
    } catch (error) {
      console.error('❌ Error changing task priority:', error);
    } finally {
      setIsProcessingDrop(false);
    }
  };

  const showDropPreview = dragState.dropPreview?.weekId === priority.id;
  const isTargetPriority = dragState.isDragging && dragState.draggedFromPriority !== priority.id;

  return (
    <Card 
      className={`
        ${priority.color} border-2 shadow-sm hover:shadow-md transition-all duration-200
        ${isDragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-[1.02]' : ''}
        ${showDropPreview ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
        ${isProcessingDrop ? 'opacity-75' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-semibold ${priority.headerColor} px-3 py-2 rounded-lg flex items-center justify-between`}>
          <span>{priority.title}</span>
          <Badge variant="secondary" className={`text-xs ${priority.badgeColor}`}>
            {tasks.length}
          </Badge>
        </CardTitle>
        
        {/* Preview de prioridad al hacer drop */}
        {showDropPreview && (
          <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-1 text-xs text-blue-700 dark:text-blue-300">
              <span className="font-medium">
                Nueva prioridad: {priority.title}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs">Sin tareas</p>
              
              {/* Indicador de drop zone cuando está vacío */}
              {isTargetPriority && (
                <div className="mt-4 p-3 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                    <span className="text-xs font-medium">Soltar aquí</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {tasks.map((task) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  priorityId={priority.id}
                  onTaskClick={onTaskClick}
                  onCompleteTask={onCompleteTask}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  formatDate={formatDate}
                  isOverdue={isOverdue}
                />
              ))}
              
              {/* Indicador de drop zone al final */}
              {isTargetPriority && (
                <div className="p-2 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                    <span className="text-xs font-medium">Soltar aquí</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
