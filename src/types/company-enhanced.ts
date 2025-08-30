import { Timestamp } from 'firebase/firestore';

// Company status enum
export type CompanyStatus = 'active' | 'inactive' | 'archived';

// Default icon types que corresponden con Lucide icons
export type CompanyIconType = 
  | 'Building'
  | 'Building2' 
  | 'Factory'
  | 'Briefcase'
  | 'Store'
  | 'Home'
  | 'Warehouse'
  | 'Landmark'
  | 'School'
  | 'Hospital'
  | 'Plane'
  | 'Ship'
  | 'Truck'
  | 'Rocket'
  | 'Globe'
  | 'Zap'
  | 'Coffee'
  | 'ShoppingBag'
  | 'Heart'
  | 'Cpu';

// Enhanced Company interface
export interface CompanyEnhanced {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  defaultIcon: CompanyIconType;
  color: string;
  status: CompanyStatus;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  metadata?: {
    employeeCount?: number;
    foundedDate?: Date | Timestamp;
    taxId?: string;
  };
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
  isDeleted: boolean;
}

// Form data for creating/editing companies
export interface CompanyFormDataEnhanced {
  name: string;
  description?: string;
  logoUrl?: string;
  logoFile?: File;
  defaultIcon: CompanyIconType;
  color: string;
  status: CompanyStatus;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

// Company color palette
export const companyColorPalette = [
  { value: '#3B82F6', label: 'Azul', name: 'blue' },
  { value: '#10B981', label: 'Verde', name: 'green' },
  { value: '#8B5CF6', label: 'Violeta', name: 'violet' },
  { value: '#F59E0B', label: 'Ámbar', name: 'amber' },
  { value: '#EF4444', label: 'Rojo', name: 'red' },
  { value: '#06B6D4', label: 'Cian', name: 'cyan' },
  { value: '#EC4899', label: 'Rosa', name: 'pink' },
  { value: '#6366F1', label: 'Índigo', name: 'indigo' },
  { value: '#84CC16', label: 'Lima', name: 'lime' },
  { value: '#F97316', label: 'Naranja', name: 'orange' },
  { value: '#14B8A6', label: 'Turquesa', name: 'teal' },
  { value: '#A855F7', label: 'Púrpura', name: 'purple' },
];

// Industry options
export const industryOptions = [
  { value: 'technology', label: 'Tecnología', defaultIcon: 'Cpu' as CompanyIconType },
  { value: 'healthcare', label: 'Salud', defaultIcon: 'Heart' as CompanyIconType },
  { value: 'finance', label: 'Finanzas', defaultIcon: 'Landmark' as CompanyIconType },
  { value: 'education', label: 'Educación', defaultIcon: 'School' as CompanyIconType },
  { value: 'retail', label: 'Comercio', defaultIcon: 'ShoppingBag' as CompanyIconType },
  { value: 'manufacturing', label: 'Manufactura', defaultIcon: 'Factory' as CompanyIconType },
  { value: 'construction', label: 'Construcción', defaultIcon: 'Building2' as CompanyIconType },
  { value: 'transportation', label: 'Transporte', defaultIcon: 'Truck' as CompanyIconType },
  { value: 'hospitality', label: 'Hospitalidad', defaultIcon: 'Coffee' as CompanyIconType },
  { value: 'agriculture', label: 'Agricultura', defaultIcon: 'Home' as CompanyIconType },
  { value: 'energy', label: 'Energía', defaultIcon: 'Zap' as CompanyIconType },
  { value: 'entertainment', label: 'Entretenimiento', defaultIcon: 'Rocket' as CompanyIconType },
  { value: 'real_estate', label: 'Bienes Raíces', defaultIcon: 'Home' as CompanyIconType },
  { value: 'consulting', label: 'Consultoría', defaultIcon: 'Briefcase' as CompanyIconType },
  { value: 'logistics', label: 'Logística', defaultIcon: 'Ship' as CompanyIconType },
  { value: 'aviation', label: 'Aviación', defaultIcon: 'Plane' as CompanyIconType },
  { value: 'other', label: 'Otro', defaultIcon: 'Building' as CompanyIconType },
];

// Available icons for manual selection
export const availableIcons: { value: CompanyIconType; label: string }[] = [
  { value: 'Building', label: 'Edificio' },
  { value: 'Building2', label: 'Edificio 2' },
  { value: 'Factory', label: 'Fábrica' },
  { value: 'Briefcase', label: 'Maletín' },
  { value: 'Store', label: 'Tienda' },
  { value: 'Home', label: 'Casa' },
  { value: 'Warehouse', label: 'Almacén' },
  { value: 'Landmark', label: 'Banco' },
  { value: 'School', label: 'Escuela' },
  { value: 'Hospital', label: 'Hospital' },
  { value: 'Plane', label: 'Avión' },
  { value: 'Ship', label: 'Barco' },
  { value: 'Truck', label: 'Camión' },
  { value: 'Rocket', label: 'Cohete' },
  { value: 'Globe', label: 'Globo' },
  { value: 'Zap', label: 'Energía' },
  { value: 'Coffee', label: 'Café' },
  { value: 'ShoppingBag', label: 'Bolsa' },
  { value: 'Heart', label: 'Corazón' },
  { value: 'Cpu', label: 'Tecnología' },
];

// Helper function to get icon based on industry
export const getDefaultIconForIndustry = (industry?: string): CompanyIconType => {
  const industryOption = industryOptions.find(opt => opt.value === industry);
  return industryOption?.defaultIcon || 'Building';
};

// Helper function to get a random icon
export const getRandomIcon = (): CompanyIconType => {
  const icons = availableIcons.map(i => i.value);
  return icons[Math.floor(Math.random() * icons.length)];
};

// Default company form data
export const getDefaultCompanyFormData = (): CompanyFormDataEnhanced => ({
  name: '',
  description: '',
  logoUrl: '',
  defaultIcon: 'Building',
  color: '#3B82F6',
  status: 'active',
  industry: '',
  website: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  },
});

// Validation rules
export const companyValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
  },
  logoUrl: {
    pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)$/i,
  },
  website: {
    pattern: /^https?:\/\/.+\..+$/i,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    pattern: /^\+?[\d\s()-]+$/,
    minLength: 10,
    maxLength: 20,
  },
  logoFile: {
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
  },
};