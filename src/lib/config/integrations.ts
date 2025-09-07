// Configuración dinámica de integraciones
export const INTEGRATIONS_CONFIG = {
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    scopes: {
      gmail: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
      calendar: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      drive: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    }
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    defaultModel: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'El modelo más avanzado y versátil de Claude',
        maxTokens: 200000,
        pricing: {
          input: '$3.00 / 1M tokens',
          output: '$15.00 / 1M tokens'
        },
        capabilities: ['Análisis complejo', 'Código avanzado', 'Razonamiento', 'Creatividad'],
        recommended: true
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Modelo rápido y eficiente para tareas simples',
        maxTokens: 200000,
        pricing: {
          input: '$0.25 / 1M tokens',
          output: '$1.25 / 1M tokens'
        },
        capabilities: ['Respuestas rápidas', 'Tareas simples', 'Análisis básico'],
        recommended: false
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Modelo de mayor capacidad para tareas complejas',
        maxTokens: 200000,
        pricing: {
          input: '$15.00 / 1M tokens',
          output: '$75.00 / 1M tokens'
        },
        capabilities: ['Análisis muy complejo', 'Investigación', 'Análisis de datos'],
        recommended: false
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balance entre capacidad y velocidad',
        maxTokens: 200000,
        pricing: {
          input: '$3.00 / 1M tokens',
          output: '$15.00 / 1M tokens'
        },
        capabilities: ['Análisis complejo', 'Código', 'Razonamiento'],
        recommended: false
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Modelo rápido para tareas cotidianas',
        maxTokens: 200000,
        pricing: {
          input: '$0.25 / 1M tokens',
          output: '$1.25 / 1M tokens'
        },
        capabilities: ['Respuestas rápidas', 'Tareas simples'],
        recommended: false
      }
    ]
  }
};

// Validar configuración
export function validateIntegrationsConfig() {
  const errors: string[] = [];
  const isServer = typeof window === 'undefined';

  // Validar Google OAuth
  if (!INTEGRATIONS_CONFIG.google.clientId) {
    errors.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado');
  }
  // Solo validar secretos en el servidor; en el cliente no están disponibles
  if (isServer) {
    if (!INTEGRATIONS_CONFIG.google.clientSecret) {
      errors.push('GOOGLE_CLIENT_SECRET no está configurado');
    }
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL no está configurado');
  }

  // Validar Claude
  if (isServer) {
    if (!INTEGRATIONS_CONFIG.claude.apiKey) {
      errors.push('CLAUDE_API_KEY no está configurado');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Obtener configuración para un tipo específico
export function getGoogleConfig() {
  return INTEGRATIONS_CONFIG.google;
}

export function getClaudeConfig() {
  return INTEGRATIONS_CONFIG.claude;
}

// Verificar si una integración está habilitada
export function isIntegrationEnabled(type: 'google' | 'claude'): boolean {
  switch (type) {
    case 'google':
      // En cliente sólo necesitamos clientId; el secret vive en el servidor
      if (typeof window !== 'undefined') {
        return !!INTEGRATIONS_CONFIG.google.clientId;
      }
      return !!(INTEGRATIONS_CONFIG.google.clientId && INTEGRATIONS_CONFIG.google.clientSecret);
    case 'claude':
      return !!INTEGRATIONS_CONFIG.claude.apiKey;
    default:
      return false;
  }
}
