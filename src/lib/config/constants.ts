// Constantes del sistema de gestión de tareas

// Estados de tareas
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// Prioridades de tareas
export const TASK_PRIORITY = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export type TaskPriority = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

// Roles de usuario
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Estados de usuario
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

// Estados de invitación
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired'
} as const;

export type InvitationStatus = typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS];

// Tipos de notificación
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_DUE_SOON: 'task_due_soon',
  TASK_OVERDUE: 'task_overdue',
  TASK_COMPLETED: 'task_completed',
  MEETING_REMINDER: 'meeting_reminder',
  DAILY_BRIEFING: 'daily_briefing',
  USER_INVITED: 'user_invited',
  USER_JOINED: 'user_joined'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Tipos de evento de webhook
export const WEBHOOK_EVENTS = {
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',
  USER_INVITED: 'user.invited',
  USER_JOINED: 'user.joined',
  COMPANY_CREATED: 'company.created',
  COMPANY_UPDATED: 'company.updated'
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
} as const;

// Configuración de rate limiting
export const RATE_LIMITS = {
  API_REQUESTS_PER_WINDOW: 100,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  WEBHOOK_TIMEOUT_MS: 5000
} as const;

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  BRIEFING_HOUR: 8,
  PRE_MEETING_MINUTES: 15,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000
} as const;

// Configuración de seguridad
export const SECURITY = {
  INVITATION_TOKEN_EXPIRY_HOURS: 72,
  API_KEY_LENGTH: 32,
  WEBHOOK_SECRET_LENGTH: 64,
  PASSWORD_MIN_LENGTH: 8
} as const;

// Configuración de archivos
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  MAX_FILES_PER_TASK: 5
} as const;

// Configuración de búsqueda
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  SEARCH_DELAY_MS: 300
} as const;

// Configuración de integraciones
export const INTEGRATION_CONFIG = {
  GOOGLE_CALENDAR_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutos
  GMAIL_CHECK_INTERVAL: 10 * 60 * 1000, // 10 minutos
  CLAUDE_API_TIMEOUT: 30000, // 30 segundos
  MAX_GOOGLE_DRIVE_FILES: 10
} as const;

// Configuración de UI
export const UI_CONFIG = {
  SIDEBAR_COLLAPSED_WIDTH: 64,
  SIDEBAR_EXPANDED_WIDTH: 240,
  TOAST_DURATION: 5000,
  LOADING_DELAY: 300,
  ANIMATION_DURATION: 200
} as const;

// Configuración de colores por empresa (por defecto)
export const COMPANY_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280'  // Gray
] as const;

// Configuración de timezones soportados
export const SUPPORTED_TIMEZONES = [
  'America/Mexico_City',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
] as const;

// Configuración de idiomas soportados
export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }
] as const;

// Configuración de temas
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const;

export type Theme = typeof THEMES[keyof typeof THEMES];

// Configuración de atajos de teclado
export const KEYBOARD_SHORTCUTS = {
  CREATE_TASK: 'CmdOrCtrl + K',
  SEARCH: 'CmdOrCtrl + Shift + K',
  TOGGLE_SIDEBAR: 'CmdOrCtrl + B',
  TOGGLE_THEME: 'CmdOrCtrl + Shift + T',
  REFRESH: 'CmdOrCtrl + R',
  SAVE: 'CmdOrCtrl + S',
  ESCAPE: 'Escape'
} as const;

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
  NOT_FOUND: 'El recurso solicitado no fue encontrado',
  VALIDATION_ERROR: 'Los datos proporcionados no son válidos',
  NETWORK_ERROR: 'Error de conexión. Intenta nuevamente',
  SERVER_ERROR: 'Error interno del servidor',
  RATE_LIMIT_EXCEEDED: 'Has excedido el límite de solicitudes',
  INVALID_TOKEN: 'Token de autenticación inválido',
  EXPIRED_TOKEN: 'Token de autenticación expirado'
} as const;

// Mensajes de éxito comunes
export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Tarea creada exitosamente',
  TASK_UPDATED: 'Tarea actualizada exitosamente',
  TASK_DELETED: 'Tarea eliminada exitosamente',
  USER_INVITED: 'Usuario invitado exitosamente',
  COMPANY_CREATED: 'Empresa creada exitosamente',
  SETTINGS_SAVED: 'Configuración guardada exitosamente',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente'
} as const;

export default {
  TASK_STATUS,
  TASK_PRIORITY,
  USER_ROLES,
  USER_STATUS,
  INVITATION_STATUS,
  NOTIFICATION_TYPES,
  WEBHOOK_EVENTS,
  PAGINATION,
  RATE_LIMITS,
  NOTIFICATION_CONFIG,
  SECURITY,
  FILE_CONFIG,
  SEARCH_CONFIG,
  INTEGRATION_CONFIG,
  UI_CONFIG,
  COMPANY_COLORS,
  SUPPORTED_TIMEZONES,
  SUPPORTED_LANGUAGES,
  THEMES,
  KEYBOARD_SHORTCUTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
