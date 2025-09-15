import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Block this endpoint in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG_ENDPOINTS_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    // Verificar si tenemos el bypass token
    const bypassToken = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    
    if (!bypassToken) {
      return NextResponse.json({
        error: 'No bypass token configured',
        message: 'VERCEL_AUTOMATION_BYPASS_SECRET not found in environment variables'
      }, { status: 500 });
    }

    // Crear URL con bypass token
    const url = new URL(request.url);
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true');
    url.searchParams.set('x-vercel-protection-bypass', bypassToken);
    
    // Redirigir a la URL con bypass
    return NextResponse.redirect(url.toString());
    
  } catch (error) {
    console.error('Error in bypass-test:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



