# 🚀 Despliegue en Firebase App Hosting

Esta guía te ayudará a desplegar Octopus App en Firebase App Hosting con todas las integraciones funcionando.

## 📋 Prerrequisitos

1. **Firebase CLI instalado**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Logueado en Firebase**:
   ```bash
   firebase login
   ```

3. **Variables de entorno configuradas** (ver sección de configuración)

## ⚙️ Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google OAuth (para integraciones)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Claude API (para integraciones)
CLAUDE_API_KEY=your_claude_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4000

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### 2. Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita las APIs:
   - Gmail API
   - Google Calendar API
   - Google Drive API
4. Crea credenciales OAuth 2.0
5. Configura las URIs de redirección:
   - `https://your-domain.com/api/auth/google/callback`

### 3. Configuración de Claude

1. Ve a [Anthropic Console](https://console.anthropic.com/)
2. Crea una cuenta o inicia sesión
3. Genera una nueva API key
4. Copia la API key (empieza con `sk-ant-`)

## 🚀 Despliegue

### Despliegue Automatizado (Recomendado)

```bash
./deploy.sh
```

Este script:
- ✅ Verifica prerrequisitos
- ✅ Instala dependencias
- ✅ Ejecuta linting
- ✅ Construye la aplicación
- ✅ Despliega a Firebase App Hosting
- ✅ Muestra información del sitio

### Despliegue Manual

```bash
# 1. Limpiar builds anteriores
npm run clean

# 2. Instalar dependencias
npm install

# 3. Construir la aplicación
npm run build

# 4. Desplegar
firebase deploy --only apphosting:theceo
```

### Despliegue Completo (incluye Firestore)

```bash
npm run deploy:all
```

## 🔧 Configuración en Producción

### Variables de Entorno en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **App Hosting > Settings**
4. En la sección **Environment variables**, configura:
   - `GOOGLE_CLIENT_SECRET`
   - `CLAUDE_API_KEY`
   - `NEXTAUTH_SECRET`
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`

### Configurar Dominio Personalizado

1. En Firebase Console, ve a **App Hosting**
2. Haz clic en **Add custom domain**
3. Sigue las instrucciones para configurar DNS

## 📊 Verificación

### 1. Verificar Despliegue

```bash
# Ver el estado del sitio
firebase hosting:sites:list

# Ver logs
firebase hosting:channel:list
```

### 2. Probar Integraciones

1. Ve a tu sitio desplegado
2. Navega a **Configuración > Integraciones**
3. Prueba conectar Google y Claude
4. Verifica que las APIs funcionen

### 3. Monitoreo

- **Firebase Console**: Monitoreo de logs y errores
- **Google Cloud Console**: Monitoreo de APIs
- **Anthropic Console**: Uso de Claude API

## 🔄 Actualizaciones

Para actualizar la aplicación:

```bash
# Despliegue rápido
./deploy.sh

# O manualmente
npm run build && firebase deploy --only apphosting:theceo
```

## 🛠️ Solución de Problemas

### Error: "Build failed"

```bash
# Verificar errores de TypeScript
npm run build

# Limpiar cache
npm run clean
rm -rf node_modules
npm install
```

### Error: "Firebase not logged in"

```bash
firebase login
```

### Error: "Project not found"

```bash
# Verificar proyecto actual
firebase projects:list

# Cambiar proyecto
firebase use your-project-id
```

### Error: "Environment variables not found"

1. Verifica que las variables estén en `.env.local`
2. En producción, configúralas en Firebase Console
3. Reinicia el servicio después de cambios

### Error: "OAuth redirect URI mismatch"

1. Verifica la URI en Google Cloud Console
2. Asegúrate de que coincida con tu dominio de producción
3. Actualiza `NEXT_PUBLIC_APP_URL` en las variables de entorno

## 📈 Escalabilidad

### Optimizaciones Recomendadas

1. **CDN**: Firebase App Hosting incluye CDN automático
2. **Caching**: Configura headers de cache apropiados
3. **Compresión**: Habilitada automáticamente
4. **Monitoreo**: Configura alertas en Firebase Console

### Límites

- **Requests**: 1M requests/mes gratis
- **Storage**: 1GB gratis
- **Bandwidth**: 10GB/mes gratis
- **Functions**: 125K invocations/mes gratis

## 🔐 Seguridad

### Mejores Prácticas

1. **Variables de entorno**: Nunca commits secrets
2. **API Keys**: Rota regularmente
3. **OAuth**: Usa scopes mínimos necesarios
4. **HTTPS**: Habilitado automáticamente
5. **CORS**: Configurado apropiadamente

### Auditoría de Seguridad

```bash
# Verificar configuración
firebase projects:list

# Ver reglas de Firestore
firebase firestore:rules:get

# Ver configuración de hosting
firebase hosting:sites:list
```

## 📞 Soporte

- **Firebase Support**: https://firebase.google.com/support
- **Google Cloud Support**: https://cloud.google.com/support
- **Anthropic Support**: https://support.anthropic.com

---

¡Tu aplicación Octopus está ahora desplegada y lista para usar! 🐙
