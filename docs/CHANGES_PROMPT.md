# 🔧 PROMPT: Cambios que Deberían Estar Implementados

## 📋 **PROBLEMAS REPORTADOS Y SOLUCIONES**

### ❌ **PROBLEMA 1: Menú de Vistas No Visible**
**Descripción**: El menú con las diferentes vistas (Por Prioridad, Por Estado, Por Vencimientos, etc.) no se muestra en la vista de tareas de empresa.

**Causa**: El componente `Tabs` de shadcn/ui está causando problemas de renderizado.

**SOLUCIÓN REQUERIDA**:
- Reemplazar el componente `Tabs` por botones simples y condicionales
- Implementar menú de vistas con botones nativos de HTML
- Mantener toda la funcionalidad de cambio de vistas
- Eliminar dependencias problemáticas del componente Tabs

**CAMBIO TÉCNICO ESPECÍFICO**:
```typescript
// ELIMINAR ESTO (problemático):
<Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full">
  <div className="mb-6">
    <TabsList className="grid w-full grid-cols-6 h-12 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
      {viewConfigs.map((view) => (
        <TabsTrigger 
          key={view.id} 
          value={view.id} 
          className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 rounded-lg transition-all duration-200"
        >
          <view.icon className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">{view.title}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  </div>
  
  <TabsContent value="priority" className="mt-0">
    <PriorityKanbanView />
  </TabsContent>
  <TabsContent value="status" className="mt-0">
    <StatusWorkflowView />
  </TabsContent>
  <TabsContent value="deadlines" className="mt-0">
    <DeadlineKanbanView />
  </TabsContent>
  <TabsContent value="calendar" className="mt-0">
    <CalendarTimelineView />
  </TabsContent>
  <TabsContent value="team" className="mt-0">
    <TeamAssignmentView />
  </TabsContent>
  <TabsContent value="list" className="mt-0">
    <TaskListView />
  </TabsContent>
</Tabs>

// REEMPLAZAR CON ESTO (funcional):
{/* Menú de vistas simplificado */}
<div className="mb-6">
  <div className="grid grid-cols-6 gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
    {viewConfigs.map((view) => (
      <button
        key={view.id}
        onClick={() => setActiveView(view.id)}
        className={`flex items-center justify-center space-x-2 p-3 rounded-lg transition-all duration-200 ${
          activeView === view.id 
            ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <view.icon className="h-4 w-4" />
        <span className="hidden sm:inline text-xs font-medium">{view.title}</span>
      </button>
    ))}
  </div>
</div>

{/* Contenido de las vistas */}
{activeView === 'priority' && (
  <PriorityKanbanView
    tasks={companyTasks}
    onTaskClick={handleOpenEditModal}
    onCompleteTask={handleCompleteTask}
    getStatusIcon={getStatusIcon}
    getStatusColor={getStatusColor}
    getPriorityColor={getPriorityColor}
    formatDate={formatDate}
    isOverdue={isOverdue}
  />
)}

{activeView === 'status' && (
  <StatusWorkflowView
    tasks={companyTasks}
    onTaskClick={handleOpenEditModal}
    onCompleteTask={handleCompleteTask}
    getStatusIcon={getStatusIcon}
    getStatusColor={getStatusColor}
    getPriorityColor={getPriorityColor}
    formatDate={formatDate}
    isOverdue={isOverdue}
  />
)}

{activeView === 'deadlines' && (
  <DeadlineKanbanView
    tasks={companyTasks}
    onTaskClick={handleOpenEditModal}
    onCompleteTask={handleCompleteTask}
    getStatusIcon={getStatusIcon}
    getStatusColor={getStatusColor}
    getPriorityColor={getPriorityColor}
    formatDate={formatDate}
    isOverdue={isOverdue}
  />
)}

{activeView === 'calendar' && (
  <CalendarTimelineView
    tasks={companyTasks}
    onTaskClick={handleOpenEditModal}
    onCompleteTask={handleCompleteTask}
    getStatusIcon={getStatusIcon}
    getStatusColor={getStatusColor}
    getPriorityColor={getPriorityColor}
    formatDate={formatDate}
    isOverdue={isOverdue}
  />
)}

{activeView === 'team' && (
  <TeamAssignmentView
    tasks={companyTasks}
    onTaskClick={handleOpenEditModal}
    onCompleteTask={handleCompleteTask}
    getStatusIcon={getStatusIcon}
    getStatusColor={getStatusColor}
    getPriorityColor={getPriorityColor}
    formatDate={formatDate}
    isOverdue={isOverdue}
  />
)}

{activeView === 'list' && (
  <TaskListView
    tasks={companyTasks}
    onTaskClick={handleOpenEditModal}
    onCompleteTask={handleCompleteTask}
    getStatusIcon={getStatusIcon}
    getStatusColor={getStatusColor}
    getPriorityColor={getPriorityColor}
    formatDate={formatDate}
    isOverdue={isOverdue}
  />
)}
```

### ❌ **PROBLEMA 2: Botón "Volver al Dashboard" No Funcional**
**Descripción**: El botón "Volver al Dashboard" no navega correctamente al dashboard principal.

**Causa**: La función `handleBackToBoard` está usando `window.location.hash = ''` en lugar del router de Next.js.

**SOLUCIÓN REQUERIDA**:
- Cambiar `window.location.hash = ''` por `router.push('/dashboard')`
- Corregir el texto del botón de "Volver al Tablero" a "Volver al Dashboard"
- Usar el router de Next.js para navegación correcta

**CAMBIO TÉCNICO ESPECÍFICO**:
```typescript
// ELIMINAR ESTO (no funcional):
const handleBackToBoard = () => {
  window.location.hash = '';
};

// REEMPLAZAR CON ESTO (funcional):
const handleBackToBoard = () => {
  router.push('/dashboard');
};
```

**CAMBIOS EN EL TEXTO DEL BOTÓN**:
```typescript
// CAMBIAR TODAS LAS INSTANCIAS DE:
<span>Volver al Tablero</span>

// POR:
<span>Volver al Dashboard</span>
```

### ❌ **PROBLEMA 3: Build Se Cuelga**
**Descripción**: El proceso de build se cuelga constantemente, impidiendo el deploy.

**Causa**: Posibles conflictos con componentes de UI o dependencias.

**SOLUCIÓN REQUERIDA**:
- Simplificar el componente eliminando dependencias problemáticas
- Reemplazar componentes complejos por implementaciones nativas
- Deploy directo sin build para evitar el problema

## 🎯 **RESULTADO ESPERADO**

### ✅ **Después de los Cambios, el Usuario Debería Ver**:

1. **MENÚ DE VISTAS VISIBLE Y FUNCIONAL**:
   - 6 botones en una fila horizontal:
     - ⭐ Por Prioridad (estrella)
     - ⏰ Por Estado (reloj)
     - 📅 Por Vencimientos (calendario)
     - 📆 Calendario (calendario)
     - 👥 Por Equipo (usuarios)
     - 📋 Lista (lista)
   - Al hacer clic en cada botón → cambia la vista
   - Botón activo → fondo blanco, texto azul
   - Botones inactivos → texto gris
   - Hover → cambio de color

2. **BOTÓN "VOLVER AL DASHBOARD" FUNCIONAL**:
   - En la esquina superior izquierda
   - Icono de flecha hacia la izquierda (←)
   - Texto: "Volver al Dashboard"
   - Al hacer clic → va al dashboard principal

3. **VISTAS ESPECÍFICAS**:
   - **Por Prioridad**: 4 columnas (Urgente, Alta, Media, Baja)
   - **Por Estado**: 3 columnas (Pendiente, En Progreso, Completada)
   - **Por Vencimientos**: Semana actual (ancho completo) + semanas futuras
   - **Calendario**: Vista temporal de calendario
   - **Por Equipo**: Organización por responsables
   - **Lista**: Vista tabular de todas las tareas

4. **CARACTERÍSTICAS ADICIONALES**:
   - Tooltips en títulos de tareas (hover)
   - Layout mejorado con semana actual destacada
   - Drag & drop funcional en vista de vencimientos

## 📁 **ARCHIVO A MODIFICAR**

**Archivo**: `src/components/dashboard/CompanyTasksView.tsx`

**Funciones a Modificar**:
- `handleBackToBoard()` - cambiar navegación
- Renderizado del menú de vistas - reemplazar Tabs por botones
- Texto de botones - cambiar "Tablero" por "Dashboard"

## 🚀 **DEPLOY REQUERIDO**

Después de los cambios:
```bash
firebase deploy --only hosting --force
```

**URL de producción**: `https://theceo.web.app`

## 🔍 **VERIFICACIÓN**

**Pasos para verificar que los cambios funcionan**:

1. Abrir `https://theceo.web.app`
2. Ir al Dashboard
3. Seleccionar una empresa
4. Verificar que aparecen los 6 botones del menú de vistas
5. Probar que los botones cambian la vista
6. Verificar que "Volver al Dashboard" funciona
7. Comprobar tooltips en títulos de tareas
8. Verificar layout mejorado en vista de vencimientos

---

**ESTE PROMPT CONTIENE TODOS LOS CAMBIOS EXACTOS NECESARIOS PARA SOLUCIONAR LOS PROBLEMAS REPORTADOS.**
