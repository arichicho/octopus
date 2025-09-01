# Módulo de Integraciones

Este módulo permite conectar Octopus con servicios externos para potenciar la productividad y automatización.

## Integraciones Disponibles

### 1. Google Workspace

#### Gmail
- **Descripción**: Sincronización de emails y gestión de comunicaciones
- **Permisos**: Lectura, envío y modificación de emails
- **Funcionalidades**:
  - Sincronización automática de emails
  - Gestión de etiquetas
  - Seguimiento de conversaciones
  - Integración con tareas

#### Google Calendar
- **Descripción**: Sincronización de eventos y reuniones
- **Permisos**: Lectura y escritura de calendarios
- **Funcionalidades**:
  - Sincronización de eventos
  - Creación automática de reuniones
  - Recordatorios integrados
  - Gestión de disponibilidad

#### Google Drive
- **Descripción**: Acceso y gestión de documentos
- **Permisos**: Lectura y escritura de archivos
- **Funcionalidades**:
  - Sincronización de documentos
  - Auto-sincronización
  - Gestión de carpetas
  - Integración con tareas

### 2. Claude AI (Anthropic)

#### Descripción
Integración con Claude para asistencia de IA avanzada

#### Modelos Disponibles
- **Claude 3.5 Sonnet** (Recomendado)
  - El modelo más versátil y avanzado
  - Ideal para análisis complejo y código
  - Precio: $3.00/1M tokens entrada, $15.00/1M tokens salida

- **Claude 3.5 Haiku**
  - Modelo rápido y eficiente
  - Ideal para tareas simples
  - Precio: $0.25/1M tokens entrada, $1.25/1M tokens salida

- **Claude 3 Opus**
  - Mayor capacidad para tareas complejas
  - Ideal para investigación y análisis de datos
  - Precio: $15.00/1M tokens entrada, $75.00/1M tokens salida

#### Funcionalidades
- Configuración de API key segura
- Selección de modelo
- Control de uso y límites
- Activación/desactivación
- Seguimiento de consumo

## Configuración

### Variables de Entorno Requeridas

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Claude API
CLAUDE_API_KEY=your_claude_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4000

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las APIs necesarias:
   - Gmail API
   - Google Calendar API
   - Google Drive API
4. Crea credenciales OAuth 2.0
5. Configura las URIs de redirección:
   - `http://localhost:3000/api/auth/google/callback` (desarrollo)
   - `https://tu-dominio.com/api/auth/google/callback` (producción)

### Configuración de Claude

1. Ve a [Anthropic Console](https://console.anthropic.com/)
2. Crea una cuenta o inicia sesión
3. Genera una nueva API key
4. Copia la API key (empieza con `sk-ant-`)

## Uso

### Conectar Integración

1. Ve a **Configuración > Integraciones**
2. Selecciona la integración deseada
3. Sigue las instrucciones de configuración
4. Autoriza los permisos necesarios

### Gestionar Integraciones

- **Estado**: Ver el estado de conexión de cada integración
- **Configuración**: Ajustar parámetros específicos
- **Sincronización**: Forzar sincronización manual
- **Desconexión**: Revocar acceso cuando sea necesario

## Seguridad

### Almacenamiento Seguro
- Las API keys se almacenan encriptadas
- Los tokens de OAuth se refrescan automáticamente
- Acceso limitado a los permisos autorizados

### Privacidad
- Solo se accede a los datos autorizados explícitamente
- Los datos se procesan localmente cuando es posible
- No se comparten datos con terceros

### Gestión de Permisos
- Puedes revocar el acceso en cualquier momento
- Control granular sobre los permisos
- Enlaces directos a las consolas de gestión

## API Endpoints

### Google Integrations
```
POST /api/v1/integrations/google/connect
POST /api/v1/integrations/google/disconnect
GET /api/v1/integrations/status
GET /api/v1/integrations/gmail/config
PUT /api/v1/integrations/gmail/config
GET /api/v1/integrations/calendar/config
PUT /api/v1/integrations/calendar/config
GET /api/v1/integrations/drive/config
PUT /api/v1/integrations/drive/config
POST /api/v1/integrations/sync
```

### Claude Integration
```
POST /api/v1/integrations/claude/connect
POST /api/v1/integrations/claude/disconnect
GET /api/v1/integrations/claude/config
PUT /api/v1/integrations/claude/config
POST /api/v1/integrations/claude/verify
GET /api/v1/integrations/claude/usage
POST /api/v1/integrations/claude/message
```

## Próximas Integraciones

- **Slack**: Notificaciones y comunicación
- **Trello**: Gestión de proyectos
- **Zapier**: Automatizaciones
- **WhatsApp Business**: Comunicación con clientes

## Solución de Problemas

### Error de Conexión con Google
1. Verifica que las credenciales OAuth estén correctas
2. Asegúrate de que las APIs estén habilitadas
3. Revisa las URIs de redirección
4. Verifica los permisos de la aplicación

### Error de Conexión con Claude
1. Verifica que la API key sea válida
2. Asegúrate de que empiece con `sk-ant-`
3. Verifica el saldo de la cuenta
4. Revisa los límites de uso

### Problemas de Sincronización
1. Verifica la conexión a internet
2. Revisa los logs de error
3. Intenta una sincronización manual
4. Contacta al soporte si persiste

## Soporte

Para problemas técnicos o preguntas sobre integraciones:
- Revisa la documentación de la API correspondiente
- Consulta los logs de error en la consola
- Contacta al equipo de desarrollo
