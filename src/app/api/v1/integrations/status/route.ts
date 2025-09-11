import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getFirestore();
  if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  try {
    const base = db.collection('integrations_google_tokens');
    const [gmailSnap, calSnap, driveSnap] = await Promise.all([
      base.where('userId', '==', auth.uid).where('type', '==', 'gmail').limit(1).get(),
      base.where('userId', '==', auth.uid).where('type', '==', 'calendar').limit(1).get(),
      base.where('userId', '==', auth.uid).where('type', '==', 'drive').limit(1).get(),
    ]);

    // Claude connected if user has an entry or if server has a global API key
    const claudeSnap = await db
      .collection('claudeIntegrations')
      .where('userId', '==', auth.uid)
      .limit(1)
      .get();
    const claude = !claudeSnap.empty || !!process.env.CLAUDE_API_KEY;
    return NextResponse.json({
      gmail: !gmailSnap.empty,
      calendar: !calSnap.empty,
      drive: !driveSnap.empty,
      claude,
    });
  } catch (e) {
    return NextResponse.json({ gmail: false, calendar: false, drive: false, claude: false });
  }
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
