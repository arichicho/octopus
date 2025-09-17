import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid alertIds array' },
        { status: 400 }
      );
    }

    console.log(`✅ Acknowledging ${alertIds.length} alerts (alias route)`);

    // TODO: Persist acknowledgment in storage if needed
    return NextResponse.json({
      success: true,
      message: `Successfully acknowledged ${alertIds.length} alerts`,
      acknowledgedIds: alertIds,
    });
  } catch (error) {
    console.error('Error acknowledging alerts (alias):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to acknowledge alerts' },
      { status: 500 }
    );
  }
}

