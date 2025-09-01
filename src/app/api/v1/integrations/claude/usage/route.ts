import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
    
    return NextResponse.json({
      currentUsage: integration.currentUsage || 0,
      usageLimit: integration.usageLimit,
      lastUsed: integration.lastUsed
    });
  } catch (error) {
    console.error('Error obteniendo uso de Claude:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
