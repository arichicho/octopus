import { NextRequest, NextResponse } from 'next/server';

// This route only redirects back to the app with code+state
// The client then calls our connect endpoint with Firebase auth
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '';
  const error = url.searchParams.get('error');

  const target = new URL('/dashboard/settings/integrations', url.origin);
  if (error) {
    target.searchParams.set('oauth_error', error);
  } else if (code) {
    target.searchParams.set('code', code);
    if (state) target.searchParams.set('state', state);
  }
  return NextResponse.redirect(target.toString());
}

