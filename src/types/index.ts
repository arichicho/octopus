export * from './auth';
export * from './task';
export * from './company';
export type { User, UserInviteData, UserStats, UserPermissions } from './user';

// Common types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationParams;
}

// Dashboard types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksByCompany: Array<{
    companyId: string;
    companyName: string;
    count: number;
  }>;
  tasksByPriority: Array<{
    priority: string;
    count: number;
  }>;
  tasksByStatus: Array<{
    status: string;
    count: number;
  }>;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_due' | 'task_completed' | 'invitation' | 'mention';
  title: string;
  message: string;
  taskId?: string;
  companyId?: string;
  read: boolean;
  createdAt: Date;
}

// Webhook types
export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

// API Key types
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rateLimit: number;
  active: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

// Integration types
export interface GoogleIntegration {
  calendar: boolean;
  drive: boolean;
  gmail: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface ClaudeIntegration {
  apiKey?: string;
  enabled: boolean;
  model: string;
  maxTokens: number;
}

// Settings types
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

// Form types
export interface TaskFormData {
  title: string;
  description: string;
  companyId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignedTo: string[];
  dueDate?: Date;
  tags: string[];
  parentTaskId?: string;
}

export interface CompanyFormData {
  name: string;
  color: string;
  settings: Record<string, unknown>;
}

export interface UserInviteData {
  email: string;
  companies: Array<{
    companyId: string;
    role: 'admin' | 'editor' | 'viewer';
  }>;
  message?: string;
}

// Filter types
export interface TaskFilters {
  companyId?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  tags?: string[];
  search?: string;
}

// Search types
export interface SearchResult {
  type: 'task' | 'company' | 'person' | 'user';
  id: string;
  title: string;
  description?: string;
  companyId?: string;
  companyName?: string;
  url: string;
}
