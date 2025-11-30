'use client';

import { memo } from 'react';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanyIcon } from '@/components/companies/CompanyIcon';
import { CompanyEnhanced } from '@/types/company-enhanced';

interface TaskViewHeaderProps {
  title: string;
  subtitle: string;
  company?: CompanyEnhanced;
  showAllCompanies?: boolean;
  onBack?: () => void;
  onCreateTask: () => void;
  showBackButton?: boolean;
}

/**
 * Shared header component for task views
 * Memoized to prevent unnecessary re-renders
 */
export const TaskViewHeader = memo(function TaskViewHeader({
  title,
  subtitle,
  company,
  showAllCompanies = false,
  onBack,
  onCreateTask,
  showBackButton = false
}: TaskViewHeaderProps) {
  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {showBackButton && onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 p-2"
            >
              <span className="hidden sm:inline">Volver</span>
            </Button>
          )}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {showAllCompanies ? (
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Building2 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            ) : company ? (
              <CompanyIcon
                logoUrl={company.logoUrl}
                defaultIcon={company.defaultIcon}
                name={company.name}
                size="md"
                color={company.color}
                className="flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={onCreateTask}
          size="sm"
          className="flex items-center space-x-2 px-4 py-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Nueva Tarea</span>
        </Button>
      </div>
    </div>
  );
});

