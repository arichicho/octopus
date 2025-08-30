'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ExternalLink, Settings } from 'lucide-react';
import Link from 'next/link';

export const FirebaseConfigAlert = () => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">Firebase No Configurado</CardTitle>
          <CardDescription>
            Para usar todas las funcionalidades, necesitas configurar Firebase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Modo Demo</AlertTitle>
            <AlertDescription>
              El sistema está ejecutándose en modo demo. Algunas funcionalidades no estarán disponibles.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h4 className="font-medium">Para configurar Firebase:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Crea un proyecto en Firebase Console</li>
              <li>2. Habilita Authentication con Google</li>
              <li>3. Crea una base de datos Firestore</li>
              <li>4. Copia las credenciales a .env.local</li>
            </ol>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="https://console.firebase.google.com/" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir a Firebase Console
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Link>
            </Button>
          </div>
          
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => window.location.reload()}
              className="text-sm"
            >
              Continuar en modo demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
