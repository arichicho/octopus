import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { signInWithGoogle, signOutUser, onAuthStateChange } from '../firebase/auth';
import { getUserByEmail, createUser, updateUser } from '../firebase/firestore';
import { User } from '../firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { auth } from '../firebase/config';
import { isEmailAuthorized } from '../auth/authorizedEmails';

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
    
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔐 Usuario loggeado:', firebaseUser.email);
        
        // Verificar si el email está autorizado
        if (!isEmailAuthorized(firebaseUser.email)) {
          console.warn('❌ Usuario no autorizado:', firebaseUser.email);
          console.log('📋 Emails autorizados:', ['ariel.chicho@daleplayrecords.com']);
          await signOutUser(); // Cerrar sesión inmediatamente
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          // Redirigir a página de no autorizado
          window.location.href = '/unauthorized';
          return;
        }
        
        console.log('✅ Usuario autorizado:', firebaseUser.email);

        setUser(firebaseUser);
        
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
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
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
