export interface Task {
  id: string;
  title: string;
  description: string;
  companyId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string[];
  dueDate: Date;
  progress: number;
  tags: string[];
  linkedDocs: string[];
  linkedEvents: string[];
  parentTaskId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface TaskFormData {
  title: string;
  description: string;
  companyId: string;
  priority: TaskPriority;
  assignedTo: string[];
  dueDate?: Date;
  tags: string[];
  parentTaskId?: string;
}

export interface TaskFilters {
  companyId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  tags?: string[];
  search?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  changes: Record<string, unknown>;
  timestamp: Date;
}

export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
