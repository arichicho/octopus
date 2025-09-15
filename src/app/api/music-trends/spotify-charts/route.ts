import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server/auth';
import { Territory } from '@/types/music';

// SpotifyCharts scraping function
async function scrapeSpotifyCharts(territory: Territory, period: 'daily' | 'weekly') {
  try {
    const territoryMap = {
      argentina: 'ar',
      spain: 'es', 
      mexico: 'mx',
      global: 'global'
    };

    const periodMap = {
      daily: 'daily',
      weekly: 'weekly'
    };

    const url = `https://spotifycharts.com/regional/${territoryMap[territory]}/${periodMap[period]}/latest`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch charts: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse HTML to extract chart data
    // This is a simplified parser - you might need to adjust based on actual HTML structure
    const tracks = parseSpotifyChartsHTML(html, territory, period);
    
    return {
      success: true,
      data: tracks,
      lastUpdated: new Date(),
      territory,
      period
    };
  } catch (error) {
    console.error('Error scraping SpotifyCharts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      territory,
      period
    };
  }
}

function parseSpotifyChartsHTML(html: string, territory: Territory, period: 'daily' | 'weekly') {
  // This is a placeholder implementation
  // You'll need to implement actual HTML parsing based on SpotifyCharts structure
  const tracks = [];
  
  // Example parsing logic (adjust based on actual HTML structure):
  const trackRegex = /<tr[^>]*>.*?<td[^>]*>(\d+)<\/td>.*?<td[^>]*>.*?<strong[^>]*>(.*?)<\/strong>.*?<span[^>]*>(.*?)<\/span>.*?<td[^>]*>(\d+)<\/td>/gs;
  let match;
  
  while ((match = trackRegex.exec(html)) !== null) {
    const [, position, title, artist, streams] = match;
    tracks.push({
      id: `${territory}-${period}-${position}-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim(),
      position: parseInt(position),
      streams: parseInt(streams.replace(/,/g, '')),
      territory,
      period,
      date: new Date(),
      isNewEntry: false, // Will be determined by comparing with previous data
      isReEntry: false,
      isNewPeak: false,
      weeksOnChart: 1 // Will be calculated from historical data
    });
  }
  
  return tracks;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const territory = searchParams.get('territory') as Territory;
    const period = searchParams.get('period') as 'daily' | 'weekly';

    if (!territory || !period) {
      return NextResponse.json(
        { error: 'Missing territory or period parameter' },
        { status: 400 }
      );
    }

    if (!['argentina', 'spain', 'mexico', 'global'].includes(territory)) {
      return NextResponse.json(
        { error: 'Invalid territory' },
        { status: 400 }
      );
    }

    if (!['daily', 'weekly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period' },
        { status: 400 }
      );
    }

    const result = await scrapeSpotifyCharts(territory, period);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in SpotifyCharts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { territory, period } = body;

    if (!territory || !period) {
      return NextResponse.json(
        { error: 'Missing territory or period' },
        { status: 400 }
      );
    }

    // Trigger manual refresh
    const result = await scrapeSpotifyCharts(territory, period);
    
    // Store in Firestore
    if (result.success) {
      // TODO: Implement Firestore storage
      console.log('Storing chart data in Firestore...');
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in SpotifyCharts POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
