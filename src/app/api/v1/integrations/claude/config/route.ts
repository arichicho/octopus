import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { verifyAuth } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Buscar la integración existente
    const claudeIntegrationsRef = collection(db, 'claudeIntegrations');
    const existingQuery = query(claudeIntegrationsRef, where('userId', '==', auth.uid));
    const existingDocs = await getDocs(existingQuery);

    if (existingDocs.empty) {
      return NextResponse.json(null);
    }

    const integration = existingDocs.docs[0].data();
    const { apiKey, apiKeyEnc, ...safe } = integration as any;
    return NextResponse.json({ id: existingDocs.docs[0].id, ...safe });
  } catch (error) {
    console.error('Error obteniendo configuración de Claude:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { ...updates } = await request.json();

    // Buscar la integración existente
    const claudeIntegrationsRef = collection(db, 'claudeIntegrations');
    const existingQuery = query(claudeIntegrationsRef, where('userId', '==', auth.uid));
    const existingDocs = await getDocs(existingQuery);

    if (existingDocs.empty) {
      return NextResponse.json(
        { error: 'No se encontró integración de Claude para este usuario' },
        { status: 404 }
      );
    }

    // Actualizar la configuración
    const existingDoc = existingDocs.docs[0];
    await updateDoc(doc(db, 'claudeIntegrations', existingDoc.id), {
      ...updates,
      updatedAt: new Date()
    });

    // Obtener la configuración actualizada
    const updatedDocs = await getDocs(existingQuery);
    const updatedIntegration = updatedDocs.docs[0].data();
    const { apiKey, apiKeyEnc, ...safe } = updatedIntegration as any;
    return NextResponse.json({ id: existingDoc.id, ...safe });
  } catch (error) {
    console.error('Error actualizando configuración de Claude:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
