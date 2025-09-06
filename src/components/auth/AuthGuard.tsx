'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const AuthGuard = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);

  // Deshabilitado modo demo - siempre requiere autenticación
  const isDemoMode = false;

  useEffect(() => {
    if (redirectingRef.current || loading || isDemoMode) return;

    // Evitar loops: no redirigir si ya estamos en el destino
    if (requireAuth && !isAuthenticated) {
      if (pathname !== redirectTo) {
        redirectingRef.current = true;
        router.push(redirectTo);
      }
    } else if (!requireAuth && isAuthenticated) {
      if (pathname !== '/dashboard') {
        redirectingRef.current = true;
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router, isDemoMode, pathname]);

  if (loading && !isDemoMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated && !isDemoMode) {
    return null;
  }

  if (!requireAuth && isAuthenticated && !isDemoMode) {
    return null;
  }

  return <>{children}</>;
};
