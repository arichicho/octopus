# Guía de Seguridad - Octopus

## 🚨 Secretos Expuestos - Acción Requerida

### Secretos Detectados en el Historial de Git

GitHub detectó los siguientes secretos en commits antiguos:

1. **Firebase Service Account JSON** (`iamtheoceo-firebase-adminsdk-*.json`)
2. **Google OAuth Client Secret** (`client_secret_*.json`)
3. **Secretos hardcodeados** en scripts y documentación

### ⚠️ Acciones Inmediatas Requeridas

#### 1. Rotar Secretos Expuestos (URGENTE)

**Firebase Service Account:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `iamtheoceo`
3. Ve a "Configuración del proyecto" → "Cuentas de servicio"
4. **Elimina** la cuenta de servicio expuesta: `firebase-adminsdk-fbsvc@iamtheoceo.iam.gserviceaccount.com`
5. **Crea** una nueva cuenta de servicio
6. **Descarga** el nuevo JSON (guárdalo en `secure/` - NO lo subas a git)
7. **Actualiza** las variables en Vercel:
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

**Google OAuth:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto
3. Ve a "APIs y servicios" → "Credenciales"
4. **Elimina** el OAuth Client ID expuesto: `511546212594-2n67bqufe9h562fl41bfe0a7c37k98q6`
5. **Crea** un nuevo OAuth Client ID
6. **Actualiza** las variables en Vercel:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
7. **Actualiza** los Redirect URIs en Google Console

**Encryption Key:**
1. Genera una nueva clave:
   ```bash
   openssl rand -hex 32
   ```
2. **Actualiza** en Vercel: `ENCRYPTION_KEY`
3. ⚠️ **Nota**: Esto invalidará todos los tokens cifrados existentes

#### 2. Limpiar Historial de Git

Los secretos están en commits antiguos. Para eliminarlos del historial:

```bash
# Instalar git-filter-repo si no está instalado
pip3 install git-filter-repo

# Crear backup
git clone --mirror . ../octopus-backup.git

# Eliminar archivos con secretos del historial
git filter-repo --path secure/iamtheoceo-firebase-adminsdk-*.json --invert-paths
git filter-repo --path secure/client_secret_*.json --invert-paths
git filter-repo --path scripts/setup-vercel-env.sh --invert-paths
git filter-repo --path docs/vercel-env-variables.md --invert-paths

# Force push (requiere permisos)
git push origin --force --all
git push origin --force --tags
```

⚠️ **ADVERTENCIA**: Esto reescribe el historial. Coordina con tu equipo antes de hacer force push.

#### 3. Verificar Archivos Actuales

Los archivos con secretos deben estar en `.gitignore`:

```bash
# Verificar que estos archivos NO están trackeados
git ls-files | grep -E "(firebase-adminsdk|client_secret|\.json$)"
```

Si aparecen archivos, elimínalos del tracking:
```bash
git rm --cached secure/*.json
git commit -m "chore: Remove secret files from git tracking"
```

## 🔒 Prevención Futura

### Checklist de Seguridad

Antes de hacer commit, verifica:

- [ ] No hay archivos `.json` con credenciales en el staging area
- [ ] No hay secretos hardcodeados en código
- [ ] No hay secretos en scripts de configuración
- [ ] No hay secretos en documentación
- [ ] Todos los archivos sensibles están en `.gitignore`
- [ ] Las variables de entorno están documentadas (sin valores reales)

### .gitignore Verificado

Asegúrate de que estos patrones estén en `.gitignore`:

```
# Secretos y credenciales
/secure/
*.json
!package.json
!tsconfig.json
!components.json
client_secret*.json
*firebase-adminsdk*.json
*service-account*.json

# Variables de entorno
.env*
!.env.example
```

### Pre-commit Hook (Opcional)

Crea un hook para prevenir commits con secretos:

```bash
# .git/hooks/pre-commit
#!/bin/bash
if git diff --cached --name-only | grep -E "(firebase-adminsdk|client_secret|\.json$)"; then
    echo "❌ Error: Intentas commitear archivos con secretos!"
    echo "Por favor, elimina estos archivos del commit."
    exit 1
fi
```

## 📋 Estado Actual

### ✅ Ya Implementado

- ✅ `.gitignore` incluye `/secure/`
- ✅ Variables de entorno documentadas (sin valores reales)
- ✅ Scripts actualizados para no hardcodear secretos
- ✅ Documentación limpiada de secretos

### ⚠️ Pendiente

- ⚠️ Rotar secretos expuestos (URGENTE)
- ⚠️ Limpiar historial de git (después de rotar secretos)
- ⚠️ Verificar que no haya más secretos en el repositorio

## 🔗 Recursos

- [GitHub Secret Scanning](https://docs.github.com/code-security/secret-scanning)
- [Firebase Security](https://firebase.google.com/support/guides/security)
- [Google Cloud Security](https://cloud.google.com/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## 📞 Contacto

Si detectas un secreto expuesto:
1. Rota el secreto inmediatamente
2. Notifica al equipo
3. Limpia el historial de git
4. Actualiza esta documentación

