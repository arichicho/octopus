import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { Territory } from '@/types/music';
import { callClaude, hasApiKey } from '@/lib/server/ai/client';

// Claude AI integration for music insights
async function generateMusicInsights(chartData: any, territory: Territory, period: 'daily' | 'weekly') {
  try {
    if (!hasApiKey()) {
      throw new Error('Claude API key not configured');
    }

    const systemPrompt = `Eres un experto analista de música y tendencias del mercado musical. Tu trabajo es analizar datos de charts y generar insights estratégicos profundos y accionables.`;

    const userPrompt = `
Analiza los siguientes datos de charts de música de ${territory} (${period}) y genera insights estratégicos:

Datos del chart:
${JSON.stringify(chartData, null, 2)}

Por favor, genera un análisis completo que incluya:

1. **Movimientos WoW**: Top subidas/caídas, promedio y mediana de variaciones, índice de volatilidad
2. **Entradas y re-entradas**: Cantidad total, Top 10 debuts, turnover rate vs semana anterior y vs media histórica
3. **Picos**: Solo new peaks, marcados con badges
4. **Colaboraciones**: Comparación collabs vs solistas en desempeño
5. **Cross-territory**: Intersecciones entre territorios y "travel map" de un país a otro
6. **Momentum 2–4 semanas**: Velocidad, aceleración, breakout watchlist
7. **Género y origen**: Distribución de géneros y países/ciudades
8. **Sellos y distribuidores**: Market share por streams y entradas, crecimiento WoW y vs histórico
9. **Artistas en ascenso**: Top 10 por crecimiento social (Spotify/IG/TikTok)
10. **Alertas automáticas**: Saltos >10, caídas >20 desde Top 50, riesgo de drop, debuts en Top 50
11. **KPIs ejecutivos**: Debuts, re-entries, turnover, share Top 10/50/200, tema de la semana, sello de la semana
12. **Persistencia/longevidad**: Half-life de tracks, curvas de supervivencia
13. **Estacionalidad**: Heatmap de patrones semanales/por mes
14. **Watchlist predictivo**: 10 temas con mayor probabilidad de entrar al Top 50
15. **Streams totales**: Top 200/50/10 vs semana anterior y vs media histórica

Responde ÚNICAMENTE en formato JSON estructurado con todos estos insights. No incluyas texto adicional fuera del JSON.
`;

    const result = await callClaude({
      system: systemPrompt,
      user: userPrompt,
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4000,
      temperature: 0.3
    });

    if (!result.ok) {
      throw new Error(`Claude API error: ${result.error}`);
    }

    const insights = JSON.parse(result.text || '{}');

    return {
      success: true,
      data: insights
    };
  } catch (error) {
    console.error('Error generating music insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const period = searchParams.get('period') as 'daily' | 'weekly';

    if (!territory || !period) {
      return NextResponse.json(
        { error: 'Missing territory or period parameter' },
        { status: 400 }
      );
    }

    // TODO: Fetch chart data from Firestore
    // For now, return mock data
    const mockChartData = {
      territory,
      period,
      date: new Date(),
      tracks: [
        {
          id: '1',
          title: 'Mock Track 1',
          artist: 'Mock Artist 1',
          position: 1,
          streams: 1000000,
          isNewEntry: false,
          isReEntry: false,
          isNewPeak: true,
          weeksOnChart: 5
        }
      ]
    };

    const result = await generateMusicInsights(mockChartData, territory, period);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in insights API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chartData, territory, period } = body;

    if (!chartData || !territory || !period) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const result = await generateMusicInsights(chartData, territory, period);
    
    // Store insights in Firestore
    if (result.success) {
      // TODO: Implement Firestore storage
      console.log('Storing insights in Firestore...');
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in insights POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
