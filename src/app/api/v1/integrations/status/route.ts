import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminDb = getFirestore();
    if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    // Obtener estado de integraciones de Google
    const googleDocs = await adminDb
      .collection('googleIntegrations')
      .where('userId', '==', auth.uid)
      .get();

    const gmailConnected = googleDocs.docs.some(doc => 
      doc.data().type === 'gmail' && doc.data().status === 'connected'
    );
    const calendarConnected = googleDocs.docs.some(doc => 
      doc.data().type === 'calendar' && doc.data().status === 'connected'
    );
    const driveConnected = googleDocs.docs.some(doc => 
      doc.data().type === 'drive' && doc.data().status === 'connected'
    );

    // Obtener estado de integración de Claude
    const claudeDocs = await adminDb
      .collection('claudeIntegrations')
      .where('userId', '==', auth.uid)
      .get();

    const claudeConnected = claudeDocs.docs.some(doc => 
      doc.data().status === 'connected' && doc.data().isActive
    );

    const status = {
      gmail: gmailConnected,
      calendar: calendarConnected,
      drive: driveConnected,
      claude: claudeConnected
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error obteniendo estado de integraciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
