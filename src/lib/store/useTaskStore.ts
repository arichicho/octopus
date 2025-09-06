import { create } from 'zustand';
import { Task, createTask as createTaskFirestore, updateTask as updateTaskFirestore, deleteTask as deleteTaskFirestore, getDocuments } from '../firebase/firestore';

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  loading: boolean;
  filters: {
    companyId?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
  };
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  loadTasks: (userId?: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TaskState['filters']>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  applyFilters: () => void;
  changeTaskPriority: (taskId: string, newPriority: "urgent" | "high" | "medium" | "low") => Promise<{ success: boolean; taskTitle: string; newPriority: string; oldPriority: string }>;
  changeTaskStatus: (taskId: string, newStatus: "pending" | "in_progress" | "completed" | "cancelled") => Promise<{ success: boolean; taskTitle: string; newStatus: string; oldStatus: string }>;
  changeTaskAssignment: (taskId: string, newAssignedTo: string[] | null) => Promise<{ success: boolean; taskTitle: string; newAssignedTo: string[] | null; oldAssignedTo: string[] }>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  filteredTasks: [],
  loading: false,
  filters: {},
  setTasks: (tasks) => set({ tasks, filteredTasks: tasks }),
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task],
    filteredTasks: [...state.filteredTasks, task]
  })),
  loadTasks: async (userId) => {
    try {
      set({ loading: true });
      console.log('📥 Loading tasks for user:', userId);
      
      let tasks: Task[] = [];
      
      if (userId) {
        // Try multiple approaches to find tasks
        const searchStrategies = [
          // Strategy 1: Direct UID match
          { field: 'createdBy', operator: '==', value: userId },
          // Strategy 2: Email match (if userId is email)
          { field: 'createdBy', operator: '==', value: userId },
          // Strategy 3: Current user fallback
          { field: 'createdBy', operator: '==', value: 'current-user' }
        ];
        
        for (const strategy of searchStrategies) {
          const conditions = [strategy];
          const foundTasks = await getDocuments<Task>('tasks', conditions);
          tasks = [...tasks, ...foundTasks];
          console.log(`📋 Found tasks with strategy ${strategy.value}:`, foundTasks.length);
          
          if (foundTasks.length > 0) {
            break; // Stop at first successful strategy
          }
        }
        
        // Remove duplicates based on task ID
        const uniqueTasks = tasks.filter((task, index, self) => 
          index === self.findIndex(t => t.id === task.id)
        );
        tasks = uniqueTasks;
        
      } else {
        // If no userId, return empty array (no tasks)
        console.log('⚠️ No userId provided, returning empty tasks array');
        tasks = [];
      }
      
      console.log('✅ Total loaded tasks:', tasks.length);
      set({ tasks, filteredTasks: tasks });
      get().applyFilters();
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
    } finally {
      set({ loading: false });
    }
  },
  createTask: async (taskData) => {
    try {
      console.log('📝 [TaskStore] Creating task with data:', taskData);
      const { id, data } = await createTaskFirestore(taskData);
      console.log('✅ [TaskStore] Task created in Firestore:', { id, data });
      
      const newTask: Task = { ...data, id };
      
      set((state) => ({ 
        tasks: [...state.tasks, newTask],
        filteredTasks: [...state.filteredTasks, newTask]
      }));
      
      console.log('✅ [TaskStore] Task added to store, total tasks:', get().tasks.length);
      get().applyFilters();
      
      // Return the created task
      return newTask;
    } catch (error) {
      console.error('❌ [TaskStore] Error creating task:', error);
      throw error;
    }
  },
  updateTask: async (id, updates) => {
    try {
      await updateTaskFirestore(id, updates);
      
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        ),
        filteredTasks: state.filteredTasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      }));
      
      get().applyFilters();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Método específico para drag & drop con optimistic updates
  moveTaskToWeek: async (taskId: string, newDueDate: Date | null) => {
    console.log('🔄 TaskStore: Moving task', taskId, 'to date:', newDueDate);
    
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('❌ TaskStore: Task not found:', taskId);
      throw new Error('Task not found');
    }

    console.log('🔄 TaskStore: Found task:', task.title, 'current date:', task.dueDate);

    // Optimistic update
    const optimisticUpdate = { dueDate: newDueDate };
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, ...optimisticUpdate } : t
      ),
      filteredTasks: state.filteredTasks.map(t => 
        t.id === taskId ? { ...t, ...optimisticUpdate } : t
      )
    }));

    console.log('🔄 TaskStore: Applied optimistic update');

    try {
      // Actualizar en Firestore
      await updateTaskFirestore(taskId, optimisticUpdate);
      console.log('✅ TaskStore: Task moved successfully:', { taskId, newDueDate });
      
      // Re-aplicar filtros después de la actualización
      get().applyFilters();
      
      // Retornar información para notificación
      return {
        success: true,
        taskTitle: task.title,
        newDueDate,
        oldDueDate: task.dueDate
      };
    } catch (error) {
      console.error('❌ TaskStore: Error moving task:', error);
      
      // Rollback en caso de error
      set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === taskId ? { ...t, dueDate: task.dueDate } : t
        ),
        filteredTasks: state.filteredTasks.map(t => 
          t.id === taskId ? { ...t, dueDate: task.dueDate } : t
        )
      }));
      
      console.log('🔄 TaskStore: Applied rollback due to error');
      throw error;
    }
  },

  // Método para cambiar prioridad con drag & drop
  changeTaskPriority: async (taskId: string, newPriority: "urgent" | "high" | "medium" | "low") => {
    console.log('🔄 TaskStore: Changing task priority', taskId, 'to:', newPriority);
    
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('❌ TaskStore: Task not found:', taskId);
      throw new Error('Task not found');
    }

    console.log('🔄 TaskStore: Found task:', task.title, 'current priority:', task.priority);

    // Optimistic update
    const optimisticUpdate = { priority: newPriority };
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, priority: newPriority } : t
      ),
      filteredTasks: state.filteredTasks.map(t => 
        t.id === taskId ? { ...t, priority: newPriority } : t
      )
    }));

    console.log('🔄 TaskStore: Applied optimistic update for priority');

    try {
      // Actualizar en Firestore
      await updateTaskFirestore(taskId, optimisticUpdate);
      console.log('✅ TaskStore: Task priority changed successfully:', { taskId, newPriority });
      
      // Re-aplicar filtros después de la actualización
      get().applyFilters();
      
      // Retornar información para notificación
      return {
        success: true,
        taskTitle: task.title,
        newPriority,
        oldPriority: task.priority
      };
    } catch (error) {
      console.error('❌ TaskStore: Error changing task priority:', error);
      
      // Rollback en caso de error
      set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === taskId ? { ...t, priority: task.priority } : t
        ),
        filteredTasks: state.filteredTasks.map(t => 
          t.id === taskId ? { ...t, priority: task.priority } : t
        )
      }));
      
      console.log('🔄 TaskStore: Applied rollback due to error');
      throw error;
    }
  },

  // Método para cambiar estado con drag & drop
  changeTaskStatus: async (taskId: string, newStatus: "pending" | "in_progress" | "completed" | "cancelled") => {
    console.log('🔄 TaskStore: Changing task status', taskId, 'to:', newStatus);
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('❌ TaskStore: Task not found:', taskId);
      throw new Error('Task not found');
    }
    console.log('🔄 TaskStore: Found task:', task.title, 'current status:', task.status);
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ),
      filteredTasks: state.filteredTasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    }));
    console.log('🔄 TaskStore: Applied optimistic update for status');
    try {
      const updateData: any = { status: newStatus, updatedAt: new Date() };
      if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      }
      await updateTaskFirestore(taskId, updateData);
      console.log('✅ TaskStore: Task status changed successfully:', { taskId, newStatus });
      get().applyFilters();
      return { success: true, taskTitle: task.title, newStatus, oldStatus: task.status };
    } catch (error) {
      console.error('❌ TaskStore: Error changing task status:', error);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: task.status } : t),
        filteredTasks: state.filteredTasks.map(t => t.id === taskId ? { ...t, status: task.status } : t)
      }));
      console.log('🔄 TaskStore: Applied rollback due to error');
      throw error;
    }
  },

  changeTaskAssignment: async (taskId: string, newAssignedTo: string[] | null) => {
    console.log('🔄 TaskStore: Changing task assignment', taskId, 'to:', newAssignedTo);
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('❌ TaskStore: Task not found:', taskId);
      throw new Error('Task not found');
    }
    console.log('🔄 TaskStore: Found task:', task.title, 'current assignment:', task.assignedTo);
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, assignedTo: newAssignedTo || [] } : t
      ),
      filteredTasks: state.filteredTasks.map(t => 
        t.id === taskId ? { ...t, assignedTo: newAssignedTo || [] } : t
      )
    }));
    console.log('🔄 TaskStore: Applied optimistic update for assignment');
    try {
      await updateTaskFirestore(taskId, { assignedTo: newAssignedTo || [], updatedAt: new Date() });
      console.log('✅ TaskStore: Task assignment changed successfully:', { taskId, newAssignedTo });
      get().applyFilters();
      return { success: true, taskTitle: task.title, newAssignedTo, oldAssignedTo: task.assignedTo };
    } catch (error) {
      console.error('❌ TaskStore: Error changing task assignment:', error);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, assignedTo: task.assignedTo } : t),
        filteredTasks: state.filteredTasks.map(t => t.id === taskId ? { ...t, assignedTo: task.assignedTo } : t)
      }));
      console.log('🔄 TaskStore: Applied rollback due to error');
      throw error;
    }
  },
  deleteTask: async (id) => {
    try {
      await deleteTaskFirestore(id);
      
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
        filteredTasks: state.filteredTasks.filter(task => task.id !== id)
      }));
      
      get().applyFilters();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  clearFilters: () => set({ filters: {}, filteredTasks: get().tasks }),
  setLoading: (loading) => set({ loading }),
  applyFilters: () => {
    const { tasks, filters } = get();
    let filtered = tasks;

    if (filters.companyId) {
      filtered = filtered.filter(task => task.companyId === filters.companyId);
    }

    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(task => 
        task.assignedTo.includes(filters.assignedTo!)
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    set({ filteredTasks: filtered });
  },
}));
