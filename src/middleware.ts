import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  
  console.log('🔍 Middleware ejecutándose:', { hostname, pathname });
  
  // Si estamos en theceo.web.app, redirigir a la URL de desarrollo
  if (hostname === 'theceo.web.app') {
    console.log('🔄 Redirigiendo desde theceo.web.app');
    const destinationUrl = `https://octopus-app--iamtheoceo.us-central1.hosted.app${pathname}`;
    return NextResponse.redirect(destinationUrl, 301);
  }
  
  // Si estamos en iamtheoceo.web.app, redirigir a la URL de desarrollo
  if (hostname === 'iamtheoceo.web.app') {
    console.log('🔄 Redirigiendo desde iamtheoceo.web.app');
    const destinationUrl = `https://octopus-app--iamtheoceo.us-central1.hosted.app${pathname}`;
    return NextResponse.redirect(destinationUrl, 301);
  }
  
  console.log('✅ Middleware: No redirección necesaria');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

