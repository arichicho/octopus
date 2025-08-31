import { create } from 'zustand';
import { User } from '../firebase/firestore';
import { getUsersByCompany } from '../firebase/firestore';

interface CompanyUsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  loadUsers: (companyId: string) => Promise<void>;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  clearUsers: () => void;
}

export const useCompanyUsersStore = create<CompanyUsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  
  loadUsers: async (companyId: string) => {
    try {
      set({ loading: true, error: null });
      console.log('📥 Loading users for company:', companyId);
      
      const users = await getUsersByCompany(companyId);
      set({ users, loading: false });
      
      console.log('✅ Loaded users:', users.length);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error loading users',
        loading: false 
      });
    }
  },
  
  setUsers: (users) => set({ users }),
  
  addUser: (user) => set((state) => ({ 
    users: [...state.users, user] 
  })),
  
  updateUser: (id, updates) => set((state) => ({
    users: state.users.map(user => 
      user.id === id ? { ...user, ...updates } : user
    )
  })),
  
  removeUser: (id) => set((state) => ({
    users: state.users.filter(user => user.id !== id)
  })),
  
  clearUsers: () => set({ users: [], error: null })
}));
