'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings } from 'lucide-react';
import { validateIntegrationsConfig } from '@/lib/config/integrations';

export default function IntegrationConfigAlert() {
  const configValidation = validateIntegrationsConfig();

  if (configValidation.isValid) {
    return null;
  }

  return (
    <Alert className="border-orange-200 dark:border-orange-800">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle>Configuración de integraciones incompleta</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Algunas integraciones no están configuradas correctamente. 
          Para usar todas las funcionalidades, configura las siguientes variables de entorno:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1">
          {configValidation.errors.map((error, index) => (
            <li key={index} className="text-orange-700 dark:text-orange-300">
              {error}
            </li>
          ))}
        </ul>
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/docs/INTEGRATIONS.md', '_blank')}
          >
            Ver Documentación
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
          >
            Google Cloud Console
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://console.anthropic.com/', '_blank')}
          >
            Anthropic Console
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
