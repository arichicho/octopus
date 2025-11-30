import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  console.log('🔍 Testing auth bypass...');
  console.log('🔍 SERVER_BYPASS_AUTH:', process.env.SERVER_BYPASS_AUTH);
  
  const auth = await verifyAuth(request);
  console.log('🔍 Auth result:', auth);
  
  return NextResponse.json({
    message: 'Auth test endpoint',
    bypassEnabled: process.env.SERVER_BYPASS_AUTH === 'true',
    authResult: auth,
    timestamp: new Date().toISOString()
  });
}







