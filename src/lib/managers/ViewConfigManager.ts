import { List, Star, Clock, CalendarDays, Calendar, Users } from 'lucide-react';

/**
 * View configuration manager
 * Centralizes all view configuration to avoid duplication
 */

export type ViewType = 'priority' | 'status' | 'deadlines' | 'calendar' | 'team' | 'list';

export interface ViewConfig {
  id: ViewType;
  title: string;
  icon: typeof List;
  description: string;
}

/**
 * Default view configurations
 */
export const DEFAULT_VIEW_CONFIGS: ViewConfig[] = [
  {
    id: 'list',
    title: 'Lista',
    icon: List,
    description: 'Vista de lista simple'
  },
  {
    id: 'priority',
    title: 'Por Prioridad',
    icon: Star,
    description: 'Organiza tareas por nivel de urgencia'
  },
  {
    id: 'status',
    title: 'Por Estado',
    icon: Clock,
    description: 'Flujo de trabajo por estado'
  },
  {
    id: 'deadlines',
    title: 'Por Vencimientos',
    icon: CalendarDays,
    description: 'Organiza por fechas de vencimiento'
  },
  {
    id: 'calendar',
    title: 'Calendario',
    icon: Calendar,
    description: 'Vista de calendario temporal'
  },
  {
    id: 'team',
    title: 'Por Equipo',
    icon: Users,
    description: 'Organiza por responsables'
  }
];

/**
 * Gets a view configuration by ID
 */
export function getViewConfig(viewId: ViewType): ViewConfig | undefined {
  return DEFAULT_VIEW_CONFIGS.find(config => config.id === viewId);
}

/**
 * Gets the default view (list)
 */
export function getDefaultView(): ViewType {
  return 'list';
}

/**
 * Gets all available view configurations
 */
export function getAllViewConfigs(): ViewConfig[] {
  return DEFAULT_VIEW_CONFIGS;
}

