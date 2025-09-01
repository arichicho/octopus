'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Calendar, 
  FolderOpen, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { GoogleIntegrationService } from '@/lib/services/google-integrations';
import { IntegrationStatus, GmailIntegration, CalendarIntegration, DriveIntegration } from '@/types/integrations';
import { useAuthStore } from '@/lib/store/useAuthStore';

interface GoogleIntegrationCardProps {
  type: 'gmail' | 'calendar' | 'drive';
}

export default function GoogleIntegrationCard({ type }: GoogleIntegrationCardProps) {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<GmailIntegration | CalendarIntegration | DriveIntegration | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const integrationConfig = {
    gmail: {
      title: 'Gmail',
      description: 'Sincroniza emails y gestiona comunicaciones',
      icon: Mail,
      color: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600'
    },
    calendar: {
      title: 'Google Calendar',
      description: 'Sincroniza eventos y reuniones',
      icon: Calendar,
      color: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600'
    },
    drive: {
      title: 'Google Drive',
      description: 'Accede y gestiona documentos',
      icon: FolderOpen,
      color: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600'
    }
  };

  const configData = integrationConfig[type];
  const IconComponent = configData.icon;

  useEffect(() => {
    if (user?.uid) {
      loadIntegrationStatus();
      loadConfig();
    }
  }, [user?.uid, type]);

  const loadIntegrationStatus = async () => {
    try {
      const status = await GoogleIntegrationService.getIntegrationStatus(user!.uid);
      setIsConnected(status[type]);
    } catch (error) {
      console.error('Error cargando estado de integración:', error);
    }
  };

  const loadConfig = async () => {
    try {
      let configData = null;
      switch (type) {
        case 'gmail':
          configData = await GoogleIntegrationService.getGmailConfig(user!.uid);
          break;
        case 'calendar':
          configData = await GoogleIntegrationService.getCalendarConfig(user!.uid);
          break;
        case 'drive':
          configData = await GoogleIntegrationService.getDriveConfig(user!.uid);
          break;
      }
      setConfig(configData);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const handleConnect = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const authUrl = GoogleIntegrationService.getAuthUrl(type);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error iniciando conexión:', error);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      await GoogleIntegrationService.disconnectIntegration(user.uid, type);
      setIsConnected(false);
      setConfig(null);
    } catch (error) {
      console.error('Error desconectando integración:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      await GoogleIntegrationService.syncData(user.uid, type);
      // Recargar configuración después de sincronizar
      await loadConfig();
    } catch (error) {
      console.error('Error sincronizando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (updates: any) => {
    if (!user?.uid || !config) return;
    
    try {
      let updatedConfig = null;
      switch (type) {
        case 'gmail':
          updatedConfig = await GoogleIntegrationService.updateGmailConfig(user.uid, updates);
          break;
        case 'calendar':
          updatedConfig = await GoogleIntegrationService.updateCalendarConfig(user.uid, updates);
          break;
        case 'drive':
          updatedConfig = await GoogleIntegrationService.updateDriveConfig(user.uid, updates);
          break;
      }
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Error actualizando configuración:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${configData.color} rounded-lg flex items-center justify-center`}>
              <IconComponent className={`h-5 w-5 ${configData.iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{configData.title}</CardTitle>
              <CardDescription>{configData.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Badge variant="default" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Conectado</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <XCircle className="h-3 w-3" />
                <span>Desconectado</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado de sincronización</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sincronizar</span>
              </Button>
            </div>

            {config && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Configuración avanzada</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center space-x-1"
                  >
                    <Settings className="h-3 w-3" />
                    <span>{showSettings ? 'Ocultar' : 'Mostrar'}</span>
                  </Button>
                </div>

                {showSettings && (
                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {type === 'gmail' && config && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sincronización automática</span>
                          <Switch
                            checked={(config as GmailIntegration).syncEnabled}
                            onCheckedChange={(checked) => 
                              updateConfig({ syncEnabled: checked })
                            }
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          Email: {(config as GmailIntegration).email}
                        </div>
                      </div>
                    )}

                    {type === 'calendar' && config && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sincronización automática</span>
                          <Switch
                            checked={(config as CalendarIntegration).syncEnabled}
                            onCheckedChange={(checked) => 
                              updateConfig({ syncEnabled: checked })
                            }
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          Calendario: {(config as CalendarIntegration).name}
                        </div>
                      </div>
                    )}

                    {type === 'drive' && config && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sincronización automática</span>
                          <Switch
                            checked={(config as DriveIntegration).syncEnabled}
                            onCheckedChange={(checked) => 
                              updateConfig({ syncEnabled: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Auto-sincronizar</span>
                          <Switch
                            checked={(config as DriveIntegration).autoSync}
                            onCheckedChange={(checked) => 
                              updateConfig({ autoSync: checked })
                            }
                          />
                        </div>
                        {(config as DriveIntegration).folderName && (
                          <div className="text-xs text-gray-500">
                            Carpeta: {(config as DriveIntegration).folderName}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1"
              >
                Desconectar
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://myaccount.google.com/permissions', '_blank')}
                className="flex items-center space-x-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Gestionar permisos</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span>No conectado. Conecta tu cuenta de Google para empezar.</span>
            </div>
            
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Conectando...' : `Conectar ${configData.title}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
