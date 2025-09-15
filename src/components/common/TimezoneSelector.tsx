"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, Settings } from 'lucide-react';
import { useTimezone, type TimezoneOption } from '@/hooks/useTimezone';

interface TimezoneSelectorProps {
  className?: string;
  showCard?: boolean;
  compact?: boolean;
}

export function TimezoneSelector({ className, showCard = true, compact = false }: TimezoneSelectorProps) {
  const { timezone, isLoading, changeTimezone, getTimezoneInfo, timezoneOptions } = useTimezone();
  const [isOpen, setIsOpen] = useState(false);

  const timezoneInfo = getTimezoneInfo();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-500">Detectando zona horaria...</span>
      </div>
    );
  }

  const handleTimezoneChange = (newTimezone: string) => {
    changeTimezone(newTimezone);
    setIsOpen(false);
  };

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-gray-500" />
        <div className="flex flex-col">
          <div className="text-sm font-medium">
            {timezoneInfo?.timezoneOption?.label || timezone}
          </div>
          {!compact && (
            <div className="text-xs text-gray-500">
              {timezoneInfo?.currentTime}
            </div>
          )}
        </div>
      </div>
      
      <Select value={timezone} onValueChange={handleTimezoneChange}>
        <SelectTrigger className="w-auto min-w-[200px]">
          <SelectValue placeholder="Seleccionar zona horaria" />
        </SelectTrigger>
        <SelectContent>
          {timezoneOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {option.offset}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" />
            Zona Horaria
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

// Componente compacto para usar en headers
export function TimezoneSelectorCompact({ className }: { className?: string }) {
  const { timezone, isLoading, changeTimezone, getTimezoneInfo, timezoneOptions } = useTimezone();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Clock className="w-3 h-3 animate-spin" />
        <span className="text-xs text-gray-500">Detectando...</span>
      </div>
    );
  }

  const timezoneInfo = getTimezoneInfo();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MapPin className="w-3 h-3 text-gray-500" />
      <Select value={timezone} onValueChange={changeTimezone}>
        <SelectTrigger className="w-auto h-8 text-xs">
          <SelectValue>
            {timezoneInfo?.timezoneOption?.label || timezone}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {timezoneOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between w-full">
                <span className="text-xs">{option.label}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {option.offset}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}



