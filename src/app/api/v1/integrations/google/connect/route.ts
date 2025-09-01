import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { encrypt } from '@/lib/server/crypto';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, authCode } = await request.json();

    if (!userId || !type || !authCode) {
      return NextResponse.json(
        { error: 'userId, type y authCode son requeridos' },
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

    // Intercambiar código de autorización por tokens
    const tokenResponse = await exchangeAuthCode(authCode);
    
    if (!tokenResponse.success) {
      return NextResponse.json(
        { error: 'Error al obtener tokens de acceso' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una integración para este usuario y tipo
    const adminDb = getFirestore();
    if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    const existingDocs = await adminDb
      .collection('googleIntegrations')
      .where('userId', '==', auth.uid)
      .where('type', '==', type)
      .limit(1)
      .get();

    let integrationId: string;

    if (!existingDocs.empty) {
      // Actualizar integración existente
      const existingDoc = existingDocs.docs[0];
      integrationId = existingDoc.id;

      await adminDb.collection('googleIntegrations').doc(integrationId).update({
        accessTokenEnc: encrypt(tokenResponse.access_token),
        refreshTokenEnc: tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null,
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        status: 'connected',
        updatedAt: new Date()
      });
    } else {
      // Crear nueva integración
      const newIntegration = {
        userId: auth.uid,
        type,
        status: 'connected' as const,
        accessTokenEnc: encrypt(tokenResponse.access_token),
        refreshTokenEnc: tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null,
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        scopes: getScopesForType(type),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await adminDb.collection('googleIntegrations').add(newIntegration);
      integrationId = docRef.id;
    }

    // Obtener la integración creada/actualizada
    const integrationDoc = await adminDb
      .collection('googleIntegrations')
      .where('userId', '==', auth.uid)
      .where('type', '==', type)
      .limit(1)
      .get();
    const integration = integrationDoc.docs[0].data();

    // No exponer tokens en respuesta
    const { accessToken, refreshToken, accessTokenEnc, refreshTokenEnc, ...safe } = integration as any;
    return NextResponse.json({ id: integrationId, ...safe });
  } catch (error) {
    console.error('Error conectando integración de Google:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function exchangeAuthCode(authCode: string) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: authCode,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      console.error('Error en exchange de token:', await response.text());
      return { success: false };
    }

    const data = await response.json();
    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  } catch (error) {
    console.error('Error en exchange de auth code:', error);
    return { success: false };
  }
}

function getScopesForType(type: string): string[] {
  switch (type) {
    case 'gmail':
      return [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
      ];
    case 'calendar':
      return [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];
    case 'drive':
      return [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
      ];
    default:
      return [];
  }
}
