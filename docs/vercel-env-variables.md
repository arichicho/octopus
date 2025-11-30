# Variables de Entorno para Vercel - Octopus

## 🚀 Despliegue

- **URL de Producción**: https://octopus-theceo.vercel.app
- **Dashboard Vercel**: https://vercel.com/dashboard

## 📋 Variables de Entorno Requeridas

⚠️ **IMPORTANTE**: Este documento NO contiene secretos reales. Usa `config/env.example` como referencia.

### 1. Firebase Cliente Web

Configura estas variables en Vercel (Settings → Environment Variables):

```
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

**Cómo obtenerlas:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a "Configuración del proyecto" → "Tus apps"
4. Copia la configuración del SDK

### 2. Firebase Admin (Servicio de Cuenta)

```
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu_proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Cómo obtenerlas:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a "Configuración del proyecto" → "Cuentas de servicio"
4. Genera una nueva clave privada o usa una existente
5. **NUNCA** subas el archivo JSON al repositorio

### 3. Google OAuth

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
```

**Cómo obtenerlas:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a "APIs y servicios" → "Credenciales"
4. Crea o usa un "ID de cliente OAuth 2.0"
5. Configura los Redirect URIs:
   - `https://octopus-theceo.vercel.app/api/auth/google/callback`

### 4. Configuración de la App

```
NEXT_PUBLIC_APP_URL=https://octopus-theceo.vercel.app
NODE_ENV=production
```

### 5. Clave de Encriptación

```
ENCRYPTION_KEY=tu_clave_de_32_caracteres_hex
```

**Cómo generarla:**
```bash
openssl rand -hex 32
```

## 🔧 Cómo Configurar en Vercel

### Opción 1: Usando el Dashboard (Recomendado)

1. **Ve al Dashboard de Vercel**: https://vercel.com/dashboard
2. **Selecciona tu proyecto**: "octopus"
3. **Ve a Settings → Environment Variables**
4. **Agrega cada variable una por una**:
   - Copia el nombre de la variable
   - Pega el valor (obtén los valores reales de Firebase/Google Console)
   - Marca "Production" (y "Preview" si aplica)
   - Haz clic en "Save"
5. **Redespliega la aplicación**:
   - Ve a "Deployments"
   - Click en "..." → "Redeploy"

### Opción 2: Usando el Script (Requiere variables locales)

```bash
# Configura las variables localmente primero
export FIREBASE_API_KEY='tu_api_key'
export GOOGLE_CLIENT_SECRET='tu_client_secret'
# ... más variables

# Ejecuta el script
./scripts/setup-vercel-env.sh
```

## 🔒 Seguridad

### ✅ Buenas Prácticas

- ✅ **NUNCA** subas secretos al repositorio
- ✅ **NUNCA** hardcodees secretos en código
- ✅ **SIEMPRE** usa variables de entorno
- ✅ **ROTA** secretos si se exponen accidentalmente
- ✅ **USA** `.env.local` para desarrollo local (está en .gitignore)

### ❌ Qué NO hacer

- ❌ No subas archivos `.json` con credenciales
- ❌ No hardcodees secretos en scripts
- ❌ No documentes secretos reales en markdown
- ❌ No compartas secretos por email/chat

## 🚨 Si un Secreto se Expone

1. **Rota el secreto inmediatamente**:
   - Genera nuevas credenciales en Firebase/Google Console
   - Actualiza las variables en Vercel
   - Elimina las credenciales antiguas

2. **Limpia el historial de git** (si el secreto está en commits):
   ```bash
   # Usa git-filter-repo para eliminar del historial
   git filter-repo --path archivo-con-secreto.json --invert-paths
   ```

3. **Verifica que no haya más exposiciones**:
   - Revisa todos los commits
   - Busca en documentación
   - Verifica logs y backups

## 📝 Referencias

- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Configuración de Seguridad](./SECURITY.md)
