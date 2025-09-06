'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskNotificationProps {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  dueDate?: Date;
  onClose: () => void;
  autoClose?: boolean;
}

export function TaskNotification({
  type,
  title,
  message,
  dueDate,
  onClose,
  autoClose = true
}: TaskNotificationProps) {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Calendar className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-300';
      case 'error':
        return 'text-red-800 dark:text-red-300';
      case 'info':
        return 'text-blue-800 dark:text-blue-300';
    }
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-sm
      ${getBgColor()}
      animate-in slide-in-from-right-2 duration-300
    `}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${getTextColor()}`}>
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {message}
          </p>
          {dueDate && (
            <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>
                Nueva fecha: {format(dueDate, 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <span className="sr-only">Cerrar</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

