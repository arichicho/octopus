"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Clock, MapPin } from 'lucide-react';
import { TimezoneSelector } from '@/components/common/TimezoneSelector';
import { useTimezone } from '@/hooks/useTimezone';

interface MyDaySettingsProps {
  className?: string;
}

export function MyDaySettings({ className }: MyDaySettingsProps) {
  const { timezone, getTimezoneInfo } = useTimezone();
  const [isExpanded, setIsExpanded] = useState(false);

  const timezoneInfo = getTimezoneInfo();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración de Mi Día
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
          {/* Zona Horaria */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Zona Horaria</span>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {timezoneInfo?.timezoneOption?.label || timezone}
                </div>
                <div className="text-xs text-gray-500">
                  {timezoneInfo?.currentTime}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {timezoneInfo?.offset}
              </Badge>
            </div>
            
            <TimezoneSelector showCard={false} />
          </div>

          {/* Información adicional */}
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Los horarios se mostrarán en tu zona horaria local</div>
              <div>• Los planes se generan considerando tu ubicación</div>
              <div>• Puedes cambiar la zona horaria en cualquier momento</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}







