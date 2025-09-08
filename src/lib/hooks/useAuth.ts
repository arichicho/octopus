import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { signInWithGoogle, signOutUser, onAuthStateChange } from '../firebase/auth';
import { getUserByEmail, createUser, updateUser } from '../firebase/firestore';
import { User } from '../firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { auth } from '../firebase/config';
// Usa lista de emails autorizados desde variables de entorno (cliente)
import { checkAuthorization } from '../auth/authorization';
const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

export const useAuth = () => {
  const { 
    user, 
    userProfile, 
    loading, 
    isAuthenticated, 
    setUser, 
    setUserProfile, 
    setLoading, 
    logout 
  } = useAuthStore();

  useEffect(() => {
    // Verificar si Firebase está configurado
    if (!auth) {
      console.error('Firebase Auth not configured');
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        console.log('🔐 Usuario loggeado:', firebaseUser.email);
        
        // Verificar si el email está autorizado (respetando bypass)
        if (!BYPASS_AUTH && !checkAuthorization(firebaseUser.email)) {
          console.warn('❌ Usuario no autorizado:', firebaseUser.email);
          console.log('📋 Emails autorizados:', ['ariel.chicho@daleplayrecords.com']);
          signOutUser(); // Cerrar sesión inmediatamente
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          // Redirigir a página de no autorizado
          window.location.href = '/unauthorized';
          return;
        }
        if (BYPASS_AUTH) {
          console.log('🟢 BYPASS_AUTH activo. Acceso permitido a:', firebaseUser.email);
        }

        console.log('✅ Usuario autorizado:', firebaseUser.email);

        setUser(firebaseUser);

        // Ensure a server session cookie exists for API routes
        firebaseUser.getIdToken().then((token) => {
          fetch('/api/auth/session/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ idToken: token, expiresInDays: 7 }),
          }).catch((e) => console.warn('Failed to establish server session cookie', e));
        }).catch(() => {});
        
        // Cargar perfil de usuario de forma asíncrona
        const loadUserProfile = async () => {
          try {
            // Check if user profile exists in Firestore
            const existingUser = await getUserByEmail(firebaseUser.email!);
            
            if (existingUser) {
              setUserProfile(existingUser);
              // Update last active
              await updateUser(existingUser.id!, { lastActive: Timestamp.now() });
            } else {
              // Create new user profile
              const newUser: Omit<User, 'id' | 'createdAt'> = {
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || '',
                photoURL: firebaseUser.photoURL || '',
                companies: [],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                preferences: {
                  theme: 'system',
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  language: 'es',
                  notifications: {
                    email: true,
                    push: true,
                    dailyDigest: true,
                    meetingReminders: true,
                  },
                  dashboard: {
                    defaultView: 'my-day',
                    showCompletedTasks: false,
                    autoRefresh: true,
                  },
                },
                lastActive: Timestamp.now(),
                status: 'active',
              };
              
              const { id, data } = await createUser(newUser);
              setUserProfile({ ...data, id });
            }
          } catch (error) {
            console.error('Error al cargar perfil de usuario:', error);
          } finally {
            setLoading(false);
          }
        };
        
        loadUserProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        // Clear server session
        fetch('/api/auth/session/logout', { method: 'POST' }).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading]);

  const signIn = async () => {
    setLoading(true);
    const { user, error } = await signInWithGoogle();
    if (error) {
      setLoading(false);
      throw error;
    }
    return user;
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await signOutUser();
    if (error) {
      setLoading(false);
      throw error;
    }
    logout();
  };

  return {
    user,
    userProfile,
    loading,
    isAuthenticated,
    signIn,
    signOut,
  };
};
