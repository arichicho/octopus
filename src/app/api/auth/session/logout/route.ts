import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('__session', '', { path: '/', maxAge: 0 });
  res.cookies.set('session', '', { path: '/', maxAge: 0 });
  return res;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

