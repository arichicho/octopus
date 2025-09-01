import { ClaudeIntegration, ClaudeModel, ClaudeModelInfo } from '@/types/integrations';
import { getClaudeConfig, isIntegrationEnabled } from '@/lib/config/integrations';
import { auth } from '@/lib/firebase/config';

async function authHeader() {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ClaudeIntegrationService {
  // Conectar integración de Claude
  static async connectClaude(
    userId: string,
    apiKey: string,
    model: ClaudeModel
  ): Promise<ClaudeIntegration> {
    try {
      const response = await fetch('/api/v1/integrations/claude/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          apiKey,
          model
        })
      });

      if (!response.ok) {
        throw new Error('Error al conectar con Claude');
      }

      return await response.json();
    } catch (error) {
      console.error('Error conectando con Claude:', error);
      throw error;
    }
  }

  // Desconectar integración de Claude
  static async disconnectClaude(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/v1/integrations/claude/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Error al desconectar Claude');
      }
    } catch (error) {
      console.error('Error desconectando Claude:', error);
      throw error;
    }
  }

  // Obtener configuración de Claude
  static async getClaudeConfig(userId: string): Promise<ClaudeIntegration | null> {
    try {
      const response = await fetch(`/api/v1/integrations/claude/config`, { headers: await authHeader() });
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo configuración de Claude:', error);
      return null;
    }
  }

  // Actualizar configuración de Claude
  static async updateClaudeConfig(
    userId: string,
    updates: Partial<ClaudeIntegration>
  ): Promise<ClaudeIntegration> {
    try {
      const response = await fetch('/api/v1/integrations/claude/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          userId,
          ...updates
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración de Claude');
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando configuración de Claude:', error);
      throw error;
    }
  }

  // Verificar API key
  static async verifyApiKey(apiKey: string): Promise<{ valid: boolean }> {
    try {
      const response = await fetch('/api/v1/integrations/claude/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          apiKey
        })
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verificando API key:', error);
      return { valid: false };
    }
  }

  // Obtener uso actual
  static async getUsage(userId: string): Promise<{
    currentUsage: number;
    usageLimit?: number;
    lastUsed?: Date;
  } | null> {
    try {
      const response = await fetch(`/api/v1/integrations/claude/usage`, { headers: await authHeader() });
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo uso de Claude:', error);
      return null;
    }
  }

  // Enviar mensaje a Claude
  static async sendMessage(
    userId: string,
    message: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{
    response: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
    };
  }> {
    try {
      const response = await fetch('/api/v1/integrations/claude/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          message,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error('Error enviando mensaje a Claude');
      }

      return await response.json();
    } catch (error) {
      console.error('Error enviando mensaje a Claude:', error);
      throw error;
    }
  }

  // Obtener modelos disponibles
  static getAvailableModels(): ClaudeModelInfo[] {
    if (!isIntegrationEnabled('claude')) {
      return [];
    }
    return getClaudeConfig().models;
  }

  // Obtener modelo recomendado
  static getRecommendedModel(): ClaudeModelInfo {
    if (!isIntegrationEnabled('claude')) {
      throw new Error('Integración de Claude no está configurada');
    }
    const models = getClaudeConfig().models;
    return models.find(model => model.recommended) || models[0];
  }

  // Validar API key (formato básico)
  static validateApiKeyFormat(apiKey: string): boolean {
    // Las API keys de Anthropic empiezan con 'sk-ant-'
    return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
  }
}
