# Arquitectura Refactorizada - Vista General y Vista por Empresa

## 📋 Resumen

Este documento describe la arquitectura refactorizada de las vistas principales del sistema de gestión de tareas. La refactorización se enfocó en eliminar duplicación de código, mejorar la mantenibilidad y crear una estructura escalable.

## 🏗️ Arquitectura General

### Estructura de Directorios

```
src/
├── lib/
│   ├── utils/
│   │   └── taskUtils.ts          # Utilidades centralizadas para tareas
│   ├── managers/
│   │   ├── ViewConfigManager.ts  # Configuración de vistas
│   │   └── CompanyFilterManager.ts # Filtrado de empresas
│   └── hooks/
│       └── useTaskView.ts        # Hook para manejo de vistas
├── components/
│   └── dashboard/
│       ├── shared/               # Componentes compartidos
│       │   ├── TaskViewHeader.tsx
│       │   ├── TaskStatsCards.tsx
│       │   ├── ViewSelector.tsx
│       │   └── ViewContentRenderer.tsx
│       ├── PriorityKanbanView.tsx
│       ├── StatusWorkflowView.tsx
│       ├── DeadlineKanbanView.tsx
│       ├── TaskListView.tsx
│       ├── TeamAssignmentView.tsx
│       ├── CalendarTimelineView.tsx
│       ├── CompanyTasksView.tsx
│       └── GeneralKanbanView.tsx
└── app/
    └── dashboard/
        ├── general/
        │   └── page.tsx          # Vista General refactorizada
        └── page.tsx              # Dashboard principal
```

## 🔧 Componentes Principales

### 1. Utilidades Centralizadas (`lib/utils/taskUtils.ts`)

**Propósito**: Eliminar duplicación de funciones en 36+ archivos.

**Funciones principales**:
- `getStatusIcon(status)` - Iconos para estados
- `getStatusColor(status)` - Colores CSS para estados
- `getStatusText(status)` - Texto legible para estados
- `getPriorityColor(priority)` - Colores CSS para prioridades
- `getPriorityText(priority)` - Texto legible para prioridades
- `formatTaskDate(date)` - Formateo de fechas
- `isTaskOverdue(dueDate)` - Verificación de vencimiento
- `getDaysRemaining(dueDate)` - Cálculo de días restantes
- `getActiveTasks(tasks)` - Filtrado de tareas activas
- `groupTasksBy(tasks, keyFn)` - Agrupación de tareas

**Uso**:
```typescript
import { getStatusColor, formatTaskDate, isTaskOverdue } from '@/lib/utils/taskUtils';

const statusClass = getStatusColor(task.status);
const formattedDate = formatTaskDate(task.dueDate);
const overdue = isTaskOverdue(task.dueDate);
```

### 2. Managers

#### ViewConfigManager (`lib/managers/ViewConfigManager.ts`)

**Propósito**: Centralizar configuración de vistas disponibles.

**Características**:
- Define todas las vistas disponibles (priority, status, deadlines, calendar, team, list)
- Proporciona metadatos (título, icono, descripción)
- Funciones helper para obtener configuraciones

**Uso**:
```typescript
import { getAllViewConfigs, getDefaultView } from '@/lib/managers/ViewConfigManager';

const views = getAllViewConfigs();
const defaultView = getDefaultView();
```

#### CompanyFilterManager (`lib/managers/CompanyFilterManager.ts`)

**Propósito**: Centralizar lógica de filtrado de empresas por usuario.

**Funciones principales**:
- `filterUserCompanies(companies, options)` - Filtra empresas del usuario
- `mergeCompaniesForView(userCompanies, extraCompanies)` - Combina listas
- `getCompanyName(companyId, companies)` - Obtiene nombre de empresa
- `getCompanyColor(companyId, companies)` - Obtiene color de empresa

**Uso**:
```typescript
import { filterUserCompanies, mergeCompaniesForView } from '@/lib/managers/CompanyFilterManager';

const userCompanies = filterUserCompanies(companies, {
  userId: user?.uid,
  userEmail: user?.email
});
```

### 3. Hook Personalizado (`hooks/useTaskView.ts`)

**Propósito**: Centralizar lógica de estado y utilidades para vistas de tareas.

**Características**:
- Maneja estado de vista activa
- Proporciona configuraciones de vistas
- Filtra tareas activas automáticamente
- Proporciona helpers para formateo y estilos

**Uso**:
```typescript
import { useTaskView } from '@/hooks/useTaskView';

const { activeView, setActiveView, viewConfigs, activeTasks, helpers } = useTaskView({
  tasks,
  companies
});

// helpers incluye: getStatusIcon, getStatusColor, getPriorityColor, formatDate, isOverdue, etc.
```

### 4. Componentes Compartidos

#### TaskViewHeader
Header reutilizable para todas las vistas de tareas.

**Props**:
- `title` - Título de la vista
- `subtitle` - Subtítulo/descripción
- `company?` - Empresa opcional
- `onCreateTask` - Handler para crear tarea
- `onBack?` - Handler opcional para volver

#### TaskStatsCards
Tarjetas de estadísticas con memoización.

**Props**:
- `tasks` - Array de tareas
- `companiesCount?` - Número opcional de empresas

#### ViewSelector
Selector de vistas con configuración centralizada.

**Props**:
- `viewConfigs` - Configuraciones de vistas
- `activeView` - Vista activa
- `onViewChange` - Handler para cambiar vista
- `title?` - Título opcional
- `description?` - Descripción opcional

#### ViewContentRenderer
Renderizador centralizado que muestra la vista apropiada.

**Props**:
- `activeView` - Vista a renderizar
- `tasks` - Tareas a mostrar
- `helpers` - Objeto con funciones helper
- `showCompanyInfo?` - Mostrar info de empresa
- `companyId?` - ID de empresa opcional
- `onTaskClick` - Handler para click en tarea
- `onCompleteTask` - Handler para completar tarea

## 📊 Vistas Principales

### Vista General (`app/dashboard/general/page.tsx`)

**Antes**: 503 líneas
**Después**: ~160 líneas (68% reducción)

**Características**:
- Muestra todas las tareas de todas las empresas
- Usa `useTaskView` para manejo de estado
- Usa componentes compartidos (TaskViewHeader, TaskStatsCards, ViewSelector, ViewContentRenderer)
- Filtrado automático de empresas del usuario

### Vista por Empresa (`components/dashboard/CompanyTasksView.tsx`)

**Antes**: 577 líneas
**Después**: ~280 líneas (51% reducción)

**Características**:
- Muestra tareas de una empresa específica
- Selector de empresas integrado
- Soporte para mostrar todas las empresas
- Usa componentes compartidos

### Vista General Kanban (`components/dashboard/GeneralKanbanView.tsx`)

**Antes**: 438 líneas
**Después**: ~180 líneas (59% reducción)

**Características**:
- Vista kanban general con filtrado por empresa
- Selector de empresas con contadores
- Creación rápida de tareas por empresa

## 🎯 Optimizaciones de Rendimiento

### Memoización

Los siguientes componentes están memoizados para prevenir re-renders innecesarios:

- `ViewContentRenderer` - Solo re-renderiza cuando cambian props relevantes
- `TaskViewHeader` - Memoizado para evitar re-renders en cambios de estado interno
- `TaskStatsCards` - Usa `useMemo` para cálculos de estadísticas

### Lazy Loading

Las vistas pesadas se cargan bajo demanda:
- Cada vista (PriorityKanbanView, StatusWorkflowView, etc.) se carga solo cuando está activa
- Los componentes Droppable se renderizan solo cuando hay tareas

## 🔄 Flujo de Datos

```
User Action
    ↓
Component (GeneralViewPage / CompanyTasksView)
    ↓
useTaskView Hook
    ↓
TaskUtils / Managers
    ↓
ViewContentRenderer
    ↓
Specific View Component (PriorityKanbanView, etc.)
```

## 📝 Mejores Prácticas

### 1. Siempre usar utilidades centralizadas

❌ **Mal**:
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100';
    // ...
  }
};
```

✅ **Bien**:
```typescript
import { getStatusColor } from '@/lib/utils/taskUtils';
const statusClass = getStatusColor(status);
```

### 2. Usar el hook useTaskView para vistas

❌ **Mal**:
```typescript
const [activeView, setActiveView] = useState('list');
const getStatusIcon = (status) => { /* ... */ };
// ... más funciones duplicadas
```

✅ **Bien**:
```typescript
const { activeView, setActiveView, helpers } = useTaskView({ tasks, companies });
```

### 3. Usar componentes compartidos

❌ **Mal**:
```typescript
<div className="header">
  <h1>{title}</h1>
  <Button onClick={onCreate}>Nueva Tarea</Button>
</div>
```

✅ **Bien**:
```typescript
<TaskViewHeader
  title={title}
  subtitle={subtitle}
  onCreateTask={onCreate}
/>
```

## 🚀 Migración de Componentes Existentes

Para migrar un componente existente:

1. **Reemplazar funciones duplicadas**:
   ```typescript
   // Antes
   const getStatusColor = (status) => { /* ... */ };
   
   // Después
   import { getStatusColor } from '@/lib/utils/taskUtils';
   ```

2. **Usar hook useTaskView si es una vista**:
   ```typescript
   // Antes
   const [activeView, setActiveView] = useState('list');
   const activeTasks = tasks.filter(/* ... */);
   
   // Después
   const { activeView, setActiveView, activeTasks, helpers } = useTaskView({ tasks });
   ```

3. **Usar componentes compartidos**:
   ```typescript
   // Antes
   <div className="header">...</div>
   
   // Después
   <TaskViewHeader title="..." onCreateTask={...} />
   ```

## 📈 Métricas de Mejora

- **Reducción de código**: ~1,200 líneas eliminadas/refactorizadas
- **Eliminación de duplicación**: Funciones centralizadas en lugar de 36+ copias
- **Mejora de mantenibilidad**: Cambios en un solo lugar
- **Mejor organización**: Componentes más pequeños y enfocados
- **Preparado para escalar**: Estructura modular y extensible

## 🔮 Futuras Mejoras

1. **Tests unitarios**: Agregar tests para utilidades y managers
2. **Storybook**: Documentación visual de componentes
3. **Performance monitoring**: Agregar métricas de rendimiento
4. **Type safety**: Mejorar tipos TypeScript
5. **Accessibility**: Mejorar accesibilidad de componentes

## 📚 Referencias

- [TaskUtils API](./taskUtils.md) - Documentación completa de utilidades
- [ViewConfigManager API](./viewConfigManager.md) - Configuración de vistas
- [CompanyFilterManager API](./companyFilterManager.md) - Filtrado de empresas
- [useTaskView Hook](./useTaskView.md) - Hook de vistas

