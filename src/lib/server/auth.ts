import { NextRequest } from 'next/server';
import { getAuth } from './firebaseAdmin';

export interface AuthContext {
  uid: string;
  email?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    const header = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
    const token = header.split(' ')[1];
    const adminAuth = getAuth();
    if (!adminAuth) return null;
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (e) {
    return null;
  }
}

