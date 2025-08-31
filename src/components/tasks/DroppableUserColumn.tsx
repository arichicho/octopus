'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, User } from 'lucide-react';
import { Task } from '@/lib/firebase/firestore';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { useDragDrop } from '@/lib/context/DragDropContext';
import { DraggableTaskCard } from './DraggableTaskCard';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  taskCount: number;
  completedCount: number;
  overdueCount: number;
}

interface DroppableUserColumnProps {
  member: TeamMember;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
  onTaskDrop: (taskId: string, newAssignedTo: string | null) => Promise<void>;
  getStatusIcon: (status: any) => React.ReactElement;
  getStatusColor: (status: any) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
  isUnassignedSection?: boolean;
}

export function DroppableUserColumn({
  member,
  tasks,
  onTaskClick,
  onCompleteTask,
  onTaskDrop,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue,
  isUnassignedSection = false
}: DroppableUserColumnProps) {
  const { dragState, setDropPreview, clearDropPreview } = useDragDrop();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.isDragging && dragState.draggedTask) {
      setDropPreview(undefined, undefined, undefined, undefined, member.id);
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
    const currentAssignedTo = dragState.draggedTask.assignedTo || [];
    if (member.id === 'unassigned' && currentAssignedTo.length === 0) {
      console.log('❌ No se puede soltar en la misma columna (sin asignar)');
      return;
    }
    if (member.id !== 'unassigned' && currentAssignedTo.includes(member.id)) {
      console.log('❌ No se puede soltar en la misma columna (usuario)');
      return;
    }
    
    console.log('🔄 Dropping task:', dragState.draggedTask.title, 'to user:', member.name);
    
    try {
      setIsProcessingDrop(true);
      const newAssignedTo = member.id === 'unassigned' ? null : member.id;
      await onTaskDrop(dragState.draggedTask.id, newAssignedTo);
      console.log('✅ Task dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping task:', error);
    } finally {
      setIsProcessingDrop(false);
    }
  };

  const showDropPreview = dragState.dropPreview?.userId === member.id;
  const isTargetUser = dragState.isDragging && dragState.draggedFromUser !== member.id;
  const pendingTasks = tasks.filter(task => task.status !== 'completed');

  return (
    <Card 
      className={`
        border-2 shadow-sm hover:shadow-md transition-all duration-200
        ${isUnassignedSection ? 'border-gray-300 shadow-md' : ''}
        ${isDragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-[1.02]' : ''}
        ${showDropPreview ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
        ${isProcessingDrop ? 'opacity-75' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className={member.color}>
              {member.id === 'unassigned' ? <User className="h-5 w-5" /> : getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className={`text-sm font-semibold truncate ${isUnassignedSection ? 'text-base' : ''}`}>
              {member.name}
            </CardTitle>
            <p className={`text-xs text-gray-600 dark:text-gray-400 truncate ${isUnassignedSection ? 'text-sm' : ''}`}>
              {member.email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={`text-xs ${member.color} ${isUnassignedSection ? 'text-sm' : ''}`}>
              {member.taskCount} tareas
            </Badge>
            {member.completedCount > 0 && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                {member.completedCount} completadas
              </Badge>
            )}
            {member.overdueCount > 0 && (
              <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                {member.overdueCount} vencidas
              </Badge>
            )}
          </div>
        </div>
        
        {/* Preview de asignación al hacer drop */}
        {showDropPreview && (
          <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-1 text-xs text-blue-700 dark:text-blue-300">
              <User className="h-3 w-3" />
              <span className="font-medium">
                Asignar a: {member.name}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className={`space-y-2 overflow-y-auto ${isUnassignedSection ? 'max-h-80' : 'max-h-80'}`}>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs">Sin tareas pendientes</p>
            </div>
          ) : (
            pendingTasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
                onCompleteTask={onCompleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
                userId={member.id}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
