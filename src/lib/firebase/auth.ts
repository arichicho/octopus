import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithCustomToken,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from './config';

// Create Google provider for Firebase Auth
let googleProvider: GoogleAuthProvider | null = null;
try {
  if (auth) {
    googleProvider = new GoogleAuthProvider();
  }
} catch (error) {
  console.warn('Google Auth Provider not initialized:', error);
}

export const signInWithGoogle = async () => {
  try {
    if (!auth || !googleProvider) {
      throw new Error('Firebase Auth not configured properly');
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { user: null, error: error as Error };
  }
};

export const signOutUser = async () => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not configured properly');
    }
    
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error as Error };
  }
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  try {
    if (!auth) {
      console.error('Firebase Auth not configured');
      setTimeout(() => callback(null), 0);
      return () => {};
    }
    
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.error('Error setting up auth state listener:', error);
    setTimeout(() => callback(null), 0);
    return () => {};
  }
};

export const signInWithCustom = async (customToken: string) => {
  try {
    if (!auth) throw new Error('Firebase Auth not configured properly');
    const result = await signInWithCustomToken(auth, customToken);
    return { user: result.user, error: null };
  } catch (error) {
    console.error('Error signing in with custom token:', error);
    return { user: null, error: error as Error };
  }
};

export { auth };
