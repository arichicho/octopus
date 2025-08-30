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
