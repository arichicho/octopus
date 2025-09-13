'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, AlertTriangle } from 'lucide-react';
import { Task } from '@/lib/firebase/firestore';
import { useDragDrop } from '@/lib/context/DragDropContext';
import { DraggableTaskCard } from './DraggableTaskCard';
import { format, startOfWeek, endOfWeek, addWeeks, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DeadlineWeek {
  id: string;
  title: string;
  description: string;
  color: string;
  headerColor: string;
  badgeColor: string;
  startDate: Date | null;
  endDate: Date | null;
  filterFn: (task: Task) => boolean;
}

interface DroppableWeekColumnProps {
  week: DeadlineWeek;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
  onTaskDrop: (taskId: string, newDueDate: Date | null) => Promise<void>;
  getStatusIcon: (status: any) => React.ReactElement;
  getStatusColor: (status: any) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
  getDaysRemaining: (dueDate: Date) => number;
  isCurrentWeek?: boolean;
  isNoDateSection?: boolean;
  showCompanyInfo?: boolean;
  getCompanyName?: (companyId: string) => string;
  getCompanyColor?: (companyId: string) => string;
}

export function DroppableWeekColumn({
  week,
  tasks,
  onTaskClick,
  onCompleteTask,
  onTaskDrop,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue,
  getDaysRemaining,
  isCurrentWeek = false,
  isNoDateSection = false,
  showCompanyInfo = false,
  getCompanyName,
  getCompanyColor
}: DroppableWeekColumnProps) {
  const { dragState, setDropPreview, clearDropPreview } = useDragDrop();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);

  const calculateNewDueDate = (weekId: string): Date | null => {
    if (weekId === 'no-date') return null;
    
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    if (weekId === 'this-week') {
      // Asignar al viernes de esta semana (día 4 de la semana)
      return addDays(thisWeekStart, 4);
    }
    
    // Para semanas futuras, extraer el número de semana
    const weekMatch = weekId.match(/week-(\d+)/);
    if (weekMatch) {
      const weekNumber = parseInt(weekMatch[1]);
      const targetWeekStart = addWeeks(thisWeekStart, weekNumber);
      // Asignar al viernes de la semana objetivo
      return addDays(targetWeekStart, 4);
    }
    
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.isDragging && dragState.draggedTask) {
      const newDueDate = calculateNewDueDate(week.id);
      setDropPreview(week.id, undefined, undefined, newDueDate);
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo limpiar si realmente salimos de la columna
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
    
    const newDueDate = calculateNewDueDate(week.id);
    if (!newDueDate && week.id !== 'no-date') {
      console.log('❌ No se pudo calcular la nueva fecha');
      return;
    }
    
    // Evitar drop en la misma columna
    if (dragState.draggedFromWeek === week.id) {
      console.log('❌ No se puede soltar en la misma columna');
      return;
    }
    
    console.log('🔄 Dropping task:', dragState.draggedTask.title, 'to week:', week.id, 'new date:', newDueDate);
    
    try {
      setIsProcessingDrop(true);
      await onTaskDrop(dragState.draggedTask.id, newDueDate);
      console.log('✅ Task dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping task:', error);
    } finally {
      setIsProcessingDrop(false);
    }
  };

  const showDropPreview = dragState.dropPreview?.weekId === week.id;
  const isTargetWeek = dragState.isDragging && dragState.draggedFromWeek !== week.id;

  return (
    <Card 
      className={`min-w-[280px] sm:min-w-0
        ${week.color} border-2 shadow-sm hover:shadow-md transition-all duration-200
        ${isCurrentWeek ? 'border-red-300 shadow-lg' : ''}
        ${isNoDateSection ? 'border-gray-300 shadow-md' : ''}
        ${isDragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-[1.02]' : ''}
        ${showDropPreview ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
        ${isProcessingDrop ? 'opacity-75' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-bold ${week.headerColor} px-4 py-3 rounded-xl flex items-center justify-between shadow-sm ${isCurrentWeek ? 'text-lg' : ''} ${isNoDateSection ? 'text-base' : ''}`}>
          <span className={`font-semibold ${isCurrentWeek ? 'text-lg' : isNoDateSection ? 'text-base' : 'text-sm'}`}>{week.title}</span>
          <Badge variant="secondary" className={`text-xs font-bold ${week.badgeColor} px-2 py-1 ${isCurrentWeek ? 'text-sm px-3 py-1' : isNoDateSection ? 'text-sm px-2 py-1' : ''}`}>
            {tasks.length}
          </Badge>
        </CardTitle>
        <p className={`text-gray-600 dark:text-gray-400 px-2 mt-2 font-medium ${isCurrentWeek ? 'text-sm' : isNoDateSection ? 'text-sm' : 'text-xs'}`}>
          {week.description}
        </p>
        
        {/* Preview de fecha al hacer drop */}
        {showDropPreview && dragState.dropPreview?.newDueDate && (
          <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-1 text-xs text-blue-700 dark:text-blue-300">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">
                Nueva fecha: {format(dragState.dropPreview.newDueDate, 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className={`space-y-2 overflow-y-auto ${isCurrentWeek ? 'max-h-96' : isNoDateSection ? 'max-h-80' : 'max-h-80'}`}>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs font-medium">Sin tareas</p>
              <p className="text-xs text-gray-400 mt-1">¡Todo al día!</p>
              
              {/* Indicador de drop zone cuando está vacío */}
              {isTargetWeek && (
                <div className="mt-4 p-3 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Calendar className="h-4 w-4" />
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
                  weekId={week.id}
                  onTaskClick={onTaskClick}
                  onCompleteTask={onCompleteTask}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  formatDate={formatDate}
                  isOverdue={isOverdue}
                  showCompanyInfo={showCompanyInfo}
                  getCompanyName={getCompanyName}
                  getCompanyColor={getCompanyColor}
                />
              ))}
              
              {/* Indicador de drop zone al final */}
              {isTargetWeek && (
                <div className="p-2 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Calendar className="h-3 w-3" />
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
