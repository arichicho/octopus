export interface GoogleIntegration {
  id: string;
  userId: string;
  companyId?: string;
  type: 'gmail' | 'calendar' | 'drive';
  status: 'connected' | 'disconnected' | 'error';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationStatus {
  gmail: boolean;
  calendar: boolean;
  drive: boolean;
  claude: boolean;
}

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: {
    gmail: string[];
    calendar: string[];
    drive: string[];
  };
}

export interface GmailIntegration {
  id: string;
  email: string;
  labels: string[];
  lastMessageId?: string;
  syncEnabled: boolean;
}

export interface CalendarIntegration {
  id: string;
  calendarId: string;
  name: string;
  primary: boolean;
  syncEnabled: boolean;
  eventSync: 'all' | 'selected' | 'none';
}

export interface DriveIntegration {
  id: string;
  folderId?: string;
  folderName?: string;
  syncEnabled: boolean;
  autoSync: boolean;
}

export interface ClaudeIntegration {
  id: string;
  userId: string;
  companyId?: string;
  apiKey: string;
  model: ClaudeModel;
  status: 'connected' | 'disconnected' | 'error';
  isActive: boolean;
  usageLimit?: number;
  currentUsage?: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ClaudeModel = 
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  | 'claude-2.1'
  | 'claude-2.0'
  | 'claude-instant-1.2';

export interface ClaudeModelInfo {
  id: ClaudeModel;
  name: string;
  description: string;
  maxTokens: number;
  pricing: {
    input: string;
    output: string;
  };
  capabilities: string[];
  recommended: boolean;
}
