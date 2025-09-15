import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';

// Chartmetric API integration
async function fetchChartmetricData(trackId: string, artistId: string) {
  try {
    const apiKey = process.env.CHARTMETRIC_API_KEY;
    if (!apiKey) {
      throw new Error('Chartmetric API key not configured');
    }

    // Fetch track data
    const trackResponse = await fetch(`https://api.chartmetric.com/api/track/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!trackResponse.ok) {
      throw new Error(`Chartmetric API error: ${trackResponse.status}`);
    }

    const trackData = await trackResponse.json();

    // Fetch artist data
    const artistResponse = await fetch(`https://api.chartmetric.com/api/artist/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!artistResponse.ok) {
      throw new Error(`Chartmetric API error: ${artistResponse.status}`);
    }

    const artistData = await artistResponse.json();

    // Fetch social metrics
    const socialResponse = await fetch(`https://api.chartmetric.com/api/artist/${artistId}/stat`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const socialData = socialResponse.ok ? await socialResponse.json() : null;

    return {
      success: true,
      data: {
        track: trackData,
        artist: artistData,
        social: socialData
      }
    };
  } catch (error) {
    console.error('Error fetching Chartmetric data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function searchChartmetricTrack(title: string, artist: string) {
  try {
    const apiKey = process.env.CHARTMETRIC_API_KEY;
    if (!apiKey) {
      throw new Error('Chartmetric API key not configured');
    }

    // Search for track
    const searchResponse = await fetch(
      `https://api.chartmetric.com/api/search?q=${encodeURIComponent(`${title} ${artist}`)}&type=track`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Chartmetric search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    return {
      success: true,
      data: searchData
    };
  } catch (error) {
    console.error('Error searching Chartmetric:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const trackId = searchParams.get('trackId');
    const artistId = searchParams.get('artistId');
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');

    if (action === 'search' && title && artist) {
      const result = await searchChartmetricTrack(title, artist);
      return NextResponse.json(result);
    }

    if (action === 'fetch' && trackId && artistId) {
      const result = await fetchChartmetricData(trackId, artistId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in Chartmetric API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tracks } = body;

    if (!tracks || !Array.isArray(tracks)) {
      return NextResponse.json(
        { error: 'Invalid tracks data' },
        { status: 400 }
      );
    }

    // Batch fetch Chartmetric data for multiple tracks
    const results = await Promise.allSettled(
      tracks.map(async (track: any) => {
        const searchResult = await searchChartmetricTrack(track.title, track.artist);
        if (searchResult.success && searchResult.data?.obj?.tracks?.length > 0) {
          const trackData = searchResult.data.obj.tracks[0];
          const artistId = trackData.artists?.[0]?.id;
          
          if (artistId) {
            const detailedResult = await fetchChartmetricData(trackData.id, artistId);
            return {
              trackId: track.id,
              data: detailedResult
            };
          }
        }
        return {
          trackId: track.id,
          data: { success: false, error: 'Track not found in Chartmetric' }
        };
      })
    );

    const enrichedTracks = results.map((result, index) => ({
      trackId: tracks[index].id,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value.data : null,
      error: result.status === 'rejected' ? result.reason : null
    }));

    return NextResponse.json({
      success: true,
      data: enrichedTracks
    });
  } catch (error) {
    console.error('Error in Chartmetric POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
