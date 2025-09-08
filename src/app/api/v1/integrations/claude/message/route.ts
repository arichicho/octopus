import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { verifyAuth } from '@/lib/server/auth';
import { decrypt } from '@/lib/server/crypto';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { message, systemPrompt, temperature = 0.7, maxTokens = 4000 } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'message es requerido' },
        { status: 400 }
      );
    }

    // Obtener la configuración de Claude del usuario
    const claudeIntegrationsRef = collection(db, 'claudeIntegrations');
    const existingQuery = query(claudeIntegrationsRef, where('userId', '==', auth.uid));
    const existingDocs = await getDocs(existingQuery);

    if (existingDocs.empty) {
      return NextResponse.json(
        { error: 'No se encontró integración de Claude para este usuario' },
        { status: 404 }
      );
    }

    const integration = existingDocs.docs[0].data();
    
    if (integration.status !== 'connected' || !integration.isActive) {
      return NextResponse.json(
        { error: 'La integración de Claude no está activa' },
        { status: 400 }
      );
    }

    // Verificar límite de uso
    if (integration.usageLimit && integration.currentUsage >= integration.usageLimit) {
      return NextResponse.json(
        { error: 'Se ha alcanzado el límite de uso de Claude' },
        { status: 429 }
      );
    }

    // Enviar mensaje a Claude
    const messages = [];
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    messages.push({
      role: 'user',
      content: message
    });

    const apiKey = integration.apiKeyEnc
      ? decrypt(integration.apiKeyEnc)
      : (integration.apiKey || '');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: integration.model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de Claude API:', errorData);
      return NextResponse.json(
        { error: 'Error al comunicarse con Claude' },
        { status: response.status }
      );
    }

    const claudeResponse = await response.json();
    
    // Calcular tokens utilizados
    const inputTokens = claudeResponse.usage?.input_tokens || 0;
    const outputTokens = claudeResponse.usage?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // Actualizar uso en la base de datos
    const newUsage = (integration.currentUsage || 0) + totalTokens;
    await updateDoc(doc(db, 'claudeIntegrations', existingDocs.docs[0].id), {
      currentUsage: newUsage,
      lastUsed: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      response: claudeResponse.content[0]?.text || '',
      usage: {
        inputTokens,
        outputTokens,
        totalTokens
      }
    });
  } catch (error) {
    console.error('Error enviando mensaje a Claude:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
