import { Territory, SpotifyChartsTrack, SpotifyChartsData } from '@/types/music';

export class KworbSpotifyChartsScraper {
  private baseUrl = 'https://kworb.net/spotify';

  /**
   * Get REAL SpotifyCharts data from Kworb.net
   */
  async getRealSpotifyChartsData(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
    try {
      console.log(`🌐 Scraping REAL SpotifyCharts data from Kworb.net for ${territory} ${period}`);

      const url = this.getKworbUrl(territory, period);
      console.log(`📡 Fetching from Kworb: ${url}`);

      // Server-side fetch doesn't have CORS restrictions
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Kworb data: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const tracks = this.parseKworbHTML(html, territory, period);
      
      if (tracks.length === 0) {
        throw new Error('No tracks found in Kworb data');
      }

      // Try to extract the actual chart date from the HTML
      const chartDate = this.extractChartDate(html) || new Date();

      console.log(`✅ Successfully scraped ${tracks.length} REAL tracks from Kworb.net (Date: ${chartDate.toISOString()})`);

      return {
        tracks: tracks.map(track => ({ ...track, date: chartDate })),
        territory,
        period,
        date: chartDate.toISOString(),
        totalTracks: tracks.length
      };
      
    } catch (error) {
      console.error('Error scraping Kworb SpotifyCharts data:', error);
      throw new Error(`Failed to scrape Kworb data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Kworb URL for the specified territory and period
   */
  private getKworbUrl(territory: Territory, period: 'daily' | 'weekly'): string {
    const territoryCode = this.getTerritoryCode(territory);
    const periodCode = period === 'daily' ? 'daily' : 'weekly';
    
    return `${this.baseUrl}/country/${territoryCode}_${periodCode}.html`;
  }

  /**
   * Get territory code for Kworb URLs
   */
  private getTerritoryCode(territory: Territory): string {
    const territoryCodes: { [key in Territory]: string } = {
      argentina: 'ar',
      mexico: 'mx',
      spanish: 'es', // Spain uses 'es' in Kworb URLs
      spain: 'es',   // Also handle 'spain' territory
      global: 'global',
    } as any;
    
    return territoryCodes[territory] || 'global';
  }

  /**
   * Parse Kworb HTML to extract track data
   */
  private parseKworbHTML(html: string, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];

    try {
      // Look for the main chart table in Kworb HTML
      // Kworb has multiple tables, we need the one with class 'd'
      const tableMatch = html.match(/<table[^>]*class="[^"]*d[^"]*"[^>]*>([\s\S]*?)<\/table>/i) ||
                        html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);

      if (!tableMatch) {
        console.log('No table found in HTML');
        console.log('HTML preview:', html.substring(0, 500));
        return [];
      }

      const tableContent = tableMatch[1];
      const rowMatches = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

      if (!rowMatches) {
        console.log('No table rows found');
        return [];
      }

      for (let i = 1; i < rowMatches.length; i++) { // Skip header row
        const rowContent = rowMatches[i];
        const cellMatches = rowContent.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        
        if (!cellMatches || cellMatches.length < 6) {
          continue;
        }

        // Extract text content from cells
        const cells = cellMatches.map(cell => {
          return cell.replace(/<[^>]*>/g, '').trim();
        });

        // Kworb table structure for daily/weekly:
        // Daily: Pos | P+ | Artist and Title | Days | Pk | Streams
        // Weekly: Pos | P+ | Artist and Title | Wks | Pk | (x?) | Streams | Streams+ | Total
        const position = parseInt(cells[0]) || i;
        const cambio = cells[1]; // Position change indicator (=, +2, -1, +1...)
        const artistAndTitle = cells[2]; // Artist - Title (combined)
        const semanasText = cells[3]; // Weeks/Days on chart
        const picoText = cells[4]; // Peak position

        // Parse streams - Kworb shows streams in different columns
        // Structure for Argentina daily (from actual data):
        // Pos | P+ | Artist-Title | Days | Pk | (x?) | Streams | Streams+ | Daily Total | Weekly+ | Total
        // 0     1    2             3      4    5      6         7          8            9        10
        let streams = 0;
        let streamsText = '';

        // For daily charts: column 6 has today's streams, column 10 has total
        // For weekly charts: similar structure but different meaning
        if (period === 'daily') {
          // Use today's streams (column 6) or total (column 10)
          streamsText = cells[6] || cells[10] || cells[5] || '';
        } else {
          // For weekly, try total column first
          streamsText = cells[10] || cells[8] || cells[6] || '';
        }

        // Debug log to see what we're parsing
        if (i <= 3) {
          console.log(`Row ${i}: Cell count: ${cells.length}, Streams text: '${streamsText}'`);
          if (cells.length > 10) {
            console.log(`  Col 6: '${cells[6]}', Col 8: '${cells[8]}', Col 10: '${cells[10]}'`);
          }
        }

        // Parse streams - handle different formats
        if (streamsText) {
          // Remove any HTML tags first
          const cleanStreams = streamsText.replace(/<[^>]*>/g, '').trim();

          // Match numbers with commas (e.g., "426,889" or "2,821,686")
          const streamMatch = cleanStreams.match(/(\d{1,3}(?:,\d{3})*|\d+)/);
          if (streamMatch) {
            streams = parseInt(streamMatch[1].replace(/,/g, '')) || 0;
          }
        }
        
        // Parse weeks on chart
        let weeksOnChart = 1;
        if (semanasText) {
          const weeksMatch = semanasText.match(/(\d+)/);
          if (weeksMatch) {
            weeksOnChart = parseInt(weeksMatch[1]) || 1;
          }
        }
        
        // Parse peak position
        let peakPosition = position;
        if (picoText) {
          const peakMatch = picoText.match(/#?(\d+)/);
          if (peakMatch) {
            peakPosition = parseInt(peakMatch[1]) || position;
          }
        }
        
        // Parse previous position from cambio (change indicator)
        let previousPosition = undefined;
        if (cambio) {
          if (cambio === '=') {
            previousPosition = position; // Same position
          } else if (cambio.startsWith('+')) {
            const change = parseInt(cambio.replace('+', ''));
            previousPosition = position + change;
          } else if (cambio.startsWith('-')) {
            const change = parseInt(cambio.replace('-', ''));
            previousPosition = position - change;
          } else if (cambio === 'NEW') {
            previousPosition = undefined; // New entry
          }
        }
        
        // Determine entry status
        const isNewEntry = cambio === 'NEW' || !previousPosition;
        const isReEntry = cambio === 'RE-ENTRY';
        const isNewPeak = peakPosition === position && previousPosition && previousPosition > position;
        
        // Extract artist and title from the combined cell
        let artist = '';
        let title = '';

        if (artistAndTitle) {
          // Remove HTML links but preserve text
          const cleanText = artistAndTitle
            .replace(/<a[^>]*>/g, '')
            .replace(/<\/a>/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();

          // Kworb format is "Artist - Title"
          const parts = cleanText.split(' - ');
          if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim(); // Handle titles with dashes
          } else {
            // Sometimes format might be different, try to extract
            title = cleanText;
            artist = 'Unknown Artist';
          }
        }
        
        if (title && artist && title !== 'Title' && artist !== 'Artist') {
          tracks.push({
            position,
            title,
            artist,
            streams,
            previousPosition,
            weeksOnChart,
            peakPosition,
            isNewEntry,
            isReEntry,
            isNewPeak,
            spotifyId: `kworb-${territory}-${period}-${position}`,
            artistIds: [],
            date: new Date(),
            territory,
            period
          });
        }
      }
      
      console.log(`✅ Parsed ${tracks.length} tracks from Kworb HTML`);
      return tracks;
      
    } catch (error) {
      console.error('Error parsing Kworb HTML:', error);
      return [];
    }
  }

  /**
   * Extract the chart date from Kworb HTML
   */
  private extractChartDate(html: string): Date | null {
    try {
      // Kworb shows the chart date in the page title like:
      // "Spotify Daily Chart - Argentina - 2025/09/14"
      // "Spotify Weekly Chart - Argentina - 2025/09/08 - 2025/09/14"

      const datePatterns = [
        // Kworb specific format: YYYY/MM/DD
        /Spotify\s+(?:Daily|Weekly)\s+Chart\s+[^-]+\s+-\s+(\d{4}\/\d{2}\/\d{2})/i,
        // Alternative with hyphen: YYYY-MM-DD
        /Spotify\s+(?:Daily|Weekly)\s+Chart\s+[^-]+\s+-\s+(\d{4}-\d{2}-\d{2})/i,
        // For weekly charts with date range
        /Spotify\s+Weekly\s+Chart\s+[^-]+\s+-\s+\d{4}[\/\-]\d{2}[\/\-]\d{2}\s+-\s+(\d{4}[\/\-]\d{2}[\/\-]\d{2})/i,
        // Generic date formats as fallback
        /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/,  // YYYY/MM/DD or YYYY-MM-DD
        /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
        /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i
      ];

      for (const pattern of datePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const dateStr = match[1].trim();
          console.log(`Found potential date string: '${dateStr}'`);

          // Clean up the date string and convert format
          const cleanDateStr = dateStr
            .replace(/&nbsp;/g, ' ')
            .replace(/\//g, '-')  // Convert YYYY/MM/DD to YYYY-MM-DD
            .replace(/\s+/g, ' ')
            .trim();

          const date = new Date(cleanDateStr + 'T00:00:00');
          if (!isNaN(date.getTime())) {
            console.log(`✅ Extracted chart date: ${date.toISOString().split('T')[0]}`);
            return date;
          }
        }
      }

      // If no date found, use yesterday's date as charts are usually 1 day behind
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      console.log(`⚠️ No chart date found in HTML, using yesterday: ${yesterday.toISOString()}`);
      return yesterday;
    } catch (error) {
      console.error('Error extracting chart date:', error);
      return null;
    }
  }
}

export const kworbSpotifyChartsScraper = new KworbSpotifyChartsScraper();

export async function getRealSpotifyChartsDataFromKworb(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
  return kworbSpotifyChartsScraper.getRealSpotifyChartsData(territory, period);
}
