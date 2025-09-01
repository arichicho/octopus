'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users,
  Bell,
  Shield,
  Zap,
  CreditCard,
  Database
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Configuración
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona la configuración de tu cuenta y aplicación
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Perfil</CardTitle>
                <CardDescription>Información personal</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Actualiza tu información personal y preferencias
            </p>
            <Button variant="outline" className="w-full">
              Editar Perfil
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Notificaciones</CardTitle>
                <CardDescription>Preferencias de alertas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm">Notificaciones activas</span>
              <Badge variant="secondary">3</Badge>
            </div>
            <Button variant="outline" className="w-full">
              Configurar
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Seguridad</CardTitle>
                <CardDescription>Contraseña y acceso</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Gestiona la seguridad de tu cuenta
            </p>
            <Button variant="outline" className="w-full">
              Cambiar Contraseña
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Integraciones</CardTitle>
                <CardDescription>Conecta servicios externos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Conecta con Google Calendar, Slack, etc.
            </p>
            <Button variant="outline" className="w-full">
              Gestionar
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Facturación</CardTitle>
                <CardDescription>Plan y pagos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm">Plan actual</span>
              <Badge variant="default">Pro</Badge>
            </div>
            <Button variant="outline" className="w-full">
              Ver Detalles
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-lg">API</CardTitle>
                <CardDescription>Claves y tokens</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Gestiona tus claves de API
            </p>
            <Button variant="outline" className="w-full">
              Ver Claves
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
