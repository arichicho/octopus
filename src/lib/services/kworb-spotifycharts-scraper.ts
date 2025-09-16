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
      console.log(`📡 Fetching: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
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

      console.log(`✅ Successfully scraped ${tracks.length} REAL tracks from Kworb.net`);
      
      return {
        tracks,
        territory,
        period,
        date: new Date().toISOString(),
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
      global: 'global',
    };
    
    return territoryCodes[territory] || 'global';
  }

  /**
   * Parse Kworb HTML to extract track data
   */
  private parseKworbHTML(html: string, territory: Territory, period: 'daily' | 'weekly'): SpotifyChartsTrack[] {
    const tracks: SpotifyChartsTrack[] = [];
    
    try {
      // Parse HTML manually without cheerio
      const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
      if (!tableMatch) {
        console.log('No table found in HTML');
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

        // Kworb table structure: Pos | P+ | Artist and Title | Wks | Pk | (x?) | Streams | Streams+ | Total
        const position = parseInt(cells[0]) || i;
        const cambio = cells[1]; // Position change indicator (=, +2, -1, +1...)
        const artistAndTitle = cells[2]; // Artist - Title (combined)
        const semanasText = cells[3]; // Weeks on chart
        const picoText = cells[4]; // Peak position
        const streamsText = cells[6]; // Streams (skip the (x?) column)
        
        // Parse streams - handle different formats
        let streams = 0;
        if (streamsText) {
          const streamMatch = streamsText.match(/(\d{1,3}(?:,\d{3})*)/);
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
          // Remove HTML links and extract text
          const cleanText = artistAndTitle.replace(/<[^>]*>/g, '').trim();
          const titleMatch = cleanText.match(/^(.+?)\s*-\s*(.+)$/);
          if (titleMatch) {
            artist = titleMatch[1].trim();
            title = titleMatch[2].trim();
          } else {
            // Fallback: if no dash found, treat the whole thing as title
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
}

export const kworbSpotifyChartsScraper = new KworbSpotifyChartsScraper();

export async function getRealSpotifyChartsDataFromKworb(territory: Territory, period: 'daily' | 'weekly'): Promise<SpotifyChartsData> {
  return kworbSpotifyChartsScraper.getRealSpotifyChartsData(territory, period);
}
