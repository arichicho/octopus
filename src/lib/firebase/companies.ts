import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './config';
import { CompanyEnhanced, CompanyFormDataEnhanced } from '../../types/company-enhanced';

const COLLECTION_NAME = 'companies';

// Mock data storage for demo mode (per user)
const createMockStorage = (): Map<string, Map<string, CompanyEnhanced>> => {
  if (typeof window === 'undefined') return new Map<string, Map<string, CompanyEnhanced>>();
  
  // Use a global variable but separate by user to persist data across page navigations
  if (!(window as any).__mockCompaniesStorageByUser) {
    (window as any).__mockCompaniesStorageByUser = new Map<string, Map<string, CompanyEnhanced>>();
  }
  return (window as any).__mockCompaniesStorageByUser;
};

const getMockStorageForUser = (userId: string): Map<string, CompanyEnhanced> => {
  const userStorages = createMockStorage();
  if (!userStorages.has(userId)) {
    userStorages.set(userId, new Map<string, CompanyEnhanced>());
  }
  return userStorages.get(userId)!;
};

// Debug function
const debugMockStorage = (context: string, userId: string) => {
  if (isMockMode()) {
    const mockCompanies = getMockStorageForUser(userId);
    console.log(`🔍 [${context}] Mock storage contents for ${userId}:`, Array.from(mockCompanies.values()));
  }
};

// Check if we're in mock mode
const isMockMode = () => {
  // FORCE real Firestore in production to avoid mock issues
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('theceo.web.app') || hostname.includes('firebaseapp.com');
    
    if (isProduction) {
      console.log('🔧 Production detected - forcing Firestore real mode');
      return false; // Always use real Firestore in production
    }
    
    // Only use mock in development if explicitly enabled
    const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR;
    const disableFirestore = process.env.NEXT_PUBLIC_DISABLE_FIRESTORE;
    const mockMode = useEmulator === 'false' && disableFirestore === 'true';
    
    console.log('🔧 Companies isMockMode check:', {
      useEmulator,
      disableFirestore,
      mockMode,
      hostname
    });
    
    return mockMode;
  }
  return false;
};

// Convert Firestore document to Company type
const documentToCompany = (doc: any): CompanyEnhanced => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
    metadata: {
      ...data.metadata,
      foundedDate: data.metadata?.foundedDate?.toDate?.() || undefined,
    },
  };
};

// Get all companies
export const getCompanies = async (userId?: string): Promise<CompanyEnhanced[]> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: usando datos mock para empresas');
      if (userId) {
        debugMockStorage('getCompanies', userId);
        const mockCompanies = getMockStorageForUser(userId);
        const companies = Array.from(mockCompanies.values());
        return companies.filter(c => !c.isDeleted);
      } else {
        console.log('🔄 No userId provided for mock mode, returning empty array');
        return [];
      }
    }

    // TEMPORAL: First, let's see ALL companies in Firestore to debug
    console.log('🔍 DEBUG: First checking ALL companies in Firestore...');
    const allQ = query(
      collection(db as any, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    const allSnapshot = await getDocs(allQ);
    const allCompanies = allSnapshot.docs.map(documentToCompany);
    console.log('🔍 DEBUG: ALL companies in Firestore:', allCompanies.map(c => ({
      name: c.name,
      createdBy: c.createdBy,
      id: c.id
    })));
    
    // Check if user has companies with 'current-user' that need migration
    const currentUserCompanies = allCompanies.filter(c => c.createdBy === 'current-user');
    if (currentUserCompanies.length > 0 && userId) {
      console.log('🔧 Found companies with current-user createdBy that need migration:', currentUserCompanies.map(c => c.name));
      console.log('🔧 Would migrate to userId:', userId);
    }

    let q;
    if (userId) {
      console.log('🔍 Searching companies with createdBy:', userId);
      // Temporary: Remove orderBy to avoid composite index requirement
      q = query(
        collection(db as any, COLLECTION_NAME),
        where('createdBy', '==', userId)
      );
    } else {
      console.log('🔍 Searching ALL companies (no userId filter)');
      q = query(
        collection(db as any, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    let companies = querySnapshot.docs.map(documentToCompany);
    
    console.log('🏢 Found companies with userId filter:', companies.map(c => ({
      name: c.name,
      createdBy: c.createdBy,
      isDeleted: c.isDeleted
    })));
    
    // TEMPORARY FIX: If no companies found with userId, also try 'current-user' but only for the specific user
    if (companies.length === 0 && userId) {
      console.log('🔧 No companies found with userId, trying current-user fallback...');
      const fallbackQ = query(
        collection(db as any, COLLECTION_NAME),
        where('createdBy', '==', 'current-user')
      );
      const fallbackSnapshot = await getDocs(fallbackQ);
      const fallbackCompanies = fallbackSnapshot.docs.map(documentToCompany);
      
      // Only include current-user companies that belong to this user
      // This prevents showing other users' companies
      const validFallbackCompanies = fallbackCompanies.filter(c => 
        c.createdBy === 'current-user' && c.id // Only include if it's a current-user company
      );
      
      companies = [...companies, ...validFallbackCompanies];
      
      console.log('🔧 Found companies with current-user fallback:', validFallbackCompanies.map(c => c.name));
    }
    
    // Filtrar elementos eliminados en el código
    const activeCompanies = companies.filter(company => !company.isDeleted);
    console.log('✅ Active companies after filtering:', activeCompanies.length);
    return activeCompanies;
  } catch (error) {
    console.error('Error getting companies:', error);
    return [];
  }
};

// Get active companies only
export const getActiveCompanies = async (userId?: string): Promise<CompanyEnhanced[]> => {
  try {
    // Unify logic by reusing getCompanies, which already
    // contains robust fallbacks (e.g., 'current-user').
    const companies = await getCompanies(userId);

    // Filter only active and not deleted
    const active = companies.filter(c => c.status === 'active' && !c.isDeleted);
    console.log('✅ getActiveCompanies resolved via getCompanies:', active.length);
    return active;
  } catch (error) {
    console.error('Error getting active companies:', error);
    return [];
  }
};

// Get single company by ID
export const getCompany = async (companyId: string, userId?: string): Promise<CompanyEnhanced | null> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: usando datos mock para empresa');
      if (userId) {
        const mockCompanies = getMockStorageForUser(userId);
        return mockCompanies.get(companyId) || null;
      }
      return null;
    }

    const docRef = doc(db as any, COLLECTION_NAME, companyId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return documentToCompany(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error getting company:', error);
    return null;
  }
};

// Create new company
export const createCompany = async (
  data: CompanyFormDataEnhanced,
  userId: string
): Promise<{ id: string; data: CompanyEnhanced }> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: creando empresa mock');
      const mockId = 'mock-company-' + Date.now();
      const mockCompany: CompanyEnhanced = {
        id: mockId,
        ...data,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        isDeleted: false,
      };
      // Store in mock storage
      const mockCompanies = getMockStorageForUser(userId);
      mockCompanies.set(mockId, mockCompany);
      debugMockStorage('createCompany - after creation', userId);
      return { id: mockId, data: mockCompany };
    }

    // Convert undefined values to null (Firestore doesn't support undefined)
    const sanitizeData = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeData);
      
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeData(value);
      }
      return sanitized;
    };

    const sanitizedData = sanitizeData(data);

    const newCompany = {
      ...sanitizedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      isDeleted: false,
      metadata: {
        ...sanitizedData.metadata,
        foundedDate: sanitizedData.metadata?.foundedDate ? Timestamp.fromDate(sanitizedData.metadata.foundedDate) : null,
      },
    };

    // Remove the file from the data before saving to Firestore
    const { logoFile, ...companyData } = newCompany;

    const docRef = await addDoc(collection(db as any, COLLECTION_NAME), companyData);
    
    const createdCompany: CompanyEnhanced = {
      id: docRef.id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      isDeleted: false,
    };

    return { id: docRef.id, data: createdCompany };
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

// Update existing company
export const updateCompany = async (
  companyId: string,
  data: Partial<CompanyFormDataEnhanced>,
  userId?: string
): Promise<void> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: actualizando empresa mock');
      if (userId) {
        const mockCompanies = getMockStorageForUser(userId);
        const existing = mockCompanies.get(companyId);
        if (existing) {
          const updated = { ...existing, ...data, updatedAt: new Date() };
          mockCompanies.set(companyId, updated);
        }
      }
      return;
    }

    const docRef = doc(db as any, COLLECTION_NAME, companyId);
    
    // Convert undefined values to null (Firestore doesn't support undefined)
    const sanitizeData = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeData);
      
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeData(value);
      }
      return sanitized;
    };

    const sanitizedData = sanitizeData(data);
    
    const updateData = {
      ...sanitizedData,
      updatedAt: serverTimestamp(),
    };

    // Handle metadata.foundedDate if it exists
    if (sanitizedData.metadata?.foundedDate) {
      updateData.metadata = {
        ...sanitizedData.metadata,
        foundedDate: Timestamp.fromDate(sanitizedData.metadata.foundedDate),
      };
    }

    // Remove the file from the data before saving to Firestore
    const { logoFile, ...companyData } = updateData;

    await updateDoc(docRef, companyData);
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

// Soft delete company (mark as deleted)
export const deleteCompany = async (companyId: string): Promise<void> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: eliminando empresa mock');
      return;
    }

    const docRef = doc(db as any, COLLECTION_NAME, companyId);
    await updateDoc(docRef, {
      isDeleted: true,
      status: 'archived',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};

// Hard delete company (permanent deletion - use with caution)
export const hardDeleteCompany = async (companyId: string): Promise<void> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: eliminando empresa mock permanentemente');
      return;
    }

    const docRef = doc(db as any, COLLECTION_NAME, companyId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error permanently deleting company:', error);
    throw error;
  }
};

// Restore deleted company
export const restoreCompany = async (companyId: string): Promise<void> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: restaurando empresa mock');
      return;
    }

    const docRef = doc(db as any, COLLECTION_NAME, companyId);
    await updateDoc(docRef, {
      isDeleted: false,
      status: 'active',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error restoring company:', error);
    throw error;
  }
};

// Check if company name exists (for validation)
export const checkCompanyNameExists = async (
  name: string,
  excludeId?: string
): Promise<boolean> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: verificando nombre de empresa mock');
      return false;
    }

    const q = query(
      collection(db as any, COLLECTION_NAME),
      where('name', '==', name),
      where('isDeleted', '==', false),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }

    // If we're excluding an ID (for updates), check if the found document is different
    if (excludeId) {
      return querySnapshot.docs[0].id !== excludeId;
    }

    return true;
  } catch (error) {
    console.error('Error checking company name:', error);
    return false;
  }
};

// Search companies by name
export const searchCompanies = async (
  searchTerm: string,
  userId?: string
): Promise<CompanyEnhanced[]> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: buscando empresas mock');
      return [];
    }

    // Firestore doesn't support full-text search, so we'll get all and filter
    const companies = await getCompanies(userId);
    
    const searchLower = searchTerm.toLowerCase();
    return companies.filter(company => 
      company.name.toLowerCase().includes(searchLower) ||
      company.description?.toLowerCase().includes(searchLower) ||
      company.industry?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching companies:', error);
    return [];
  }
};

// Get companies by industry
export const getCompaniesByIndustry = async (
  industry: string,
  userId?: string
): Promise<CompanyEnhanced[]> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: obteniendo empresas por industria mock');
      return [];
    }

    let q;
    if (userId) {
      q = query(
        collection(db as any, COLLECTION_NAME),
        where('industry', '==', industry),
        where('createdBy', '==', userId),
        where('isDeleted', '==', false),
        orderBy('name', 'asc')
      );
    } else {
      q = query(
        collection(db as any, COLLECTION_NAME),
        where('industry', '==', industry),
        where('isDeleted', '==', false),
        orderBy('name', 'asc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(documentToCompany);
  } catch (error) {
    console.error('Error getting companies by industry:', error);
    return [];
  }
};

// Batch update companies
export const batchUpdateCompanies = async (
  updates: { id: string; data: Partial<CompanyFormDataEnhanced> }[]
): Promise<void> => {
  try {
    if (isMockMode()) {
      console.log('🔄 Modo demo: actualizando empresas en lote mock');
      return;
    }

    const promises = updates.map(({ id, data }) => updateCompany(id, data));
    await Promise.all(promises);
  } catch (error) {
    console.error('Error batch updating companies:', error);
    throw error;
  }
};
