/**
 * Music Insights Storage
 * Manages persistence of insights in Firestore
 * Avoids regenerating insights on every request
 */

import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, orderBy, limit, writeBatch } from 'firebase/firestore';
import { StrategicInsights, MusicInsight } from './music-insights-generator';
import { ChartAnalysis } from './music-insights-pipeline';
import { Territory, ChartPeriod } from '@/types/music';

export interface StoredInsights {
  id: string;
  territory: Territory;
  period: ChartPeriod;
  date: Date;
  lastUpdated: Date;
  chartData: ChartAnalysis;
  strategicInsights: StrategicInsights;
  trackInsights: MusicInsight[];
  isStale: boolean; // True if chart data has been updated since insights were generated
}

export class MusicInsightsStorage {
  private readonly COLLECTION = 'music_insights';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get insights for a specific territory and period
   * Returns cached insights if available and not stale
   */
  async getInsights(territory: Territory, period: ChartPeriod): Promise<StoredInsights | null> {
    try {
      const docId = this.getDocumentId(territory, period);
      const docRef = doc(db, this.COLLECTION, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log(`📊 No insights found for ${territory} ${period}`);
        return null;
      }

      const data = docSnap.data() as StoredInsights;
      
      // Check if insights are stale
      const isStale = this.isInsightsStale(data);
      
      if (isStale) {
        console.log(`📊 Insights for ${territory} ${period} are stale, need regeneration`);
        data.isStale = true;
      }

      return data;
    } catch (error) {
      console.error('Error getting insights from storage:', error);
      return null;
    }
  }

  /**
   * Store insights in Firestore
   */
  async storeInsights(
    territory: Territory, 
    period: ChartPeriod, 
    chartData: ChartAnalysis,
    strategicInsights: StrategicInsights,
    trackInsights: MusicInsight[]
  ): Promise<void> {
    try {
      const docId = this.getDocumentId(territory, period);
      const now = new Date();

      const storedInsights: StoredInsights = {
        id: docId,
        territory,
        period,
        date: chartData.date,
        lastUpdated: now,
        chartData,
        strategicInsights,
        trackInsights,
        isStale: false
      };

      await setDoc(doc(db, this.COLLECTION, docId), storedInsights);
      console.log(`💾 Stored insights for ${territory} ${period}`);

    } catch (error) {
      console.error('Error storing insights:', error);
      throw error;
    }
  }

  /**
   * Update insights when chart data changes
   */
  async updateInsights(
    territory: Territory, 
    period: ChartPeriod, 
    newChartData: ChartAnalysis
  ): Promise<void> {
    try {
      const docId = this.getDocumentId(territory, period);
      const doc = await db.collection(this.COLLECTION).doc(docId).get();

      if (doc.exists) {
        const existingData = doc.data() as StoredInsights;
        
        // Mark as stale if chart data has changed significantly
        const hasSignificantChanges = this.hasSignificantChanges(existingData.chartData, newChartData);
        
        if (hasSignificantChanges) {
        await updateDoc(doc(db, this.COLLECTION, docId), {
          isStale: true,
          lastUpdated: new Date()
        });
          console.log(`🔄 Marked insights as stale for ${territory} ${period}`);
        }
      }
    } catch (error) {
      console.error('Error updating insights:', error);
    }
  }

  /**
   * Get all insights for a territory (both daily and weekly)
   */
  async getAllInsightsForTerritory(territory: Territory): Promise<StoredInsights[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('territory', '==', territory),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.data() as StoredInsights);
    } catch (error) {
      console.error('Error getting all insights for territory:', error);
      return [];
    }
  }

  /**
   * Get recent insights across all territories
   */
  async getRecentInsights(limit: number = 10): Promise<StoredInsights[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('lastUpdated', 'desc'),
        limit(limit)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.data() as StoredInsights);
    } catch (error) {
      console.error('Error getting recent insights:', error);
      return [];
    }
  }

  /**
   * Clean up old insights (older than 30 days)
   */
  async cleanupOldInsights(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const q = query(
        collection(db, this.COLLECTION),
        where('date', '<', thirtyDaysAgo)
      );
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`🧹 Cleaned up ${snapshot.docs.length} old insights`);
    } catch (error) {
      console.error('Error cleaning up old insights:', error);
    }
  }

  /**
   * Get insights generation status
   */
  async getInsightsStatus(): Promise<{
    totalInsights: number;
    staleInsights: number;
    territories: Array<{
      territory: Territory;
      daily: { exists: boolean; isStale: boolean; lastUpdated?: Date };
      weekly: { exists: boolean; isStale: boolean; lastUpdated?: Date };
    }>;
  }> {
    try {
      const snapshot = await getDocs(collection(db, this.COLLECTION));
      const insights = snapshot.docs.map(doc => doc.data() as StoredInsights);

      const territories: Territory[] = ['argentina', 'spain', 'mexico', 'global'];
      const territoryStatus = territories.map(territory => {
        const daily = insights.find(i => i.territory === territory && i.period === 'daily');
        const weekly = insights.find(i => i.territory === territory && i.period === 'weekly');

        return {
          territory,
          daily: {
            exists: !!daily,
            isStale: daily?.isStale || false,
            lastUpdated: daily?.lastUpdated
          },
          weekly: {
            exists: !!weekly,
            isStale: weekly?.isStale || false,
            lastUpdated: weekly?.lastUpdated
          }
        };
      });

      return {
        totalInsights: insights.length,
        staleInsights: insights.filter(i => i.isStale).length,
        territories: territoryStatus
      };
    } catch (error) {
      console.error('Error getting insights status:', error);
      return {
        totalInsights: 0,
        staleInsights: 0,
        territories: []
      };
    }
  }

  /**
   * Generate document ID for insights
   */
  private getDocumentId(territory: Territory, period: ChartPeriod): string {
    return `${territory}_${period}_${new Date().toISOString().split('T')[0]}`;
  }

  /**
   * Check if insights are stale
   */
  private isInsightsStale(insights: StoredInsights): boolean {
    const now = new Date();
    const age = now.getTime() - insights.lastUpdated.getTime();
    
    // Mark as stale if older than cache duration
    if (age > this.CACHE_DURATION) {
      return true;
    }

    // Mark as stale if explicitly marked
    if (insights.isStale) {
      return true;
    }

    return false;
  }

  /**
   * Check if chart data has significant changes
   */
  private hasSignificantChanges(oldData: ChartAnalysis, newData: ChartAnalysis): boolean {
    // Check if total streams changed significantly (>10%)
    const oldStreams = oldData.totalStreams;
    const newStreams = newData.totalStreams;
    const streamsChange = Math.abs(newStreams - oldStreams) / oldStreams;
    
    if (streamsChange > 0.1) {
      return true;
    }

    // Check if top 10 tracks changed significantly
    const oldTop10 = oldData.enrichedTracks.slice(0, 10).map(t => t.id);
    const newTop10 = newData.enrichedTracks.slice(0, 10).map(t => t.id);
    const top10Changes = oldTop10.filter(id => !newTop10.includes(id)).length;
    
    if (top10Changes > 2) {
      return true;
    }

    // Check if market dynamics changed significantly
    const oldDynamics = oldData.summary.marketDynamics;
    const newDynamics = newData.summary.marketDynamics;
    
    if (Math.abs(oldDynamics.turnoverRate - newDynamics.turnoverRate) > 5) {
      return true;
    }

    return false;
  }
}

// Singleton instance
let musicInsightsStorage: MusicInsightsStorage | null = null;

export function getMusicInsightsStorage(): MusicInsightsStorage {
  if (!musicInsightsStorage) {
    musicInsightsStorage = new MusicInsightsStorage();
  }
  return musicInsightsStorage;
}
