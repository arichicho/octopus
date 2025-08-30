'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  // Deshabilitado modo demo - siempre requiere autenticación
  const isDemoMode = false;

  useEffect(() => {
    if (!loading && !isDemoMode) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router, isDemoMode]);

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
