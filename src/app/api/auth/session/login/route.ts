import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/server/firebaseAdmin';

export async function POST(request: NextRequest) {
  const adminAuth = getAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: 'Server auth not configured' }, { status: 500 });
  }

  try {
    let idToken: string | null = null;
    let expiresInDays = 7;
    try {
      const body = await request.json();
      idToken = body?.idToken || null;
      if (typeof body?.expiresInDays === 'number') expiresInDays = body.expiresInDays;
    } catch {
      // ignore JSON parse errors
    }

    // Fallback: accept Bearer token from Authorization header
    if (!idToken) {
      const h = request.headers.get('authorization') || request.headers.get('Authorization');
      if (h && h.toLowerCase().startsWith('bearer ')) {
        idToken = h.split(' ')[1];
      }
    }

    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });

    const expiresIn = Math.min(Math.max(1, Number(expiresInDays)), 14) * 24 * 60 * 60 * 1000; // 1-14 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });
    const isProd = process.env.NODE_ENV === 'production';
    // Set both names for flexibility; __session is special on Firebase Hosting
    res.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(expiresIn / 1000),
    });
    res.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(expiresIn / 1000),
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create session' }, { status: 400 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
