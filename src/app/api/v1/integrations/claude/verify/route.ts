import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'apiKey es requerido' },
        { status: 400 }
      );
    }

    // Validar formato básico de la API key
    if (!apiKey.startsWith('sk-ant-') || apiKey.length < 20) {
      return NextResponse.json({ valid: false });
    }

    // Verificar la API key con Anthropic
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1,
          messages: [
            {
              role: 'user',
              content: 'test'
            }
          ]
        })
      });

      // Si la respuesta es 200, la API key es válida
      // Si es 401, la API key es inválida
      // Si es 429, la API key es válida pero hay límite de rate
      const isValid = response.status === 200 || response.status === 429;

      return NextResponse.json({ valid: isValid });
    } catch (error) {
      console.error('Error verificando API key:', error);
      return NextResponse.json({ valid: false });
    }
  } catch (error) {
    console.error('Error en verificación de API key:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
