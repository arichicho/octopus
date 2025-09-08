import { NextRequest } from 'next/server';
import { getAuth } from './firebaseAdmin';

export interface AuthContext {
  uid: string;
  email?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    // Optional bypass for troubleshooting in controlled environments (never in production)
    const allowBypass = process.env.SERVER_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production';
    if (allowBypass) {
      console.warn('⚠️ SERVER_BYPASS_AUTH enabled (non-production) — skipping token verification');
      return { uid: 'bypass-uid', email: 'bypass@example.com' };
    }

    // Try session cookie first (more reliable on SSR and across requests)
    const cookieToken =
      request.cookies.get('session')?.value ||
      request.cookies.get('__session')?.value ||
      request.cookies.get('firebaseSession')?.value ||
      null;

    const header = request.headers.get('authorization') || request.headers.get('Authorization');
    console.log('🔍 DEBUG verifyAuth - Header received:', header ? 'YES' : 'NO');
    console.log('🔍 DEBUG verifyAuth - Header value:', header);
    
    const hasBearer = !!header && header.toLowerCase().startsWith('bearer ');
    const token = hasBearer ? header!.split(' ')[1] : null;
    console.log('🔍 DEBUG verifyAuth - Cookie present:', cookieToken ? 'YES' : 'NO');
    console.log('🔍 DEBUG verifyAuth - Bearer present:', hasBearer ? 'YES' : 'NO');
    
    const adminAuth = getAuth();
    console.log('🔍 DEBUG verifyAuth - Firebase admin auth initialized:', adminAuth ? 'YES' : 'NO');
    
    if (!adminAuth) {
      console.log('❌ DEBUG verifyAuth - Firebase admin auth not available');
      return null;
    }
    
    // Prefer session cookie if available
    if (cookieToken) {
      try {
        const decodedSession = await adminAuth.verifySessionCookie(cookieToken, true);
        console.log('✅ DEBUG verifyAuth - Session cookie verified for UID:', decodedSession.uid);
        return { uid: decodedSession.uid, email: decodedSession.email };
      } catch (e) {
        console.log('❌ DEBUG verifyAuth - Session cookie invalid:', e);
      }
    }

    if (!token) {
      console.log('❌ DEBUG verifyAuth - No valid authorization header and no session cookie');
      return null;
    }

    const decoded = await adminAuth.verifyIdToken(token);
    console.log('✅ DEBUG verifyAuth - Token verified successfully for UID:', decoded.uid);
    return { uid: decoded.uid, email: decoded.email };
  } catch (e) {
    console.log('❌ DEBUG verifyAuth - Error verifying token:', e);
    return null;
  }
}
