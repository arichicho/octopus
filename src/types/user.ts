export interface User {
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

export interface UserInviteData {
  email: string;
  companies: Array<{
    companyId: string;
    role: 'admin' | 'editor' | 'viewer';
  }>;
  message?: string;
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksByCompany: Array<{
    companyId: string;
    companyName: string;
    count: number;
  }>;
  averageCompletionTime: number;
  productivityScore: number;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserPermissions {
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;
  canViewAllTasks: boolean;
  canManageUsers: boolean;
  canManageCompany: boolean;
  canViewAnalytics: boolean;
}
