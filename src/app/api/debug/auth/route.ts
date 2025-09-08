import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/server/firebaseAdmin';

export async function GET(request: NextRequest) {
  // Hide this endpoint in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG_ENDPOINTS_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  const hasHeader = !!header;
  const bearer = hasHeader && header!.toLowerCase().startsWith('bearer ');
  const token = bearer ? header!.split(' ')[1] : null;
  const adminAuth = getAuth();

  // Check for session cookies
  const sessionCookie = request.cookies.get('session')?.value || request.cookies.get('__session')?.value;
  const hasSessionCookie = !!sessionCookie;

  const resp: any = {
    serverBypass: process.env.SERVER_BYPASS_AUTH === 'true',
    hasAuthHeader: hasHeader,
    bearerLike: bearer,
    tokenLength: token?.length || 0,
    cookiePresent: hasSessionCookie ? 'YES' : 'NO',
    adminInitialized: !!adminAuth,
    projectEnv: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'set' : 'missing',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'set' : 'missing',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'set' : 'missing',
      FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT ? 'set' : 'missing',
    },
  };

  if (process.env.SERVER_BYPASS_AUTH === 'true') {
    return NextResponse.json({ ...resp, mode: 'bypass' });
  }

  if (!adminAuth) {
    return NextResponse.json({ ...resp, verified: false, error: 'Firebase admin not initialized' }, { status: 401 });
  }

  // Try session cookie first
  if (sessionCookie) {
    try {
      const decodedSession = await adminAuth.verifySessionCookie(sessionCookie, true);
      return NextResponse.json({ 
        ...resp, 
        verified: true, 
        uid: decodedSession.uid, 
        email: decodedSession.email,
        authMethod: 'session-cookie'
      });
    } catch (e: any) {
      console.log('Session cookie verification failed:', e?.message);
    }
  }

  // Fallback to Bearer token
  if (!token) {
    return NextResponse.json({ ...resp, verified: false, error: 'No valid auth method' }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return NextResponse.json({ ...resp, verified: true, uid: decoded.uid, email: decoded.email, authMethod: 'bearer-token' });
  } catch (e: any) {
    return NextResponse.json({ ...resp, verified: false, error: e?.message || String(e) }, { status: 401 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
