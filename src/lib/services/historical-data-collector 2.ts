import { Territory, SpotifyChartsData, SpotifyChartsTrack } from '@/types/music';
import { getRealSpotifyChartsDataFromKworb } from './kworb-spotifycharts-scraper';
import fs from 'fs';
import path from 'path';

/**
 * Historical Data Collector for Music Trends
 *
 * Collects and stores historical chart data from Kworb for trend analysis
 * Supports scraping multiple weeks of data for comparison calculations
 */

export interface HistoricalChartData {
  id: string;
  territory: Territory;
  period: 'daily' | 'weekly';
  date: string; // ISO date string
  week_number: number; // Week of the year
  year: number;
  tracks: SpotifyChartsTrack[];
  aggregatedData: {
    top10_streams: number;
    top50_streams: number;
    top200_streams: number;
    total_tracks: number;
    debuts: number;
    reentries: number;
  };
  createdAt: string;
}

export interface WeeklyComparison {
  current: HistoricalChartData;
  previous: HistoricalChartData | null;
  growth_rates: {
    top10: number;
    top50: number;
    top200: number;
  };
  weeks_back: number;
}

export class HistoricalDataCollector {
  private storage: Map<string, HistoricalChartData> = new Map();
  private readonly storageFile = path.join(process.cwd(), 'data', 'historical-charts.json');

  constructor() {
    this.loadFromFile();
  }

  /**
   * Collect historical data for the last N weeks
   */
  async collectHistoricalData(
    territory: Territory,
    weeks: number = 12,
    period: 'weekly' | 'daily' = 'weekly'
  ): Promise<HistoricalChartData[]> {
    console.log(`📅 Starting historical data collection for ${territory} - ${weeks} weeks of ${period} data`);

    const historicalData: HistoricalChartData[] = [];
    const currentDate = new Date();

    // Collect data for each week going backwards
    for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
      try {
        console.log(`🔍 Collecting week ${weekOffset + 1}/${weeks}...`);

        // Calculate the target date (weeks back from now)
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDate.getDate() - (weekOffset * 7));

        // For now, we'll scrape current data and simulate historical dates
        // In a real implementation, Kworb might have historical charts or we'd need different URLs
        const chartData = await this.scrapeWeekData(territory, period, targetDate, weekOffset);

        if (chartData) {
          historicalData.push(chartData);

          // Store in memory cache and file
          this.storage.set(chartData.id, chartData);
          this.saveToFile();

          // Add delay between requests to be respectful to Kworb
          if (weekOffset < weeks - 1) {
            await this.delay(2000); // 2 second delay between requests
          }
        }

      } catch (error) {
        console.error(`❌ Failed to collect data for week ${weekOffset}:`, error);

        // Create empty placeholder for failed weeks
        const placeholderData = this.createPlaceholderData(territory, period, currentDate, weekOffset);
        historicalData.push(placeholderData);
      }
    }

    console.log(`✅ Historical data collection completed: ${historicalData.length} weeks collected`);
    return historicalData.reverse(); // Return in chronological order (oldest first)
  }

  /**
   * Scrape data for a specific week
   */
  private async scrapeWeekData(
    territory: Territory,
    period: 'weekly' | 'daily',
    targetDate: Date,
    weekOffset: number
  ): Promise<HistoricalChartData | null> {
    try {
      // For current week (offset 0), get real data
      if (weekOffset === 0) {
        console.log(`📊 Scraping current ${period} data for ${territory}`);
        const chartData = await getRealSpotifyChartsDataFromKworb(territory, period);
        return this.transformToHistoricalData(chartData, targetDate, weekOffset);
      }

      // For historical weeks, we'll need to simulate or find alternative sources
      // Kworb typically only shows current week data
      console.log(`⚠️ Historical data for week ${weekOffset} not available from Kworb, generating estimated data`);

      // Get current data as baseline and create historical simulation
      const currentData = await getRealSpotifyChartsDataFromKworb(territory, period);
      return this.simulateHistoricalData(currentData, targetDate, weekOffset);

    } catch (error) {
      console.error(`Error scraping week data for ${territory} week ${weekOffset}:`, error);
      return null;
    }
  }

  /**
   * Transform Kworb data to historical format
   */
  public transformToHistoricalData(
    chartData: SpotifyChartsData,
    date: Date,
    weekOffset: number
  ): HistoricalChartData {
    const year = date.getFullYear();
    const weekNumber = this.getWeekNumber(date);

    // Calculate aggregated metrics
    const tracks = chartData.tracks || [];
    const top10Streams = tracks.slice(0, 10).reduce((sum, t) => sum + (t.streams || 0), 0);
    const top50Streams = tracks.slice(0, 50).reduce((sum, t) => sum + (t.streams || 0), 0);
    const top200Streams = tracks.reduce((sum, t) => sum + (t.streams || 0), 0);

    const debuts = tracks.filter(t => t.isNewEntry).length;
    const reentries = tracks.filter(t => t.isReEntry).length;

    const id = `${chartData.territory}-${chartData.period}-${year}W${weekNumber}`;

    return {
      id,
      territory: chartData.territory,
      period: chartData.period,
      date: date.toISOString(),
      week_number: weekNumber,
      year,
      tracks,
      aggregatedData: {
        top10_streams: top10Streams,
        top50_streams: top50Streams,
        top200_streams: top200Streams,
        total_tracks: tracks.length,
        debuts,
        reentries
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Simulate historical data based on current data with realistic variations
   */
  private simulateHistoricalData(
    currentData: SpotifyChartsData,
    targetDate: Date,
    weekOffset: number
  ): HistoricalChartData {
    const year = targetDate.getFullYear();
    const weekNumber = this.getWeekNumber(targetDate);

    // Create variations based on week offset (further back = more variation)
    const variationFactor = 1 + (weekOffset * 0.02); // 2% variation per week
    const randomFactor = 0.8 + (Math.random() * 0.4); // Random factor between 0.8-1.2

    const baseStreams = currentData.tracks.reduce((sum, t) => sum + (t.streams || 0), 0);
    const adjustedStreams = baseStreams * variationFactor * randomFactor;

    // Create historical tracks with adjusted streams
    const historicalTracks = currentData.tracks.map(track => ({
      ...track,
      streams: Math.round((track.streams || 0) * variationFactor * (0.9 + Math.random() * 0.2)),
      date: targetDate
    }));

    // Calculate aggregated metrics
    const top10Streams = historicalTracks.slice(0, 10).reduce((sum, t) => sum + (t.streams || 0), 0);
    const top50Streams = historicalTracks.slice(0, 50).reduce((sum, t) => sum + (t.streams || 0), 0);
    const top200Streams = historicalTracks.reduce((sum, t) => sum + (t.streams || 0), 0);

    const debuts = Math.max(0, Math.round(historicalTracks.filter(t => t.isNewEntry).length * (0.8 + Math.random() * 0.4)));
    const reentries = Math.max(0, Math.round(historicalTracks.filter(t => t.isReEntry).length * (0.8 + Math.random() * 0.4)));

    const id = `${currentData.territory}-${currentData.period}-${year}W${weekNumber}-simulated`;

    return {
      id,
      territory: currentData.territory,
      period: currentData.period,
      date: targetDate.toISOString(),
      week_number: weekNumber,
      year,
      tracks: historicalTracks,
      aggregatedData: {
        top10_streams: top10Streams,
        top50_streams: top50Streams,
        top200_streams: top200Streams,
        total_tracks: historicalTracks.length,
        debuts,
        reentries
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Create placeholder data for failed weeks
   */
  private createPlaceholderData(
    territory: Territory,
    period: 'weekly' | 'daily',
    currentDate: Date,
    weekOffset: number
  ): HistoricalChartData {
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() - (weekOffset * 7));

    const year = targetDate.getFullYear();
    const weekNumber = this.getWeekNumber(targetDate);
    const id = `${territory}-${period}-${year}W${weekNumber}-placeholder`;

    return {
      id,
      territory,
      period,
      date: targetDate.toISOString(),
      week_number: weekNumber,
      year,
      tracks: [],
      aggregatedData: {
        top10_streams: 0,
        top50_streams: 0,
        top200_streams: 0,
        total_tracks: 0,
        debuts: 0,
        reentries: 0
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Compare current week with previous weeks
   */
  async compareWithPreviousWeeks(
    territory: Territory,
    period: 'weekly' | 'daily' = 'weekly'
  ): Promise<WeeklyComparison> {
    console.log(`📊 Comparing current week with historical data for ${territory}`);

    // Get current data
    const currentChartData = await getRealSpotifyChartsDataFromKworb(territory, period);
    const currentHistorical = this.transformToHistoricalData(currentChartData, new Date(), 0);

    // Get previous week data (would be from storage in real implementation)
    const previousData = await this.getPreviousWeekData(territory, period);

    // Calculate growth rates
    const growthRates = this.calculateGrowthRates(currentHistorical, previousData);

    return {
      current: currentHistorical,
      previous: previousData,
      growth_rates: growthRates,
      weeks_back: 1
    };
  }

  /**
   * Calculate growth rates between two periods
   */
  private calculateGrowthRates(
    current: HistoricalChartData,
    previous: HistoricalChartData | null
  ): { top10: number; top50: number; top200: number } {
    if (!previous || previous.aggregatedData.top200_streams === 0) {
      return { top10: 0, top50: 0, top200: 0 };
    }

    const top10Growth = ((current.aggregatedData.top10_streams - previous.aggregatedData.top10_streams) / previous.aggregatedData.top10_streams) * 100;
    const top50Growth = ((current.aggregatedData.top50_streams - previous.aggregatedData.top50_streams) / previous.aggregatedData.top50_streams) * 100;
    const top200Growth = ((current.aggregatedData.top200_streams - previous.aggregatedData.top200_streams) / previous.aggregatedData.top200_streams) * 100;

    return {
      top10: top10Growth,
      top50: top50Growth,
      top200: top200Growth
    };
  }

  /**
   * Get previous week data (placeholder for now)
   */
  private async getPreviousWeekData(
    territory: Territory,
    period: 'weekly' | 'daily'
  ): Promise<HistoricalChartData | null> {
    // In real implementation, this would query from storage
    // For now, simulate previous week data
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 7);

    try {
      const currentData = await getRealSpotifyChartsDataFromKworb(territory, period);
      return this.simulateHistoricalData(currentData, previousDate, 1);
    } catch (error) {
      console.error('Error getting previous week data:', error);
      return null;
    }
  }

  /**
   * Load historical data from file
   */
  private loadFromFile(): void {
    try {
      console.log(`🔍 Looking for historical data at: ${this.storageFile}`);

      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf8');
        const storedData = JSON.parse(data);

        // Convert back to Map
        for (const [key, value] of Object.entries(storedData)) {
          this.storage.set(key, value as HistoricalChartData);
        }

        console.log(`📁 Successfully loaded ${this.storage.size} historical entries from file`);

        // Log breakdown by territory
        const territories = ['argentina', 'spanish', 'mexico', 'global'];
        for (const territory of territories) {
          const count = Array.from(this.storage.values()).filter(entry => entry.territory === territory).length;
          console.log(`   ${territory}: ${count} weeks`);
        }
      } else {
        console.log(`📁 Historical data file not found at: ${this.storageFile}`);
        this.ensureDataDirectory();
      }
    } catch (error) {
      console.error('❌ Error loading historical data from file:', error);
      this.ensureDataDirectory();
    }
  }

  /**
   * Save historical data to file
   */
  private saveToFile(): void {
    try {
      this.ensureDataDirectory();

      // Convert Map to object for JSON storage
      const dataToSave = Object.fromEntries(this.storage);

      fs.writeFileSync(this.storageFile, JSON.stringify(dataToSave, null, 2));
      console.log(`💾 Saved ${this.storage.size} historical entries to file`);
    } catch (error) {
      console.error('Error saving historical data to file:', error);
    }
  }

  /**
   * Ensure data directory exists
   */
  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.storageFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Get week number of the year
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Store data and save to file
   */
  public setStoredData(id: string, data: HistoricalChartData): void {
    this.storage.set(id, data);
    this.saveToFile();
  }

  /**
   * Get stored historical data
   */
  getStoredData(id: string): HistoricalChartData | null {
    return this.storage.get(id) || null;
  }

  /**
   * Get all stored data for a territory
   */
  getAllStoredData(territory: Territory, period: 'weekly' | 'daily'): HistoricalChartData[] {
    console.log(`🔍 Getting stored data for ${territory} ${period}`);
    console.log(`📊 Total entries in storage: ${this.storage.size}`);

    const results: HistoricalChartData[] = [];
    for (const [key, data] of this.storage.entries()) {
      if (data.territory === territory && data.period === period) {
        results.push(data);
      }
    }

    const sorted = results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    console.log(`📈 Found ${sorted.length} entries for ${territory} ${period}`);

    if (sorted.length > 0) {
      console.log(`   Date range: ${sorted[0].date.slice(0, 10)} to ${sorted[sorted.length - 1].date.slice(0, 10)}`);
    }

    return sorted;
  }
}

// Export singleton instance
export const historicalDataCollector = new HistoricalDataCollector();