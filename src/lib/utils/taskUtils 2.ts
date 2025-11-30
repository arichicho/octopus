import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TaskStatus } from '@/types/task';
import { firestoreDateToDate, isTaskOverdue as dateUtilsIsOverdue, getDaysRemaining as dateUtilsGetDaysRemaining } from './dateUtils';

/**
 * Task utility functions - Centralized helpers for task-related operations
 * 
 * This module provides reusable utility functions for:
 * - Status formatting and styling
 * - Priority formatting and styling
 * - Date formatting and validation
 * - Task status icons
 */

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * Returns the icon component for a given task status
 */
export function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'pending':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'review':
      return <Clock className="h-4 w-4 text-purple-600" />;
    case 'cancelled':
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
}

/**
 * Returns Tailwind CSS classes for status badge styling
 */
export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'review':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

/**
 * Returns human-readable text for task status
 */
export function getStatusText(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'Completada';
    case 'in_progress':
      return 'En Progreso';
    case 'pending':
      return 'Pendiente';
    case 'review':
      return 'Esperando Respuesta';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Pendiente';
  }
}

/**
 * Returns Tailwind CSS classes for priority badge styling
 */
export function getPriorityColor(priority: string): string {
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
}

/**
 * Returns human-readable text for task priority
 */
export function getPriorityText(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'Urgente';
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Media';
    case 'low':
      return 'Baja';
    default:
      return 'Normal';
  }
}

/**
 * Formats a date for display in task views
 * Handles Firestore dates and regular Date objects
 */
export function formatTaskDate(date: Date | any): string {
  if (!date) return 'Sin fecha';
  try {
    const dateObj = firestoreDateToDate(date);
    if (!dateObj) return 'Fecha inválida';
    return format(dateObj, 'dd/MM/yyyy', { locale: es });
  } catch {
    return 'Fecha inválida';
  }
}

/**
 * Checks if a task due date is overdue
 * Re-exports from dateUtils for convenience
 */
export const isTaskOverdue = dateUtilsIsOverdue;

/**
 * Calculates days remaining until due date
 * Re-exports from dateUtils for convenience
 */
export const getDaysRemaining = dateUtilsGetDaysRemaining;

/**
 * Filters tasks to only show active (non-completed, non-cancelled) tasks
 */
export function getActiveTasks<T extends { status: string }>(tasks: T[]): T[] {
  return tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  );
}

/**
 * Groups tasks by a given key
 */
export function groupTasksBy<T>(
  tasks: T[],
  keyFn: (task: T) => string
): Record<string, T[]> {
  return tasks.reduce((acc, task) => {
    const key = keyFn(task);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {} as Record<string, T[]>);
}

