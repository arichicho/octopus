import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Territory, Track, MusicInsights, ChartData } from '@/types/music';

// Collection names
const COLLECTIONS = {
  CHARTS: 'music_charts',
  INSIGHTS: 'music_insights',
  TRACKS: 'music_tracks',
  ARTISTS: 'music_artists',
  LABELS: 'music_labels',
  ALERTS: 'music_alerts',
  CONFIG: 'music_config'
};

export class MusicTrendsStorage {
  
  // Check if Firestore is available
  private static checkFirestore() {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
  }
  
  // Chart Data Storage
  static async storeChartData(chartData: ChartData): Promise<void> {
    try {
      this.checkFirestore();
      const dateStr = chartData.date.toISOString().split('T')[0];
      const docId = `${chartData.territory}_${chartData.period}_${dateStr}`;
      
      const docRef = doc(db, COLLECTIONS.CHARTS, docId);
      await setDoc(docRef, {
        ...chartData,
        date: Timestamp.fromDate(chartData.date),
        lastUpdated: Timestamp.fromDate(chartData.lastUpdated),
        tracks: chartData.tracks.map(track => ({
          ...track,
          date: Timestamp.fromDate(track.date)
        }))
      });
      
      console.log(`📊 Stored chart data for ${chartData.territory} ${chartData.period} ${dateStr}`);
    } catch (error) {
      console.error('Error storing chart data:', error);
      throw error;
    }
  }

  static async getChartData(
    territory: Territory, 
    period: 'daily' | 'weekly', 
    date?: Date
  ): Promise<ChartData | null> {
    try {
      this.checkFirestore();
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0];
      const docId = `${territory}_${period}_${dateStr}`;
      
      const docRef = doc(db, COLLECTIONS.CHARTS, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          date: data.date.toDate(),
          lastUpdated: data.lastUpdated.toDate(),
          tracks: data.tracks.map((track: any) => ({
            ...track,
            date: track.date.toDate()
          }))
        } as ChartData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting chart data:', error);
      throw error;
    }
  }

  static async getLatestChartData(
    territory: Territory, 
    period: 'daily' | 'weekly'
  ): Promise<ChartData | null> {
    try {
      this.checkFirestore();
      const q = query(
        collection(db, COLLECTIONS.CHARTS),
        where('territory', '==', territory),
        where('period', '==', period),
        orderBy('date', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          date: data.date.toDate(),
          lastUpdated: data.lastUpdated.toDate(),
          tracks: data.tracks.map((track: any) => ({
            ...track,
            date: track.date.toDate()
          }))
        } as ChartData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting latest chart data:', error);
      throw error;
    }
  }

  // Insights Storage
  static async storeInsights(insights: MusicInsights): Promise<void> {
    try {
      const dateStr = insights.date.toISOString().split('T')[0];
      const docId = `${insights.territory}_${insights.period}_${dateStr}`;
      
      const docRef = doc(db, COLLECTIONS.INSIGHTS, docId);
      await setDoc(docRef, {
        ...insights,
        date: Timestamp.fromDate(insights.date),
        createdAt: Timestamp.fromDate(insights.createdAt),
        updatedAt: Timestamp.fromDate(insights.updatedAt),
        topGainers: insights.topGainers.map(track => ({
          ...track,
          date: Timestamp.fromDate(track.date)
        })),
        topLosers: insights.topLosers.map(track => ({
          ...track,
          date: Timestamp.fromDate(track.date)
        })),
        newPeaks: insights.newPeaks.map(track => ({
          ...track,
          date: Timestamp.fromDate(track.date)
        })),
        crossTerritoryTracks: insights.crossTerritoryTracks.map(track => ({
          ...track,
          date: Timestamp.fromDate(track.date)
        })),
        momentumTracks: insights.momentumTracks.map(mt => ({
          ...mt,
          track: {
            ...mt.track,
            date: Timestamp.fromDate(mt.track.date)
          }
        })),
        breakoutWatchlist: insights.breakoutWatchlist.map(track => ({
          ...track,
          date: Timestamp.fromDate(track.date)
        })),
        alerts: insights.alerts.map(alert => ({
          ...alert,
          track: {
            ...alert.track,
            date: Timestamp.fromDate(alert.track.date)
          },
          createdAt: Timestamp.fromDate(alert.createdAt)
        })),
        executiveKPIs: {
          ...insights.executiveKPIs,
          trackOfTheWeek: {
            ...insights.executiveKPIs.trackOfTheWeek,
            date: Timestamp.fromDate(insights.executiveKPIs.trackOfTheWeek.date)
          }
        },
        longevityLeaders: insights.persistenceStats.longevityLeaders.map(track => ({
          ...track,
          date: Timestamp.fromDate(track.date)
        })),
        predictiveWatchlist: insights.predictiveWatchlist.map(pt => ({
          ...pt,
          track: {
            ...pt.track,
            date: Timestamp.fromDate(pt.track.date)
          }
        }))
      });
      
      console.log(`🧠 Stored insights for ${insights.territory} ${insights.period} ${dateStr}`);
    } catch (error) {
      console.error('Error storing insights:', error);
      throw error;
    }
  }

  static async getInsights(
    territory: Territory, 
    period: 'daily' | 'weekly', 
    date?: Date
  ): Promise<MusicInsights | null> {
    try {
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0];
      const docId = `${territory}_${period}_${dateStr}`;
      
      const docRef = doc(db, COLLECTIONS.INSIGHTS, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return this.convertInsightsFromFirestore(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting insights:', error);
      throw error;
    }
  }

  static async getLatestInsights(
    territory: Territory, 
    period: 'daily' | 'weekly'
  ): Promise<MusicInsights | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.INSIGHTS),
        where('territory', '==', territory),
        where('period', '==', period),
        orderBy('date', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.convertInsightsFromFirestore(doc.data());
      }
      
      return null;
    } catch (error) {
      console.error('Error getting latest insights:', error);
      throw error;
    }
  }

  // Track Storage
  static async storeTrack(track: Track): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.TRACKS, track.id);
      await setDoc(docRef, {
        ...track,
        date: Timestamp.fromDate(track.date)
      });
    } catch (error) {
      console.error('Error storing track:', error);
      throw error;
    }
  }

  static async getTrack(trackId: string): Promise<Track | null> {
    try {
      const docRef = doc(db, COLLECTIONS.TRACKS, trackId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          date: data.date.toDate()
        } as Track;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting track:', error);
      throw error;
    }
  }

  // Helper method to convert Firestore data back to MusicInsights
  private static convertInsightsFromFirestore(data: any): MusicInsights {
    return {
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      topGainers: data.topGainers.map((track: any) => ({
        ...track,
        date: track.date.toDate()
      })),
      topLosers: data.topLosers.map((track: any) => ({
        ...track,
        date: track.date.toDate()
      })),
      newPeaks: data.newPeaks.map((track: any) => ({
        ...track,
        date: track.date.toDate()
      })),
      crossTerritoryTracks: data.crossTerritoryTracks.map((track: any) => ({
        ...track,
        date: track.date.toDate()
      })),
      momentumTracks: data.momentumTracks.map((mt: any) => ({
        ...mt,
        track: {
          ...mt.track,
          date: mt.track.date.toDate()
        }
      })),
      breakoutWatchlist: data.breakoutWatchlist.map((track: any) => ({
        ...track,
        date: track.date.toDate()
      })),
      alerts: data.alerts.map((alert: any) => ({
        ...alert,
        track: {
          ...alert.track,
          date: alert.track.date.toDate()
        },
        createdAt: alert.createdAt.toDate()
      })),
      executiveKPIs: {
        ...data.executiveKPIs,
        trackOfTheWeek: {
          ...data.executiveKPIs.trackOfTheWeek,
          date: data.executiveKPIs.trackOfTheWeek.date.toDate()
        }
      },
      persistenceStats: {
        ...data.persistenceStats,
        longevityLeaders: data.persistenceStats.longevityLeaders.map((track: any) => ({
          ...track,
          date: track.date.toDate()
        }))
      },
      predictiveWatchlist: data.predictiveWatchlist.map((pt: any) => ({
        ...pt,
        track: {
          ...pt.track,
          date: pt.track.date.toDate()
        }
      }))
    };
  }

  // Configuration Storage
  static async storeConfig(config: any): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CONFIG, 'main');
      await setDoc(docRef, {
        ...config,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error storing config:', error);
      throw error;
    }
  }

  static async getConfig(): Promise<any | null> {
    try {
      const docRef = doc(db, COLLECTIONS.CONFIG, 'main');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting config:', error);
      throw error;
    }
  }
}
