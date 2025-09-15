# Music Trends Module

## Descripción

El módulo de Music Trends es un agente de inteligencia musical automatizado que proporciona análisis estratégicos sobre la evolución de la música en los mercados clave. Se integra con SpotifyCharts, Chartmetric y Claude AI para generar insights ejecutivos.

## Características Principales

### 1. Monitoreo Continuo
- **Actualización Diaria**: 10:00 AM (hora Argentina) - Top 200 diario
- **Actualización Semanal**: 7:00 AM (hora Argentina) - Top 200 semanal
- **Territorios**: Argentina, España, México, Global
- **Actualización Manual**: Botón de refresh para actualizaciones inmediatas

### 2. Análisis e Insights
- **Movimientos WoW**: Top subidas/caídas, volatilidad
- **Entradas y Re-entradas**: Debuts, turnover rate
- **Picos**: Nuevos peaks alcanzados
- **Colaboraciones**: Performance collabs vs solistas
- **Cross-territory**: Intersecciones entre mercados
- **Momentum**: Velocidad y aceleración de tracks
- **Género y Origen**: Distribución por géneros y países
- **Sellos y Distribuidores**: Market share y crecimiento
- **Artistas en Ascenso**: Crecimiento social
- **Alertas Automáticas**: Saltos, caídas, debuts, riesgos
- **KPIs Ejecutivos**: Métricas clave del mercado
- **Persistencia**: Longevidad de tracks
- **Estacionalidad**: Patrones temporales
- **Watchlist Predictivo**: Tracks con potencial de crecimiento

### 3. Integración de Fuentes
- **SpotifyCharts**: Scraping de datos de posiciones y streams
- **Chartmetric**: Enriquecimiento con sellos, distribuidores, géneros
- **Claude AI**: Análisis inteligente y generación de insights
- **Firestore**: Almacenamiento de datos históricos

## Estructura del Sistema

### APIs
```
/api/music-trends/
├── spotify-charts/     # Scraping de SpotifyCharts
├── chartmetric/        # Integración con Chartmetric
├── insights/           # Generación de insights con Claude
└── auto-update/        # Sistema de actualización automática
```

### Componentes
```
src/components/music-trends/
├── MusicTrendsOverview.tsx    # Resumen ejecutivo
├── MusicTrendsCharts.tsx      # Tabla de charts
├── MusicTrendsInsights.tsx    # Análisis detallados
└── MusicTrendsAlerts.tsx      # Sistema de alertas
```

### Servicios
```
src/lib/services/
├── music-trends-scheduler.ts  # Programador de actualizaciones
└── music-trends-storage.ts    # Almacenamiento en Firestore
```

### Tipos
```
src/types/music.ts             # Tipos TypeScript para música
```

## Configuración

### Variables de Entorno
```env
# Chartmetric API - 64-character refresh token (permanent)
# Obtener después de suscribirse al plan de API de Chartmetric
CHARTMETRIC_REFRESH_TOKEN=your_64_character_chartmetric_refresh_token

# Claude AI (ya configurada en el sistema)
CLAUDE_API_KEY=your_claude_api_key

# Internal API (para actualizaciones automáticas)
INTERNAL_API_KEY=your_internal_api_key
```

### Configuración de Chartmetric

1. **Suscribirse al Plan de API**: Visitar [Chartmetric API](https://api.chartmetric.com/apidoc/#api-Authorization-GetAccessToken)
2. **Obtener Refresh Token**: Token permanente de 64 caracteres
3. **Configurar Variable**: Agregar `CHARTMETRIC_REFRESH_TOKEN` a las variables de entorno
4. **Test de Conexión**: Usar `/api/music-trends/chartmetric-test?action=connection`

#### Flujo de Autenticación Chartmetric
```
1. Refresh Token (64 chars) → Access Token (180 chars, 1 hora)
2. Access Token → API calls
3. Token expirado (401) → Refresh automático
```

### Firestore Collections
- `music_charts`: Datos de charts por territorio y período
- `music_insights`: Insights generados por Claude AI
- `music_tracks`: Información detallada de tracks
- `music_artists`: Datos de artistas
- `music_labels`: Información de sellos
- `music_alerts`: Sistema de alertas
- `music_config`: Configuración del módulo

## Uso

### Dashboard Principal
1. Navegar a `/dashboard/music-trends`
2. Seleccionar período (Diario/Semanal)
3. Seleccionar territorio (Argentina/España/México/Global)
4. Explorar tabs: Resumen, Charts, Insights, Alertas

### Actualización Manual
- Usar botón "Actualizar" en el header
- Sistema automático cada día a las 10:00 AM y lunes a las 7:00 AM

### Alertas
- Saltos >10 posiciones
- Caídas >20 posiciones desde Top 50
- Debuts en Top 50
- Riesgo de salir del Top 200

## Programación Automática

El sistema utiliza el scheduler integrado con timezone de Argentina:

```typescript
// Diario: 10:00 AM Argentina
// Semanal: 7:00 AM Argentina (lunes)
const scheduler = getMusicTrendsScheduler();
scheduler.start();
```

## Integración con Claude AI

Claude AI analiza los datos y genera insights estructurados:

```typescript
const insights = await generateMusicInsights(chartData, territory, period);
```

## Monitoreo y Alertas

- **Estado de Actualización**: Current/Delayed/Error
- **Alertas por Severidad**: Alta/Media/Baja
- **Filtros**: Por tipo y severidad
- **Notificaciones**: En tiempo real

## Extensibilidad

El sistema está diseñado para ser extensible:

1. **Nuevos Territorios**: Agregar en configuración
2. **Nuevas Fuentes**: Implementar nuevos scrapers
3. **Nuevos Insights**: Extender análisis de Claude
4. **Nuevas Alertas**: Configurar umbrales personalizados

## Troubleshooting

### Datos No Actualizados
- Verificar estado de SpotifyCharts
- Revisar logs del scheduler
- Ejecutar actualización manual

### Errores de API
- Verificar claves de API
- Revisar límites de rate
- Consultar logs de error

### Problemas de Timezone
- Verificar configuración de timezone
- Revisar scheduler de actualizaciones
- Validar horarios de Argentina

## Roadmap

- [ ] Integración con más fuentes de datos
- [ ] Análisis de sentimiento en redes sociales
- [ ] Predicciones de tendencias
- [ ] Exportación de reportes
- [ ] API pública para terceros
- [ ] Dashboard móvil optimizado
