"use client";

import { useState, useEffect } from 'react';

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

// Lista de zonas horarias comunes
export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: 'America/New_York', label: 'New York (EST/EDT)', offset: '-05:00/-04:00' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', offset: '-06:00/-05:00' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)', offset: '-07:00/-06:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', offset: '-08:00/-07:00' },
  { value: 'America/Mexico_City', label: 'México (CST/CDT)', offset: '-06:00/-05:00' },
  { value: 'America/Bogota', label: 'Bogotá (COT)', offset: '-05:00' },
  { value: 'America/Lima', label: 'Lima (PET)', offset: '-05:00' },
  { value: 'America/Santiago', label: 'Santiago (CLT/CLST)', offset: '-04:00/-03:00' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)', offset: '-03:00' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT/BRST)', offset: '-03:00/-02:00' },
  { value: 'Europe/London', label: 'Londres (GMT/BST)', offset: '+00:00/+01:00' },
  { value: 'Europe/Paris', label: 'París (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Berlin', label: 'Berlín (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Europe/Rome', label: 'Roma (CET/CEST)', offset: '+01:00/+02:00' },
  { value: 'Asia/Tokyo', label: 'Tokio (JST)', offset: '+09:00' },
  { value: 'Asia/Shanghai', label: 'Shanghái (CST)', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: '+08:00' },
  { value: 'Asia/Singapore', label: 'Singapur (SGT)', offset: '+08:00' },
  { value: 'Asia/Dubai', label: 'Dubái (GST)', offset: '+04:00' },
  { value: 'Australia/Sydney', label: 'Sídney (AEST/AEDT)', offset: '+10:00/+11:00' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)', offset: '+10:00/+11:00' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', offset: '+12:00/+13:00' },
];

export function useTimezone() {
  const [timezone, setTimezone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Detectar zona horaria automáticamente
  useEffect(() => {
    const detectTimezone = () => {
      try {
        // Obtener zona horaria del navegador
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Verificar si hay una preferencia guardada
        const savedTimezone = localStorage.getItem('user-timezone');
        
        if (savedTimezone) {
          setTimezone(savedTimezone);
        } else {
          setTimezone(detectedTimezone);
          // Guardar la zona horaria detectada
          localStorage.setItem('user-timezone', detectedTimezone);
        }
      } catch (error) {
        console.error('Error detecting timezone:', error);
        // Fallback a UTC
        setTimezone('UTC');
      } finally {
        setIsLoading(false);
      }
    };

    detectTimezone();
  }, []);

  // Función para cambiar zona horaria
  const changeTimezone = (newTimezone: string) => {
    setTimezone(newTimezone);
    localStorage.setItem('user-timezone', newTimezone);
  };

  // Función para obtener información de la zona horaria actual
  const getTimezoneInfo = () => {
    if (!timezone) return null;

    const now = new Date();
    const offset = now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetString = `${offset < 0 ? '+' : '-'}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

    return {
      timezone,
      offset: offsetString,
      currentTime: now.toLocaleString('es-ES', { 
        timeZone: timezone,
        timeZoneName: 'short'
      }),
      timezoneOption: COMMON_TIMEZONES.find(tz => tz.value === timezone)
    };
  };

  // Función para formatear fecha en la zona horaria del usuario
  const formatDateInTimezone = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    if (!timezone) return date.toString();

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleString('es-ES', {
      timeZone: timezone,
      ...options
    });
  };

  // Función para convertir fecha a la zona horaria del usuario
  const convertToUserTimezone = (date: Date | string) => {
    if (!timezone) return new Date(date);

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Crear una nueva fecha en la zona horaria del usuario
    const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (getTimezoneOffset(timezone) * 60000));
    
    return targetTime;
  };

  // Función para obtener la fecha actual en la zona horaria del usuario
  const getCurrentDateInTimezone = () => {
    if (!timezone) return new Date();
    
    return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  };

  // Función para verificar si una fecha está en el día actual (en zona horaria del usuario)
  const isTodayInTimezone = (date: Date | string) => {
    if (!timezone) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    // Convertir ambas fechas a la zona horaria del usuario
    const userDate = new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
    const userToday = new Date(today.toLocaleString('en-US', { timeZone: timezone }));
    
    return userDate.toDateString() === userToday.toDateString();
  };

  // Función para obtener el offset de zona horaria en minutos
  const getTimezoneOffsetMinutes = (tz: string) => {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const target = new Date(utc.toLocaleString('en-US', { timeZone: tz }));
    return (target.getTime() - utc.getTime()) / 60000;
  };

  // Función auxiliar para obtener offset de zona horaria
  const getTimezoneOffset = (tz: string) => {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const target = new Date(utc.toLocaleString('en-US', { timeZone: tz }));
    return (target.getTime() - utc.getTime()) / 60000;
  };

  return {
    timezone,
    isLoading,
    changeTimezone,
    getTimezoneInfo,
    formatDateInTimezone,
    convertToUserTimezone,
    getCurrentDateInTimezone,
    isTodayInTimezone,
    getTimezoneOffsetMinutes,
    timezoneOptions: COMMON_TIMEZONES
  };
}
