'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCompanyStore } from '@/lib/store/useCompanyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Bell, 
  Plus, 
  Settings, 
  LogOut, 
  User,
  Command
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Usuario Demo</span>
        </div>
      </div>
    </header>
  );
};
