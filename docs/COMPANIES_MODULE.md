# Módulo de Configuración y CRUD de Empresas

## Descripción General

El módulo de empresas es un sistema completo de gestión empresarial que permite administrar todas las empresas de la aplicación con funcionalidades avanzadas de CRUD, configuración, análisis y gestión masiva.

## Características Principales

### 🏢 Gestión Básica de Empresas
- **Crear empresas** con información completa
- **Editar** datos de empresas existentes
- **Eliminar** empresas (soft delete)
- **Restaurar** empresas eliminadas
- **Archivar** empresas inactivas

### 🔍 Búsqueda y Filtros
- Búsqueda por nombre, descripción e industria
- Filtros por estado (activa, inactiva, archivada)
- Filtros por industria
- Ordenamiento por nombre, fecha de creación y actualización
- Vista de empresas eliminadas

### 📊 Análisis y Estadísticas
- Métricas de rendimiento en tiempo real
- Distribución por estado y industria
- Análisis geográfico
- Tendencias de crecimiento
- Actividad reciente

### ⚙️ Configuración Avanzada
- Configuración general del sistema
- Configuración de seguridad
- Integraciones con servicios externos
- Configuración de notificaciones
- Gestión de datos y respaldos
- Personalización de la interfaz

### 🚀 Gestión Masiva
- Selección múltiple de empresas
- Acciones masivas (activar, desactivar, archivar, eliminar)
- Importación/exportación de datos
- Progreso visual de operaciones masivas

## Estructura de Archivos

```
src/
├── app/dashboard/settings/companies/
│   └── page.tsx                    # Página principal de configuración
├── components/companies/
│   ├── CompanyModal.tsx           # Modal para crear/editar empresas
│   ├── CompanyAdvancedManagement.tsx # Gestión avanzada y masiva
│   ├── CompanySettingsPanel.tsx   # Panel de configuración
│   ├── CompanyAnalytics.tsx       # Análisis y estadísticas
│   ├── CompanyDragDrop.tsx        # Drag & drop para reordenar
│   └── CompanySelector.tsx        # Selector de empresas
├── lib/store/
│   └── useCompanyEnhancedStore.ts # Store de estado de empresas
├── lib/firebase/
│   └── companies.ts               # Funciones de Firebase
└── types/
    └── company-enhanced.ts        # Tipos de datos
```

## Tipos de Datos

### CompanyEnhanced
```typescript
interface CompanyEnhanced {
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
```

### Estados de Empresa
- `active`: Empresa activa y operativa
- `inactive`: Empresa temporalmente inactiva
- `archived`: Empresa archivada

## Funcionalidades Detalladas

### 1. Gestión Básica

#### Crear Empresa
```typescript
const handleCreateCompany = async (data: CompanyFormDataEnhanced) => {
  try {
    const newCompany = await createNewCompany(data, userId);
    console.log('Empresa creada:', newCompany);
  } catch (error) {
    console.error('Error al crear empresa:', error);
  }
};
```

#### Editar Empresa
```typescript
const handleEditCompany = async (companyId: string, data: Partial<CompanyFormDataEnhanced>) => {
  try {
    await updateExistingCompany(companyId, data);
    console.log('Empresa actualizada');
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
  }
};
```

#### Eliminar Empresa
```typescript
const handleDeleteCompany = async (companyId: string) => {
  try {
    await deleteCompanyAction(companyId);
    console.log('Empresa eliminada');
  } catch (error) {
    console.error('Error al eliminar empresa:', error);
  }
};
```

### 2. Búsqueda y Filtros

#### Búsqueda
```typescript
const handleSearch = (query: string) => {
  if (query.trim()) {
    searchCompaniesAction(query, userId);
  } else {
    filterCompanies('');
  }
};
```

#### Filtros
```typescript
const filteredCompanies = companies.filter(company => {
  // Filtro por estado
  if (statusFilter !== 'all' && company.status !== statusFilter) {
    return false;
  }
  
  // Filtro por industria
  if (industryFilter !== 'all' && company.industry !== industryFilter) {
    return false;
  }
  
  return true;
});
```

### 3. Gestión Masiva

#### Acciones Masivas
```typescript
const handleBulkAction = async (companyIds: string[], action: string) => {
  switch (action) {
    case 'activate':
      await bulkUpdateCompanies(companyIds, { status: 'active' });
      break;
    case 'deactivate':
      await bulkUpdateCompanies(companyIds, { status: 'inactive' });
      break;
    case 'archive':
      await bulkArchiveCompanies(companyIds);
      break;
    case 'delete':
      await bulkDeleteCompanies(companyIds);
      break;
    case 'restore':
      await bulkRestoreCompanies(companyIds);
      break;
  }
};
```

### 4. Configuración

#### Configuración General
- Archivado automático de empresas inactivas
- Respaldo automático de datos
- Configuración de idioma y zona horaria
- Habilitación de notificaciones y auditoría

#### Configuración de Seguridad
- Autenticación de dos factores
- Tiempo de sesión configurable
- Políticas de contraseñas
- Acceso a API

#### Integraciones
- Slack
- Microsoft Teams
- Notificaciones por email y SMS
- Webhooks personalizados

### 5. Análisis

#### Métricas Principales
- Total de empresas
- Empresas activas vs inactivas
- Crecimiento mensual
- Tasa de activación y retención

#### Distribuciones
- Por estado (activa, inactiva, archivada)
- Por industria
- Por ubicación geográfica

## Uso del Store

### Estado del Store
```typescript
interface CompanyEnhancedStore {
  companies: CompanyEnhanced[];
  activeCompanies: CompanyEnhanced[];
  selectedCompany: CompanyEnhanced | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filteredCompanies: CompanyEnhanced[];
}
```

### Acciones Disponibles
```typescript
// Lectura
fetchCompanies: (userId?: string) => Promise<void>;
fetchActiveCompanies: (userId?: string) => Promise<void>;
fetchCompany: (companyId: string) => Promise<void>;
searchCompaniesAction: (searchTerm: string, userId?: string) => Promise<void>;

// Crear/Actualizar/Eliminar
createNewCompany: (data: CompanyFormDataEnhanced, userId: string) => Promise<CompanyEnhanced>;
updateExistingCompany: (companyId: string, data: Partial<CompanyFormDataEnhanced>) => Promise<void>;
deleteCompanyAction: (companyId: string) => Promise<void>;
restoreCompanyAction: (companyId: string) => Promise<void>;

// Operaciones Masivas
bulkUpdateCompanies: (companyIds: string[], updates: Partial<CompanyFormDataEnhanced>) => Promise<void>;
bulkDeleteCompanies: (companyIds: string[]) => Promise<void>;
bulkRestoreCompanies: (companyIds: string[]) => Promise<void>;
bulkArchiveCompanies: (companyIds: string[]) => Promise<void>;

// Utilidades
setSelectedCompany: (company: CompanyEnhanced | null) => void;
reorderCompanies: (reorderedCompanies: CompanyEnhanced[]) => void;
filterCompanies: (query: string) => void;
clearError: () => void;
reset: () => void;
```

## Componentes Principales

### CompanyModal
Modal para crear y editar empresas con validación de formularios.

### CompanyAdvancedManagement
Panel de gestión avanzada con:
- Selección masiva
- Acciones en lote
- Importación/exportación
- Progreso visual

### CompanySettingsPanel
Panel de configuración con pestañas para:
- Configuración general
- Seguridad
- Integraciones
- Notificaciones
- Gestión de datos
- Personalización

### CompanyAnalytics
Panel de análisis con:
- Métricas en tiempo real
- Gráficos de distribución
- Tendencias
- Estadísticas geográficas

## Navegación

El módulo está accesible desde:
- **Sidebar**: `/dashboard/settings/companies`
- **Menú de configuración**: Configuración > Empresas

## Permisos y Seguridad

- Solo usuarios autenticados pueden acceder
- Las empresas están asociadas al usuario que las crea
- Validación de datos en frontend y backend
- Soft delete para evitar pérdida de datos

## Integración con Firebase

### Colección: `companies`
- Documentos con estructura `CompanyEnhanced`
- Índices para búsqueda eficiente
- Reglas de seguridad por usuario

### Operaciones Soportadas
- CRUD completo
- Búsqueda por texto
- Filtros por estado e industria
- Operaciones masivas
- Soft delete y restauración

## Personalización

### Colores de Empresa
Paleta predefinida de colores para identificar empresas visualmente.

### Iconos
Iconos de Lucide React para representar diferentes tipos de empresas.

### Industrias
Lista predefinida de industrias con iconos asociados.

## Mejores Prácticas

1. **Validación**: Siempre validar datos antes de enviar a Firebase
2. **Manejo de Errores**: Implementar manejo robusto de errores
3. **Optimización**: Usar filtros y paginación para grandes volúmenes
4. **UX**: Proporcionar feedback visual para todas las acciones
5. **Seguridad**: Validar permisos en frontend y backend

## Troubleshooting

### Problemas Comunes

1. **Empresas no se cargan**
   - Verificar conexión a Firebase
   - Revisar reglas de seguridad
   - Comprobar userId

2. **Errores de validación**
   - Verificar formato de datos
   - Revisar reglas de validación
   - Comprobar campos requeridos

3. **Problemas de rendimiento**
   - Implementar paginación
   - Optimizar consultas
   - Usar índices apropiados

## Futuras Mejoras

- [ ] Gráficos interactivos
- [ ] Reportes personalizados
- [ ] Integración con CRM
- [ ] API pública
- [ ] Notificaciones push
- [ ] Auditoría completa
- [ ] Backup automático
- [ ] Migración de datos
