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
        // First try to get tasks with real userId
        const userConditions = [{ field: 'createdBy', operator: '==', value: userId }];
        tasks = await getDocuments<Task>('tasks', userConditions);
        
        console.log('📋 Found tasks with userId:', tasks.length);
        
        // TEMPORARY FIX: If no tasks found with userId, also try 'current-user'
        if (tasks.length === 0) {
          console.log('🔧 No tasks found with userId, trying current-user fallback...');
          const fallbackConditions = [{ field: 'createdBy', operator: '==', value: 'current-user' }];
          const fallbackTasks = await getDocuments<Task>('tasks', fallbackConditions);
          tasks = [...tasks, ...fallbackTasks];
          
          console.log('🔧 Found tasks with current-user fallback:', fallbackTasks.length);
        }
      } else {
        // If no userId, get all tasks
        tasks = await getDocuments<Task>('tasks');
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
