import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { type } = await request.json();

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'userId y type son requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de integración
    if (!['gmail', 'calendar', 'drive'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de integración inválido' },
        { status: 400 }
      );
    }

    // Buscar la integración existente
    const adminDb = getFirestore();
    if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    const existingDocs = await adminDb
      .collection('googleIntegrations')
      .where('userId', '==', auth.uid)
      .where('type', '==', type)
      .limit(1)
      .get();

    if (existingDocs.empty) {
      return NextResponse.json(
        { error: 'No se encontró integración de Google para este usuario y tipo' },
        { status: 404 }
      );
    }

    // Actualizar el estado a desconectado
    const existingDoc = existingDocs.docs[0];
    await adminDb.collection('googleIntegrations').doc(existingDoc.id).update({
      status: 'disconnected',
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error desconectando integración de Google:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
