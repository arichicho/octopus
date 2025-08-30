import { CompanyEnhanced, CompanyIconType, getDefaultIconForIndustry, getRandomIcon } from '@/types/company-enhanced';
import { createCompany } from '@/lib/firebase/companies';
import { Company } from '@/types/company';

// Simplificado: Solo datos de migración mínimos para demostración
const legacyCompanies: Partial<Company>[] = [];

// Function to migrate a legacy company to the new system
const migrateLegacyCompany = (legacyCompany: Partial<Company>): CompanyEnhanced => {
  // Try to determine industry from company name
  let industry = 'other';
  let defaultIcon: CompanyIconType = 'Building';

  const name = legacyCompany.name?.toLowerCase() || '';
  
  if (name.includes('tech') || name.includes('corp') || name.includes('solutions')) {
    industry = 'technology';
    defaultIcon = 'Cpu';
  } else if (name.includes('green') || name.includes('energy')) {
    industry = 'energy';
    defaultIcon = 'Zap';
  } else if (name.includes('finance') || name.includes('financial')) {
    industry = 'finance';
    defaultIcon = 'Landmark';
  } else if (name.includes('health') || name.includes('care') || name.includes('medical')) {
    industry = 'healthcare';
    defaultIcon = 'Heart';
  } else if (name.includes('construction') || name.includes('building')) {
    industry = 'construction';
    defaultIcon = 'Building2';
  } else if (name.includes('retail') || name.includes('store') || name.includes('shop')) {
    industry = 'retail';
    defaultIcon = 'Store';
  } else if (name.includes('transport') || name.includes('logistics')) {
    industry = 'transportation';
    defaultIcon = 'Truck';
  } else {
    // Use a random icon for unknown industries
    defaultIcon = getRandomIcon();
  }

  return {
    id: legacyCompany.id || '',
    name: legacyCompany.name || '',
    description: `Empresa migrada del sistema anterior`,
    logoUrl: undefined,
    defaultIcon,
    color: legacyCompany.color || '#3B82F6',
    status: 'active',
    industry,
    website: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'México',
      postalCode: '',
    },
    metadata: {
      employeeCount: undefined,
      foundedDate: undefined,
      taxId: '',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system-migration',
    isDeleted: false,
  };
};

// Function to run the migration
export const migrateCompaniesToNewSystem = async (userId: string = 'system-migration'): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> => {
  console.log('🔄 Iniciando migración de empresas...');
  
  const results = {
    success: true,
    migratedCount: 0,
    errors: [] as string[],
  };

  try {
    for (const legacyCompany of legacyCompanies) {
      try {
        console.log(`Migrando empresa: ${legacyCompany.name}`);
        
        const enhancedCompany = migrateLegacyCompany(legacyCompany);
        
        // Convert to form data format for createCompany
        const formData = {
          name: enhancedCompany.name,
          description: enhancedCompany.description,
          logoUrl: enhancedCompany.logoUrl,
          defaultIcon: enhancedCompany.defaultIcon,
          color: enhancedCompany.color,
          status: enhancedCompany.status,
          industry: enhancedCompany.industry,
          website: enhancedCompany.website,
          email: enhancedCompany.email,
          phone: enhancedCompany.phone,
          address: enhancedCompany.address,
        };

        await createCompany(formData, userId);
        results.migratedCount++;
        
        console.log(`✅ Empresa migrada exitosamente: ${legacyCompany.name}`);
      } catch (error) {
        const errorMessage = `Error migrando ${legacyCompany.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        console.error(`❌ ${errorMessage}`);
        results.errors.push(errorMessage);
        results.success = false;
      }
    }

    console.log(`🎉 Migración completada. ${results.migratedCount} empresas migradas exitosamente.`);
    
    if (results.errors.length > 0) {
      console.log(`⚠️ Se encontraron ${results.errors.length} errores durante la migración.`);
    }

  } catch (error) {
    console.error('💥 Error crítico en la migración:', error);
    results.success = false;
    results.errors.push(error instanceof Error ? error.message : 'Error crítico desconocido');
  }

  return results;
};

// Function to create sample companies for testing
export const createSampleCompanies = async (userId: string = 'system-sample'): Promise<{
  success: boolean;
  createdCount: number;
  errors: string[];
}> => {
  console.log('🔄 Creando empresas de muestra...');
  
  const results = {
    success: true,
    createdCount: 0,
    errors: [] as string[],
  };

  const sampleCompanies = [
    {
      name: 'Innovatech Solutions',
      description: 'Soluciones tecnológicas innovadoras para empresas modernas',
      industry: 'technology',
      defaultIcon: 'Cpu' as CompanyIconType,
      color: '#3B82F6',
      website: 'https://innovatech.com',
      email: 'contacto@innovatech.com',
    },
    {
      name: 'EcoVerde Energía',
      description: 'Energías renovables y sostenibles para un futuro verde',
      industry: 'energy',
      defaultIcon: 'Zap' as CompanyIconType,
      color: '#10B981',
      website: 'https://ecoverde.com',
      email: 'info@ecoverde.com',
    },
    {
      name: 'Salud Integral Plus',
      description: 'Centro médico integral con tecnología de vanguardia',
      industry: 'healthcare',
      defaultIcon: 'Heart' as CompanyIconType,
      color: '#EF4444',
      website: 'https://saludintegral.com',
      email: 'citas@saludintegral.com',
    },
    {
      name: 'FinancePro Consultores',
      description: 'Consultoría financiera y gestión de inversiones',
      industry: 'finance',
      defaultIcon: 'Landmark' as CompanyIconType,
      color: '#8B5CF6',
      website: 'https://financepro.com',
      email: 'asesores@financepro.com',
    },
    {
      name: 'Construmax Edificaciones',
      description: 'Construcción y desarrollo inmobiliario de calidad',
      industry: 'construction',
      defaultIcon: 'Building2' as CompanyIconType,
      color: '#F59E0B',
      website: 'https://construmax.com',
      email: 'proyectos@construmax.com',
    },
    {
      name: 'EduTech Academy',
      description: 'Plataforma educativa digital para el aprendizaje del futuro',
      industry: 'education',
      defaultIcon: 'School' as CompanyIconType,
      color: '#06B6D4',
      website: 'https://edutech-academy.com',
      email: 'admisiones@edutech-academy.com',
    },
  ];

  try {
    for (const sampleCompany of sampleCompanies) {
      try {
        console.log(`Creando empresa de muestra: ${sampleCompany.name}`);
        
        const formData = {
          name: sampleCompany.name,
          description: sampleCompany.description,
          logoUrl: '',
          defaultIcon: sampleCompany.defaultIcon,
          color: sampleCompany.color,
          status: 'active' as const,
          industry: sampleCompany.industry,
          website: sampleCompany.website,
          email: sampleCompany.email,
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: 'México',
            postalCode: '',
          },
        };

        await createCompany(formData, userId);
        results.createdCount++;
        
        console.log(`✅ Empresa de muestra creada: ${sampleCompany.name}`);
      } catch (error) {
        const errorMessage = `Error creando ${sampleCompany.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        console.error(`❌ ${errorMessage}`);
        results.errors.push(errorMessage);
        results.success = false;
      }
    }

    console.log(`🎉 Creación de muestras completada. ${results.createdCount} empresas creadas exitosamente.`);
    
    if (results.errors.length > 0) {
      console.log(`⚠️ Se encontraron ${results.errors.length} errores durante la creación.`);
    }

  } catch (error) {
    console.error('💥 Error crítico en la creación de muestras:', error);
    results.success = false;
    results.errors.push(error instanceof Error ? error.message : 'Error crítico desconocido');
  }

  return results;
};

// Utility function to clean up migration data (use with caution)
export const cleanupMigrationData = async (): Promise<void> => {
  console.log('⚠️ Esta función debe implementar la limpieza de datos de migración');
  console.log('⚠️ Implementar solo si es necesario y con extremo cuidado');
  // TODO: Implement if needed
};