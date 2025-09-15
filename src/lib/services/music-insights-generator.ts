/**
 * Music Insights Generator
 * Uses Claude AI to generate strategic insights from music data
 */

import { callClaude, hasApiKey } from '@/lib/server/ai/client';
import { ChartAnalysis, EnrichedTrack } from './music-insights-pipeline';
import { Territory, ChartPeriod } from '@/types/music';

export interface MusicInsight {
  id: string;
  territory: Territory;
  period: ChartPeriod;
  date: Date;
  type: 'market' | 'genre' | 'artist' | 'label' | 'trend' | 'alert';
  title: string;
  description: string;
  data: any;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  generatedAt: Date;
}

export interface StrategicInsights {
  id: string;
  territory: Territory;
  period: ChartPeriod;
  date: Date;
  executiveSummary: string;
  keyFindings: MusicInsight[];
  marketAnalysis: {
    genreTrends: string;
    labelDynamics: string;
    artistMovements: string;
    crossTerritoryInsights: string;
  };
  recommendations: Array<{
    type: 'opportunity' | 'risk' | 'strategy';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  alerts: Array<{
    type: 'jump' | 'drop' | 'debut' | 'risk';
    track: string;
    artist: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  generatedBy: 'claude';
  generatedAt: Date;
}

export class MusicInsightsGenerator {
  /**
   * Generate comprehensive strategic insights from chart analysis
   */
  async generateStrategicInsights(analysis: ChartAnalysis): Promise<StrategicInsights> {
    if (!hasApiKey()) {
      throw new Error('Claude API key not configured');
    }

    console.log(`🧠 Generating strategic insights for ${analysis.territory} ${analysis.period}`);

    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.buildUserPrompt(analysis);

    try {
      const result = await callClaude({
        system: systemPrompt,
        user: userPrompt,
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4000,
        temperature: 0.3
      });

      const insights = this.parseClaudeResponse(result, analysis);
      return insights;

    } catch (error) {
      console.error('Error generating insights with Claude:', error);
      throw error;
    }
  }

  /**
   * Generate insights for specific track movements
   */
  async generateTrackInsights(tracks: EnrichedTrack[], territory: Territory, period: ChartPeriod): Promise<MusicInsight[]> {
    if (!hasApiKey()) {
      throw new Error('Claude API key not configured');
    }

    const systemPrompt = this.getTrackAnalysisSystemPrompt();
    const userPrompt = this.buildTrackAnalysisPrompt(tracks, territory, period);

    try {
      const result = await callClaude({
        system: systemPrompt,
        user: userPrompt,
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 2000,
        temperature: 0.3
      });

      return this.parseTrackInsights(result, territory, period);

    } catch (error) {
      console.error('Error generating track insights:', error);
      throw error;
    }
  }

  /**
   * Get system prompt for strategic analysis
   */
  private getSystemPrompt(): string {
    return `Eres un analista estratégico de la industria musical con acceso a datos de SpotifyCharts y Chartmetric. Tu trabajo es generar insights ejecutivos sobre tendencias musicales, movimientos de mercado y oportunidades estratégicas.

ANÁLISIS REQUERIDO:
1. **Resumen Ejecutivo**: 2-3 párrafos con los hallazgos más importantes
2. **Hallazgos Clave**: 5-7 insights específicos con datos concretos
3. **Análisis de Mercado**: Tendencias de género, dinámicas de sellos, movimientos de artistas
4. **Recomendaciones**: Oportunidades, riesgos y estrategias
5. **Alertas**: Movimientos significativos que requieren atención

FORMATO DE RESPUESTA:
Responde en JSON válido con la siguiente estructura:
{
  "executiveSummary": "string",
  "keyFindings": [
    {
      "type": "market|genre|artist|label|trend|alert",
      "title": "string",
      "description": "string",
      "data": {},
      "confidence": 85,
      "impact": "high|medium|low",
      "actionable": true
    }
  ],
  "marketAnalysis": {
    "genreTrends": "string",
    "labelDynamics": "string", 
    "artistMovements": "string",
    "crossTerritoryInsights": "string"
  },
  "recommendations": [
    {
      "type": "opportunity|risk|strategy",
      "title": "string",
      "description": "string",
      "priority": "high|medium|low"
    }
  ],
  "alerts": [
    {
      "type": "jump|drop|debut|risk",
      "track": "string",
      "artist": "string", 
      "message": "string",
      "severity": "high|medium|low"
    }
  ]
}

ENFOQUE:
- Usa datos específicos (números, porcentajes, posiciones)
- Identifica patrones y tendencias
- Proporciona contexto sobre movimientos significativos
- Sugiere acciones concretas
- Prioriza información accionable`;
  }

  /**
   * Get system prompt for track analysis
   */
  private getTrackAnalysisSystemPrompt(): string {
    return `Eres un analista de música especializado en identificar movimientos significativos en charts. Analiza los datos de tracks y genera insights sobre:

1. **Saltos significativos** (>10 posiciones)
2. **Caídas importantes** (>20 posiciones desde Top 50)
3. **Debutantes destacados** (Top 50)
4. **Riesgos de salida** (posiciones bajas con tendencia descendente)
5. **Patrones de género y origen**
6. **Dinámicas de sellos y distribuidores**

FORMATO DE RESPUESTA:
Responde en JSON válido con array de insights:
[
  {
    "type": "jump|drop|debut|risk|trend",
    "title": "string",
    "description": "string", 
    "data": {
      "track": "string",
      "artist": "string",
      "position": number,
      "previousPosition": number,
      "change": number,
      "streams": number
    },
    "confidence": 85,
    "impact": "high|medium|low",
    "actionable": true
  }
]`;
  }

  /**
   * Build user prompt for strategic analysis
   */
  private buildUserPrompt(analysis: ChartAnalysis): string {
    const { territory, period, totalTracks, totalStreams, summary, enrichedTracks } = analysis;

    // Get top tracks for context
    const topTracks = enrichedTracks.slice(0, 10).map(track => ({
      position: track.position,
      title: track.title,
      artist: track.artist,
      streams: track.streams,
      genre: track.insights?.genre || 'Unknown',
      origin: track.insights?.origin || 'Unknown',
      label: track.insights?.label || 'Unknown',
      isNewEntry: track.isNewEntry,
      isReEntry: track.isReEntry,
      isNewPeak: track.isNewPeak
    }));

    return `Analiza los datos del chart ${territory.toUpperCase()} ${period.toUpperCase()} del ${new Date().toLocaleDateString('es-AR')}:

DATOS DEL CHART:
- Total de tracks: ${totalTracks}
- Total de streams: ${totalStreams.toLocaleString()}
- Territorio: ${territory}
- Período: ${period}

RESUMEN DEL MERCADO:
- Nuevas entradas: ${summary.marketDynamics.newEntries}
- Re-entradas: ${summary.marketDynamics.reEntries}
- Nuevos picos: ${summary.marketDynamics.newPeaks}
- Tasa de rotación: ${summary.marketDynamics.turnoverRate}%

TOP 10 TRACKS:
${topTracks.map(track => 
  `${track.position}. ${track.title} - ${track.artist}
   Streams: ${track.streams?.toLocaleString() || 'N/A'} | Género: ${track.genre} | Origen: ${track.origin}
   Sello: ${track.label} | ${track.isNewEntry ? 'NUEVA ENTRADA' : ''} ${track.isReEntry ? 'RE-ENTRADA' : ''} ${track.isNewPeak ? 'NUEVO PICO' : ''}`
).join('\n')}

TOP GÉNEROS:
${summary.topGenres.slice(0, 5).map(g => `${g.genre}: ${g.count} tracks (${g.percentage.toFixed(1)}%)`).join('\n')}

TOP SELLOS:
${summary.topLabels.slice(0, 5).map(l => `${l.label}: ${l.count} tracks (${l.percentage.toFixed(1)}%)`).join('\n')}

TOP ORÍGENES:
${summary.topOrigins.slice(0, 5).map(o => `${o.origin}: ${o.count} tracks (${o.percentage.toFixed(1)}%)`).join('\n')}

LÍDERES SOCIALES:
${summary.socialLeaders.slice(0, 5).map(s => `${s.artist}: ${s.totalReach.toLocaleString()} reach total (Posición: ${s.position})`).join('\n')}

Genera insights estratégicos basados en estos datos.`;
  }

  /**
   * Build user prompt for track analysis
   */
  private buildTrackAnalysisPrompt(tracks: EnrichedTrack[], territory: Territory, period: ChartPeriod): string {
    const significantMovements = tracks.filter(track => 
      track.previousPosition && 
      (Math.abs(track.previousPosition - track.position) > 10 || 
       track.isNewEntry || 
       track.isReEntry || 
       track.isNewPeak)
    );

    return `Analiza los movimientos significativos en el chart ${territory.toUpperCase()} ${period.toUpperCase()}:

MOVIMIENTOS SIGNIFICATIVOS:
${significantMovements.map(track => {
  const change = track.previousPosition ? track.previousPosition - track.position : 0;
  return `${track.position}. ${track.title} - ${track.artist}
   Cambio: ${change > 0 ? '+' : ''}${change} posiciones
   Streams: ${track.streams?.toLocaleString() || 'N/A'}
   ${track.isNewEntry ? 'NUEVA ENTRADA' : ''} ${track.isReEntry ? 'RE-ENTRADA' : ''} ${track.isNewPeak ? 'NUEVO PICO' : ''}`;
}).join('\n')}

Identifica patrones, riesgos y oportunidades en estos movimientos.`;
  }

  /**
   * Parse Claude response for strategic insights
   */
  private parseClaudeResponse(response: string, analysis: ChartAnalysis): StrategicInsights {
    try {
      const parsed = JSON.parse(response);
      
      return {
        id: `insights_${analysis.territory}_${analysis.period}_${Date.now()}`,
        territory: analysis.territory,
        period: analysis.period,
        date: analysis.date,
        executiveSummary: parsed.executiveSummary || 'Análisis no disponible',
        keyFindings: parsed.keyFindings || [],
        marketAnalysis: parsed.marketAnalysis || {
          genreTrends: 'Análisis no disponible',
          labelDynamics: 'Análisis no disponible',
          artistMovements: 'Análisis no disponible',
          crossTerritoryInsights: 'Análisis no disponible'
        },
        recommendations: parsed.recommendations || [],
        alerts: parsed.alerts || [],
        generatedBy: 'claude',
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      throw new Error('Failed to parse insights from Claude AI');
    }
  }

  /**
   * Parse Claude response for track insights
   */
  private parseTrackInsights(response: string, territory: Territory, period: ChartPeriod): MusicInsight[] {
    try {
      const parsed = JSON.parse(response);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array of insights');
      }

      return parsed.map((insight: any, index: number) => ({
        id: `track_insight_${territory}_${period}_${index}_${Date.now()}`,
        territory,
        period,
        date: new Date(),
        type: insight.type || 'trend',
        title: insight.title || 'Insight sin título',
        description: insight.description || 'Descripción no disponible',
        data: insight.data || {},
        confidence: insight.confidence || 75,
        impact: insight.impact || 'medium',
        actionable: insight.actionable || false,
        generatedAt: new Date()
      }));
    } catch (error) {
      console.error('Error parsing track insights:', error);
      throw new Error('Failed to parse track insights from Claude AI');
    }
  }
}

// Singleton instance
let musicInsightsGenerator: MusicInsightsGenerator | null = null;

export function getMusicInsightsGenerator(): MusicInsightsGenerator {
  if (!musicInsightsGenerator) {
    musicInsightsGenerator = new MusicInsightsGenerator();
  }
  return musicInsightsGenerator;
}
