import { Territory, SpotifyChartsTrack, SpotifyChartsData } from '@/types/music';

export class ThirdPartyChartsAPI {
  private baseUrl = 'https://api.zylalabs.com/api/v1/spotifycharts';

  /**
   * Get REAL SpotifyCharts data from third-party API
   */
  async getRealSpotifyChartsData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    try {
      console.log(`🌐 Getting REAL SpotifyCharts data from third-party API for ${territory} ${period}`);
      
      const url = this.buildAPIUrl(territory, period);
      console.log(`📡 Fetching: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from third-party API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const tracks = this.parseThirdPartyData(data, territory, period);
      
      console.log(`✅ Successfully retrieved ${tracks.length} REAL tracks from third-party API`);
      
      return {
        tracks,
        territory,
        period,
        date: new Date().toISOString(),
        totalTracks: tracks.length
      };

    } catch (error) {
      console.error('Error getting data from third-party API:', error);
      throw new Error(`Failed to get data from third-party API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the third-party API URL
   */
  private buildAPIUrl(territory: Territory, period: 'daily' | 'weekly'): string {
    const territoryCode = this.getTerritoryCode(territory);
    const periodCode = period === 'daily' ? 'daily' : 'weekly';
    
    // Try different possible API endpoints
    return `${this.baseUrl}/${territoryCode}/${periodCode}`;
  }

  /**
   * Get territory code for API
   */
  private getTerritoryCode(territory: Territory): string {
    const territoryCodes = {
      'argentina': 'AR',
      'mexico': 'MX',
      'spain': 'ES',
      'global': 'GLOBAL'
    };
    
    return territoryCodes[territory] || 'GLOBAL';
  }

  /**
   * Parse third-party API data
   */
  private parseThirdPartyData(data: any, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    try {
      // Handle different possible response structures
      let tracks: any[] = [];
      
      if (data.data && Array.isArray(data.data)) {
        tracks = data.data;
      } else if (data.charts && Array.isArray(data.charts)) {
        tracks = data.charts;
      } else if (data.tracks && Array.isArray(data.tracks)) {
        tracks = data.tracks;
      } else if (Array.isArray(data)) {
        tracks = data;
      } else {
        console.warn('Unexpected third-party API response structure:', data);
        return [];
      }

      return tracks.map((track, index) => this.parseTrack(track, index + 1, territory, period));

    } catch (error) {
      console.error('Error parsing third-party API data:', error);
      return [];
    }
  }

  /**
   * Parse individual track from third-party API data
   */
  private parseTrack(trackData: any, position: number, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack {
    // Handle different possible field names
    const title = trackData.name || trackData.title || trackData.track_name || trackData.song_name || 'Unknown Title';
    const artist = trackData.artist || trackData.artist_name || trackData.artists || 'Unknown Artist';
    const streams = trackData.streams || trackData.play_count || trackData.plays || 0;
    
    // Parse artist if it's an array
    const artistName = Array.isArray(artist) ? artist.join(', ') : artist;

    return {
      position,
      title,
      artist: artistName,
      streams,
      previousPosition: trackData.previous_position || trackData.last_position || undefined,
      weeksOnChart: trackData.weeks_on_chart || trackData.weeks_in_chart || 1,
      peakPosition: trackData.peak_position || trackData.highest_position || position,
      isNewEntry: trackData.is_new_entry || trackData.new_entry || false,
      isReEntry: trackData.is_re_entry || trackData.re_entry || false,
      isNewPeak: trackData.is_new_peak || trackData.new_peak || false,
      spotifyId: trackData.spotify_id || trackData.id || `third-party-${territory}-${period}-${position}`,
      artistIds: trackData.artist_ids || trackData.artists_ids || [`artist-${position}`],
      date: new Date(),
      territory,
      period
    };
  }
}

// Export singleton instance
export const thirdPartyChartsAPI = new ThirdPartyChartsAPI();

/**
 * Main function to get REAL SpotifyCharts data from third-party API
 */
export async function getRealSpotifyChartsDataFromThirdParty(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
  try {
    console.log(`🌐 Getting REAL SpotifyCharts data from third-party API for ${territory} ${period}`);
    return await thirdPartyChartsAPI.getRealSpotifyChartsData(territory, period);
  } catch (error) {
    console.error('Error getting REAL SpotifyCharts data from third-party API:', error);
    throw error;
  }
}
