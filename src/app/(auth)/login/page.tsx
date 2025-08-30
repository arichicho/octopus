'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">🐙</span>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Bienvenido a Octopus</CardTitle>
                <CardDescription className="text-base mt-2">
                  Sistema de gestión de tareas multi-empresa
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Inicia sesión para acceder a tu dashboard
                </p>
                <GoogleSignInButton className="w-full">
                  Continuar con Google
                </GoogleSignInButton>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Al continuar, aceptas nuestros{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Términos de Servicio
                  </a>{' '}
                  y{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Política de Privacidad
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Tienes una invitación?{' '}
              <Link href="/invite" className="text-blue-600 hover:underline font-medium">
                Únete a tu empresa
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
