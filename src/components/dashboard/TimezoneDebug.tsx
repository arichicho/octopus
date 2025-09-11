"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useTimezone } from '@/hooks/useTimezone';

interface TimezoneDebugProps {
  className?: string;
}

export function TimezoneDebug({ className }: TimezoneDebugProps) {
  const { timezone, getTimezoneInfo, formatDateInTimezone, getCurrentDateInTimezone } = useTimezone();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const info = getTimezoneInfo();
    setDebugInfo(info);
  }, [timezone, getTimezoneInfo]);

  if (!debugInfo) return null;

  // Test dates
  const now = new Date();
  const tomorrow8amMexico = new Date();
  tomorrow8amMexico.setDate(tomorrow8amMexico.getDate() + 1);
  tomorrow8amMexico.setHours(8, 0, 0, 0); // 8 AM local time

  // Convert to Mexico timezone
  const mexicoTime = new Date(tomorrow8amMexico.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  
  // Current date in user's timezone
  const userToday = timezone ? new Date(now.toLocaleString('en-US', { timeZone: timezone })) : now;
  const userTodayStr = userToday.toISOString().split('T')[0];
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            Debug Zona Horaria
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Información actual */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Zona Horaria Actual</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium">{debugInfo.timezoneOption?.label || timezone}</div>
              <div className="text-xs text-gray-500">Offset: {debugInfo.offset}</div>
              <div className="text-xs text-gray-500">Hora actual: {debugInfo.currentTime}</div>
            </div>
          </div>

          {/* Test de conversión */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Test de Conversión - Obel Ejecutivo</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
                <div className="font-medium">"Obel Ejecutivo" mañana 8am México</div>
                <div>UTC: {tomorrow8amMexico.toISOString()}</div>
                <div>México: {mexicoTime.toLocaleString('es-ES', { timeZone: 'America/Mexico_City' })}</div>
                <div>Tu zona: {formatDateInTimezone(tomorrow8amMexico, { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}</div>
                <div className="pt-2 border-t mt-2">
                  <div className="font-medium">Conversión de horario:</div>
                  <div>8:00 AM México → {timezone ? new Date(tomorrow8amMexico).toLocaleTimeString('es-ES', { 
                    timeZone: timezone, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'N/A'} en tu zona</div>
                </div>
              </div>
            </div>
          </div>

          {/* Información del navegador */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Información del Navegador</span>
            </div>
            <div className="space-y-1 text-xs">
              <div>Zona horaria detectada: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
              <div>Offset del navegador: {now.getTimezoneOffset()} minutos</div>
              <div>Hora UTC: {now.toISOString()}</div>
              <div>Hora local: {now.toLocaleString('es-ES')}</div>
              <div className="pt-2 border-t">
                <div className="font-medium">Fechas generadas:</div>
                <div>Hoy en tu zona: {userTodayStr}</div>
                <div>Hoy UTC: {now.toISOString().split('T')[0]}</div>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Si "Obel Ejecutivo" no aparece a las 8am, hay un problema de conversión</div>
              <div>• Verifica que la zona horaria esté configurada correctamente</div>
              <div>• Los eventos de Google Calendar deben mostrarse en tu zona horaria</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
