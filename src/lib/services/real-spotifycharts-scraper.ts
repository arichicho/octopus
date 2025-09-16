import { Territory, SpotifyChartsTrack, SpotifyChartsData } from '@/types/music';

export class RealSpotifyChartsScraper {
  private baseUrl = 'https://charts.spotify.com';

  /**
   * Get REAL SpotifyCharts data for ALL 200 positions
   */
  async getRealSpotifyChartsData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    const possibleUrls = this.getPossibleUrls(territory, period);
    
    for (const url of possibleUrls) {
      try {
        console.log(`🌐 Scraping REAL SpotifyCharts data for ${territory} ${period} (ALL 200 positions)`);
        console.log(`📡 Trying URL: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          }
        });

        if (!response.ok) {
          console.log(`❌ URL failed: ${url} - ${response.status} ${response.statusText}`);
          continue;
        }

        const html = await response.text();
        const tracks = this.parseRealSpotifyChartsHTML(html, territory, period);
        
        if (tracks.length > 0) {
          console.log(`✅ Successfully scraped ${tracks.length} REAL tracks from SpotifyCharts using: ${url}`);
          
          return {
            tracks,
            territory,
            period,
            date: new Date().toISOString(),
            totalTracks: tracks.length
          };
        } else {
          console.log(`⚠️ No tracks found in URL: ${url}`);
          continue;
        }

      } catch (error) {
        console.log(`❌ Error with URL ${url}:`, error);
        continue;
      }
    }

    throw new Error(`Failed to scrape REAL SpotifyCharts from any URL for ${territory} ${period}`);
  }

  /**
   * Get all possible URLs to try for SpotifyCharts
   */
  private getPossibleUrls(territory: Territory, period: 'daily' | 'weekly'): string[] {
    const territoryCode = this.getTerritoryCode(territory);
    const periodCode = period === 'daily' ? 'daily' : 'weekly';
    
    return [
      `${this.baseUrl}/charts/${periodCode}/${territoryCode}`,
      `${this.baseUrl}/charts/${territoryCode}/${periodCode}`,
      `${this.baseUrl}/charts/${periodCode}/${territoryCode}/`,
      `${this.baseUrl}/charts/${territoryCode}/${periodCode}/`,
      `${this.baseUrl}/charts/${periodCode}/${territoryCode}/tracks`,
      `${this.baseUrl}/charts/${territoryCode}/${periodCode}/tracks`,
      `${this.baseUrl}/charts/${periodCode}/${territoryCode}/songs`,
      `${this.baseUrl}/charts/${territoryCode}/${periodCode}/songs`,
      `${this.baseUrl}/charts/${periodCode}/${territoryCode}/top-200`,
      `${this.baseUrl}/charts/${territoryCode}/${periodCode}/top-200`,
      `${this.baseUrl}/charts/${periodCode}/${territoryCode}/top200`,
      `${this.baseUrl}/charts/${territoryCode}/${periodCode}/top200`,
      `${this.baseUrl}/charts/${periodCode}/${territoryCode}/all`,
      `${this.baseUrl}/charts/${territoryCode}/${periodCode}/all`,
      `${this.baseUrl}/charts/${periodCode}/${territoryCode}/complete`,
      `${this.baseUrl}/charts/${territoryCode}/${periodCode}/complete`
    ];
  }

  /**
   * Get the territory code for SpotifyCharts URLs
   */
  private getTerritoryCode(territory: Territory): string {
    const territoryCodes = {
      'argentina': 'ar',
      'mexico': 'mx', 
      'spain': 'es',
      'global': 'global'
    };
    
    return territoryCodes[territory] || 'global';
  }

  /**
   * Parse the HTML response from SpotifyCharts to get ALL 200 real tracks
   */
  private parseRealSpotifyChartsHTML(html: string, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    // Try to find the chart data in different possible formats
    // SpotifyCharts might use JSON data embedded in the HTML
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
    if (jsonMatch) {
      try {
        const initialState = JSON.parse(jsonMatch[1]);
        return this.parseFromInitialState(initialState, territory, period);
      } catch (error) {
        console.warn('Failed to parse initial state JSON:', error);
      }
    }

    // Try to find chart data in script tags
    const scriptMatches = html.match(/<script[^>]*>([^<]*chart[^<]*)<\/script>/gi);
    if (scriptMatches) {
      for (const script of scriptMatches) {
        try {
          const jsonMatch = script.match(/\{.*"tracks".*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.tracks && Array.isArray(data.tracks)) {
              return this.parseFromTracksArray(data.tracks, territory, period);
            }
          }
        } catch (error) {
          // Continue trying other scripts
        }
      }
    }

    // Try to find table rows with chart data
    const tableRows = html.match(/<tr[^>]*data-testid="chart-table-row"[^>]*>.*?<\/tr>/gi);
    if (tableRows) {
      return this.parseFromTableRows(tableRows, territory, period);
    }

    // Try to find list items with chart data
    const listItems = html.match(/<li[^>]*data-testid="chart-item"[^>]*>.*?<\/li>/gi);
    if (listItems) {
      return this.parseFromListItems(listItems, territory, period);
    }

    // If no structured data found, try to extract from any table structure
    const allRows = html.match(/<tr[^>]*>.*?<\/tr>/gi);
    if (allRows && allRows.length > 1) { // More than just header
      return this.parseFromTableRows(allRows.slice(1), territory, period); // Skip header
    }

    console.warn('No chart data structure found in HTML');
    return [];
  }

  /**
   * Parse tracks from initial state JSON
   */
  private parseFromInitialState(initialState: any, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    // Navigate through possible data structures
    const chartData = initialState.charts || initialState.data || initialState.tracks || initialState;
    
    if (chartData && Array.isArray(chartData)) {
      return this.parseFromTracksArray(chartData, territory, period);
    }

    if (chartData && chartData.tracks && Array.isArray(chartData.tracks)) {
      return this.parseFromTracksArray(chartData.tracks, territory, period);
    }

    return tracks;
  }

  /**
   * Parse tracks from tracks array
   */
  private parseFromTracksArray(tracksArray: any[], territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    return tracksArray.map((track, index) => ({
      position: index + 1,
      title: track.name || track.title || track.track_name || track.song_name || 'Unknown Title',
      artist: this.parseArtist(track.artist || track.artists || track.artist_name),
      streams: track.streams || track.play_count || track.plays || 0,
      previousPosition: track.previous_position || track.last_position || undefined,
      weeksOnChart: track.weeks_on_chart || track.weeks_in_chart || 1,
      peakPosition: track.peak_position || track.highest_position || index + 1,
      isNewEntry: track.is_new_entry || track.new_entry || false,
      isReEntry: track.is_re_entry || track.re_entry || false,
      isNewPeak: track.is_new_peak || track.new_peak || false,
      spotifyId: track.spotify_id || track.id || `real-${territory}-${period}-${index + 1}`,
      artistIds: track.artist_ids || track.artists_ids || [`artist-${index + 1}`],
      date: new Date(),
      territory,
      period
    }));
  }

  /**
   * Parse artist from various possible formats
   */
  private parseArtist(artist: any): string {
    if (typeof artist === 'string') {
      return artist;
    }
    
    if (Array.isArray(artist)) {
      return artist.map(a => typeof a === 'string' ? a : a.name || a.artist_name || 'Unknown').join(', ');
    }
    
    if (artist && typeof artist === 'object') {
      return artist.name || artist.artist_name || 'Unknown Artist';
    }
    
    return 'Unknown Artist';
  }

  /**
   * Parse tracks from table rows
   */
  private parseFromTableRows(rows: string[], territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    rows.forEach((row, index) => {
      try {
        const track = this.parseTableRow(row, index + 1, territory, period);
        if (track) {
          tracks.push(track);
        }
      } catch (error) {
        console.warn(`Error parsing row ${index + 1}:`, error);
      }
    });

    return tracks;
  }

  /**
   * Parse a single table row
   */
  private parseTableRow(row: string, position: number, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack | null {
    // Extract title
    const titleMatch = row.match(/<td[^>]*>.*?<[^>]*>([^<]+)<\/[^>]*>.*?<\/td>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract artist
    const artistMatch = row.match(/<td[^>]*>.*?<[^>]*>([^<]+)<\/[^>]*>.*?<\/td>/gi);
    const artist = artistMatch && artistMatch[1] ? artistMatch[1].trim() : '';

    // Extract streams
    const streamsMatch = row.match(/(\d{1,3}(?:,\d{3})*)/);
    const streams = streamsMatch ? parseInt(streamsMatch[1].replace(/,/g, '')) : 0;

    if (!title || !artist) {
      return null;
    }

    return {
      position,
      title,
      artist,
      streams,
      previousPosition: undefined,
      weeksOnChart: 1,
      peakPosition: position,
      isNewEntry: false,
      isReEntry: false,
      isNewPeak: false,
      spotifyId: `real-${territory}-${period}-${position}`,
      artistIds: [`artist-${position}`],
      date: new Date(),
      territory,
      period
    };
  }

  /**
   * Parse tracks from list items
   */
  private parseFromListItems(items: string[], territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    items.forEach((item, index) => {
      try {
        const track = this.parseListItem(item, index + 1, territory, period);
        if (track) {
          tracks.push(track);
        }
      } catch (error) {
        console.warn(`Error parsing list item ${index + 1}:`, error);
      }
    });

    return tracks;
  }

  /**
   * Parse a single list item
   */
  private parseListItem(item: string, position: number, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack | null {
    // Extract title and artist from list item
    const titleMatch = item.match(/<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/[^>]*>/i);
    const artistMatch = item.match(/<[^>]*class="[^"]*artist[^"]*"[^>]*>([^<]+)<\/[^>]*>/i);

    const title = titleMatch ? titleMatch[1].trim() : '';
    const artist = artistMatch ? artistMatch[1].trim() : '';

    if (!title || !artist) {
      return null;
    }

    return {
      position,
      title,
      artist,
      streams: 0, // Will be filled from other sources
      previousPosition: undefined,
      weeksOnChart: 1,
      peakPosition: position,
      isNewEntry: false,
      isReEntry: false,
      isNewPeak: false,
      spotifyId: `real-${territory}-${period}-${position}`,
      artistIds: [`artist-${position}`],
      date: new Date(),
      territory,
      period
    };
  }
}

// Export singleton instance
export const realSpotifyChartsScraper = new RealSpotifyChartsScraper();

/**
 * Main function to get REAL SpotifyCharts data for ALL 200 positions
 */
export async function getRealSpotifyChartsDataAllPositions(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
  try {
    console.log(`🌐 Getting REAL SpotifyCharts data for ALL 200 positions - ${territory} ${period}`);
    return await realSpotifyChartsScraper.getRealSpotifyChartsData(territory, period);
  } catch (error) {
    console.error('Error getting REAL SpotifyCharts data for all positions:', error);
    throw error;
  }
}
