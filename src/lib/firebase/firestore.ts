import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

// Mock data storage for demo mode
const mockDataStorage = new Map<string, any[]>();

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
    
    console.log('🔧 Firestore isMockMode check:', {
      useEmulator,
      disableFirestore,
      mockMode,
      hostname
    });
    
    return mockMode;
  }
  return false;
};

// Types
export interface Company {
  id?: string;
  name: string;
  color: string;
  settings: Record<string, unknown>;
  createdAt: Timestamp;
  ownerId: string;
}

export interface User {
  id?: string;
  email: string;
  displayName: string
  photoURL: string;
  companies: Array<{ companyId: string; role: 'admin' | 'editor' | 'viewer' }>;
  timezone: string;
  preferences: Record<string, unknown>;
  lastActive: Timestamp;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
}

export interface Invitation {
  id?: string;
  email: string;
  companyId: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: Date | Timestamp;
  assignedTo: string[];
  companyId: string;
  createdBy: string;
  progress?: number;
  tags?: string[];
  linkedDocs?: string[];
  linkedEvents?: string[];
  parentTaskId?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
}

export interface Person {
  id?: string;
  name: string;
  email: string;
  companies: string[];
  role: string;
  active: boolean;
  userId?: string;
}

// Generic CRUD operations
export const createDocument = async <T>(
  collectionName: string, 
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string; data: T }> => {
  // Handle mock database
  if (isMockMode()) {
    console.warn('Firestore no configurado. Modo demo activado.');
    const mockId = 'mock-id-' + Date.now();
    const mockData = { ...data, id: mockId, createdAt: new Date() } as T;
    
    // Store in mock storage
    if (!mockDataStorage.has(collectionName)) {
      mockDataStorage.set(collectionName, []);
    }
    mockDataStorage.get(collectionName)!.push(mockData);
    
    return { id: mockId, data: mockData };
  }
  
  try {
    // Clean up undefined values before sending to Firebase
    const cleanData: any = { ...data };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    
    const docRef = await addDoc(collection(db as any, collectionName), {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Return the data with proper timestamps
    const createdData = {
      ...data,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as T;
    
    return { id: docRef.id, data: createdData };
  } catch (error) {
    console.error('Error creating document:', error);
    // Fallback to mock if Firebase fails
    const mockId = 'mock-id-' + Date.now();
    return { 
      id: mockId, 
      data: { ...data, id: mockId, createdAt: new Date() } as T 
    };
  }
};

export const getDocument = async <T>(
  collectionName: string, 
  id: string
): Promise<T | null> => {
  // Handle mock database
  if (isMockMode()) {
    console.warn('Firestore no configurado. Modo demo activado.');
    const collectionData = mockDataStorage.get(collectionName) || [];
    const doc = collectionData.find(item => item.id === id);
    return doc || null;
  }
  
  try {
    const docRef = doc(db as any, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      const convertedData = {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
      };
      return convertedData as T;
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
};

export const updateDocument = async <T>(
  collectionName: string, 
  id: string, 
  data: Partial<T>
): Promise<void> => {
  // Handle mock database
  if (isMockMode()) {
    const collectionData = mockDataStorage.get(collectionName) || [];
    const index = collectionData.findIndex(item => item.id === id);
    if (index !== -1) {
      collectionData[index] = { ...collectionData[index], ...data, updatedAt: new Date() };
      mockDataStorage.set(collectionName, collectionData);
    }
    return;
  }
  
  try {
    const docRef = doc(db as any, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating document:', error);
  }
};

export const deleteDocument = async (
  collectionName: string, 
  id: string
): Promise<void> => {
  // Handle mock database
  if (isMockMode()) {
    const collectionData = mockDataStorage.get(collectionName) || [];
    const filteredData = collectionData.filter(item => item.id !== id);
    mockDataStorage.set(collectionName, filteredData);
    return;
  }
  
  try {
    const docRef = doc(db as any, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
  }
};

export const getDocuments = async <T>(
  collectionName: string,
  conditions?: Array<{ field: string; operator: string; value: unknown }>,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
): Promise<T[]> => {
  console.log('🔍 Getting documents from:', collectionName);
  console.log('🔍 Conditions:', JSON.stringify(conditions, null, 2));
  console.log('🔍 Mock mode:', isMockMode());
  
  if (typeof window !== 'undefined') {
    console.log('🌐 Environment check:', {
      hostname: window.location.hostname,
      useEmulator: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR,
      disableFirestore: process.env.NEXT_PUBLIC_DISABLE_FIRESTORE,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
  }
  // Handle mock database
  if (isMockMode()) {
    console.warn('Firestore no configurado. Modo demo activado.');
    let collectionData = mockDataStorage.get(collectionName) || [];
    
    // Apply conditions (simplified mock filtering)
    if (conditions) {
      collectionData = collectionData.filter(item => {
        return conditions.every(condition => {
          const value = item[condition.field];
          switch (condition.operator) {
            case '==':
              return value === condition.value;
            case '!=':
              return value !== condition.value;
            case 'array-contains':
              return Array.isArray(value) && value.includes(condition.value);
            default:
              return true;
          }
        });
      });
    }
    
    // Apply ordering
    if (orderByField) {
      collectionData.sort((a, b) => {
        const aVal = a[orderByField];
        const bVal = b[orderByField];
        if (orderDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }
    
    // Apply limit
    if (limitCount) {
      collectionData = collectionData.slice(0, limitCount);
    }
    
    console.log('📋 Mock mode - returning', collectionData.length, 'documents from', collectionName);
    return collectionData as T[];
  }
  
  try {
    // Only call Firebase functions when not in mock mode
    const collectionRef = collection(db as any, collectionName);
    let q: any = collectionRef;
    
    if (conditions) {
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator as any, condition.value));
      });
    }
    
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      // Convert Timestamp fields to Date objects
      const convertedData = {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
      };
      return convertedData as T;
    });
    console.log('📋 Found', results.length, 'documents in', collectionName);
    if (results.length > 0) {
      console.log('📋 Sample document:', results[0]);
    }
    return results;
  } catch (error) {
    console.error('Error getting documents:', error);
    // Fallback to empty array if Firebase fails
    return [];
  }
};

// Company operations
export const createCompany = async (data: Omit<Company, 'id' | 'createdAt'>): Promise<{ id: string; data: Company }> => {
  return createDocument<Company>('companies', data);
};

export const getCompany = async (id: string): Promise<Company | null> => {
  return getDocument<Company>('companies', id);
};

export const updateCompany = async (id: string, data: Partial<Company>): Promise<void> => {
  return updateDocument<Company>('companies', id, data);
};

export const deleteCompany = async (id: string): Promise<void> => {
  return deleteDocument('companies', id);
};

export const getUserCompanies = async (userId: string): Promise<Company[]> => {
  return getDocuments<Company>('companies', [
    { field: 'ownerId', operator: '==', value: userId }
  ]);
};

// User operations
export const createUser = async (data: Omit<User, 'id' | 'createdAt'>): Promise<{ id: string; data: User }> => {
  return createDocument<User>('users', data);
};

export const getUser = async (id: string): Promise<User | null> => {
  return getDocument<User>('users', id);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const users = await getDocuments<User>('users', [
    { field: 'email', operator: '==', value: email }
  ], undefined, undefined, 1);
  return users[0] || null;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<void> => {
  return updateDocument<User>('users', id, data);
};

// Invitation operations
export const createInvitation = async (data: Omit<Invitation, 'id' | 'createdAt'>): Promise<{ id: string; data: Invitation }> => {
  return createDocument<Invitation>('invitations', data);
};

export const getInvitation = async (id: string): Promise<Invitation | null> => {
  return getDocument<Invitation>('invitations', id);
};

export const getInvitationByEmail = async (email: string): Promise<Invitation | null> => {
  const invitations = await getDocuments<Invitation>('invitations', [
    { field: 'email', operator: '==', value: email },
    { field: 'status', operator: '==', value: 'pending' }
  ], 'createdAt', 'desc', 1);
  return invitations[0] || null;
};

export const updateInvitation = async (id: string, data: Partial<Invitation>): Promise<void> => {
  return updateDocument<Invitation>('invitations', id, data);
};

// Task operations
export const createTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string; data: Task }> => {
  console.log('📝 Creating task:', data.title, 'createdBy:', data.createdBy, 'isMockMode:', isMockMode());
  
  // Ensure all required fields have defaults and remove undefined values
  const taskData: any = {
    ...data,
    status: data.status ?? 'pending',
    priority: data.priority ?? 'medium',
    progress: data.progress ?? 0,
    tags: data.tags ?? [],
    linkedDocs: data.linkedDocs ?? [],
    linkedEvents: data.linkedEvents ?? [],
    description: data.description ?? '',
    assignedTo: data.assignedTo ?? [],
  };
  
  // Remove undefined fields (Firebase doesn't accept undefined)
  Object.keys(taskData).forEach(key => {
    if (taskData[key] === undefined) {
      delete taskData[key];
    }
  });
  
  console.log('📋 Final task data to save:', JSON.stringify(taskData, null, 2));
  
  try {
    const result = await createDocument<Task>('tasks', taskData);
    console.log('✅ Task created successfully with ID:', result.id);
    console.log('✅ Full task data returned:', JSON.stringify(result.data, null, 2));
    
    // Verify task was actually saved by reading it back
    const verification = await getDocument<Task>('tasks', result.id);
    console.log('🔍 Verification read:', verification ? 'Task found in database' : 'Task NOT found in database');
    
    return result;
  } catch (error) {
    console.error('❌ Error in createTask:', error);
    throw error;
  }
};

export const getTask = async (id: string): Promise<Task | null> => {
  return getDocument<Task>('tasks', id);
};

export const updateTask = async (id: string, data: Partial<Task>): Promise<void> => {
  return updateDocument<Task>('tasks', id, data);
};

export const deleteTask = async (id: string): Promise<void> => {
  return deleteDocument('tasks', id);
};

export const getCompanyTasks = async (companyId: string): Promise<Task[]> => {
  return getDocuments<Task>('tasks', [
    { field: 'companyId', operator: '==', value: companyId }
  ], 'createdAt', 'desc');
};

export const getUserTasks = async (userId: string): Promise<Task[]> => {
  return getDocuments<Task>('tasks', [
    { field: 'assignedTo', operator: 'array-contains', value: userId }
  ], 'dueDate', 'asc');
};

// Debug function to get ALL tasks regardless of user
export const getAllTasksDebug = async (): Promise<Task[]> => {
  console.log('🔍 DEBUG: Getting ALL tasks from Firestore (no filters)');
  try {
    const allTasks = await getDocuments<Task>('tasks');
    console.log('🔍 DEBUG: Found', allTasks.length, 'total tasks in database');
    if (allTasks.length > 0) {
      console.log('🔍 DEBUG: Sample task:', JSON.stringify(allTasks[0], null, 2));
      console.log('🔍 DEBUG: Task creators:', allTasks.map(t => ({ id: t.id, title: t.title, createdBy: t.createdBy })));
    }
    return allTasks;
  } catch (error) {
    console.error('❌ DEBUG: Error getting all tasks:', error);
    return [];
  }
};

// Person operations
export const createPerson = async (data: Omit<Person, 'id'>): Promise<{ id: string; data: Person }> => {
  return createDocument<Person>('people', data);
};

export const getPerson = async (id: string): Promise<Person | null> => {
  return getDocument<Person>('people', id);
};

export const updatePerson = async (id: string, data: Partial<Person>): Promise<void> => {
  return updateDocument<Person>('people', id, data);
};

export const deletePerson = async (id: string): Promise<void> => {
  return deleteDocument('people', id);
};

export const getCompanyPeople = async (companyId: string): Promise<Person[]> => {
  return getDocuments<Person>('people', [
    { field: 'companies', operator: 'array-contains', value: companyId }
  ], 'name', 'asc');
};
