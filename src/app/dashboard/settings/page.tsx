"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Users, Shield, Bell, CreditCard, Settings, Building } from 'lucide-react';

export default function SettingsPage() {
  const settingsItems = [
    {
      title: 'Gestión de Tags',
      description: 'Configura tags predeterminados y personalizados para mejorar la organización',
      href: '/dashboard/settings/tags',
      icon: Tag,
      color: 'text-blue-600'
    },
    {
      title: 'Empresas',
      description: 'Gestiona las empresas y organizaciones',
      href: '/dashboard/settings/companies',
      icon: Building,
      color: 'text-green-600'
    },
    {
      title: 'Integraciones',
      description: 'Configura integraciones con servicios externos',
      href: '/dashboard/settings/integrations',
      icon: Settings,
      color: 'text-purple-600'
    },
    {
      title: 'Equipo',
      description: 'Gestiona miembros del equipo y permisos',
      href: '/dashboard/settings/team',
      icon: Users,
      color: 'text-orange-600'
    },
    {
      title: 'Seguridad',
      description: 'Configuración de seguridad y autenticación',
      href: '/dashboard/settings/security',
      icon: Shield,
      color: 'text-red-600'
    },
    {
      title: 'Notificaciones',
      description: 'Configura cómo recibir notificaciones',
      href: '/dashboard/settings/notifications',
      icon: Bell,
      color: 'text-yellow-600'
    },
    {
      title: 'Facturación',
      description: 'Gestiona tu suscripción y facturación',
      href: '/dashboard/settings/billing',
      icon: CreditCard,
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona la configuración de tu cuenta y preferencias
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconComponent className={`h-6 w-6 ${item.color}`} />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
