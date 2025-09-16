import { Territory, Track } from '@/types/music';

// Define the interfaces that are missing
export interface SpotifyChartsTrack extends Track {
  spotifyId: string;
  artistIds: string[];
}

export interface SpotifyChartsData {
  tracks: SpotifyChartsTrack[];
  territory: Territory;
  period: 'daily' | 'weekly';
  date: string;
  totalTracks: number;
}

export class LiveSpotifyChartsScraper {
  private baseUrl = 'https://charts.spotify.com';

  /**
   * Get LIVE REAL SpotifyCharts data for ALL 200 positions
   */
  async getLiveSpotifyChartsData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    try {
      console.log(`🌐 Getting LIVE REAL SpotifyCharts data for ${territory} ${period} (ALL 200 positions)`);
      
      // Try multiple approaches to get real data
      const approaches = [
        () => this.getKworbData(territory, period),
        () => this.getSpotifyChartsAPIData(territory, period),
        () => this.getPublicAPIData(territory, period),
        () => this.getCSVData(territory, period),
      ];

      for (const approach of approaches) {
        try {
          const result = await approach();
          if (result.tracks.length > 0) {
            console.log(`✅ Successfully got ${result.tracks.length} LIVE REAL tracks`);
            return result;
          }
        } catch (error) {
          console.log(`⚠️ Approach failed, trying next one:`, error);
          continue;
        }
      }

      throw new Error(`Failed to get real data for ${territory} ${period}`);

    } catch (error) {
      console.error('Error getting LIVE SpotifyCharts data:', error);
      throw new Error(`Failed to get LIVE SpotifyCharts data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Try to get data from Kworb.net
   */
  private async getKworbData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    try {
      const { getRealSpotifyChartsDataFromKworb } = await import('./kworb-spotifycharts-scraper');
      return await getRealSpotifyChartsDataFromKworb(territory, period);
    } catch (error) {
      console.error('Error getting Kworb data:', error);
      return { tracks: [], territory, period, date: new Date().toISOString(), totalTracks: 0 };
    }
  }

  /**
   * Try to access SpotifyCharts internal API
   */
  private async getSpotifyChartsAPIData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    const territoryCode = this.getTerritoryCode(territory);
    const periodCode = period === 'daily' ? 'daily' : 'weekly';
    
    // Try different API endpoints and dates
    const apiUrls = this.getSpotifyChartsAPIUrls(territoryCode, periodCode);
    
    for (const apiUrl of apiUrls) {
      try {
        console.log(`📡 Trying SpotifyCharts API: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json,text/plain,*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://charts.spotify.com/',
            'Origin': 'https://charts.spotify.com',
          }
        });

        if (!response.ok) {
          console.log(`❌ API URL failed: ${apiUrl} - ${response.status} ${response.statusText}`);
          continue;
        }

        const jsonData = await response.json();
        const tracks = this.parseSpotifyChartsAPIResponse(jsonData, territory, period);
        
        if (tracks.length > 0) {
          console.log(`✅ Successfully got ${tracks.length} tracks from SpotifyCharts API: ${apiUrl}`);
          
          return {
            tracks,
            territory,
            period,
            date: new Date().toISOString(),
            totalTracks: tracks.length
          };
        } else {
          console.log(`⚠️ No tracks found in API response: ${apiUrl}`);
          continue;
        }

      } catch (error) {
        console.log(`❌ Error with API URL ${apiUrl}:`, error);
        continue;
      }
    }

    return { tracks: [], territory, period, date: new Date().toISOString(), totalTracks: 0 };
  }

  /**
   * Get SpotifyCharts API URLs to try
   */
  private getSpotifyChartsAPIUrls(territoryCode: string, periodCode: string): string[] {
    const baseApiUrl = 'https://charts-spotify-com-service.spotify.com';
    const urls: string[] = [];
    
    // Generate URLs for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Try different API endpoint structures
      urls.push(`${baseApiUrl}/auth/v0/charts/regional-${territoryCode}-${periodCode}/${dateStr}`);
      urls.push(`${baseApiUrl}/v0/charts/regional-${territoryCode}-${periodCode}/${dateStr}`);
      urls.push(`${baseApiUrl}/charts/regional-${territoryCode}-${periodCode}/${dateStr}`);
    }
    
    // Also try 'latest' endpoint
    urls.push(`${baseApiUrl}/auth/v0/charts/regional-${territoryCode}-${periodCode}/latest`);
    urls.push(`${baseApiUrl}/v0/charts/regional-${territoryCode}-${periodCode}/latest`);
    urls.push(`${baseApiUrl}/charts/regional-${territoryCode}-${periodCode}/latest`);
    
    return urls;
  }

  /**
   * Parse SpotifyCharts API response
   */
  private parseSpotifyChartsAPIResponse(jsonData: any, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];
    
    try {
      // Navigate through possible JSON structures
      const entries = jsonData.entries || jsonData.data?.entries || jsonData.chart?.entries || [];
      
      if (Array.isArray(entries) && entries.length > 0) {
        for (const entry of entries) {
          const track = this.parseSpotifyChartsEntry(entry, territory, period);
          if (track) {
            tracks.push(track);
          }
        }
      }
      
      console.log(`✅ Parsed ${tracks.length} tracks from SpotifyCharts API response`);
      return tracks;
      
    } catch (error) {
      console.error('Error parsing SpotifyCharts API response:', error);
      return [];
    }
  }

  /**
   * Parse individual SpotifyCharts entry
   */
  private parseSpotifyChartsEntry(entry: any, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack | null {
    try {
      const position = entry.chartEntryData?.currentRank || entry.rank || 1;
      const title = entry.trackMetadata?.trackName || entry.track_name || 'Unknown Title';
      const artist = entry.trackMetadata?.artists?.[0]?.name || entry.artist_names || 'Unknown Artist';
      const streams = entry.chartEntryData?.rankingMetric?.value || entry.streams || 0;
      
      return {
        id: `api-${territory}-${period}-${position}`,
        position,
        title,
        artist,
        streams,
        previousPosition: entry.chartEntryData?.previousRank,
        weeksOnChart: entry.chartEntryData?.appearancesOnChart || 1,
        peakPosition: entry.chartEntryData?.peakRank || position,
        isNewEntry: entry.chartEntryData?.isNewEntry || false,
        isReEntry: entry.chartEntryData?.isReEntry || false,
        isNewPeak: entry.chartEntryData?.isNewPeak || false,
        spotifyId: entry.uri || `api-${territory}-${period}-${position}`,
        artistIds: entry.trackMetadata?.artists?.map((a: any) => a.uri) || [],
        date: new Date(),
        territory,
        period
      };
    } catch (error) {
      console.error('Error parsing SpotifyCharts entry:', error);
      return null;
    }
  }

  /**
   * Try to get data from public APIs
   */
  private async getPublicAPIData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    try {
      const { getRealSpotifyChartsDataFromPublicAPI } = await import('./public-spotifycharts-api');
      return await getRealSpotifyChartsDataFromPublicAPI(territory, period);
    } catch (error) {
      console.error('Error getting public API data:', error);
      return { tracks: [], territory, period, date: new Date().toISOString(), totalTracks: 0 };
    }
  }

  /**
   * Try to get CSV data
   */
  private async getCSVData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    const csvUrls = this.getCSVUrls(territory, period);
    
    for (const csvUrl of csvUrls) {
      try {
        console.log(`📡 Trying CSV URL: ${csvUrl}`);
        
        const response = await fetch(csvUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/csv,application/csv,text/plain,*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
          }
        });

        if (!response.ok) {
          console.log(`❌ CSV URL failed: ${csvUrl} - ${response.status} ${response.statusText}`);
          continue;
        }

        const csvText = await response.text();
        const tracks = this.parseCSVData(csvText, territory, period);
        
        if (tracks.length > 0) {
          console.log(`✅ Successfully downloaded ${tracks.length} LIVE REAL tracks from CSV: ${csvUrl}`);
          
          return {
            tracks,
            territory,
            period,
            date: new Date().toISOString(),
            totalTracks: tracks.length
          };
        } else {
          console.log(`⚠️ No tracks found in CSV: ${csvUrl}`);
          continue;
        }

      } catch (error) {
        console.log(`❌ Error with CSV URL ${csvUrl}:`, error);
        continue;
      }
    }

    return { tracks: [], territory, period, date: new Date().toISOString(), totalTracks: 0 };
  }

  /**
   * Get CSV URLs for SpotifyCharts data
   */
  private getCSVUrls(territory: Territory, period: 'daily' | 'weekly'): string[] {
    const territoryCode = this.getTerritoryCode(territory);
    const periodCode = period === 'daily' ? 'daily' : 'weekly';
    
    // Generate CSV URLs for the last 7 days to ensure we find available data
    const csvUrls: string[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // CSV URL format: https://charts.spotify.com/charts/regional-{territory}-{period}-{date}.csv
      csvUrls.push(`${this.baseUrl}/charts/regional-${territoryCode}-${periodCode}-${dateStr}.csv`);
    }
    
    return csvUrls;
  }

  /**
   * Get territory code for SpotifyCharts URLs
   */
  private getTerritoryCode(territory: Territory): string {
    const territoryCodes: { [key: string]: string } = {
      'argentina': 'ar',
      'mexico': 'mx',
      'spain': 'es',
      'spanish': 'es', // Map 'spanish' to 'es' for Spain
      'global': 'global'
    };

    return territoryCodes[territory] || 'global';
  }

  /**
   * Parse LIVE HTML response from SpotifyCharts
   */
  private parseLiveSpotifyChartsHTML(html: string, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    // Method 1: Look for JSON data embedded in the HTML (Next.js __NEXT_DATA__)
    const jsonData = this.extractJSONFromHTML(html);
    if (jsonData) {
      const parsedTracks = this.parseFromJSON(jsonData, territory, period);
      if (parsedTracks.length > 0) {
        return parsedTracks;
      }
    }

    // Method 2: Look for Next.js build manifest or other data
    const nextData = this.extractNextJSData(html);
    if (nextData) {
      const parsedTracks = this.parseFromNextJSData(nextData, territory, period);
      if (parsedTracks.length > 0) {
        return parsedTracks;
      }
    }

    // Method 3: Parse HTML table structure
    const tableTracks = this.parseFromHTMLTable(html, territory, period);
    if (tableTracks.length > 0) {
      return tableTracks;
    }

    // Method 4: Parse HTML list structure
    const listTracks = this.parseFromHTMLList(html, territory, period);
    if (listTracks.length > 0) {
      return listTracks;
    }

    // Method 5: Parse from any structured data found
    const structuredTracks = this.parseFromStructuredData(html, territory, period);
    if (structuredTracks.length > 0) {
      return structuredTracks;
    }

    console.warn('No chart data structure found in LIVE HTML');
    return [];
  }

  /**
   * Extract JSON data from HTML
   */
  private extractJSONFromHTML(html: string): any {
    // Look for common JSON patterns in HTML
    const patterns = [
      /window\.__INITIAL_STATE__\s*=\s*({.*?});/,
      /window\.__NEXT_DATA__\s*=\s*({.*?});/,
      /window\.__APOLLO_STATE__\s*=\s*({.*?});/,
      /"tracks":\s*\[(.*?)\]/,
      /"charts":\s*\[(.*?)\]/,
      /"data":\s*\[(.*?)\]/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Extract Next.js data from HTML
   */
  private extractNextJSData(html: string): any {
    // Look for Next.js specific patterns
    const patterns = [
      /<script id="__NEXT_DATA__" type="application\/json">({.*?})<\/script>/,
      /window\.__NEXT_DATA__\s*=\s*({.*?});/,
      /<script[^>]*>.*?__NEXT_DATA__.*?({.*?}).*?<\/script>/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Parse tracks from JSON data
   */
  private parseFromJSON(jsonData: any, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    // Navigate through possible JSON structures
    const possiblePaths = [
      jsonData.tracks,
      jsonData.charts,
      jsonData.data,
      jsonData.chart?.tracks,
      jsonData.chart?.data,
      jsonData.props?.pageProps?.tracks,
      jsonData.props?.pageProps?.charts,
      jsonData.props?.pageProps?.data
    ];

    for (const path of possiblePaths) {
      if (Array.isArray(path) && path.length > 0) {
        return path.map((track, index) => this.parseTrackFromJSON(track, index + 1, territory, period));
      }
    }

    return tracks;
  }

  /**
   * Parse tracks from Next.js data
   */
  private parseFromNextJSData(nextData: any, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    // Navigate through Next.js data structure
    const possiblePaths = [
      nextData.props?.pageProps?.tracks,
      nextData.props?.pageProps?.charts,
      nextData.props?.pageProps?.data,
      nextData.props?.pageProps?.chart?.tracks,
      nextData.props?.pageProps?.chart?.data,
      nextData.query?.tracks,
      nextData.query?.charts,
      nextData.query?.data
    ];

    for (const path of possiblePaths) {
      if (Array.isArray(path) && path.length > 0) {
        return path.map((track, index) => this.parseTrackFromJSON(track, index + 1, territory, period));
      }
    }

    return tracks;
  }

  /**
   * Parse individual track from JSON
   */
  private parseTrackFromJSON(trackData: any, position: number, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack {
    return {
      id: trackData.id || `live-${territory}-${period}-${position}`,
      position,
      title: trackData.name || trackData.title || trackData.track_name || trackData.song_name || 'Unknown Title',
      artist: this.parseArtist(trackData.artist || trackData.artists || trackData.artist_name),
      streams: trackData.streams || trackData.play_count || trackData.plays || 0,
      previousPosition: trackData.previous_position || trackData.last_position || undefined,
      weeksOnChart: trackData.weeks_on_chart || trackData.weeks_in_chart || 1,
      peakPosition: trackData.peak_position || trackData.highest_position || position,
      isNewEntry: trackData.is_new_entry || trackData.new_entry || false,
      isReEntry: trackData.is_re_entry || trackData.re_entry || false,
      isNewPeak: trackData.is_new_peak || trackData.new_peak || false,
      spotifyId: trackData.spotify_id || trackData.id || `live-${territory}-${period}-${position}`,
      artistIds: trackData.artist_ids || trackData.artists_ids || [`artist-${position}`],
      date: new Date(),
      territory,
      period
    };
  }

  /**
   * Parse artist from various formats
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
   * Parse from HTML table structure
   */
  private parseFromHTMLTable(html: string, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    // Look for table rows
    const rowPattern = /<tr[^>]*>.*?<\/tr>/gi;
    const rows = html.match(rowPattern) || [];

    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header row

      const track = this.parseTableRow(row, index, territory, period);
      if (track) {
        tracks.push(track);
      }
    });

    return tracks;
  }

  /**
   * Parse individual table row
   */
  private parseTableRow(row: string, position: number, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack | null {
    // Extract data from table cells
    const cellPattern = /<td[^>]*>(.*?)<\/td>/gi;
    const cells = [];
    let match;

    while ((match = cellPattern.exec(row)) !== null) {
      cells.push(match[1]);
    }

    if (cells.length < 2) return null;

    // Extract title and artist from cells
    const title = this.extractTextFromHTML(cells[1] || cells[0]);
    const artist = this.extractTextFromHTML(cells[2] || cells[1]);
    const streams = this.extractStreamsFromHTML(cells[3] || cells[2]);

    if (!title || !artist) return null;

    return {
      id: `live-${territory}-${period}-${position}`,
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
      spotifyId: `live-${territory}-${period}-${position}`,
      artistIds: [`artist-${position}`],
      date: new Date(),
      territory,
      period
    };
  }

  /**
   * Parse from HTML list structure
   */
  private parseFromHTMLList(html: string, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    // Look for list items
    const itemPattern = /<li[^>]*>.*?<\/li>/gi;
    const items = html.match(itemPattern) || [];

    items.forEach((item, index) => {
      const track = this.parseListItem(item, index + 1, territory, period);
      if (track) {
        tracks.push(track);
      }
    });

    return tracks;
  }

  /**
   * Parse individual list item
   */
  private parseListItem(item: string, position: number, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack | null {
    // Extract title and artist from list item
    const titleMatch = item.match(/<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/[^>]*>/i);
    const artistMatch = item.match(/<[^>]*class="[^"]*artist[^"]*"[^>]*>([^<]+)<\/[^>]*>/i);

    const title = titleMatch ? titleMatch[1].trim() : '';
    const artist = artistMatch ? artistMatch[1].trim() : '';

    if (!title || !artist) return null;

    return {
      id: `live-${territory}-${period}-${position}`,
      position,
      title,
      artist,
      streams: 0,
      previousPosition: undefined,
      weeksOnChart: 1,
      peakPosition: position,
      isNewEntry: false,
      isReEntry: false,
      isNewPeak: false,
      spotifyId: `live-${territory}-${period}-${position}`,
      artistIds: [`artist-${position}`],
      date: new Date(),
      territory,
      period
    };
  }

  /**
   * Parse CSV data from SpotifyCharts
   */
  private parseCSVData(csvText: string, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];
    
    try {
      const lines = csvText.split('\n');
      
      // Skip header line and process data lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line - SpotifyCharts CSV format typically has: Position, Track Name, Artist, Streams, etc.
        const columns = this.parseCSVLine(line);
        
        if (columns.length >= 3) {
          const position = parseInt(columns[0]) || i;
          const title = columns[1] || 'Unknown Title';
          const artist = columns[2] || 'Unknown Artist';
          const streams = parseInt(columns[3]) || 0;
          
          tracks.push({
            id: `csv-${territory}-${period}-${position}`,
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
            spotifyId: `csv-${territory}-${period}-${position}`,
            artistIds: [`artist-${position}`],
            date: new Date(),
            territory,
            period
          });
        }
      }
      
      console.log(`✅ Parsed ${tracks.length} tracks from CSV data`);
      return tracks;
      
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      return [];
    }
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last column
    columns.push(current.trim());
    
    return columns;
  }

  /**
   * Extract text content from HTML
   */
  private extractTextFromHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Extract streams from HTML
   */
  private extractStreamsFromHTML(html: string): number {
    const match = html.match(/(\d{1,3}(?:,\d{3})*)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  /**
   * Parse from any structured data found in HTML
   */
  private parseFromStructuredData(html: string, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    // Look for any structured data patterns
    const patterns = [
      /data-track="([^"]+)"/g,
      /data-song="([^"]+)"/g,
      /data-artist="([^"]+)"/g,
      /data-position="([^"]+)"/g
    ];

    // This is a fallback method - return empty array for now
    // In a real implementation, you would parse the structured data
    console.log('Parsing from structured data (fallback method)');
    
    return tracks;
  }
}

// Export singleton instance
export const liveSpotifyChartsScraper = new LiveSpotifyChartsScraper();

/**
 * Main function to get LIVE REAL SpotifyCharts data for ALL 200 positions
 */
export async function getLiveSpotifyChartsData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
  try {
    console.log(`🌐 Getting LIVE REAL SpotifyCharts data for ${territory} ${period}`);
    return await liveSpotifyChartsScraper.getLiveSpotifyChartsData(territory, period);
  } catch (error) {
    console.error('Error getting LIVE REAL SpotifyCharts data:', error);
    throw error;
  }
}
