import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    bypassAuth: process.env.SERVER_BYPASS_AUTH,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT_SET',
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT_SET',
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT_SET'
  });
}
