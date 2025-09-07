import { NextRequest } from 'next/server';
import { getAuth } from './firebaseAdmin';

export interface AuthContext {
  uid: string;
  email?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    const header = request.headers.get('authorization') || request.headers.get('Authorization');
    console.log('🔍 DEBUG verifyAuth - Header received:', header ? 'YES' : 'NO');
    console.log('🔍 DEBUG verifyAuth - Header value:', header);
    
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      console.log('❌ DEBUG verifyAuth - No valid authorization header');
      return null;
    }
    
    const token = header.split(' ')[1];
    console.log('🔍 DEBUG verifyAuth - Token extracted:', token ? 'YES' : 'NO');
    console.log('🔍 DEBUG verifyAuth - Token length:', token?.length);
    
    const adminAuth = getAuth();
    console.log('🔍 DEBUG verifyAuth - Firebase admin auth initialized:', adminAuth ? 'YES' : 'NO');
    
    if (!adminAuth) {
      console.log('❌ DEBUG verifyAuth - Firebase admin auth not available');
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

