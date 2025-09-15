/**
 * Music Insights Orchestrator
 * Main service that coordinates data fetching, enrichment, and insight generation
 * Ensures APIs are called only when necessary (max 1x per day/week)
 */

import { Territory, ChartPeriod } from '@/types/music';
import { getMusicInsightsPipeline } from './music-insights-pipeline';
import { getMusicInsightsGenerator } from './music-insights-generator';
import { getMusicInsightsStorage } from './music-insights-storage';
import { StoredInsights } from './music-insights-storage';

export interface InsightsResult {
  insights: StoredInsights;
  fromCache: boolean;
  generatedAt: Date;
  nextUpdate: Date;
}

export class MusicInsightsOrchestrator {
  private pipeline = getMusicInsightsPipeline();
  private generator = getMusicInsightsGenerator();
  private storage = getMusicInsightsStorage();

  /**
   * Get insights for a territory and period
   * Returns cached insights if available and fresh, otherwise generates new ones
   */
  async getInsights(territory: Territory, period: ChartPeriod): Promise<InsightsResult> {
    console.log(`🎯 Getting insights for ${territory} ${period}`);

    // 1. Check if we have fresh insights in storage
    const cachedInsights = await this.storage.getInsights(territory, period);
    
    if (cachedInsights && !cachedInsights.isStale) {
      console.log(`✅ Using cached insights for ${territory} ${period}`);
      return {
        insights: cachedInsights,
        fromCache: true,
        generatedAt: cachedInsights.lastUpdated,
        nextUpdate: this.getNextUpdateTime(territory, period)
      };
    }

    // 2. Generate new insights if cache is stale or doesn't exist
    console.log(`🔄 Generating new insights for ${territory} ${period}`);
    const newInsights = await this.generateInsights(territory, period);
    
    return {
      insights: newInsights,
      fromCache: false,
      generatedAt: new Date(),
      nextUpdate: this.getNextUpdateTime(territory, period)
    };
  }

  /**
   * Generate fresh insights (calls APIs)
   */
  private async generateInsights(territory: Territory, period: ChartPeriod): Promise<StoredInsights> {
    console.log(`🚀 Generating fresh insights for ${territory} ${period}`);

    // 1. Fetch chart data from SpotifyCharts
    const chartData = await this.fetchChartData(territory, period);
    
    // 2. Analyze chart and enrich with Chartmetric data
    const analysis = await this.pipeline.analyzeChart(chartData, territory, period);
    
    // 3. Generate strategic insights with Claude AI
    const strategicInsights = await this.generator.generateStrategicInsights(analysis);
    
    // 4. Generate track-specific insights
    const trackInsights = await this.generator.generateTrackInsights(
      analysis.enrichedTracks, 
      territory, 
      period
    );
    
    // 5. Store insights in Firestore
    await this.storage.storeInsights(
      territory, 
      period, 
      analysis, 
      strategicInsights, 
      trackInsights
    );

    // 6. Return the stored insights
    const storedInsights = await this.storage.getInsights(territory, period);
    if (!storedInsights) {
      throw new Error('Failed to store insights');
    }

    console.log(`✅ Successfully generated and stored insights for ${territory} ${period}`);
    return storedInsights;
  }

  /**
   * Fetch chart data from SpotifyCharts API
   */
  private async fetchChartData(territory: Territory, period: ChartPeriod) {
    console.log(`📊 Fetching chart data for ${territory} ${period}`);
    
    // Import the SpotifyCharts API function directly
    const { fetchSpotifyCharts } = await import('@/app/api/music-trends/spotify-charts/route');
    
    try {
      const result = await fetchSpotifyCharts(territory, period);
      return result;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw new Error(`Failed to fetch chart data: ${error}`);
    }
  }

  /**
   * Force refresh insights (bypasses cache)
   */
  async forceRefreshInsights(territory: Territory, period: ChartPeriod): Promise<InsightsResult> {
    console.log(`🔄 Force refreshing insights for ${territory} ${period}`);
    
    // Mark existing insights as stale
    await this.storage.updateInsights(territory, period, {} as any);
    
    // Generate new insights
    return await this.getInsights(territory, period);
  }

  /**
   * Get insights status across all territories
   */
  async getInsightsStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    territories: Array<{
      territory: Territory;
      daily: { exists: boolean; isStale: boolean; lastUpdated?: Date; nextUpdate: Date };
      weekly: { exists: boolean; isStale: boolean; lastUpdated?: Date; nextUpdate: Date };
    }>;
    summary: {
      totalInsights: number;
      staleInsights: number;
      nextUpdate: Date;
    };
  }> {
    try {
      const status = await this.storage.getInsightsStatus();
      
      const territories = status.territories.map(t => ({
        territory: t.territory,
        daily: {
          ...t.daily,
          nextUpdate: this.getNextUpdateTime(t.territory, 'daily')
        },
        weekly: {
          ...t.weekly,
          nextUpdate: this.getNextUpdateTime(t.territory, 'weekly')
        }
      }));

      // Find next update time
      const nextUpdates = territories.flatMap(t => [t.daily.nextUpdate, t.weekly.nextUpdate]);
      const nextUpdate = new Date(Math.min(...nextUpdates.map(d => d.getTime())));

      // Determine overall status
      let overallStatus: 'healthy' | 'degraded' | 'error' = 'healthy';
      if (status.staleInsights > 0) {
        overallStatus = 'degraded';
      }
      if (status.totalInsights === 0) {
        overallStatus = 'error';
      }

      return {
        status: overallStatus,
        territories,
        summary: {
          totalInsights: status.totalInsights,
          staleInsights: status.staleInsights,
          nextUpdate
        }
      };
    } catch (error) {
      console.error('Error getting insights status:', error);
      return {
        status: 'error',
        territories: [],
        summary: {
          totalInsights: 0,
          staleInsights: 0,
          nextUpdate: new Date()
        }
      };
    }
  }

  /**
   * Schedule automatic updates
   */
  async scheduleUpdates(): Promise<void> {
    console.log('⏰ Scheduling automatic insights updates');
    
    // This would integrate with the existing scheduler
    // For now, we'll just log the schedule
    
    const territories: Territory[] = ['argentina', 'spain', 'mexico', 'global'];
    
    territories.forEach(territory => {
      const dailyUpdate = this.getNextUpdateTime(territory, 'daily');
      const weeklyUpdate = this.getNextUpdateTime(territory, 'weekly');
      
      console.log(`📅 ${territory} Daily: ${dailyUpdate.toLocaleString()}`);
      console.log(`📅 ${territory} Weekly: ${weeklyUpdate.toLocaleString()}`);
    });
  }

  /**
   * Get next update time for a territory and period
   */
  private getNextUpdateTime(territory: Territory, period: ChartPeriod): Date {
    const now = new Date();
    const argentinaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
    
    if (period === 'daily') {
      // Daily updates at 10:00 AM Argentina time
      const nextUpdate = new Date(argentinaTime);
      nextUpdate.setHours(10, 0, 0, 0);
      
      // If it's already past 10 AM today, schedule for tomorrow
      if (argentinaTime.getHours() >= 10) {
        nextUpdate.setDate(nextUpdate.getDate() + 1);
      }
      
      return nextUpdate;
    } else {
      // Weekly updates on Monday at 7:00 AM Argentina time
      const nextUpdate = new Date(argentinaTime);
      nextUpdate.setHours(7, 0, 0, 0);
      
      // Find next Monday
      const daysUntilMonday = (1 - nextUpdate.getDay() + 7) % 7;
      if (daysUntilMonday === 0 && argentinaTime.getHours() >= 7) {
        // If it's Monday and past 7 AM, schedule for next Monday
        nextUpdate.setDate(nextUpdate.getDate() + 7);
      } else {
        nextUpdate.setDate(nextUpdate.getDate() + daysUntilMonday);
      }
      
      return nextUpdate;
    }
  }

  /**
   * Check if insights need update based on time
   */
  shouldUpdateInsights(territory: Territory, period: ChartPeriod): boolean {
    const nextUpdate = this.getNextUpdateTime(territory, period);
    const now = new Date();
    
    return now >= nextUpdate;
  }

  /**
   * Clean up old insights
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up old insights');
    await this.storage.cleanupOldInsights();
  }
}

// Singleton instance
let musicInsightsOrchestrator: MusicInsightsOrchestrator | null = null;

export function getMusicInsightsOrchestrator(): MusicInsightsOrchestrator {
  if (!musicInsightsOrchestrator) {
    musicInsightsOrchestrator = new MusicInsightsOrchestrator();
  }
  return musicInsightsOrchestrator;
}
