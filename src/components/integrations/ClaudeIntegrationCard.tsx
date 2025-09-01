'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Key, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info,
  Zap,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { ClaudeIntegrationService } from '@/lib/services/claude-integrations';
import { ClaudeIntegration, ClaudeModel } from '@/types/integrations';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function ClaudeIntegrationCard() {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<ClaudeIntegration | null>(null);
  const [usage, setUsage] = useState<{
    currentUsage: number;
    usageLimit?: number;
    lastUsed?: Date;
  } | null>(null);

  // Form states
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState<ClaudeModel>('claude-3-5-sonnet-20241022');
  const [isActive, setIsActive] = useState(true);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (user?.uid) {
      loadClaudeConfig();
      loadUsage();
    }
  }, [user?.uid]);

  const loadClaudeConfig = async () => {
    try {
      const configData = await ClaudeIntegrationService.getClaudeConfig(user!.uid);
      if (configData) {
        setConfig(configData);
        setIsConnected(true);
        // Nunca mostramos API key almacenada
        setApiKey('');
        setSelectedModel(configData.model);
        setIsActive(configData.isActive);
        setUsageLimit(configData.usageLimit);
      }
    } catch (error) {
      console.error('Error cargando configuración de Claude:', error);
    }
  };

  const loadUsage = async () => {
    try {
      const usageData = await ClaudeIntegrationService.getUsage(user!.uid);
      setUsage(usageData);
    } catch (error) {
      console.error('Error cargando uso de Claude:', error);
    }
  };

  const handleConnect = async () => {
    if (!user?.uid || !apiKey.trim()) return;
    
    setIsLoading(true);
    try {
      // Validar formato de API key
      if (!ClaudeIntegrationService.validateApiKeyFormat(apiKey)) {
        throw new Error('Formato de API key inválido. Debe empezar con "sk-ant-"');
      }

      // Verificar API key
      const verifyResponse = await ClaudeIntegrationService.verifyApiKey(apiKey);
      if (!verifyResponse.valid) {
        throw new Error('API key inválida o no autorizada');
      }

      // Conectar integración
      const newConfig = await ClaudeIntegrationService.connectClaude(
        user.uid,
        apiKey,
        selectedModel
      );
      
      setConfig(newConfig);
      setIsConnected(true);
      
      // Actualizar configuración adicional
      if (usageLimit !== undefined || !isActive) {
        await ClaudeIntegrationService.updateClaudeConfig(user.uid, {
          isActive,
          usageLimit
        });
      }
      
      await loadUsage();
    } catch (error) {
      console.error('Error conectando Claude:', error);
      alert(error instanceof Error ? error.message : 'Error al conectar con Claude');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      await ClaudeIntegrationService.disconnectClaude(user.uid);
      setIsConnected(false);
      setConfig(null);
      setUsage(null);
      setApiKey('');
    } catch (error) {
      console.error('Error desconectando Claude:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<ClaudeIntegration>) => {
    if (!user?.uid || !config) return;
    
    try {
      const updatedConfig = await ClaudeIntegrationService.updateClaudeConfig(user.uid, updates);
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Error actualizando configuración:', error);
    }
  };

  const getRecommendedModel = () => {
    return ClaudeIntegrationService.getRecommendedModel();
  };

  const getSelectedModelInfo = () => {
    return ClaudeIntegrationService.getAvailableModels().find(model => model.id === selectedModel);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Claude AI</CardTitle>
              <CardDescription>Integración con Claude de Anthropic</CardDescription>
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
            {/* Estado y uso */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado</span>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => {
                      setIsActive(checked);
                      updateConfig({ isActive: checked });
                    }}
                  />
                  <span className="text-sm">{isActive ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>

              {usage && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uso actual</span>
                    <span className="font-medium">
                      {usage.currentUsage.toLocaleString()} tokens
                    </span>
                  </div>
                  {usage.usageLimit && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Límite</span>
                      <span className="font-medium">
                        {usage.usageLimit.toLocaleString()} tokens
                      </span>
                    </div>
                  )}
                  {usage.lastUsed && (
                    <div className="text-xs text-gray-500 mt-1">
                      Último uso: {new Date(usage.lastUsed).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              <div className="text-sm">
                <span className="font-medium">Modelo actual: </span>
                {getSelectedModelInfo()?.name}
              </div>
            </div>

            {/* Configuración avanzada */}
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
                  <div className="space-y-2">
                    <Label htmlFor="model-select">Modelo</Label>
                    <Select
                      value={selectedModel}
                      onValueChange={(value: ClaudeModel) => {
                        setSelectedModel(value);
                        updateConfig({ model: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ClaudeIntegrationService.getAvailableModels().map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-gray-500">
                                {model.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usage-limit">Límite de uso (opcional)</Label>
                    <Input
                      id="usage-limit"
                      type="number"
                      placeholder="Ej: 1000000"
                      value={usageLimit || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                        setUsageLimit(value);
                        updateConfig({ usageLimit: value });
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Deja vacío para uso ilimitado
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-3 w-3" />
                    <span>Tu API key está encriptada y segura</span>
                  </div>
                </div>
              )}
            </div>

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
                onClick={() => window.open('https://console.anthropic.com/', '_blank')}
                className="flex items-center space-x-1"
              >
                <Zap className="h-3 w-3" />
                <span>Consola Anthropic</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span>Conecta tu cuenta de Claude para usar IA avanzada</span>
            </div>

            {/* Formulario de conexión */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key de Anthropic</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-ant-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Obtén tu API key en{' '}
                  <button
                    type="button"
                    onClick={() => window.open('https://console.anthropic.com/', '_blank')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    console.anthropic.com
                  </button>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-select">Modelo</Label>
                <Select
                  value={selectedModel}
                  onValueChange={(value: ClaudeModel) => setSelectedModel(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ClaudeIntegrationService.getAvailableModels().map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-gray-500">
                            {model.description}
                          </span>
                          {model.recommended && (
                            <Badge variant="secondary" className="w-fit text-xs mt-1">
                              Recomendado
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Información del modelo seleccionado:</p>
                    <p className="text-xs">
                      {getSelectedModelInfo()?.description}
                    </p>
                    <p className="text-xs mt-1">
                      Precio: {getSelectedModelInfo()?.pricing.input} entrada, {getSelectedModelInfo()?.pricing.output} salida
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading || !apiKey.trim()}
                className="w-full"
              >
                {isLoading ? 'Conectando...' : 'Conectar Claude'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
