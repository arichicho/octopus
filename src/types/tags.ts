// Types for the Tag Management System

export interface TagCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagDefinition {
  id: string;
  name: string;
  category: string;
  description?: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagUsagePattern {
  tagId: string;
  tagName: string;
  context: 'task' | 'meeting' | 'event';
  frequency: number;
  avgDuration?: number; // en minutos
  commonTimes: string[]; // horarios comunes
  commonDays: string[]; // días de la semana
  relatedTags: string[]; // tags que suelen usarse juntos
  lastUsed: Date;
}

export interface TagLearningData {
  userId: string;
  tagPatterns: TagUsagePattern[];
  suggestions: TagSuggestion[];
  lastAnalyzed: Date;
}

export interface TagSuggestion {
  tagId: string;
  tagName: string;
  reason: string;
  confidence: number; // 0-1
  context: 'task' | 'meeting' | 'event';
  suggestedFor: string; // ID del elemento
}

export interface TagSettings {
  userId: string;
  defaultTags: TagDefinition[];
  customTags: TagDefinition[];
  categories: TagCategory[];
  learningEnabled: boolean;
  autoSuggestions: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Categorías predeterminadas
export const DEFAULT_TAG_CATEGORIES: Omit<TagCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Prioridad',
    description: 'Tags para indicar urgencia e importancia',
    color: '#ef4444',
    icon: '🔥',
    isDefault: true
  },
  {
    name: 'Ingresos',
    description: 'Tags relacionados con generación de ingresos',
    color: '#10b981',
    icon: '💰',
    isDefault: true
  },
  {
    name: 'Cliente',
    description: 'Tags para identificar clientes y relaciones',
    color: '#3b82f6',
    icon: '👥',
    isDefault: true
  },
  {
    name: 'Proyecto',
    description: 'Tags para organizar por proyectos',
    color: '#8b5cf6',
    icon: '📁',
    isDefault: true
  },
  {
    name: 'Acción',
    description: 'Tags que indican acciones específicas',
    color: '#f59e0b',
    icon: '⚡',
    isDefault: true
  },
  {
    name: 'Contexto',
    description: 'Tags para contexto y ubicación',
    color: '#6b7280',
    icon: '📍',
    isDefault: true
  }
];

// Tags predeterminados
export const DEFAULT_TAGS: Omit<TagDefinition, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Prioridad
  { name: 'urgente', category: 'Prioridad', color: '#ef4444', icon: '🚨', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'importante', category: 'Prioridad', color: '#f97316', icon: '⭐', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'crítico', category: 'Prioridad', color: '#dc2626', icon: '💥', isDefault: true, isActive: true, usageCount: 0 },
  
  // Ingresos
  { name: 'ingresos', category: 'Ingresos', color: '#10b981', icon: '💰', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'venta', category: 'Ingresos', color: '#059669', icon: '💵', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'facturación', category: 'Ingresos', color: '#047857', icon: '🧾', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'contrato', category: 'Ingresos', color: '#065f46', icon: '📋', isDefault: true, isActive: true, usageCount: 0 },
  
  // Cliente
  { name: 'cliente', category: 'Cliente', color: '#3b82f6', icon: '👥', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'prospecto', category: 'Cliente', color: '#2563eb', icon: '🎯', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'seguimiento', category: 'Cliente', color: '#1d4ed8', icon: '📞', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'llamar', category: 'Cliente', color: '#1e40af', icon: '📱', isDefault: true, isActive: true, usageCount: 0 },
  
  // Proyecto
  { name: 'desarrollo', category: 'Proyecto', color: '#8b5cf6', icon: '💻', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'marketing', category: 'Proyecto', color: '#7c3aed', icon: '📢', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'diseño', category: 'Proyecto', color: '#6d28d9', icon: '🎨', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'coordinación', category: 'Proyecto', color: '#5b21b6', icon: '🤝', isDefault: true, isActive: true, usageCount: 0 },
  
  // Acción
  { name: 'revisar', category: 'Acción', color: '#f59e0b', icon: '👀', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'aprobar', category: 'Acción', color: '#d97706', icon: '✅', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'enviar', category: 'Acción', color: '#b45309', icon: '📤', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'coordinar', category: 'Acción', color: '#92400e', icon: '🔄', isDefault: true, isActive: true, usageCount: 0 },
  
  // Contexto
  { name: 'oficina', category: 'Contexto', color: '#6b7280', icon: '🏢', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'casa', category: 'Contexto', color: '#4b5563', icon: '🏠', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'viaje', category: 'Contexto', color: '#374151', icon: '✈️', isDefault: true, isActive: true, usageCount: 0 },
  { name: 'reunión', category: 'Contexto', color: '#1f2937', icon: '🤝', isDefault: true, isActive: true, usageCount: 0 }
];
