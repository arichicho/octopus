'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldX, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-red-600">Acceso Denegado</CardTitle>
              <CardDescription className="text-base mt-2">
                Tu cuenta no tiene autorización para acceder a esta aplicación
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>Usuario No Autorizado</AlertTitle>
              <AlertDescription>
                Solo usuarios autorizados por el administrador pueden acceder al sistema.
                Si necesitas acceso, contacta al administrador.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Si crees que esto es un error o necesitas acceso, por favor contacta al administrador del sistema.
                </p>
              </div>
              
              <Button asChild className="w-full" variant="outline">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Inicio
                </Link>
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Para obtener acceso, proporciona tu email al administrador
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}