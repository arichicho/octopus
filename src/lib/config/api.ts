// Configuración de APIs externas para el sistema de gestión de tareas

export const apiConfig = {
  // Google APIs
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    
    // Google Calendar API
    calendar: {
      apiKey: process.env.GOOGLE_CALENDAR_API_KEY || '',
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.settings.readonly'
      ]
    },
    
    // Google Drive API
    drive: {
      apiKey: process.env.GOOGLE_DRIVE_API_KEY || '',
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ]
    },
    
    // Gmail API
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send'
      ]
    }
  },
  
  // Claude API
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
    baseUrl: 'https://api.anthropic.com/v1'
  },
  
  // SendGrid para notificaciones por email
  sendGrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
    templates: {
      invitation: process.env.SENDGRID_TEMPLATE_ID_INVITATION || '',
      notification: process.env.SENDGRID_TEMPLATE_ID_NOTIFICATION || '',
      briefing: process.env.SENDGRID_TEMPLATE_ID_BRIEFING || ''
    }
  },
  
  // Configuración de la aplicación
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    secret: process.env.NEXTAUTH_SECRET || '',
    jwtSecret: process.env.JWT_SECRET || '',
    encryptionKey: process.env.ENCRYPTION_KEY || ''
  },
  
  // Configuración de API REST
  api: {
    rateLimit: {
      requests: parseInt(process.env.API_RATE_LIMIT_REQUESTS || '100'),
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000')
    },
    keySecret: process.env.API_KEY_SECRET || 'demo-api-key-secret'
  },
  
  // Configuración de webhooks
  webhooks: {
    secret: process.env.WEBHOOK_SECRET || 'demo-webhook-secret',
    timeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000')
  },
  
  // Configuración de notificaciones
  notifications: {
    briefing: {
      hour: parseInt(process.env.NOTIFICATION_BRIEFING_HOUR || '8'),
      timezone: process.env.NOTIFICATION_BRIEFING_TIMEZONE || 'America/Mexico_City'
    },
    preMeetingMinutes: parseInt(process.env.NOTIFICATION_PRE_MEETING_MINUTES || '15'),
    email: {
      enabled: process.env.NOTIFICATION_EMAIL_ENABLED === 'true'
    },
    push: {
      enabled: process.env.NOTIFICATION_PUSH_ENABLED === 'true'
    }
  },
  
  // Preferencias por defecto
  preferences: {
    timezone: process.env.DEFAULT_TIMEZONE || 'America/Mexico_City',
    language: process.env.DEFAULT_LANGUAGE || 'es',
    theme: process.env.DEFAULT_THEME || 'light'
  },
  
  // Configuración de desarrollo
  development: {
    nodeEnv: process.env.NODE_ENV || 'development',
    debugMode: process.env.DEBUG_MODE === 'true'
  }
};

// Validación de configuración requerida
export const validateApiConfig = () => {
  const required = [
    'google.clientId',
    'google.clientSecret',
    'claude.apiKey',
    'sendGrid.apiKey',
    'app.secret'
  ];
  
  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], apiConfig);
    return !value;
  });
  
  if (missing.length > 0) {
    console.warn('⚠️ Configuraciones de API faltantes:', missing);
    return false;
  }
  
  return true;
};

// Configuración para diferentes entornos
export const getApiConfig = (environment: 'development' | 'production' | 'test' = 'development') => {
  const baseConfig = { ...apiConfig };
  
  if (environment === 'development') {
    // Configuraciones específicas para desarrollo
    baseConfig.development.debugMode = true;
  } else if (environment === 'production') {
    // Configuraciones específicas para producción
    baseConfig.development.debugMode = false;
  }
  
  return baseConfig;
};

export default apiConfig;
