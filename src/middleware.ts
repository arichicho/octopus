import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accept = request.headers.get('accept') || '';
  const isHtml = accept.includes('text/html');
  if (!isHtml) return NextResponse.next();

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const config = {
  matcher: [
    // Todas las rutas excepto assets y archivos estáticos de Next
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|svg|gif|ico|css|js|txt)).*)',
  ],
};

