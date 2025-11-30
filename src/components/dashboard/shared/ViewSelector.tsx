'use client';

import { ViewConfig, ViewType } from '@/lib/managers/ViewConfigManager';

interface ViewSelectorProps {
  viewConfigs: ViewConfig[];
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  title?: string;
  description?: string;
}

/**
 * Shared view selector component for task views
 */
export function ViewSelector({
  viewConfigs,
  activeView,
  onViewChange,
  title = 'Vistas de Tareas',
  description
}: ViewSelectorProps) {
  return (
    <div className="mb-6">
      {(title || description) && (
        <div className="mb-3">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
          {viewConfigs.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 rounded-lg transition-all duration-200 group relative ${
                  activeView === view.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                title={view.description}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium text-center">{view.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>Vista: {viewConfigs.find(v => v.id === activeView)?.title}</span>
        </div>
      </div>
    </div>
  );
}

