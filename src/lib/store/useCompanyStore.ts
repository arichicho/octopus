import { create } from 'zustand';
import { Company } from '../firebase/firestore';

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  loading: boolean;
  setCompanies: (companies: Company[]) => void;
  setCurrentCompany: (company: Company | null) => void;
  addCompany: (company: Company) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  currentCompany: null,
  loading: false,
  setCompanies: (companies) => set({ companies }),
  setCurrentCompany: (currentCompany) => set({ currentCompany }),
  addCompany: (company) => set((state) => ({ 
    companies: [...state.companies, company] 
  })),
  updateCompany: (id, updates) => set((state) => ({
    companies: state.companies.map(company => 
      company.id === id ? { ...company, ...updates } : company
    ),
    currentCompany: state.currentCompany?.id === id 
      ? { ...state.currentCompany, ...updates } 
      : state.currentCompany
  })),
  deleteCompany: (id) => set((state) => ({
    companies: state.companies.filter(company => company.id !== id),
    currentCompany: state.currentCompany?.id === id ? null : state.currentCompany
  })),
  setLoading: (loading) => set({ loading }),
}));
