export interface Company {
  id: string;
  name: string;
  color: string;
  settings: CompanySettings;
  createdAt: Date;
  ownerId: string;
  updatedAt?: Date;
}

export interface CompanySettings {
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    dailyDigest: boolean;
  };
  permissions: {
    allowPublicTasks: boolean;
    requireApproval: boolean;
    autoAssign: boolean;
  };
  integrations: {
    googleCalendar: boolean;
    googleDrive: boolean;
    gmail: boolean;
    slack: boolean;
  };
}

export interface CompanyFormData {
  name: string;
  color: string;
  settings: Partial<CompanySettings>;
}

export interface CompanyStats {
  totalTasks: number;
  activeUsers: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: Array<{
    status: string;
    count: number;
  }>;
  tasksByPriority: Array<{
    priority: string;
    count: number;
  }>;
}

export interface CompanyMember {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive';
}

export interface CompanyInvitation {
  id: string;
  companyId: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  token: string;
}
