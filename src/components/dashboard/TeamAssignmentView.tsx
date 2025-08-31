'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Clock, AlertTriangle, Calendar, User, Users } from 'lucide-react';
import { TaskStatus } from '@/types/task';
import { Task } from '@/lib/firebase/firestore';
import { firestoreDateToDate } from '@/lib/utils/dateUtils';
import { useCompanyUsersStore } from '@/lib/store/useCompanyUsersStore';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { DragDropProvider, useDragDrop } from '@/lib/context/DragDropContext';
import { TaskNotification } from '@/components/ui/task-notification';
import { DroppableUserColumn } from '@/components/tasks/DroppableUserColumn';

interface TeamAssignmentViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCompleteTask: (e: React.MouseEvent, task: Task) => void;
  getStatusIcon: (status: TaskStatus) => React.ReactElement;
  getStatusColor: (status: TaskStatus) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | any) => string;
  isOverdue: (dueDate: Date | null | undefined) => boolean;
  companyId: string;
}

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

function TeamAssignmentViewContent({
  tasks,
  onTaskClick,
  onCompleteTask,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  formatDate,
  isOverdue,
  companyId
}: TeamAssignmentViewProps) {
  const { users, loading, error, loadUsers } = useCompanyUsersStore();
  const { changeTaskAssignment } = useTaskStore();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    dueDate?: Date;
  } | null>(null);

  useEffect(() => {
    if (companyId) {
      console.log('🔄 TeamAssignmentView: Loading users for company:', companyId);
      loadUsers(companyId).catch(err => {
        console.error('❌ TeamAssignmentView: Error loading users:', err);
        setNotification({
          type: 'error',
          title: 'Error al Cargar Usuarios',
          message: 'No se pudieron cargar los usuarios del equipo. Inténtalo de nuevo.'
        });
      });
    }
  }, [companyId, loadUsers]);

  // Obtener miembros del equipo reales
  const getTeamMembers = (): TeamMember[] => {
    const members: TeamMember[] = [];
    
    try {
      // Agregar usuarios reales de la empresa
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          const userTasks = tasks.filter(task => 
            task.assignedTo && task.assignedTo.includes(user.id)
          );
          const completedTasks = userTasks.filter(task => task.status === 'completed');
          const overdueTasks = userTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = firestoreDateToDate(task.dueDate);
            return task.status !== 'completed' && isOverdue(dueDate);
          });

          const colors = [
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
            'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
          ];

          members.push({
            id: user.id,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            avatar: user.photoURL,
            color: colors[index % colors.length],
            taskCount: userTasks.length,
            completedCount: completedTasks.length,
            overdueCount: overdueTasks.length
          });
        });
      }

      // Agregar sección para tareas sin asignar
      const unassignedTasks = tasks.filter(task => 
        !task.assignedTo || task.assignedTo.length === 0
      );
      if (unassignedTasks.length > 0) {
        members.unshift({
          id: 'unassigned',
          name: 'Sin Asignar',
          email: 'sin-asignar@empresa.com',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
          taskCount: unassignedTasks.length,
          completedCount: unassignedTasks.filter(task => task.status === 'completed').length,
          overdueCount: unassignedTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = firestoreDateToDate(task.dueDate);
            return task.status !== 'completed' && isOverdue(dueDate);
          }).length
        });
      }

      // Si no hay usuarios ni tareas sin asignar, crear un miembro demo
      if (members.length === 0) {
        members.push({
          id: 'demo-user',
          name: 'Usuario Demo',
          email: 'demo@empresa.com',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          taskCount: 0,
          completedCount: 0,
          overdueCount: 0
        });
      }

      console.log('✅ TeamAssignmentView: Generated team members:', members.length);
      return members;
    } catch (error) {
      console.error('❌ TeamAssignmentView: Error generating team members:', error);
      // Fallback: crear un miembro demo en caso de error
      return [{
        id: 'fallback-user',
        name: 'Usuario',
        email: 'usuario@empresa.com',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        taskCount: 0,
        completedCount: 0,
        overdueCount: 0
      }];
    }
  };

  const teamMembers = getTeamMembers();

  const getTasksByMember = (memberId: string) => {
    if (memberId === 'unassigned') {
      return tasks.filter(task => !task.assignedTo || task.assignedTo.length === 0);
    }
    return tasks.filter(task => task.assignedTo && task.assignedTo.includes(memberId));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleTaskDrop = async (taskId: string, newAssignedTo: string | null) => {
    try {
      const result = await changeTaskAssignment(taskId, newAssignedTo ? [newAssignedTo] : null);
      if (result.success) {
        setNotification({
          type: 'success',
          title: 'Tarea Reasignada',
          message: `"${result.taskTitle}" ha sido asignada exitosamente.`
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        title: 'Error al Reasignar',
        message: 'No se pudo reasignar la tarea. Inténtalo de nuevo.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Cargando miembros del equipo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instrucciones de Drag & Drop */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            💡 Drag & Drop Activo
          </h3>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Arrastra las tareas entre los miembros del equipo para reasignarlas. Los cambios se guardarán automáticamente.
        </p>
      </div>

      {/* Tareas sin asignar - ancho completo */}
      {(() => {
        const unassignedMember = teamMembers.find(member => member.id === 'unassigned');
        if (!unassignedMember) return null;
        
        const unassignedTasks = getTasksByMember('unassigned');
        
        return (
          <div className="w-full">
            <DroppableUserColumn
              member={unassignedMember}
              tasks={unassignedTasks}
              onTaskClick={onTaskClick}
              onCompleteTask={onCompleteTask}
              onTaskDrop={handleTaskDrop}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              formatDate={formatDate}
              isOverdue={isOverdue}
              isUnassignedSection={true}
            />
          </div>
        );
      })()}

      {/* Miembros del equipo - en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers
          .filter(member => member.id !== 'unassigned')
          .map((member) => {
            const memberTasks = getTasksByMember(member.id);
            
            return (
              <DroppableUserColumn
                key={member.id}
                member={member}
                tasks={memberTasks}
                onTaskClick={onTaskClick}
                onCompleteTask={onCompleteTask}
                onTaskDrop={handleTaskDrop}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                isOverdue={isOverdue}
              />
            );
          })}
      </div>

      {/* Notificaciones */}
      {notification && (
        <TaskNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          dueDate={notification.dueDate}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export function TeamAssignmentView(props: TeamAssignmentViewProps) {
  return (
    <DragDropProvider>
      <TeamAssignmentViewContent {...props} />
    </DragDropProvider>
  );
}
