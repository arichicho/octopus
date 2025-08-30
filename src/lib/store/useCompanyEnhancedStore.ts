import { create } from 'zustand';
import { CompanyEnhanced, CompanyFormDataEnhanced } from '@/types/company-enhanced';
import {
  getCompanies,
  getActiveCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  restoreCompany,
  searchCompanies,
  checkCompanyNameExists,
} from '@/lib/firebase/companies';

interface CompanyEnhancedStore {
  // State
  companies: CompanyEnhanced[];
  activeCompanies: CompanyEnhanced[];
  selectedCompany: CompanyEnhanced | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filteredCompanies: CompanyEnhanced[];
  
  // Actions - Read
  fetchCompanies: (userId?: string) => Promise<void>;
  fetchActiveCompanies: (userId?: string) => Promise<void>;
  fetchCompany: (companyId: string) => Promise<void>;
  searchCompaniesAction: (searchTerm: string, userId?: string) => Promise<void>;
  
  // Actions - Create/Update/Delete
  createNewCompany: (data: CompanyFormDataEnhanced, userId: string) => Promise<CompanyEnhanced>;
  updateExistingCompany: (companyId: string, data: Partial<CompanyFormDataEnhanced>) => Promise<void>;
  deleteCompanyAction: (companyId: string) => Promise<void>;
  restoreCompanyAction: (companyId: string) => Promise<void>;
  
  // Actions - Utility
  setSelectedCompany: (company: CompanyEnhanced | null) => void;
  reorderCompanies: (reorderedCompanies: CompanyEnhanced[]) => void;
  checkNameExists: (name: string, excludeId?: string) => Promise<boolean>;
  filterCompanies: (query: string) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  companies: [],
  activeCompanies: [],
  selectedCompany: null,
  loading: false,
  error: null,
  searchQuery: '',
  filteredCompanies: [],
};

export const useCompanyEnhancedStore = create<CompanyEnhancedStore>((set, get) => ({
  ...initialState,

  // Fetch all companies
  fetchCompanies: async (userId) => {
    set({ loading: true, error: null });
    try {
      let companies = await getCompanies(userId);
      
      // Apply saved order if it exists
      try {
        const savedOrder = localStorage.getItem('company-order');
        if (savedOrder) {
          const companyOrder = JSON.parse(savedOrder) as string[];
          companies = companies.sort((a, b) => {
            const aIndex = companyOrder.indexOf(a.id);
            const bIndex = companyOrder.indexOf(b.id);
            
            // If both are in saved order, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            // If only one is in saved order, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            // If neither is in saved order, keep original order
            return 0;
          });
        }
      } catch (error) {
        console.warn('Could not load company order:', error);
      }
      
      set({ companies, filteredCompanies: companies, loading: false });
    } catch (error) {
      console.error('Error fetching companies:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar empresas', 
        loading: false,
        companies: [],
        filteredCompanies: []
      });
    }
  },

  // Fetch active companies only
  fetchActiveCompanies: async (userId) => {
    set({ loading: true, error: null });
    try {
      const activeCompanies = await getActiveCompanies(userId);
      set({ activeCompanies, loading: false });
    } catch (error) {
      console.error('Error fetching active companies:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar empresas activas', 
        loading: false,
        activeCompanies: []
      });
    }
  },

  // Fetch single company
  fetchCompany: async (companyId) => {
    set({ loading: true, error: null });
    try {
      const company = await getCompany(companyId);
      if (company) {
        set({ selectedCompany: company, loading: false });
      } else {
        set({ 
          error: 'Empresa no encontrada', 
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar empresa', 
        loading: false 
      });
    }
  },

  // Search companies
  searchCompaniesAction: async (searchTerm, userId) => {
    set({ loading: true, error: null, searchQuery: searchTerm });
    try {
      const results = await searchCompanies(searchTerm, userId);
      set({ filteredCompanies: results, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al buscar empresas', 
        loading: false 
      });
    }
  },

  // Create new company
  createNewCompany: async (data, userId) => {
    set({ loading: true, error: null });
    try {
      // Check if name already exists
      const nameExists = await checkCompanyNameExists(data.name);
      if (nameExists) {
        set({ 
          error: 'Ya existe una empresa con este nombre', 
          loading: false 
        });
        throw new Error('Ya existe una empresa con este nombre');
      }

      const { id, data: newCompany } = await createCompany(data, userId);
      
      set((state) => ({
        companies: [newCompany, ...state.companies],
        activeCompanies: newCompany.status === 'active' 
          ? [newCompany, ...state.activeCompanies]
          : state.activeCompanies,
        filteredCompanies: [newCompany, ...state.filteredCompanies],
        loading: false,
      }));
      
      return newCompany;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear empresa', 
        loading: false 
      });
      throw error;
    }
  },

  // Update existing company
  updateExistingCompany: async (companyId, data) => {
    set({ loading: true, error: null });
    try {
      // Check if name already exists (if name is being updated)
      if (data.name) {
        const nameExists = await checkCompanyNameExists(data.name, companyId);
        if (nameExists) {
          set({ 
            error: 'Ya existe una empresa con este nombre', 
            loading: false 
          });
          throw new Error('Ya existe una empresa con este nombre');
        }
      }

      await updateCompany(companyId, data);
      
      set((state) => {
        const updatedCompanies = state.companies.map(company =>
          company.id === companyId 
            ? { ...company, ...data, updatedAt: new Date() }
            : company
        );
        
        const updatedActiveCompanies = state.activeCompanies.map(company =>
          company.id === companyId 
            ? { ...company, ...data, updatedAt: new Date() }
            : company
        );

        const updatedFilteredCompanies = state.filteredCompanies.map(company =>
          company.id === companyId 
            ? { ...company, ...data, updatedAt: new Date() }
            : company
        );

        return {
          companies: updatedCompanies,
          activeCompanies: updatedActiveCompanies,
          filteredCompanies: updatedFilteredCompanies,
          selectedCompany: state.selectedCompany?.id === companyId
            ? { ...state.selectedCompany, ...data, updatedAt: new Date() }
            : state.selectedCompany,
          loading: false,
        };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar empresa', 
        loading: false 
      });
      throw error;
    }
  },

  // Delete company (soft delete)
  deleteCompanyAction: async (companyId) => {
    set({ loading: true, error: null });
    try {
      await deleteCompany(companyId);
      
      set((state) => ({
        companies: state.companies.filter(c => c.id !== companyId),
        activeCompanies: state.activeCompanies.filter(c => c.id !== companyId),
        filteredCompanies: state.filteredCompanies.filter(c => c.id !== companyId),
        selectedCompany: state.selectedCompany?.id === companyId ? null : state.selectedCompany,
        loading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar empresa', 
        loading: false 
      });
      throw error;
    }
  },

  // Restore deleted company
  restoreCompanyAction: async (companyId) => {
    set({ loading: true, error: null });
    try {
      await restoreCompany(companyId);
      // Refetch companies to get the restored one
      const userId = undefined; // You might want to pass this from the component
      await get().fetchCompanies(userId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al restaurar empresa', 
        loading: false 
      });
      throw error;
    }
  },

  // Set selected company
  setSelectedCompany: (company) => {
    set({ selectedCompany: company });
  },

  // Reorder companies
  reorderCompanies: (reorderedCompanies) => {
    set((state) => ({
      companies: reorderedCompanies,
      filteredCompanies: reorderedCompanies,
    }));
    
    // Persist the order in localStorage
    try {
      const companyOrder = reorderedCompanies.map(company => company.id);
      localStorage.setItem('company-order', JSON.stringify(companyOrder));
    } catch (error) {
      console.warn('Could not persist company order:', error);
    }
  },

  // Check if name exists
  checkNameExists: async (name, excludeId) => {
    try {
      return await checkCompanyNameExists(name, excludeId);
    } catch (error) {
      console.error('Error checking company name:', error);
      return false;
    }
  },

  // Filter companies locally
  filterCompanies: (query) => {
    set((state) => {
      if (!query) {
        return { filteredCompanies: state.companies, searchQuery: '' };
      }

      const queryLower = query.toLowerCase();
      const filtered = state.companies.filter(company =>
        company.name.toLowerCase().includes(queryLower) ||
        company.description?.toLowerCase().includes(queryLower) ||
        company.industry?.toLowerCase().includes(queryLower)
      );

      return { filteredCompanies: filtered, searchQuery: query };
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set(initialState);
  },
}));