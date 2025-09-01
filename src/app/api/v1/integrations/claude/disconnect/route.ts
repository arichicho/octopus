import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Buscar la integración existente
    const adminDb = getFirestore();
    if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    const existingDocs = await adminDb
      .collection('claudeIntegrations')
      .where('userId', '==', auth.uid)
      .limit(1)
      .get();

    if (existingDocs.empty) {
      return NextResponse.json(
        { error: 'No se encontró integración de Claude para este usuario' },
        { status: 404 }
      );
    }

    // Actualizar el estado a desconectado
    const existingDoc = existingDocs.docs[0];
    await adminDb.collection('claudeIntegrations').doc(existingDoc.id).update({
      status: 'disconnected',
      isActive: false,
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error desconectando Claude:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
