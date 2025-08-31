'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  Database, 
  Zap, 
  Users, 
  Globe,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Download,
  Upload
} from 'lucide-react';

interface CompanySettingsPanelProps {
  company?: any;
  onSave: (settings: any) => Promise<void>;
  onReset: () => void;
}

export function CompanySettingsPanel({ company, onSave, onReset }: CompanySettingsPanelProps) {
  const [settings, setSettings] = useState({
    // Configuración general
    general: {
      autoArchive: false,
      autoBackup: true,
      enableNotifications: true,
      enableAuditLog: true,
      defaultLanguage: 'es',
      timezone: 'America/Mexico_City',
    },
    
    // Configuración de seguridad
    security: {
      requireTwoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordPolicy: 'strong',
      enableApiAccess: false,
      apiKeyExpiration: 90,
    },
    
    // Configuración de integraciones
    integrations: {
      enableSlack: false,
      enableTeams: false,
      enableEmail: true,
      enableSMS: false,
      enableWebhooks: false,
      webhookUrl: '',
    },
    
    // Configuración de notificaciones
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationFrequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    },
    
    // Configuración de datos
    data: {
      retentionPeriod: 365,
      autoDelete: false,
      enableExport: true,
      enableImport: true,
      backupFrequency: 'daily',
      compressionEnabled: true,
    },
    
    // Configuración de personalización
    customization: {
      theme: 'system',
      primaryColor: '#3B82F6',
      enableCustomLogo: false,
      customLogoUrl: '',
      enableCustomDomain: false,
      customDomain: '',
      enableBranding: false,
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Configuración de Empresa
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Personaliza la configuración de {company?.name || 'tu empresa'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restablecer
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Tabs de Configuración */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Integraciones</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Datos</span>
          </TabsTrigger>
          <TabsTrigger value="customization" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Personalización</span>
          </TabsTrigger>
        </TabsList>

        {/* Configuración General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuración General</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="autoArchive">Archivado Automático</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoArchive"
                      checked={settings.general.autoArchive}
                      onCheckedChange={(checked) => handleSettingChange('general', 'autoArchive', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Archivar empresas inactivas automáticamente
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoBackup">Respaldo Automático</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoBackup"
                      checked={settings.general.autoBackup}
                      onCheckedChange={(checked) => handleSettingChange('general', 'autoBackup', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Crear respaldos automáticos
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Idioma Predeterminado</Label>
                  <Select
                    value={settings.general.defaultLanguage}
                    onValueChange={(value) => handleSettingChange('general', 'defaultLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Mexico_City">México (GMT-6)</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Seguridad */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Configuración de Seguridad</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requireTwoFactor">Autenticación de Dos Factores</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireTwoFactor"
                      checked={settings.security.requireTwoFactor}
                      onCheckedChange={(checked) => handleSettingChange('security', 'requireTwoFactor', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Requerir 2FA para todos los usuarios
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="480"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Intentos Máximos de Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    min="3"
                    max="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordPolicy">Política de Contraseñas</Label>
                  <Select
                    value={settings.security.passwordPolicy}
                    onValueChange={(value) => handleSettingChange('security', 'passwordPolicy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básica</SelectItem>
                      <SelectItem value="strong">Fuerte</SelectItem>
                      <SelectItem value="veryStrong">Muy Fuerte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Integraciones */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Integraciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enableSlack">Integración con Slack</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableSlack"
                      checked={settings.integrations.enableSlack}
                      onCheckedChange={(checked) => handleSettingChange('integrations', 'enableSlack', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Recibir notificaciones en Slack
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enableTeams">Integración con Teams</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableTeams"
                      checked={settings.integrations.enableTeams}
                      onCheckedChange={(checked) => handleSettingChange('integrations', 'enableTeams', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Recibir notificaciones en Teams
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enableEmail">Notificaciones por Email</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableEmail"
                      checked={settings.integrations.enableEmail}
                      onCheckedChange={(checked) => handleSettingChange('integrations', 'enableEmail', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Enviar notificaciones por email
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enableSMS">Notificaciones por SMS</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableSMS"
                      checked={settings.integrations.enableSMS}
                      onCheckedChange={(checked) => handleSettingChange('integrations', 'enableSMS', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Enviar notificaciones por SMS
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL de Webhook</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://api.example.com/webhook"
                  value={settings.integrations.webhookUrl}
                  onChange={(e) => handleSettingChange('integrations', 'webhookUrl', e.target.value)}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  URL para enviar notificaciones webhook
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Notificaciones */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Configuración de Notificaciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNotifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Recibir notificaciones por email
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pushNotifications">Notificaciones Push</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pushNotifications"
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'pushNotifications', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Recibir notificaciones push
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notificationFrequency">Frecuencia de Notificaciones</Label>
                  <Select
                    value={settings.notifications.notificationFrequency}
                    onValueChange={(value) => handleSettingChange('notifications', 'notificationFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Inmediata</SelectItem>
                      <SelectItem value="hourly">Cada hora</SelectItem>
                      <SelectItem value="daily">Diaria</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="quietHours">Horas Silenciosas</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="quietHours"
                    checked={settings.notifications.quietHours.enabled}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'quietHours', {
                      ...settings.notifications.quietHours,
                      enabled: checked
                    })}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    No enviar notificaciones durante las horas silenciosas
                  </span>
                </div>
                
                {settings.notifications.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="quietStart">Hora de Inicio</Label>
                      <Input
                        id="quietStart"
                        type="time"
                        value={settings.notifications.quietHours.start}
                        onChange={(e) => handleSettingChange('notifications', 'quietHours', {
                          ...settings.notifications.quietHours,
                          start: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quietEnd">Hora de Fin</Label>
                      <Input
                        id="quietEnd"
                        type="time"
                        value={settings.notifications.quietHours.end}
                        onChange={(e) => handleSettingChange('notifications', 'quietHours', {
                          ...settings.notifications.quietHours,
                          end: e.target.value
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Datos */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Gestión de Datos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retentionPeriod">Período de Retención (días)</Label>
                  <Input
                    id="retentionPeriod"
                    type="number"
                    value={settings.data.retentionPeriod}
                    onChange={(e) => handleSettingChange('data', 'retentionPeriod', parseInt(e.target.value))}
                    min="30"
                    max="3650"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Frecuencia de Respaldo</Label>
                  <Select
                    value={settings.data.backupFrequency}
                    onValueChange={(value) => handleSettingChange('data', 'backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Cada hora</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoDelete">Eliminación Automática</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoDelete"
                      checked={settings.data.autoDelete}
                      onCheckedChange={(checked) => handleSettingChange('data', 'autoDelete', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Eliminar datos antiguos automáticamente
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compressionEnabled">Compresión de Datos</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="compressionEnabled"
                      checked={settings.data.compressionEnabled}
                      onCheckedChange={(checked) => handleSettingChange('data', 'compressionEnabled', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Comprimir datos para ahorrar espacio
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Personalización */}
        <TabsContent value="customization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Personalización</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={settings.customization.theme}
                    onValueChange={(value) => handleSettingChange('customization', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Oscuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Color Primario</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.customization.primaryColor}
                      onChange={(e) => handleSettingChange('customization', 'primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.customization.primaryColor}
                      onChange={(e) => handleSettingChange('customization', 'primaryColor', e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enableCustomLogo">Logo Personalizado</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableCustomLogo"
                      checked={settings.customization.enableCustomLogo}
                      onCheckedChange={(checked) => handleSettingChange('customization', 'enableCustomLogo', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Usar logo personalizado
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enableBranding">Marca Personalizada</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableBranding"
                      checked={settings.customization.enableBranding}
                      onCheckedChange={(checked) => handleSettingChange('customization', 'enableBranding', checked)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrar marca personalizada
                    </span>
                  </div>
                </div>
              </div>

              {settings.customization.enableCustomLogo && (
                <div className="space-y-2">
                  <Label htmlFor="customLogoUrl">URL del Logo</Label>
                  <Input
                    id="customLogoUrl"
                    placeholder="https://example.com/logo.png"
                    value={settings.customization.customLogoUrl}
                    onChange={(e) => handleSettingChange('customization', 'customLogoUrl', e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="enableCustomDomain">Dominio Personalizado</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableCustomDomain"
                    checked={settings.customization.enableCustomDomain}
                    onCheckedChange={(checked) => handleSettingChange('customization', 'enableCustomDomain', checked)}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Usar dominio personalizado
                  </span>
                </div>
                
                {settings.customization.enableCustomDomain && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="customDomain">Dominio</Label>
                    <Input
                      id="customDomain"
                      placeholder="app.miempresa.com"
                      value={settings.customization.customDomain}
                      onChange={(e) => handleSettingChange('customization', 'customDomain', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
