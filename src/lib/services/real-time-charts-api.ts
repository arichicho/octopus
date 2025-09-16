import { Territory, SpotifyChartsTrack, SpotifyChartsData } from '@/types/music';

export class RealTimeChartsAPI {
  /**
   * Get REAL SpotifyCharts data by combining multiple real-time sources
   */
  async getRealSpotifyChartsData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    try {
      console.log(`🎯 Getting REAL SpotifyCharts data from multiple real-time sources for ${territory} ${period} (ALL 200 positions)`);
      
      // Get real data from multiple sources
      const realDataSources = await this.getRealDataFromMultipleSources(territory, period);
      
      // Check if we have any real data
      const totalRealTracks = realDataSources.reduce((sum, source) => sum + source.length, 0);
      
      if (totalRealTracks === 0) {
        console.log(`❌ No real data available for ${territory} ${period}`);
        throw new Error(`No real data available for ${territory} ${period}. All data sources returned empty results.`);
      }
      
      // Combine and deduplicate the data
      const combinedTracks = this.combineRealDataSources(realDataSources, territory, period);
      
      console.log(`✅ Successfully aggregated ${combinedTracks.length} REAL tracks from multiple real-time sources`);
      
      return {
        tracks: combinedTracks,
        territory,
        period,
        date: new Date().toISOString(),
        totalTracks: combinedTracks.length
      };

    } catch (error) {
      console.error('Error aggregating real-time data:', error);
      throw new Error(`Failed to aggregate real-time data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real data from multiple sources
   */
  private async getRealDataFromMultipleSources(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsTrack[][]> {
    const sources: SpotifyChartsTrack[][] = [];

    // Source 1: Real data from Spotify Web API (search for popular tracks)
    try {
      const spotifyData = await this.getRealDataFromSpotifyAPI(territory, period);
      sources.push(spotifyData);
      console.log(`✅ Got ${spotifyData.length} real tracks from Spotify API`);
    } catch (error) {
      console.warn('Failed to get Spotify API data:', error);
    }

    // Source 2: Real data from Chartmetric (if available)
    try {
      const chartmetricData = await this.getRealDataFromChartmetric(territory, period);
      sources.push(chartmetricData);
      console.log(`✅ Got ${chartmetricData.length} real tracks from Chartmetric`);
    } catch (error) {
      console.warn('Failed to get Chartmetric data:', error);
    }

    // Source 3: Real data from third-party APIs
    try {
      const thirdPartyData = await this.getRealDataFromThirdPartyAPIs(territory, period);
      sources.push(thirdPartyData);
      console.log(`✅ Got ${thirdPartyData.length} real tracks from third-party APIs`);
    } catch (error) {
      console.warn('Failed to get third-party API data:', error);
    }

    return sources;
  }

  /**
   * Get real data from Spotify Web API
   */
  private async getRealDataFromSpotifyAPI(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsTrack[]> {
    try {
      // This would use the Spotify Web API to get real popular tracks
      // For now, return empty array as we don't have Spotify API configured
      console.log('Spotify Web API not configured, skipping...');
      return [];
    } catch (error) {
      console.error('Error getting Spotify API data:', error);
      return [];
    }
  }

  /**
   * Get real data from Chartmetric
   */
  private async getRealDataFromChartmetric(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsTrack[]> {
    try {
      // This would use Chartmetric API to get real chart data
      // For now, return empty array as Chartmetric doesn't have charts endpoints
      console.log('Chartmetric charts API not available, skipping...');
      return [];
    } catch (error) {
      console.error('Error getting Chartmetric data:', error);
      return [];
    }
  }

  /**
   * Get real data from third-party APIs
   */
  private async getRealDataFromThirdPartyAPIs(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsTrack[]> {
    try {
      // This would use various third-party APIs to get real chart data
      // For now, return empty array as we don't have working third-party APIs
      console.log('Third-party APIs not available, skipping...');
      return [];
    } catch (error) {
      console.error('Error getting third-party API data:', error);
      return [];
    }
  }

  /**
   * Combine real data from multiple sources
   */
  private combineRealDataSources(sources: SpotifyChartsTrack[][], territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const combinedTracks: SpotifyChartsTrack[] = [];
    const seenTracks = new Set<string>();

    // Add tracks from all sources, avoiding duplicates
    for (const source of sources) {
      for (const track of source) {
        const trackKey = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;
        if (!seenTracks.has(trackKey)) {
          seenTracks.add(trackKey);
          combinedTracks.push(track);
        }
      }
    }

    // Sort by position
    combinedTracks.sort((a, b) => a.position - b.position);

    // Return only the real data we have - no expansion, no fallback
    return combinedTracks;
  }

}

// Export singleton instance
export const realTimeChartsAPI = new RealTimeChartsAPI();

/**
 * Main function to get REAL SpotifyCharts data from multiple real-time sources
 */
export async function getRealSpotifyChartsDataFromRealTimeAPI(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
  try {
    console.log(`🎯 Getting REAL SpotifyCharts data from real-time API for ${territory} ${period}`);
    return await realTimeChartsAPI.getRealSpotifyChartsData(territory, period);
  } catch (error) {
    console.error('Error getting REAL SpotifyCharts data from real-time API:', error);
    throw error;
  }
}
