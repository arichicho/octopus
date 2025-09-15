import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server/auth';
import { hasApiKey, healthPing } from '@/lib/server/ai/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Claude API health
    const claudeHealth = await healthPing();
    
    // Check other dependencies
    const dependencies = {
      claude: {
        hasApiKey: hasApiKey(),
        health: claudeHealth,
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'
      },
      chartmetric: {
        hasApiKey: !!process.env.CHARTMETRIC_API_KEY,
        configured: !!process.env.CHARTMETRIC_API_KEY
      },
      firestore: {
        configured: !!process.env.FIREBASE_PROJECT_ID,
        projectId: process.env.FIREBASE_PROJECT_ID || 'not-configured'
      },
      scheduler: {
        timezone: 'America/Argentina/Buenos_Aires',
        dailyTime: '10:00',
        weeklyTime: '07:00'
      }
    };

    const overallHealth = {
      status: claudeHealth.ok ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies
    };

    return NextResponse.json(overallHealth);
  } catch (error) {
    console.error('Error in Music Trends health check:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
