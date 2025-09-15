# 🐙 Octopus - Sistema de Gestión de Tareas Empresarial

## 🌐 **Aplicación en Producción**
**https://theceo.web.app**

### 📋 **Estado del Deploy**
- ✅ **Último deploy**: 31 de Agosto, 2025 - 15:08 GMT
- ✅ **Estado**: Funcionando correctamente
- ✅ **Funcionalidades**: Todas las vistas con drag & drop activo

---

## 🚀 **Deploy a Producción**

### Deploy Automático
```bash
# Build y deploy completo
npm run build:static
firebase deploy --only hosting
```

### Deploy Manual
```bash
# Usar el script automatizado
./deploy.sh
```

**📖 [Ver documentación completa de deployment](docs/DEPLOYMENT.md)**

---

## ✨ **Funcionalidades Principales**

### 🎯 **Vistas de Tareas con Drag & Drop**
1. **Por Prioridad** - Arrastra tareas entre prioridades
2. **Por Estado** - Arrastra tareas entre estados de trabajo
3. **Por Vencimientos** - Arrastra tareas entre semanas
4. **Por Equipo** - Arrastra tareas entre miembros del equipo
5. **Calendario** - Vista temporal de tareas
6. **Lista** - Vista de lista simple

### 👥 **Gestión de Equipos**
- **Usuarios reales** de la empresa
- **Asignación visual** de tareas
- **Sección "Sin Asignar"** con ancho completo
- **Avatares y datos** de usuarios

### 🏢 **Sistema Multi-Empresa**
- **Colores personalizados** por empresa
- **Control de acceso** por empresa
- **Sidebar con selector** de empresas

---

## 🛠️ **Stack Tecnológico**

- **Frontend**: Next.js 15.5.2 + React + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Estado**: Zustand
- **Deploy**: Firebase Hosting (CDN global)

---

## 🚀 **Inicio Rápido**

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Firebase

### Instalación
```bash
# Clonar repositorio
git clone <repository-url>
cd Octopus

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# Iniciar desarrollo
npm run dev
```

### Scripts Disponibles
```bash
npm run dev          # Desarrollo con Turbopack
npm run build        # Build de producción
npm run build:static # Build estático para hosting
npm run deploy       # Deploy a Firebase
```

---

## 📱 **Acceso a la Aplicación**

### Producción
- **URL**: https://theceo.web.app
- **Login**: Google OAuth
- **Email autorizado**: ariel.chicho@daleplayrecords.com

### Desarrollo Local
- **URL**: http://localhost:3000
- **Modo**: Desarrollo con hot reload

---

## 🎯 **Características Destacadas**

### ✅ **Drag & Drop Completo**
- **Todas las vistas** soportan drag & drop
- **Feedback visual** durante el arrastre
- **Optimistic updates** para mejor UX
- **Rollback automático** en caso de error

### ✅ **Responsive Design**
- **Mobile-first** design
- **Adaptativo** a todas las pantallas
- **Touch-friendly** para dispositivos móviles

### ✅ **Performance Optimizada**
- **Build estático** para máxima velocidad
- **CDN global** de Firebase
- **Lazy loading** de componentes
- **Compresión automática**

---

## 📊 **Estadísticas del Deploy**

- **Archivos desplegados**: 136
- **Páginas estáticas**: 32 rutas
- **Tamaño de bundle**: ~102 kB
- **Tiempo de carga**: < 2 segundos
- **CDN**: Global (Firebase)

---

## 🔧 **Configuración**

### Variables de Entorno
```env
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=iamtheoceo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=iamtheoceo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=iamtheoceo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=511546212594
NEXT_PUBLIC_FIREBASE_APP_ID=1:511546212594:web:08397e8ff7f942a34a906b
```

### Firebase Configuration
```json
{
  "hosting": {
    "site": "theceo",
    "public": "out",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## 📚 **Documentación**

- **[Guía de Deployment](docs/DEPLOYMENT.md)** - Proceso completo de deploy
- **[Estado del Proyecto](PROJECT_STATUS.md)** - Funcionalidades implementadas
- **[Configuración Firebase](firebase-rules.md)** - Reglas de seguridad

---

## 🤝 **Contribución**

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 📞 **Soporte**

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/octopus/issues)
- **Documentación**: [docs/](docs/)
- **Deploy**: [Firebase Console](https://console.firebase.google.com/project/iamtheoceo/overview)

---

**¡La aplicación está desplegada y funcionando correctamente en https://theceo.web.app! 🎉**
