# Sistema de Gestión de Tareas Multi-Empresa - Especificaciones Completas

## Stack Tecnológico
- **Frontend:** Next.js 14 con TypeScript, Tailwind CSS, Shadcn/ui
- **Backend:** Firebase (Auth, Firestore, Cloud Functions)
- **Estado:** Zustand
- **Notificaciones:** Firebase Cloud Messaging + SendGrid
- **APIs:** Google Calendar, Google Drive, Gmail, Claude API

## Arquitectura Core

### 1. Autenticación y Usuarios
- **Login con Google OAuth** (Firebase Auth)
- **Gestión de usuarios desde configuración:**
  - Invitar usuarios por email
  - Asignar a empresas específicas
  - Definir roles (Admin, Editor, Viewer)
  - Activar/desactivar usuarios
  - Ver última actividad
- **Onboarding** para nuevos usuarios

### 2. Sistema Multi-Empresa
- CRUD de empresas desde configuración
- Cada empresa con su color/branding
- Vista unificada y vistas por empresa
- Empresa "Personal" por defecto
- Control de acceso por empresa

### 3. Gestión de Tareas
- Estados: Pendiente, En progreso, Completado, Cancelado
- Prioridades: Urgente, Alta, Media, Baja
- Subtareas con asignación a personas
- Vinculación con Google Drive docs y Calendar events
- Porcentaje de avance
- Fechas de vencimiento con alertas
- Etiquetas personalizables por empresa

### 4. Dashboard Principal - 3 Vistas

#### Mi Día
- Tareas vencidas (destacadas en rojo)
- Tareas para hoy
- Reuniones de hoy con pendientes asociados
- Alertas y seguimientos programados

#### Resumen Ejecutivo
- Gráfico circular de pendientes por empresa
- Tareas críticas/urgentes de todas las empresas
- Próximos vencimientos (7 días)
- Tareas asignadas esperando respuesta

#### Flujo de Trabajo
- Tareas iniciadas esta semana
- Completadas últimos 7 días
- Cuellos de botella (en progreso > X días)
- Timeline de próximos hitos por empresa

### 5. Gestión de Equipos
- CRUD de personas por empresa
- Asignación de tareas
- Sistema de notificaciones configurables
- Invitaciones por email

### 6. Integraciones

#### Google Suite
- **Calendar:** Sincronización de eventos, creación de tareas desde eventos
- **Drive:** Vincular documentos a tareas
- **Gmail:** Crear tareas desde emails

#### Claude API
- Crear tareas automáticamente desde emails/documentos
- Asistente inteligente para consultas
- Briefing automático pre-reuniones

### 7. Sistema de Notificaciones
- Email y push browser
- Configurables por tipo y horario
- Briefing diario configurable
- Alertas pre-reunión (tiempo configurable)

### 8. API REST + Webhooks

#### Endpoints
- `/api/v1/tasks`
- `/api/v1/companies`
- `/api/v1/people`
- `/api/v1/users`
- `/api/v1/webhooks`
- `/api/v1/events`

#### Características
- Gestión de API keys
- Rate limits configurables
- Logs de actividad
- Documentación Swagger

### 9. Búsqueda y Filtros
- Búsqueda por texto en todos los campos
- Filtros por: empresa, estado, prioridad, asignado, fechas
- Búsqueda con Cmd+K

### 10. Configuración
- **Usuarios:** Invitar, gestionar roles, permisos
- **Empresas:** CRUD completo
- **Equipos:** Gestión de personas
- **APIs:** Claude, Google, API keys propias
- **Notificaciones:** Tipos y horarios
- **Preferencias:** Tema (dark/light), timezone, idioma
- **Webhooks:** URLs y eventos

## Diseño UI/UX

### Principios
- Mobile-first responsive
- Minimalista y clean
- Micro-interacciones suaves
- Zero-friction para crear tareas
- Navegación seamless

### Componentes clave
- Sidebar colapsable con empresas
- Command palette (Cmd+K)
- Drag & drop para cambiar estados
- Toast notifications elegantes
- Loading states con skeletons
- Empty states ilustrados
- Modal rápido para crear tareas (+ o escribiendo)
- Breadcrumbs para navegación

### Características especiales
- Soporte multi-timezone
- Modo oscuro/claro
- Atajos de teclado
- Autocompletado inteligente
- Gestos nativos en móvil

## Arquitectura del Sistema

### Base de Datos (Firestore)

```
/companies
  /{companyId}
    - name: string
    - color: string
    - settings: object
    - createdAt: timestamp
    - ownerId: string

/users
  /{userId}
    - email: string
    - displayName: string
    - photoURL: string
    - companies: [{companyId: string, role: string}]
    - timezone: string
    - preferences: object
    - lastActive: timestamp
    - status: 'active' | 'inactive'
    - createdAt: timestamp
    - invitedBy: string

/invitations
  /{invitationId}
    - email: string
    - companies: [{companyId: string, role: string}]
    - invitedBy: string
    - status: 'pending' | 'accepted' | 'expired'
    - createdAt: timestamp
    - expiresAt: timestamp

/tasks
  /{taskId}
    - title: string
    - description: string
    - companyId: string
    - status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    - priority: 'urgent' | 'high' | 'medium' | 'low'
    - assignedTo: string[]
    - dueDate: timestamp
    - progress: number (0-100)
    - tags: string[]
    - linkedDocs: string[]
    - linkedEvents: string[]
    - parentTaskId: string | null
    - createdBy: string
    - createdAt: timestamp
    - updatedAt: timestamp

/people
  /{personId}
    - name: string
    - email: string
    - companies: string[]
    - role: string
    - active: boolean
    - userId: string | null

/notifications
  /{notificationId}
    - userId: string
    - type: string
    - taskId: string
    - read: boolean
    - createdAt: timestamp

/apiKeys
  /{keyId}
    - name: string
    - key: string
    - permissions: string[]
    - rateLimit: number
    - active: boolean

/webhooks
  /{webhookId}
    - url: string
    - events: string[]
    - secret: string
    - active: boolean
```

### Estructura de Carpetas

```
/app
  /api
    /v1
      /tasks
      /companies
      /people
      /users
      /webhooks
      /events
  /(auth)
    /login
      /page.tsx (Google OAuth)
    /invite
      /[token]
        /page.tsx
  /(dashboard)
    /layout.tsx
    /page.tsx
    /[company]
      /page.tsx
      /tasks
      /team
  /settings
    /page.tsx
    /users
      /page.tsx
      /invite
    /companies
    /team
    /api
    /notifications
    /preferences
/components
  /ui (shadcn components)
  /auth
    /GoogleSignInButton.tsx
    /AuthGuard.tsx
  /dashboard
    /DashboardHeader.tsx
    /MyDayView.tsx
    /ExecutiveSummaryView.tsx
    /WorkflowView.tsx
  /tasks
    /TaskCard.tsx
    /TaskList.tsx
    /TaskForm.tsx
    /TaskFilters.tsx
  /users
    /UserInviteModal.tsx
    /UserList.tsx
    /UserPermissions.tsx
  /common
    /Sidebar.tsx
    /CommandPalette.tsx
    /NotificationCenter.tsx
/lib
  /firebase
    /config.ts
    /auth.ts
    /firestore.ts
    /functions.ts
  /store
    /useAuthStore.ts
    /useTaskStore.ts
    /useCompanyStore.ts
    /useNotificationStore.ts
    /useUserStore.ts
  /hooks
    /useAuth.ts
    /useFirestore.ts
    /useGoogleCalendar.ts
    /useClaudeAPI.ts
  /utils
    /date.ts
    /validators.ts
    /api.ts
    /permissions.ts
  /services
    /google.ts
    /claude.ts
    /notifications.ts
    /invitations.ts
/types
  /index.ts
  /task.ts
  /company.ts
  /user.ts
  /auth.ts
/styles
  /globals.css
/public
  /icons
  /images
```

### Flujo de Autenticación
1. Usuario entra → Pantalla de login con botón de Google
2. OAuth con Google → Firebase Auth
3. Primera vez → Crear perfil y empresa "Personal"
4. Usuario existente → Cargar empresas y preferencias
5. Invitados → Link único por email → Aceptar → Login con Google

### Roles y Permisos
- **Super Admin**: Todo (solo el creador inicial)
- **Admin por empresa**: Gestionar empresa, usuarios, todo
- **Editor**: Crear, editar tareas, ver todo
- **Viewer**: Solo lectura

### Seguridad
- Row Level Security en Firestore
- Validación de permisos por empresa
- API keys con permisos granulares
- Rate limiting
- Validación de datos en cliente y servidor
- Sanitización de inputs
- CORS configurado correctamente
- Tokens de invitación con expiración

## Instrucciones de Implementación

Crea un sistema completo, production-ready, con todas las mejores prácticas de desarrollo. El código debe ser limpio, bien documentado, modular y fácilmente extensible. La UI debe ser hermosa, moderna y extremadamente fácil de usar. 

### Prioridad de Implementación
1. Estructura base y configuración de Firebase Auth con Google OAuth
2. Sistema de invitaciones
3. CRUD de empresas y tareas
4. Dashboard con las 3 vistas
5. Integraciones con Google Suite
6. Sistema de notificaciones
7. API REST y webhooks
8. Integración con Claude API