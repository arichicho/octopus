import { GoogleIntegration, IntegrationStatus, GmailIntegration, CalendarIntegration, DriveIntegration } from '@/types/integrations';
import { getGoogleConfig, isIntegrationEnabled } from '@/lib/config/integrations';
import { auth } from '@/lib/firebase/config';

async function authHeader() {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class GoogleIntegrationService {
  // Obtener URL de autorización para Google
  static getAuthUrl(type: 'gmail' | 'calendar' | 'drive'): string {
    if (!isIntegrationEnabled('google')) {
      throw new Error('Integración de Google no está configurada');
    }

    const config = getGoogleConfig();
    const scopes = config.scopes[type].join(' ');
    const state = encodeURIComponent(JSON.stringify({ type }));
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: scopes,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Conectar integración
  static async connectIntegration(
    userId: string,
    type: 'gmail' | 'calendar' | 'drive',
    authCode: string
  ): Promise<GoogleIntegration> {
    try {
      const response = await fetch('/api/v1/integrations/google/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          type,
          authCode
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error al conectar la integración: ${response.status} ${text}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error conectando integración:', error);
      throw error;
    }
  }

  // Desconectar integración
  static async disconnectIntegration(
    userId: string,
    type: 'gmail' | 'calendar' | 'drive'
  ): Promise<void> {
    try {
      const response = await fetch('/api/v1/integrations/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          type
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error al desconectar la integración: ${response.status} ${text}`);
      }
    } catch (error) {
      console.error('Error desconectando integración:', error);
      throw error;
    }
  }

  // Obtener estado de integraciones
  static async getIntegrationStatus(userId: string): Promise<IntegrationStatus> {
    try {
      const response = await fetch(`/api/v1/integrations/status`, { headers: await authHeader() });
      
      if (!response.ok) {
        throw new Error('Error al obtener el estado de las integraciones');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estado de integraciones:', error);
      return {
        gmail: false,
        calendar: false,
        drive: false,
        claude: false
      };
    }
  }

  // Obtener configuración de Gmail
  static async getGmailConfig(userId: string): Promise<GmailIntegration | null> {
    try {
      const response = await fetch(`/api/v1/integrations/gmail/config?userId=${userId}` , { headers: await authHeader() });
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo configuración de Gmail:', error);
      return null;
    }
  }

  // Obtener configuración de Calendar
  static async getCalendarConfig(userId: string): Promise<CalendarIntegration | null> {
    try {
      const response = await fetch(`/api/v1/integrations/calendar/config?userId=${userId}`, { headers: await authHeader() });
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo configuración de Calendar:', error);
      return null;
    }
  }

  // Obtener configuración de Drive
  static async getDriveConfig(userId: string): Promise<DriveIntegration | null> {
    try {
      const response = await fetch(`/api/v1/integrations/drive/config?userId=${userId}`, { headers: await authHeader() });
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo configuración de Drive:', error);
      return null;
    }
  }

  // Actualizar configuración de Gmail
  static async updateGmailConfig(
    userId: string,
    config: Partial<GmailIntegration>
  ): Promise<GmailIntegration> {
    try {
      const response = await fetch('/api/v1/integrations/gmail/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          userId,
          ...config
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración de Gmail');
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando configuración de Gmail:', error);
      throw error;
    }
  }

  // Actualizar configuración de Calendar
  static async updateCalendarConfig(
    userId: string,
    config: Partial<CalendarIntegration>
  ): Promise<CalendarIntegration> {
    try {
      const response = await fetch('/api/v1/integrations/calendar/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          userId,
          ...config
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración de Calendar');
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando configuración de Calendar:', error);
      throw error;
    }
  }

  // Actualizar configuración de Drive
  static async updateDriveConfig(
    userId: string,
    config: Partial<DriveIntegration>
  ): Promise<DriveIntegration> {
    try {
      const response = await fetch('/api/v1/integrations/drive/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          userId,
          ...config
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración de Drive');
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando configuración de Drive:', error);
      throw error;
    }
  }

  // Sincronizar datos
  static async syncData(
    userId: string,
    type: 'gmail' | 'calendar' | 'drive'
  ): Promise<void> {
    try {
      const response = await fetch('/api/v1/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          userId,
          type
        })
      });

      if (!response.ok) {
        throw new Error('Error al sincronizar datos');
      }
    } catch (error) {
      console.error('Error sincronizando datos:', error);
      throw error;
    }
  }
}
