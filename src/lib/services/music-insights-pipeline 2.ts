/**
 * Music Insights Data Pipeline
 * Combines SpotifyCharts data with Chartmetric enrichment
 * Prepares data for Claude AI analysis
 */

import { Track, Territory, ChartPeriod } from '@/types/music';
import { getChartmetricClient } from './chartmetric-client';

export interface EnrichedTrack extends Track {
  chartmetricData?: {
    track: any;
    artist: any;
    social: any;
    enriched: boolean;
    enrichedAt: string;
  };
  insights?: {
    genre: string;
    origin: string;
    label: string;
    distributor: string;
    socialMetrics: {
      spotifyFollowers: number;
      instagramFollowers: number;
      tiktokFollowers: number;
      totalReach: number;
    };
    marketPosition: {
      territory: Territory;
      period: ChartPeriod;
      position: number;
      streams: number;
      marketShare: number;
    };
  };
}

export interface ChartAnalysis {
  territory: Territory;
  period: ChartPeriod;
  date: Date;
  totalTracks: number;
  totalStreams: number;
  enrichedTracks: EnrichedTrack[];
  summary: {
    topGenres: Array<{ genre: string; count: number; percentage: number }>;
    topLabels: Array<{ label: string; count: number; percentage: number }>;
    topOrigins: Array<{ origin: string; count: number; percentage: number }>;
    socialLeaders: Array<{ artist: string; totalReach: number; position: number }>;
    marketDynamics: {
      newEntries: number;
      reEntries: number;
      newPeaks: number;
      turnoverRate: number;
    };
  };
}

export class MusicInsightsPipeline {
  private chartmetricClient = getChartmetricClient();

  /**
   * Enrich a single track with Chartmetric data
   */
  async enrichTrack(track: Track): Promise<EnrichedTrack> {
    const enrichedTrack: EnrichedTrack = { ...track };

    if (!this.chartmetricClient || !track.spotifyId) {
      console.warn(`No Chartmetric client or Spotify ID for track: ${track.title}`);
      return enrichedTrack;
    }

    try {
      // Get track data from Chartmetric
      const trackData = await this.chartmetricClient.getTrackBySpotifyId(track.spotifyId);
      
      // Get artist data if available
      let artistData = null;
      if (track.artistIds && track.artistIds.length > 0) {
        try {
          artistData = await this.chartmetricClient.getArtistBySpotifyId(track.artistIds[0]);
        } catch (artistError) {
          console.warn('Could not fetch artist data:', artistError);
        }
      }

      // Get social metrics for artist
      let socialMetrics = null;
      if (artistData?.id) {
        try {
          socialMetrics = await this.chartmetricClient.getArtistSocialMetrics(artistData.id);
        } catch (socialError) {
          console.warn('Could not fetch social metrics:', socialError);
        }
      }

      // Enrich track with Chartmetric data
      enrichedTrack.chartmetricData = {
        track: trackData,
        artist: artistData,
        social: socialMetrics,
        enriched: true,
        enrichedAt: new Date().toISOString()
      };

      // Generate insights
      enrichedTrack.insights = this.generateTrackInsights(enrichedTrack);

    } catch (error) {
      console.error('Error enriching track with Chartmetric:', error);
      enrichedTrack.chartmetricData = {
        enriched: false,
        enrichedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return enrichedTrack;
  }

  /**
   * Generate insights for a single track
   */
  private generateTrackInsights(track: EnrichedTrack): EnrichedTrack['insights'] {
    const chartmetric = track.chartmetricData;
    
    if (!chartmetric?.enriched) {
      return undefined;
    }

    const genre = chartmetric.track?.genre || 'Unknown';
    const origin = chartmetric.artist?.origin || 'Unknown';
    const label = chartmetric.track?.label || 'Unknown';
    const distributor = chartmetric.track?.distributor || 'Unknown';

    // Calculate social metrics
    const spotifyFollowers = chartmetric.social?.spotify?.followers || 0;
    const instagramFollowers = chartmetric.social?.instagram?.followers || 0;
    const tiktokFollowers = chartmetric.social?.tiktok?.followers || 0;
    const totalReach = spotifyFollowers + instagramFollowers + tiktokFollowers;

    return {
      genre,
      origin,
      label,
      distributor,
      socialMetrics: {
        spotifyFollowers,
        instagramFollowers,
        tiktokFollowers,
        totalReach
      },
      marketPosition: {
        territory: track.territory,
        period: track.period,
        position: track.position,
        streams: track.streams || 0,
        marketShare: 0 // Will be calculated in chart analysis
      }
    };
  }

  /**
   * Analyze a complete chart and generate insights
   */
  async analyzeChart(tracks: Track[], territory: Territory, period: ChartPeriod): Promise<ChartAnalysis> {
    console.log(`🔍 Analyzing chart: ${territory} ${period} with ${tracks.length} tracks`);

    // Enrich tracks with Chartmetric data (batch process)
    const enrichedTracks = await this.enrichTracksBatch(tracks);

    // Calculate total streams
    const totalStreams = enrichedTracks.reduce((sum, track) => sum + (track.streams || 0), 0);

    // Generate summary insights
    const summary = this.generateChartSummary(enrichedTracks, totalStreams);

    return {
      territory,
      period,
      date: new Date(),
      totalTracks: tracks.length,
      totalStreams,
      enrichedTracks,
      summary
    };
  }

  /**
   * Enrich multiple tracks in batch
   */
  private async enrichTracksBatch(tracks: Track[]): Promise<EnrichedTrack[]> {
    const batchSize = 5; // Process in small batches to avoid rate limits
    const enrichedTracks: EnrichedTrack[] = [];

    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      const batchPromises = batch.map(track => this.enrichTrack(track));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            enrichedTracks.push(result.value);
          } else {
            console.error(`Failed to enrich track ${batch[index].title}:`, result.reason);
            enrichedTracks.push(batch[index] as EnrichedTrack);
          }
        });

        // Add delay between batches to respect rate limits
        if (i + batchSize < tracks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error processing batch:', error);
        // Add tracks without enrichment
        batch.forEach(track => enrichedTracks.push(track as EnrichedTrack));
      }
    }

    return enrichedTracks;
  }

  /**
   * Generate summary insights for a chart
   */
  private generateChartSummary(enrichedTracks: EnrichedTrack[], totalStreams: number) {
    // Count genres
    const genreCount = new Map<string, number>();
    const labelCount = new Map<string, number>();
    const originCount = new Map<string, number>();
    const socialLeaders: Array<{ artist: string; totalReach: number; position: number }> = [];

    let newEntries = 0;
    let reEntries = 0;
    let newPeaks = 0;

    enrichedTracks.forEach((track, index) => {
      // Count market dynamics
      if (track.isNewEntry) newEntries++;
      if (track.isReEntry) reEntries++;
      if (track.isNewPeak) newPeaks++;

      // Count genres, labels, origins
      const genre = track.insights?.genre || 'Unknown';
      const label = track.insights?.label || 'Unknown';
      const origin = track.insights?.origin || 'Unknown';

      genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
      labelCount.set(label, (labelCount.get(label) || 0) + 1);
      originCount.set(origin, (originCount.get(origin) || 0) + 1);

      // Track social leaders
      const totalReach = track.insights?.socialMetrics?.totalReach || 0;
      if (totalReach > 0) {
        socialLeaders.push({
          artist: track.artist,
          totalReach,
          position: track.position
        });
      }
    });

    // Sort and limit results
    const topGenres = Array.from(genreCount.entries())
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: (count / enrichedTracks.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topLabels = Array.from(labelCount.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: (count / enrichedTracks.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topOrigins = Array.from(originCount.entries())
      .map(([origin, count]) => ({
        origin,
        count,
        percentage: (count / enrichedTracks.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topSocialLeaders = socialLeaders
      .sort((a, b) => b.totalReach - a.totalReach)
      .slice(0, 10);

    const turnoverRate = ((newEntries + reEntries) / enrichedTracks.length) * 100;

    return {
      topGenres,
      topLabels,
      topOrigins,
      socialLeaders: topSocialLeaders,
      marketDynamics: {
        newEntries,
        reEntries,
        newPeaks,
        turnoverRate: Math.round(turnoverRate * 10) / 10
      }
    };
  }

  /**
   * Get historical comparison data
   */
  async getHistoricalComparison(territory: Territory, period: ChartPeriod, days: number = 7) {
    // This would fetch historical data from Firestore
    // For now, return mock data structure
    return {
      territory,
      period,
      comparisonDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      changes: {
        totalStreams: 0,
        newEntries: 0,
        reEntries: 0,
        turnoverRate: 0
      }
    };
  }
}

// Singleton instance
let musicInsightsPipeline: MusicInsightsPipeline | null = null;

export function getMusicInsightsPipeline(): MusicInsightsPipeline {
  if (!musicInsightsPipeline) {
    musicInsightsPipeline = new MusicInsightsPipeline();
  }
  return musicInsightsPipeline;
}
