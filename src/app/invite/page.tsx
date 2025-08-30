'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { validateInvitation, acceptInvitation } from '@/lib/services/invitations';
import { useAuth } from '@/lib/hooks/useAuth';
import { Invitation } from '@/lib/firebase/firestore';

function InvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const token = searchParams.get('token') as string;

  useEffect(() => {
    const validateInvitationToken = async () => {
      try {
        setLoading(true);
        const invitationData = await validateInvitation(token);
        setInvitation(invitationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al validar la invitación');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateInvitationToken();
    }
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!user || !invitation) return;

    try {
      setAccepting(true);
      await acceptInvitation(token, user.uid);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aceptar la invitación');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Validando invitación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Invitación Inválida</CardTitle>
            <CardDescription className="text-red-500">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">¡Invitación Válida!</CardTitle>
          <CardDescription>
            Has sido invitado a unirte a Octopus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Email invitado:
            </p>
            <p className="font-medium">{invitation.email}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Empresa y rol:
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{invitation.companyId}</span>
                <Badge variant="secondary">{invitation.role}</Badge>
              </div>
            </div>
          </div>

          {isAuthenticated ? (
            <Button 
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aceptando...
                </>
              ) : (
                'Aceptar Invitación'
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Inicia sesión para aceptar la invitación
              </p>
              <GoogleSignInButton className="w-full">
                Continuar con Google
              </GoogleSignInButton>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  );
}