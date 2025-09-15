import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/auth';
import { getChartmetricClient, testChartmetricConnection } from '@/lib/services/chartmetric-client';

// Chartmetric API integration using the new client
async function fetchChartmetricData(spotifyId: string, type: 'track' | 'artist') {
  const client = getChartmetricClient();
  
  if (!client) {
    throw new Error('Chartmetric client not configured (missing CHARTMETRIC_REFRESH_TOKEN)');
  }

  try {
    if (type === 'track') {
      return await client.getTrackBySpotifyId(spotifyId);
    } else {
      return await client.getArtistBySpotifyId(spotifyId);
    }
  } catch (error) {
    console.error('Chartmetric API error:', error);
    throw error;
  }
}

async function searchChartmetricTrack(title: string, artist: string) {
  const client = getChartmetricClient();
  
  if (!client) {
    throw new Error('Chartmetric client not configured (missing CHARTMETRIC_REFRESH_TOKEN)');
  }

  try {
    // Search for track
    const searchData = await client.searchTracks(`${title} ${artist}`, 5);
    
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

async function enrichTrackWithChartmetric(track: any) {
  const client = getChartmetricClient();
  
  if (!client || !track.spotifyId) {
    return {
      ...track,
      chartmetricData: null,
      enrichmentError: 'Chartmetric not configured or no Spotify ID'
    };
  }

  try {
    // Get track data
    const trackData = await client.getTrackBySpotifyId(track.spotifyId);
    
    // Get artist data if available
    let artistData = null;
    if (track.artistIds && track.artistIds.length > 0) {
      try {
        artistData = await client.getArtistBySpotifyId(track.artistIds[0]);
      } catch (artistError) {
        console.warn('Could not fetch artist data:', artistError);
      }
    }

    // Get social metrics for artist
    let socialMetrics = null;
    if (artistData?.id) {
      try {
        socialMetrics = await client.getArtistSocialMetrics(artistData.id);
      } catch (socialError) {
        console.warn('Could not fetch social metrics:', socialError);
      }
    }

    return {
      ...track,
      chartmetricData: {
        track: trackData,
        artist: artistData,
        social: socialMetrics,
        enriched: true,
        enrichedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error enriching track with Chartmetric:', error);
    return {
      ...track,
      chartmetricData: null,
      enrichmentError: error instanceof Error ? error.message : 'Unknown error'
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
    const spotifyId = searchParams.get('spotifyId');
    const type = searchParams.get('type') as 'track' | 'artist';
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');
    const test = searchParams.get('test');

    // Test connection
    if (test === 'true') {
      const testResult = await testChartmetricConnection();
      return NextResponse.json(testResult);
    }

    // Search for track
    if (action === 'search' && title && artist) {
      const result = await searchChartmetricTrack(title, artist);
      return NextResponse.json(result);
    }

    // Fetch specific data
    if (action === 'fetch' && spotifyId && type) {
      const result = await fetchChartmetricData(spotifyId, type);
      return NextResponse.json({
        success: true,
        data: result
      });
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
    const { tracks, action } = body;

    if (action === 'enrich' && tracks && Array.isArray(tracks)) {
      // Batch enrich tracks with Chartmetric data
      const enrichedTracks = await Promise.allSettled(
        tracks.map(async (track: any) => {
          return await enrichTrackWithChartmetric(track);
        })
      );

      const results = enrichedTracks.map((result, index) => ({
        trackId: tracks[index].id,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));

      return NextResponse.json({
        success: true,
        data: results
      });
    }

    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in Chartmetric POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}