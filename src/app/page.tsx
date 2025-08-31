'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink, Settings, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🏠 HomePage - Auth state:', { isAuthenticated, loading, user: user?.email });
    if (!loading && isAuthenticated) {
      console.log('🔄 Redirecting to dashboard...');
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router, user]);

  // Verificar si Firebase está configurado
  const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_firebase_api_key';

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar loading mientras redirige
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">🐙</span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">Bienvenido a Octopus</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              Sistema de gestión de tareas multi-empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isFirebaseConfigured && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuración Requerida</AlertTitle>
                <AlertDescription>
                  Para usar todas las funcionalidades, necesitas configurar Firebase.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              {isFirebaseConfigured ? (
                <Button asChild className="w-full">
                  <Link href="/login">
                    Iniciar Sesión
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild className="w-full">
                    <Link href="https://console.firebase.google.com/" target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Configurar Firebase
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/demo">
                      Ver Demo
                    </Link>
                  </Button>
                </>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Sistema de gestión de tareas moderno y eficiente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
