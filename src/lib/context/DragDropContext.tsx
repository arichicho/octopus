'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task } from '@/lib/firebase/firestore';

interface DragDropState {
  isDragging: boolean;
  draggedTask: Task | null;
  draggedFromWeek?: string;
  draggedFromPriority?: string;
  draggedFromStatus?: string;
  draggedFromUser?: string;
  dropPreview: {
    weekId?: string;
    priorityId?: string;
    statusId?: string;
    userId?: string;
    newDueDate?: Date;
  } | null;
}

interface DragDropContextType {
  dragState: DragDropState;
  startDrag: (task: Task, fromWeek?: string, fromPriority?: string, fromStatus?: string, fromUser?: string) => void;
  stopDrag: () => void;
  setDropPreview: (weekId?: string, priorityId?: string, statusId?: string, newDueDate?: Date, userId?: string) => void;
  clearDropPreview: () => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedTask: null,
    draggedFromWeek: null,
    draggedFromPriority: null,
    draggedFromStatus: null,
    dropPreview: null,
  });

  const startDrag = (task: Task, fromWeek?: string, fromPriority?: string, fromStatus?: string) => {
    console.log('🔄 DragDropContext: Starting drag for task:', task.title, 'from week:', fromWeek);
    setDragState({
      isDragging: true,
      draggedTask: task,
      draggedFromWeek: fromWeek || null,
      draggedFromPriority: fromPriority || null,
      draggedFromStatus: fromStatus || null,
      dropPreview: null,
    });
  };

  const stopDrag = () => {
    console.log('🔄 DragDropContext: Ending drag');
    setDragState({
      isDragging: false,
      draggedTask: null,
      draggedFromWeek: null,
      draggedFromPriority: null,
      draggedFromStatus: null,
      dropPreview: null,
    });
  };

  const setDropPreview = (weekId?: string | null, priorityId?: string | null, statusId?: string | null, newDueDate?: Date | null) => {
    console.log('🔄 DragDropContext: Setting drop preview for week:', weekId, 'priority:', priorityId, 'status:', statusId, 'new date:', newDueDate);
    setDragState(prev => ({
      ...prev,
      dropPreview: weekId || priorityId || statusId || newDueDate ? { weekId, priorityId, statusId, newDueDate } : null,
    }));
  };

  const clearDropPreview = () => {
    console.log('🔄 DragDropContext: Clearing drop preview');
    setDragState(prev => ({
      ...prev,
      dropPreview: null,
    }));
  };

  const value: DragDropContextType = {
    dragState,
    startDrag,
    stopDrag,
    setDropPreview,
    clearDropPreview,
  };

  return (
    <DragDropContext.Provider
      value={value}
    >
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}
