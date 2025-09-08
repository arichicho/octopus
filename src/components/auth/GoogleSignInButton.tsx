'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { signInWithCustom } from '@/lib/firebase/auth';
import { getAuthorizedEmails } from '@/lib/auth/authorization';
import { checkAuthorization } from '@/lib/auth/authorization';
const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
import { Chrome } from 'lucide-react';

interface GoogleSignInButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const GoogleSignInButton = ({ className, children }: GoogleSignInButtonProps) => {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const user = await signIn();
      
      // Verificar autorización después del login
      if (user && !BYPASS_AUTH && !(await checkAuthorization(user.email))) {
        console.warn('Usuario no autorizado después del login:', user.email);
        window.location.href = '/unauthorized';
        return;
      }
      if (BYPASS_AUTH) {
        console.log('🟢 BYPASS_AUTH activo post-login. Acceso permitido a:', user?.email);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);

      // Fallback Dev Login (custom token) — gated by env flag
      const enableDev = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';
      if (enableDev) {
        try {
          const list = getAuthorizedEmails();
          const email = list[0] || 'dev@example.com';
          const headers: Record<string,string> = { 'Content-Type': 'application/json' };
          const devSecret = process.env.NEXT_PUBLIC_DEV_LOGIN_TOKEN;
          if (devSecret) headers['x-dev-login-secret'] = devSecret;
          const res = await fetch('/api/auth/dev-login', { method: 'POST', headers, body: JSON.stringify({ email }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Dev login failed');
          const { user: devUser, error: devErr } = await signInWithCustom(data.customToken);
          if (devErr) throw devErr;
          console.log('✅ Signed in via Dev Login as', devUser?.email || email);
        } catch (e) {
          console.error('Dev login failed:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      className={className}
      variant="outline"
      size="lg"
    >
      <Chrome className="mr-2 h-4 w-4" />
      {isLoading ? 'Iniciando sesión...' : children || 'Continuar con Google'}
    </Button>
  );
};
