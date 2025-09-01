"use client";

import IntegrationConfigAlert from '@/components/integrations/IntegrationConfigAlert';
import GoogleIntegrationCard from '@/components/integrations/GoogleIntegrationCard';
import ClaudeIntegrationCard from '@/components/integrations/ClaudeIntegrationCard';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useEffect, useState } from 'react';
import { GoogleIntegrationService } from '@/lib/services/google-integrations';
import { Badge } from '@/components/ui/badge';

function IntegrationsOverview() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<{ gmail: boolean; calendar: boolean; drive: boolean; claude: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;
    if (user?.uid) {
      GoogleIntegrationService.getIntegrationStatus(user.uid)
        .then((s) => mounted && setStatus(s))
        .catch(() => mounted && setStatus({ gmail: false, calendar: false, drive: false, claude: false }));
    }
    return () => { mounted = false; };
  }, [user?.uid]);

  const connected = status ? Object.values(status).filter(Boolean).length : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 text-lg">⚡</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Estado General</h3>
            <p className="text-sm text-gray-500">Resumen de todas las integraciones</p>
          </div>
        </div>
        <Badge variant="outline">{connected} conectadas</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Gmail','Calendar','Drive','Claude'].map((name, i) => {
          const key = ['gmail','calendar','drive','claude'][i] as 'gmail'|'calendar'|'drive'|'claude';
          const on = status?.[key];
          return (
            <div key={key} className="flex items-center space-x-2">
              <span className="text-gray-400">{key === 'gmail' ? '📧' : key === 'calendar' ? '📅' : key === 'drive' ? '📁' : '🤖'}</span>
              <span className="text-sm">{name}</span>
              <span className={`px-2 py-1 rounded text-xs ml-auto ${on ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                {on ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IntegrationsClient() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Integraciones</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Conecta con otras herramientas y servicios</p>
      </div>

      <IntegrationConfigAlert />
      <IntegrationsOverview />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Integraciones de Google</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GoogleIntegrationCard type="gmail" />
          <GoogleIntegrationCard type="calendar" />
          <GoogleIntegrationCard type="drive" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Inteligencia Artificial</h3>
        <ClaudeIntegrationCard />
      </div>
    </div>
  );
}

