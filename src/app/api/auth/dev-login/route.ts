import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/server/firebaseAdmin';

// Secure dev login via Firebase custom token.
// Access control:
// - Allowed when NODE_ENV !== 'production'
// - Or when DEV_LOGIN_ENABLED === 'true' AND request includes matching secret
//   via header `x-dev-login-secret` or query param `secret`.

function isAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  if (process.env.DEV_LOGIN_ENABLED !== 'true') return false;
  const header = request.headers.get('x-dev-login-secret');
  const url = new URL(request.url);
  const qp = url.searchParams.get('secret');
  const secret = header || qp;
  return !!secret && secret === process.env.DEV_LOGIN_SECRET;
}

export async function POST(request: NextRequest) {
  if (!isAllowed(request)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const adminAuth = getAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: 'Server auth not configured' }, { status: 500 });
  }

  try {
    let email: string | null = null;
    let displayName: string | null = null;
    try {
      const body = await request.json();
      email = (body?.email || '').trim() || null;
      displayName = (body?.displayName || '').trim() || null;
    } catch {}

    if (!email) {
      // Fallback: use first from env list or a safe default
      const envList = (process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
      email = envList[0] || 'dev@example.com';
    }

    // Use email as uid to keep consistency
    const uid = email.toLowerCase();

    // Ensure user exists with email set
    try {
      await adminAuth.getUserByEmail(email);
    } catch {
      try {
        await adminAuth.getUser(uid);
      } catch {
        await adminAuth.createUser({ uid, email, emailVerified: true, displayName: displayName || email });
      }
      await adminAuth.updateUser(uid, { email, emailVerified: true, displayName: displayName || email });
    }

    const customToken = await adminAuth.createCustomToken(uid, { email });
    return NextResponse.json({ customToken, email, uid });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create custom token' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

