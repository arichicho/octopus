import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=${encodeURIComponent('Código de autorización no recibido')}`
      );
    }

    // Parsear el estado para obtener el tipo de integración
    let integrationType = 'gmail'; // default
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        integrationType = stateData.type || 'gmail';
      } catch (e) {
        console.error('Error parsing state:', e);
      }
    }

    // Redirigir al frontend con el código de autorización
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?auth_code=${encodeURIComponent(code)}&type=${integrationType}`;
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error en callback de Google OAuth:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=${encodeURIComponent('Error interno del servidor')}`
    );
  }
}
