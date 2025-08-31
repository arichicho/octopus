import { Timestamp } from 'firebase/firestore';

/**
 * Convierte una fecha de Firestore (Timestamp o Date) a un objeto Date de JavaScript
 */
export const firestoreDateToDate = (date: Date | Timestamp | undefined | null): Date | null => {
  if (!date) return null;
  
  if (date instanceof Date) {
    return date;
  }
  
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  
  // Si es un objeto con método toDate (Timestamp de Firestore)
  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  
  // Si es un string o número, intentar crear una fecha
  try {
    return new Date(date as any);
  } catch {
    return null;
  }
};

/**
 * Verifica si una fecha es válida
 */
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Compara dos fechas de Firestore
 */
export const compareFirestoreDates = (dateA: Date | Timestamp | undefined | null, dateB: Date | Timestamp | undefined | null): number => {
  const a = firestoreDateToDate(dateA);
  const b = firestoreDateToDate(dateB);
  
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  
  return a.getTime() - b.getTime();
};

/**
 * Calcula la fecha de vencimiento para una semana específica
 */
export const calculateDueDateForWeek = (weekId: string): Date | null => {
  if (weekId === 'no-date') return null;
  
  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay() + 1); // Lunes
  
  if (weekId === 'this-week') {
    // Asignar al viernes de esta semana (día 4 de la semana)
    const friday = new Date(thisWeekStart);
    friday.setDate(thisWeekStart.getDate() + 4);
    return friday;
  }
  
  // Para semanas futuras, extraer el número de semana
  const weekMatch = weekId.match(/week-(\d+)/);
  if (weekMatch) {
    const weekNumber = parseInt(weekMatch[1]);
    const targetWeekStart = new Date(thisWeekStart);
    targetWeekStart.setDate(thisWeekStart.getDate() + (weekNumber * 7));
    
    // Asignar al viernes de la semana objetivo
    const friday = new Date(targetWeekStart);
    friday.setDate(targetWeekStart.getDate() + 4);
    return friday;
  }
  
  return null;
};

/**
 * Verifica si una tarea está vencida
 */
export const isTaskOverdue = (dueDate: Date | Timestamp | undefined | null): boolean => {
  if (!dueDate) return false;
  
  const date = firestoreDateToDate(dueDate);
  if (!date) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  return date < today;
};

/**
 * Calcula los días restantes hasta la fecha de vencimiento
 */
export const getDaysRemaining = (dueDate: Date | Timestamp | undefined | null): number | null => {
  if (!dueDate) return null;
  
  const date = firestoreDateToDate(dueDate);
  if (!date) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};
