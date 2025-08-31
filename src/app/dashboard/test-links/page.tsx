'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestLinksPage() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);

  const links = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Mi Día', href: '/dashboard/my-day' },
    { name: 'Tareas', href: '/dashboard/tasks' },
    { name: 'Historial', href: '/dashboard/history' },
    { name: 'Empresas', href: '/dashboard/companies' },
    { name: 'Calendario', href: '/dashboard/calendar' },
    { name: 'Reportes', href: '/dashboard/reports' },
    { name: 'Métricas', href: '/dashboard/metrics' },
    { name: 'KPIs', href: '/dashboard/kpis' },
    { name: 'Equipo', href: '/dashboard/team' },
    { name: 'Proyectos', href: '/dashboard/projects' },
    { name: 'Documentos', href: '/dashboard/documents' },
    { name: 'Configuración', href: '/dashboard/settings' },
    { name: 'Perfil', href: '/dashboard/settings/profile' },
    { name: 'Notificaciones', href: '/dashboard/settings/notifications' },
    { name: 'Seguridad', href: '/dashboard/settings/security' },
    { name: 'Integraciones', href: '/dashboard/settings/integrations' },
    { name: 'Facturación', href: '/dashboard/settings/billing' },
    { name: 'API', href: '/dashboard/settings/api' },
    { name: 'Empresas Config', href: '/dashboard/settings/companies' },
  ];

  const testLinks = async () => {
    setIsTesting(true);
    const results: Record<string, boolean> = {};

    for (const link of links) {
      try {
        const response = await fetch(link.href, { method: 'HEAD' });
        results[link.name] = response.ok;
      } catch (error) {
        results[link.name] = false;
      }
    }

    setTestResults(results);
    setIsTesting(false);
  };

  useEffect(() => {
    testLinks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prueba de Links del Sidebar</h1>
        <Button onClick={testLinks} disabled={isTesting}>
          {isTesting ? 'Probando...' : 'Probar de Nuevo'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados de la Prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <div
                key={link.name}
                className={`p-4 rounded-lg border ${
                  testResults[link.name] === true
                    ? 'border-green-200 bg-green-50'
                    : testResults[link.name] === false
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{link.name}</h3>
                    <p className="text-sm text-gray-600">{link.href}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {testResults[link.name] === true && (
                      <span className="text-green-600">✅</span>
                    )}
                    {testResults[link.name] === false && (
                      <span className="text-red-600">❌</span>
                    )}
                    {testResults[link.name] === undefined && (
                      <span className="text-gray-400">⏳</span>
                    )}
                    <Link href={link.href}>
                      <Button variant="outline" size="sm">
                        Probar
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>URL Actual:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
            <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
