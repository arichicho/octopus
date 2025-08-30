import { User as FirebaseUser } from 'firebase/auth';

export interface AuthUser extends FirebaseUser {
  // Extended Firebase user properties can be added here
  customProperty?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  companies: Array<{
    companyId: string;
    role: 'admin' | 'editor' | 'viewer';
  }>;
  timezone: string;
  preferences: UserPreferences;
  lastActive: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
  invitedBy?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  language: 'es' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    dailyDigest: boolean;
    meetingReminders: boolean;
  };
  dashboard: {
    defaultView: 'my-day' | 'executive' | 'workflow';
    showCompletedTasks: boolean;
    autoRefresh: boolean;
  };
}

export interface Invitation {
  id: string;
  email: string;
  companies: Array<{
    companyId: string;
    role: 'admin' | 'editor' | 'viewer';
  }>;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface CompanyAccess {
  companyId: string;
  role: UserRole;
  permissions: string[];
}
