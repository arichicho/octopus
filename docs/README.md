# 🐙 Octopus - Sistema de Gestión de Tareas y Productividad

## 📋 Descripción

Octopus es una aplicación web moderna para la gestión de tareas, proyectos y productividad personal y empresarial. Desarrollada con Next.js 15, TypeScript, Firebase y Shadcn/ui.

## 🚀 Características Principales

- **Dashboard Intuitivo**: Vista general con métricas y estadísticas en tiempo real
- **Gestión de Tareas**: Creación, asignación y seguimiento de tareas
- **Calendario Integrado**: Programación de eventos y reuniones
- **Reportes y Analytics**: Métricas de productividad y rendimiento
- **Gestión de Equipos**: Colaboración y asignación de responsabilidades
- **Configuración Completa**: Personalización de perfil y preferencias
- **Sidebar Colapsible**: Navegación intuitiva y responsive

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Lucide React Icons
- **Backend**: Firebase (Auth, Firestore, Functions)
- **Estado**: Zustand
- **Fechas**: date-fns
- **Desarrollo**: Firebase Emulators

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas del dashboard
│   ├── dashboard/         # Páginas del dashboard
│   │   ├── my-day/        # Vista "Mi Día"
│   │   ├── tasks/         # Gestión de tareas
│   │   ├── calendar/      # Calendario
│   │   └── reports/       # Reportes
│   └── settings/          # Configuración
│       └── profile/       # Perfil de usuario
├── components/            # Componentes reutilizables
│   ├── auth/             # Componentes de autenticación
│   ├── common/           # Componentes comunes (Sidebar, etc.)
│   ├── dashboard/        # Componentes del dashboard
│   └── ui/               # Componentes de UI (Shadcn/ui)
├── lib/                  # Utilidades y configuración
│   ├── firebase/         # Configuración de Firebase
│   └── hooks/            # Hooks personalizados
└── types/                # Tipos de TypeScript
```

## 🎯 Implementación del Sidebar - Octopus

### ✅ Características Implementadas

#### 🔧 **Funcionalidad Colapsible**
- Sidebar completamente funcional con botón de colapso/expansión
- Transiciones suaves y animaciones fluidas
- Estado persistente del sidebar (colapsado/expandido)
- Responsive design para diferentes tamaños de pantalla

#### 🧭 **Navegación Completa**
- **Dashboard**: Vista General, Mi Día, Tareas, Calendario
- **Análisis**: Reportes, Métricas, KPIs
- **Equipo**: Miembros, Proyectos, Documentos
- **Configuración**: General, Perfil, Notificaciones, Seguridad, Integraciones, Facturación, API

#### 🎨 **Diseño y UX**
- Iconos intuitivos para cada sección
- Badges para mostrar notificaciones y contadores
- Estados activos con indicadores visuales
- Búsqueda integrada en el sidebar
- Perfil de usuario con avatar y información
- Acciones rápidas (Nueva Tarea, Programar)

#### 📱 **Responsive Design**
- Adaptación automática a diferentes tamaños de pantalla
- Sidebar colapsado en pantallas pequeñas
- Navegación optimizada para móviles

### 📄 **Páginas Implementadas**

#### 🏠 **Dashboard Principal** (`/dashboard`)
- Métricas clave con tarjetas informativas
- Actividad reciente con estados visuales
- Acciones rápidas para funciones comunes
- Agenda del día con eventos programados

#### 📅 **Mi Día** (`/dashboard/my-day`)
- Vista enfocada en tareas del día actual
- Estadísticas de productividad diaria
- Lista detallada de tareas con prioridades
- Indicadores de tareas vencidas y completadas

#### ✅ **Tareas** (`/dashboard/tasks`)
- Vista de cuadrícula con todas las tareas
- Filtros por fecha, asignado y estado
- Búsqueda avanzada de tareas
- Gestión completa de tareas con acciones

#### 📊 **Calendario** (`/dashboard/calendar`)
- Vista de calendario mensual interactiva
- Eventos del día con detalles
- Próximos eventos de la semana
- Acciones rápidas para gestión de eventos

#### 📈 **Reportes** (`/dashboard/reports`)
- Métricas de productividad y rendimiento
- Gráficos de tendencias (placeholder)
- Rendimiento del equipo
- Estado de proyectos con progreso

#### ⚙️ **Configuración** (`/settings`)
- Panel principal de configuración
- Acceso rápido a todas las secciones
- Estado de cuenta y suscripción
- Acciones rápidas de configuración

#### 👤 **Perfil** (`/settings/profile`)
- Información personal completa
- Habilidades y certificaciones
- Estadísticas de usuario
- Preferencias de idioma y región

### 🔗 **Navegación Funcional**

Todos los enlaces del sidebar están completamente funcionales y dirigen a las páginas correspondientes:

- ✅ Dashboard → `/dashboard`
- ✅ Mi Día → `/dashboard/my-day`
- ✅ Tareas → `/dashboard/tasks`
- ✅ Calendario → `/dashboard/calendar`
- ✅ Reportes → `/dashboard/reports`
- ✅ Configuración → `/settings`
- ✅ Perfil → `/settings/profile`

### 🎨 **Diseño y Estilo**

- **Colores**: Paleta azul profesional con acentos
- **Tipografía**: Jerarquía clara con diferentes pesos
- **Espaciado**: Consistente y bien balanceado
- **Iconos**: Lucide React para consistencia visual
- **Estados**: Hover, active y focus bien definidos
- **Dark Mode**: Soporte completo para modo oscuro

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Firebase CLI
- Cuenta de Firebase

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd Octopus
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Firebase

```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Iniciar sesión en Firebase
firebase login

# Inicializar proyecto Firebase
firebase init
```

### 4. Configurar Variables de Entorno

Crear archivo `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Firebase Emulators (Development)
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001
```

### 5. Configurar Firebase Emulators

```bash
# Iniciar emuladores
firebase emulators:start --only auth,firestore,functions
```

### 6. Ejecutar el Proyecto

```bash
# Desarrollo
npm run dev

# O usar el script automatizado
./start-dev.sh
```

## 📱 Uso de la Aplicación

### 🔐 Autenticación
- Inicio de sesión con Google
- Modo demo disponible para desarrollo
- Protección de rutas con AuthGuard

### 🧭 Navegación
- Sidebar colapsible con navegación completa
- Búsqueda integrada
- Acciones rápidas desde el sidebar

### 📊 Dashboard
- Vista general con métricas clave
- Actividad reciente
- Agenda del día
- Acciones rápidas

### ✅ Gestión de Tareas
- Crear y editar tareas
- Asignar prioridades
- Establecer fechas de vencimiento
- Marcar como completadas

### 📅 Calendario
- Vista mensual de eventos
- Programar reuniones
- Gestionar agenda personal

### 📈 Reportes
- Métricas de productividad
- Rendimiento del equipo
- Estado de proyectos
- Exportación de datos

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Construcción
npm run build

# Producción
npm start

# Linting
npm run lint

# Type checking
npm run type-check

# Iniciar emuladores y desarrollo
./start-dev.sh

# Solo emuladores
./start-emulators.sh
```

## 🏗️ Arquitectura

### Frontend
- **Next.js 15**: App Router para routing moderno
- **TypeScript**: Tipado estático para mayor seguridad
- **Tailwind CSS**: Framework CSS utility-first
- **Shadcn/ui**: Componentes de UI modernos y accesibles

### Backend
- **Firebase Auth**: Autenticación segura
- **Firestore**: Base de datos NoSQL en tiempo real
- **Firebase Functions**: Funciones serverless
- **Firebase Emulators**: Entorno de desarrollo local

### Estado y Datos
- **Zustand**: Gestión de estado ligera
- **React Hooks**: Hooks personalizados para lógica reutilizable
- **date-fns**: Manipulación de fechas

## 🎨 UI/UX Guidelines

### Principios de Diseño
- **Simplicidad**: Interfaces limpias y minimalistas
- **Consistencia**: Patrones de diseño uniformes
- **Accesibilidad**: Cumplimiento de estándares WCAG
- **Responsive**: Funcionalidad en todos los dispositivos

### Componentes
- **Shadcn/ui**: Biblioteca de componentes moderna
- **Lucide React**: Iconos consistentes y escalables
- **Tailwind CSS**: Sistema de diseño utility-first

## 🚀 Próximos Pasos

### Funcionalidades Pendientes
- [ ] Integración con Google Calendar
- [ ] Notificaciones push
- [ ] Exportación de reportes
- [ ] Integración con Slack
- [ ] API REST completa
- [ ] Tests automatizados

### Mejoras de UX
- [ ] Animaciones más fluidas
- [ ] Modo offline
- [ ] PWA capabilities
- [ ] Temas personalizables

## 📝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación en `/docs`

---

**Octopus** - Transformando la productividad, una tarea a la vez 🐙
