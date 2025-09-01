import { NextRequest, NextResponse } from 'next/server';
import { ClaudeModel } from '@/types/integrations';
import { verifyAuth } from '@/lib/server/auth';
import { encrypt } from '@/lib/server/crypto';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { apiKey, model } = await request.json();

    if (!apiKey || !model) {
      return NextResponse.json(
        { error: 'apiKey y model son requeridos' },
        { status: 400 }
      );
    }

    const adminDb = getFirestore();
    if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    // Verificar si ya existe una integración para este usuario
    const existingDocs = await adminDb
      .collection('claudeIntegrations')
      .where('userId', '==', auth.uid)
      .limit(1)
      .get();

    let integrationId: string;

    if (!existingDocs.empty) {
      // Actualizar integración existente
      const existingDoc = existingDocs.docs[0];
      integrationId = existingDoc.id;
      
      await adminDb.collection('claudeIntegrations').doc(integrationId).update({
        apiKeyEnc: encrypt(apiKey),
        model,
        status: 'connected',
        isActive: true,
        updatedAt: new Date()
      });
    } else {
      // Crear nueva integración
      const newIntegration = {
        userId: auth.uid,
        apiKeyEnc: encrypt(apiKey),
        model,
        status: 'connected' as const,
        isActive: true,
        currentUsage: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const docRef = await adminDb.collection('claudeIntegrations').add(newIntegration);
      integrationId = docRef.id;
    }

    // Obtener la integración creada/actualizada
    const integrationDoc = await adminDb
      .collection('claudeIntegrations')
      .where('userId', '==', auth.uid)
      .limit(1)
      .get();
    const integration = integrationDoc.docs[0].data();

    const { apiKey: _a, apiKeyEnc, ...safe } = integration as any;
    return NextResponse.json({ id: integrationId, ...safe });
  } catch (error) {
    console.error('Error conectando Claude:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
