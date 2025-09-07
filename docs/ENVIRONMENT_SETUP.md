# Configuración de Variables de Entorno - Octopus

Este documento explica cómo configurar todas las variables de entorno necesarias para el funcionamiento completo de Octopus.

## 📋 Variables Requeridas

### 1. Google OAuth (Gmail/Calendar/Drive)

#### Configuración en Google Cloud Console:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las APIs necesarias:
   - Gmail API
   - Google Calendar API
   - Google Drive API
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
5. Configura el tipo de aplicación como "Aplicación web"

#### Variables a configurar:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

#### Redirect URIs a configurar en Google Console:
- **Desarrollo**: `http://localhost:3000/api/auth/google/callback`
- **Producción**: `https://octopus-theceo.vercel.app/api/auth/google/callback`

### 2. Firebase (Cliente Web)

#### Configuración en Firebase Console:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a "Configuración del proyecto" → "Tus apps"
4. Si no tienes una app web, crea una nueva
5. Copia la configuración del SDK

#### Variables a configurar:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### 3. Firebase Admin (Verificar tokens en API routes)

#### Opción A: Una sola variable (JSON)
```bash
FIREBASE_SERVICE_ACCOUNT='{"project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"}'
```

#### Opción B: Variables separadas (Recomendado)
```bash
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu_proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Cómo obtener la cuenta de servicio:
1. En Firebase Console, ve a "Configuración del proyecto"
2. Pestaña "Cuentas de servicio"
3. Haz clic en "Generar nueva clave privada"
4. Descarga el archivo JSON y extrae los valores

### 4. App/Config Generales

```bash
# URL pública de la app
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Desarrollo
NEXT_PUBLIC_APP_URL=https://octopus-theceo.vercel.app  # Producción

# Clave de encriptación (generar con: openssl rand -hex 32)
ENCRYPTION_KEY=tu_clave_de_32_caracteres_hex
```

#### Generar clave de encriptación:
```bash
openssl rand -hex 32
```

## 🔧 Variables Opcionales

### Claude API (Anthropic)
```bash
CLAUDE_API_KEY=tu_claude_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### SendGrid (Email transaccional)
```bash
SENDGRID_API_KEY=tu_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@tudominio.com
```

## 🚀 Configuración por Entorno

### Desarrollo Local
1. Copia `env.example` a `.env.local`
2. Configura las variables con valores de desarrollo
3. Asegúrate de que `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Producción (Vercel)
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a "Settings" → "Environment Variables"
3. Agrega todas las variables de producción
4. Asegúrate de que `NEXT_PUBLIC_APP_URL=https://octopus-theceo.vercel.app`

## ✅ Verificación

### Verificar configuración de Google OAuth:
1. Visita `http://localhost:3000/api/auth/google` (desarrollo)
2. Deberías ser redirigido a Google para autenticación

### Verificar configuración de Firebase:
1. Abre las herramientas de desarrollador
2. En la consola, deberías ver la configuración de Firebase cargada

### Verificar variables de entorno:
```bash
# En desarrollo
npm run dev

# Verificar que no hay errores de configuración en la consola
```

## 🔒 Seguridad

- **NUNCA** commites archivos `.env` al repositorio
- Usa diferentes credenciales para desarrollo y producción
- Rota las claves regularmente
- Usa variables de entorno en Vercel para producción

## 🆘 Solución de Problemas

### Error: "Invalid client ID"
- Verifica que `NEXT_PUBLIC_GOOGLE_CLIENT_ID` esté configurado correctamente
- Asegúrate de que los redirect URIs estén configurados en Google Console

### Error: "Firebase config not found"
- Verifica que todas las variables `NEXT_PUBLIC_FIREBASE_*` estén configuradas
- Asegúrate de que el proyecto de Firebase esté activo

### Error: "Invalid service account"
- Verifica que `FIREBASE_PRIVATE_KEY` tenga el formato correcto
- Asegúrate de que la cuenta de servicio tenga los permisos necesarios

## 📞 Soporte

Si tienes problemas con la configuración, verifica:
1. Que todas las variables estén configuradas
2. Que los servicios estén habilitados en las consolas correspondientes
3. Que las URLs de redirección estén configuradas correctamente
