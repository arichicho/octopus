import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getFirestore } from '@/lib/server/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { companyId, weekStart } = await request.json();
    if (!companyId || !weekStart) return NextResponse.json({ error: 'companyId and weekStart are required' }, { status: 400 });

    const db = getFirestore();
    if (!db) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    // Skeleton: compute simple counts by status for the company (not strictly week-filtered yet)
    const snap = await db.collection('tasks').where('companyId', '==', companyId).get();
    const stats = { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 } as Record<string, number>;
    snap.forEach((d) => {
      const t = d.data() as any;
      stats.total += 1;
      stats[t.status] = (stats[t.status] || 0) + 1;
    });

    // TODO: filter by weekStart..weekEnd and join Calendar/Gmail once implemented
    // TODO: optionally generate a Docs report and return its URL
    return NextResponse.json({
      success: true,
      weekStart,
      stats,
      reportUrl: null,
    });
  } catch (e) {
    console.error('Weekly report error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

