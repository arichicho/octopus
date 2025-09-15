# 🔥 Reglas de Seguridad de Firestore

## Configuración Inicial

Para configurar las reglas de seguridad en Firestore, sigue estos pasos:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** > **Rules**
4. Reemplaza las reglas existentes con las siguientes:

## Reglas de Seguridad

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función helper para verificar si el usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función helper para verificar si el usuario es propietario de una empresa
    function isCompanyOwner(companyId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/companies/$(companyId)) &&
        get(/databases/$(database)/documents/companies/$(companyId)).data.ownerId == request.auth.uid;
    }
    
    // Función helper para verificar si el usuario tiene acceso a una empresa
    function hasCompanyAccess(companyId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/companies/$(companyId)) &&
        (
          get(/databases/$(database)/documents/companies/$(companyId)).data.ownerId == request.auth.uid ||
          request.auth.uid in get(/databases/$(database)/documents/companies/$(companyId)).data.members
        );
    }

    // Usuarios: solo pueden leer/escribir su propio perfil
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Empresas: solo el propietario puede modificar
    match /companies/{companyId} {
      allow read: if hasCompanyAccess(companyId);
      allow create: if isAuthenticated();
      allow update, delete: if isCompanyOwner(companyId);
    }
    
    // Tareas: usuarios con acceso a la empresa
    match /tasks/{taskId} {
      allow read, write: if hasCompanyAccess(resource.data.companyId);
      allow create: if isAuthenticated() && hasCompanyAccess(request.resource.data.companyId);
    }
    
    // Personas: usuarios con acceso a la empresa
    match /people/{personId} {
      allow read, write: if hasCompanyAccess(resource.data.companies[0]);
      allow create: if isAuthenticated() && hasCompanyAccess(request.resource.data.companies[0]);
    }
    
    // Invitaciones: solo el creador puede modificar
    match /invitations/{invitationId} {
      allow read: if isAuthenticated() && 
        (resource.data.invitedBy == request.auth.uid || 
         resource.data.email == request.auth.token.email);
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.invitedBy == request.auth.uid;
    }
    
    // Notificaciones: solo el usuario destinatario
    match /notifications/{notificationId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // API Keys: solo el propietario
    match /apiKeys/{keyId} {
      allow read, write: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
    }
    
    // Webhooks: solo el propietario
    match /webhooks/{webhookId} {
      allow read, write: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

## Configuración de Authentication

1. Ve a **Authentication** > **Sign-in method**
2. Habilita **Google** como proveedor
3. Configura el **Project support email**
4. Agrega tu dominio a **Authorized domains**

## Configuración de Firestore

1. Ve a **Firestore Database**
2. Crea una base de datos en **production mode**
3. Selecciona la ubicación más cercana a tus usuarios
4. Aplica las reglas de seguridad anteriores

## Índices Recomendados

Crea los siguientes índices compuestos para optimizar las consultas:

### Tareas
- Collection: `tasks`
- Fields: `companyId` (Ascending), `status` (Ascending), `dueDate` (Ascending)
- Fields: `assignedTo` (Array), `status` (Ascending), `dueDate` (Ascending)
- Fields: `companyId` (Ascending), `priority` (Ascending), `dueDate` (Ascending)

### Usuarios
- Collection: `users`
- Fields: `email` (Ascending)

### Invitaciones
- Collection: `invitations`
- Fields: `email` (Ascending), `status` (Ascending), `createdAt` (Descending)

## Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## Pruebas de Seguridad

Después de configurar las reglas, puedes probar la seguridad:

1. **Usuario no autenticado**: No debe poder acceder a ningún dato
2. **Usuario autenticado**: Solo debe poder acceder a sus propios datos y empresas donde tenga acceso
3. **Propietario de empresa**: Debe poder gestionar completamente su empresa
4. **Miembro de empresa**: Debe poder leer/escribir tareas pero no modificar la empresa

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Verifica que las reglas estén correctamente aplicadas
- Asegúrate de que el usuario esté autenticado
- Confirma que el usuario tenga acceso a la empresa correspondiente

### Error: "The query requires an index"
- Crea los índices compuestos recomendados
- Espera a que los índices se construyan (puede tomar varios minutos)

### Error: "Firebase App named '[DEFAULT]' already exists"
- Asegúrate de que Firebase solo se inicialice una vez
- Verifica que no haya múltiples llamadas a `initializeApp()`
