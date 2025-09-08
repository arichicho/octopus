import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/server/firebaseAdmin';

export async function GET() {
  const adminAuth = getAuth();
  return NextResponse.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    bypassAuth: process.env.SERVER_BYPASS_AUTH,
    adminInitialized: !!adminAuth,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT_SET',
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT_SET',
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT_SET'
  });
}
