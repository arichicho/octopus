'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { isEmailAuthorized } from '@/lib/auth/authorizedEmails';
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
      if (user && !isEmailAuthorized(user.email)) {
        console.warn('Usuario no autorizado después del login:', user.email);
        window.location.href = '/unauthorized';
        return;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
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
