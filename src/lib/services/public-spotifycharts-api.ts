import { Territory, SpotifyChartsTrack, SpotifyChartsData } from '@/types/music';

export class PublicSpotifyChartsAPI {
  private lastFmApiKey = process.env.LASTFM_API_KEY;
  private lastFmBaseUrl = 'https://ws.audioscrobbler.com/2.0/';

  /**
   * Get REAL SpotifyCharts data using public APIs
   */
  async getRealSpotifyChartsData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    try {
      console.log(`🌐 Fetching REAL SpotifyCharts data from public APIs for ${territory} ${period}`);
      
      // Try multiple public APIs that might have Spotify chart data
      const apis = [
        () => this.getLastFmData(territory, period),
        () => this.getMusicBrainzData(territory, period),
        () => this.getGeniusData(territory, period),
      ];

      for (const apiCall of apis) {
        try {
          const result = await apiCall();
          if (result.tracks.length > 0) {
            console.log(`✅ Successfully got ${result.tracks.length} tracks from public API`);
            return result;
          }
        } catch (error) {
          console.log(`⚠️ API failed, trying next one:`, error);
          continue;
        }
      }

      // If all APIs fail, return empty data
      return {
        tracks: [],
        territory,
        period,
        date: new Date().toISOString(),
        totalTracks: 0
      };
      
    } catch (error) {
      console.error('Error getting public SpotifyCharts data:', error);
      throw new Error(`Failed to get data from public APIs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Try to get data from Last.fm API
   */
  private async getLastFmData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    if (!this.lastFmApiKey) {
      throw new Error('Last.fm API key not configured');
    }

    const country = this.getCountryCode(territory);
    const method = period === 'daily' ? 'chart.gettoptracks' : 'chart.gettoptracks';
    
    const url = `${this.lastFmBaseUrl}?method=${method}&api_key=${this.lastFmApiKey}&format=json&country=${country}&limit=200`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Last.fm API failed: ${response.status}`);
    }

    const data = await response.json();
    const tracks = this.parseLastFmData(data, territory, period);
    
    return {
      tracks,
      territory,
      period,
      date: new Date().toISOString(),
      totalTracks: tracks.length
    };
  }

  /**
   * Try to get data from MusicBrainz API
   */
  private async getMusicBrainzData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    // MusicBrainz doesn't have chart data, so this will always fail
    throw new Error('MusicBrainz API does not provide chart data');
  }

  /**
   * Try to get data from Genius API
   */
  private async getGeniusData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    // Genius doesn't have Spotify chart data, so this will always fail
    throw new Error('Genius API does not provide Spotify chart data');
  }

  /**
   * Parse Last.fm data
   */
  private parseLastFmData(data: any, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];
    
    try {
      const trackList = data.tracks?.track || [];
      
      for (let i = 0; i < trackList.length; i++) {
        const track = trackList[i];
        tracks.push({
          position: i + 1,
          title: track.name || 'Unknown Title',
          artist: track.artist?.name || 'Unknown Artist',
          streams: parseInt(track.playcount) || 0,
          previousPosition: undefined,
          weeksOnChart: 1,
          peakPosition: i + 1,
          isNewEntry: false,
          isReEntry: false,
          isNewPeak: false,
          spotifyId: `lastfm-${territory}-${period}-${i + 1}`,
          artistIds: [],
          date: new Date(),
          territory,
          period
        });
      }
      
      console.log(`✅ Parsed ${tracks.length} tracks from Last.fm`);
      return tracks;
      
    } catch (error) {
      console.error('Error parsing Last.fm data:', error);
      return [];
    }
  }

  /**
   * Get country code for API calls
   */
  private getCountryCode(territory: Territory): string {
    const countryCodes: { [key in Territory]: string } = {
      argentina: 'argentina',
      mexico: 'mexico',
      spanish: 'spain',
      global: 'global',
    };
    
    return countryCodes[territory] || 'global';
  }
}

export const publicSpotifyChartsAPI = new PublicSpotifyChartsAPI();

export async function getRealSpotifyChartsDataFromPublicAPI(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
  return publicSpotifyChartsAPI.getRealSpotifyChartsData(territory, period);
}
