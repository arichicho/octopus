import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../firebase/firestore';

interface AuthState {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setUserProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userProfile: null,
  loading: true,
  isAuthenticated: false,
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    loading: false 
  }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ 
    user: null, 
    userProfile: null, 
    isAuthenticated: false,
    loading: false 
  }),
}));
