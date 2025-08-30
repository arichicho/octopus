// Configuraciones centralizadas del sistema de gestión de tareas

// Configuración de Firebase
export { appConfig } from '../firebase/config';

// Configuración de APIs externas
export { 
  apiConfig, 
  validateApiConfig, 
  getApiConfig 
} from './api';

// Constantes del sistema
export {
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
} from './constants';

// Tipos de configuración
export type {
  TaskStatus,
  TaskPriority,
  UserRole,
  UserStatus,
  InvitationStatus,
  NotificationType,
  WebhookEvent,
  Theme
} from './constants';

// Configuración completa del sistema
export const systemConfig = {
  firebase: {
    useEmulator: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true',
    authEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099',
    firestoreEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080',
    functionsEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST || 'localhost:5001',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    debugMode: process.env.DEBUG_MODE === 'true',
    secret: process.env.NEXTAUTH_SECRET || '',
    jwtSecret: process.env.JWT_SECRET || '',
    encryptionKey: process.env.ENCRYPTION_KEY || '',
  },
  notifications: {
    briefing: {
      hour: parseInt(process.env.NOTIFICATION_BRIEFING_HOUR || '8'),
      timezone: process.env.NOTIFICATION_BRIEFING_TIMEZONE || 'America/Mexico_City',
    },
    preMeetingMinutes: parseInt(process.env.NOTIFICATION_PRE_MEETING_MINUTES || '15'),
    email: {
      enabled: process.env.NOTIFICATION_EMAIL_ENABLED === 'true',
    },
    push: {
      enabled: process.env.NOTIFICATION_PUSH_ENABLED === 'true',
    },
  },
  api: {
    rateLimit: {
      requests: parseInt(process.env.API_RATE_LIMIT_REQUESTS || '100'),
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000'),
    },
    keySecret: process.env.API_KEY_SECRET || 'demo-api-key-secret',
  },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET || 'demo-webhook-secret',
    timeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000'),
  },
  preferences: {
    timezone: process.env.DEFAULT_TIMEZONE || 'America/Mexico_City',
    language: process.env.DEFAULT_LANGUAGE || 'es',
    theme: process.env.DEFAULT_THEME || 'light',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    calendar: {
      apiKey: process.env.GOOGLE_CALENDAR_API_KEY || '',
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
    },
    drive: {
      apiKey: process.env.GOOGLE_DRIVE_API_KEY || '',
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
    },
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    },
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
  },
  sendGrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
    templates: {
      invitation: process.env.SENDGRID_TEMPLATE_ID_INVITATION || '',
      notification: process.env.SENDGRID_TEMPLATE_ID_NOTIFICATION || '',
      briefing: process.env.SENDGRID_TEMPLATE_ID_BRIEFING || '',
    },
  },
};

// Función para validar la configuración completa del sistema
export const validateSystemConfig = () => {
  const errors: string[] = [];
  
  // Validar configuración de Firebase
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    errors.push('NEXT_PUBLIC_FIREBASE_API_KEY es requerida');
  }
  
  // Validar configuración de Google
  if (!systemConfig.google.clientId) {
    errors.push('GOOGLE_CLIENT_ID es requerida');
  }
  
  // Validar configuración de Claude
  if (!systemConfig.claude.apiKey) {
    errors.push('CLAUDE_API_KEY es requerida');
  }
  
  // Validar configuración de SendGrid
  if (!systemConfig.sendGrid.apiKey) {
    errors.push('SENDGRID_API_KEY es requerida');
  }
  
  // Validar configuración de la aplicación
  if (!systemConfig.app.secret) {
    errors.push('NEXTAUTH_SECRET es requerida');
  }
  
  if (errors.length > 0) {
    console.error('❌ Errores de configuración:', errors);
    return false;
  }
  
  console.log('✅ Configuración del sistema validada correctamente');
  return true;
};

// Función para obtener la configuración según el entorno
export const getSystemConfig = (environment: 'development' | 'production' | 'test' = 'development') => {
  const config = { ...systemConfig };
  
  if (environment === 'development') {
    config.app.debugMode = true;
    config.firebase.useEmulator = true;
  } else if (environment === 'production') {
    config.app.debugMode = false;
    config.firebase.useEmulator = false;
  }
  
  return config;
};

export default systemConfig;
