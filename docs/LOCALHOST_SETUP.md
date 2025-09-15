# 🏠 Configuración para Desarrollo Local

Esta guía te ayudará a configurar y ejecutar Octopus en tu entorno local de desarrollo.

## 📋 Prerrequisitos

### Software Requerido
- **Node.js 18+**: [Descargar aquí](https://nodejs.org/)
- **npm o yarn**: Viene con Node.js
- **Git**: [Descargar aquí](https://git-scm.com/)

### Verificar Instalación
```bash
node --version    # Debe ser 18 o superior
npm --version     # Debe estar instalado
git --version     # Debe estar instalado
```

## 🚀 Configuración Inicial

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd Octopus
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 4. Configurar Variables de Entorno
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## 🔥 Iniciar Desarrollo

### Opción 1: Script Automático (Recomendado)
```bash
./start-dev.sh
```

Este script:
- ✅ Verifica prerrequisitos
- ✅ Instala dependencias si es necesario
- ✅ Configura Firebase CLI
- ✅ Inicia emuladores de Firebase
- ✅ Inicia servidor de desarrollo Next.js
- ✅ Abre las URLs necesarias

### Opción 2: Manual
```bash
# Terminal 1: Emuladores de Firebase
firebase emulators:start --only auth,firestore,storage --import=./firebase-data --export-on-exit=./firebase-data

# Terminal 2: Servidor de desarrollo
npm run dev
```

## 🌐 URLs de Desarrollo

Una vez iniciado, tendrás acceso a:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Aplicación** | http://localhost:3000 | Interfaz principal de Octopus |
| **Emuladores** | http://localhost:4000 | Panel de control de Firebase |
| **Firestore UI** | http://localhost:4000/firestore | Base de datos en tiempo real |
| **Auth UI** | http://localhost:4000/auth | Gestión de usuarios |

## 🔧 Funcionalidades Disponibles en Localhost

### ✅ Completamente Funcionales
- **Autenticación**: Login con Google (usando emuladores)
- **Gestión de Empresas**: Crear, editar, eliminar empresas
- **Logos de Empresas**: Visualización mejorada con fallbacks
- **Drag & Drop**: Reordenar empresas (se memoriza automáticamente)
- **Dashboard**: Página principal con todas las funcionalidades
- **Gestión de Tareas**: CRUD completo de tareas
- **Persistencia**: El orden de empresas se guarda en localStorage

### 🎯 Características Destacadas

#### 1. Logos de Empresas Mejorados
- ✅ Carga progresiva con skeleton loading
- ✅ Manejo robusto de errores
- ✅ Fallback automático a iconos predeterminados
- ✅ Transiciones suaves
- ✅ Soporte para diferentes tamaños

#### 2. Drag & Drop Inteligente
- ✅ Reordenamiento visual en tiempo real
- ✅ Persistencia automática en localStorage
- ✅ Restauración del orden al recargar
- ✅ Indicadores visuales durante el arrastre

#### 3. Dashboard como Homepage
- ✅ Redirección automática al dashboard
- ✅ Página de bienvenida para usuarios no autenticados
- ✅ Loading states apropiados
- ✅ Navegación fluida

## 🐛 Solución de Problemas

### Error: "Firebase CLI no está instalado"
```bash
npm install -g firebase-tools
firebase login
```

### Error: "Puerto 3000 en uso"
```bash
# Encontrar proceso que usa el puerto
lsof -i :3000
# Terminar proceso
kill -9 <PID>
```

### Error: "Emuladores no se inician"
```bash
# Verificar que Firebase esté configurado
firebase projects:list
# Reiniciar emuladores
firebase emulators:start --only auth,firestore,storage
```

### Error: "Variables de entorno no encontradas"
```bash
# Verificar archivo .env.local
ls -la .env.local
# Si no existe, copiar desde ejemplo
cp .env.example .env.local
```

### Error: "Dependencias no instaladas"
```bash
# Limpiar cache de npm
npm cache clean --force
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 📊 Datos de Prueba

Los emuladores incluyen datos de prueba que se guardan en `./firebase-data/`:

- **Usuarios de prueba**: Configurados en el emulador de Auth
- **Empresas de ejemplo**: Creadas automáticamente
- **Tareas de muestra**: Para probar funcionalidades

## 🔄 Flujo de Desarrollo

### 1. Iniciar Desarrollo
```bash
./start-dev.sh
```

### 2. Hacer Cambios
- Edita archivos en `src/`
- Los cambios se reflejan automáticamente
- Los emuladores mantienen los datos

### 3. Probar Funcionalidades
- Crea empresas y tareas
- Prueba el drag & drop
- Verifica la persistencia del orden
- Prueba los logos de empresas

### 4. Detener Desarrollo
```bash
# Presiona Ctrl+C en la terminal
# O cierra las terminales
```

## 🚀 Próximos Pasos

Una vez que tengas el entorno funcionando:

1. **Explora la interfaz**: Navega por todas las secciones
2. **Crea datos de prueba**: Empresas y tareas
3. **Prueba funcionalidades**: Drag & drop, logos, etc.
4. **Revisa el código**: Familiarízate con la estructura
5. **Haz modificaciones**: Implementa nuevas features

## 📞 Soporte

Si encuentras problemas:

1. Revisa esta documentación
2. Verifica la consola del navegador
3. Revisa los logs de los emuladores
4. Abre un issue en GitHub

---

**¡Disfruta desarrollando con Octopus! 🐙**




