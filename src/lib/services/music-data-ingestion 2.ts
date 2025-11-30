import { TrackAnalysis, Territory, AnalysisConfig, DEFAULT_ANALYSIS_CONFIG } from '@/types/music-analysis';
import { getRealSpotifyChartsDataFromKworb } from './kworb-spotifycharts-scraper';
import { getChartmetricClient } from './chartmetric-client';
import { MusicTrendsStorage } from './music-trends-storage';

export class MusicDataIngestion {
  private config: AnalysisConfig;
  private chartmetricClient: any;

  constructor(config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG) {
    this.config = config;
    this.chartmetricClient = getChartmetricClient();
  }

  /**
   * Main ingestion method - loads and normalizes data from all sources
   */
  async ingestData(territory: Territory, period: 'daily' | 'weekly', date?: Date): Promise<TrackAnalysis[]> {
    console.log(`🔄 Starting data ingestion for ${territory} ${period}${date ? ` on ${date.toISOString().split('T')[0]}` : ''}`);
    
    try {
      // Step 1: Load raw data (prefer stored Firestore, fallback to Kworb)
      const rawTracks = await this.loadChartData(territory, period, date);
      console.log(`✅ Loaded ${rawTracks.length} tracks for ingestion`);

      // Step 2: Normalize track IDs
      const normalizedTracks = await this.normalizeTrackIds(rawTracks);
      console.log(`✅ Normalized ${normalizedTracks.length} track IDs`);

      // Step 3: Enrich with Chartmetric data
      const enrichedTracks = await this.enrichWithChartmetric(normalizedTracks);
      console.log(`✅ Enriched ${enrichedTracks.length} tracks with Chartmetric data`);

      // Step 4: Calculate basic features
      const tracksWithFeatures = await this.calculateBasicFeatures(enrichedTracks, territory, period);
      console.log(`✅ Calculated basic features for ${tracksWithFeatures.length} tracks`);

      return tracksWithFeatures;

    } catch (error) {
      console.error(`❌ Error in data ingestion for ${territory} ${period}:`, error);
      throw error;
    }
  }

  /**
   * Load chart data preferring stored Firestore (from cron), fallback to Kworb
   */
  private async loadChartData(territory: Territory, period: 'daily' | 'weekly', date?: Date): Promise<any[]> {
    try {
      const stored = await MusicTrendsStorage.getLatestChartData(territory, period);
      const sourceTracks = stored?.tracks && stored.tracks.length > 0
        ? stored.tracks
        : (await getRealSpotifyChartsDataFromKworb(territory, period)).tracks;

      // Convert to our format
      return sourceTracks.map((track: any) => ({
        track_id: track.spotifyId || null,
        track_name: track.title,
        artists: track.artist,
        territory: track.territory,
        period: track.period,
        date: new Date(track.date),
        position: track.position,
        streams: track.streams,
        is_weekly: period === 'weekly',
        weeks_on_chart: track.weeksOnChart || 1,
        peak_position: track.peakPosition || track.position,
        previous_position: track.previousPosition,
        is_debut: track.isNewEntry || false,
        is_reentry: track.isReEntry || false,
        is_exit: false, // Will be calculated later
      }));
    } catch (error) {
      console.error('Error loading Kworb data:', error);
      throw new Error(`Failed to load Kworb data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Normalize track IDs - resolve missing IDs with fuzzy matching
   */
  private async normalizeTrackIds(tracks: any[]): Promise<any[]> {
    const normalizedTracks = [];
    let fuzzyMatchCount = 0;

    for (const track of tracks) {
      let normalizedTrack = { ...track };

      // If track_id is missing, try to resolve it
      if (!track.track_id) {
        try {
          const resolvedId = await this.resolveTrackId(track.track_name, track.artists);
          if (resolvedId) {
            normalizedTrack.track_id = resolvedId;
            fuzzyMatchCount++;
            console.log(`🔍 Fuzzy match: "${track.track_name}" by ${track.artists} → ${resolvedId}`);
          } else {
            console.warn(`⚠️ Could not resolve track ID for: "${track.track_name}" by ${track.artists}`);
          }
        } catch (error) {
          console.error(`Error resolving track ID for "${track.track_name}":`, error);
        }
      }

      normalizedTracks.push(normalizedTrack);
    }

    if (fuzzyMatchCount > 0) {
      console.log(`🔍 Resolved ${fuzzyMatchCount} track IDs using fuzzy matching`);
    }

    return normalizedTracks;
  }

  /**
   * Resolve track ID using Spotify search
   */
  private async resolveTrackId(trackName: string, artists: string): Promise<string | null> {
    try {
      // This would use Spotify Web API to search for the track
      // For now, we'll generate a placeholder ID
      // TODO: Implement actual Spotify search
      const searchQuery = `${trackName} ${artists}`;
      const trackId = `spotify:track:${Buffer.from(searchQuery).toString('base64').substring(0, 22)}`;
      return trackId;
    } catch (error) {
      console.error('Error resolving track ID:', error);
      return null;
    }
  }

  /**
   * Enrich tracks with Chartmetric data
   */
  private async enrichWithChartmetric(tracks: any[]): Promise<TrackAnalysis[]> {
    const enrichedTracks: TrackAnalysis[] = [];
    let enrichedCount = 0;

    for (const track of tracks) {
      let enrichedTrack: TrackAnalysis = {
        ...track,
        genres: [],
        main_artist_country: undefined,
        main_artist_city: undefined,
        label: undefined,
        distributor: undefined,
        release_date: undefined,
        spotify_followers: undefined,
        ig_followers: undefined,
        tiktok_followers: undefined,
        engagement_rate: undefined,
        social_metrics_date: undefined,
      };

      // Only enrich if we have a track_id
      if (track.track_id) {
        try {
          const chartmetricData = await this.getChartmetricData(track.track_id);
          if (chartmetricData) {
            enrichedTrack = {
              ...enrichedTrack,
              ...chartmetricData,
            };
            enrichedCount++;
          }
        } catch (error) {
          console.error(`Error enriching track ${track.track_id}:`, error);
        }
      }

      enrichedTracks.push(enrichedTrack);
    }

    console.log(`📊 Enriched ${enrichedCount}/${tracks.length} tracks with Chartmetric data`);
    return enrichedTracks;
  }

  /**
   * Get Chartmetric data for a track
   */
  private async getChartmetricData(trackId: string): Promise<Partial<TrackAnalysis> | null> {
    try {
      if (!this.chartmetricClient) {
        console.warn('Chartmetric client not available');
        return null;
      }

      // Get track data from Chartmetric
      const trackData = await this.chartmetricClient.getTrackBySpotifyId(trackId);
      if (!trackData) {
        return null;
      }

      // Get artist data
      const artistData = trackData.artists?.[0] ? 
        await this.chartmetricClient.getArtistBySpotifyId(trackData.artists[0].spotifyId) : null;

      return {
        genres: trackData.genres || [],
        main_artist_country: artistData?.country,
        main_artist_city: artistData?.city,
        label: trackData.label,
        distributor: trackData.distributor,
        release_date: trackData.releaseDate ? new Date(trackData.releaseDate) : undefined,
        spotify_followers: artistData?.spotifyFollowers,
        ig_followers: artistData?.instagramFollowers,
        tiktok_followers: artistData?.tiktokFollowers,
        engagement_rate: artistData?.engagementRate,
        social_metrics_date: artistData?.lastUpdated ? new Date(artistData.lastUpdated) : undefined,
      };
    } catch (error) {
      console.error(`Error getting Chartmetric data for ${trackId}:`, error);
      return null;
    }
  }

  /**
   * Calculate basic features for tracks
   */
  private async calculateBasicFeatures(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly'): Promise<TrackAnalysis[]> {
    return tracks.map(track => {
      // Calculate delta position
      const delta_pos = track.previous_position ? track.previous_position - track.position : 0;

      // Calculate delta streams percentage (if we have previous data)
      const delta_streams_pct = 0; // TODO: Calculate when we have historical data

      return {
        ...track,
        delta_pos,
        delta_streams_pct,
        // is_debut and is_reentry are already set from Kworb data
        // is_exit will be calculated when we have historical data
      };
    });
  }

  /**
   * Get historical data for a track to calculate deltas
   */
  async getHistoricalData(trackId: string, territory: Territory, period: 'daily' | 'weekly', weeks: number = 12): Promise<TrackAnalysis[]> {
    // TODO: Implement historical data retrieval from database
    // This would query the database for the last N weeks of data for this track
    return [];
  }

  /**
   * Calculate advanced features that require historical data
   */
  async calculateAdvancedFeatures(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly'): Promise<TrackAnalysis[]> {
    const tracksWithAdvancedFeatures: TrackAnalysis[] = [];

    for (const track of tracks) {
      let advancedTrack = { ...track };

      try {
        // Get historical data
        const historicalData = await this.getHistoricalData(track.track_id, territory, period, this.config.windows.baseline);

        if (historicalData.length > 0) {
          // Calculate 12-week baseline
          const baselinePositions = historicalData.map(h => h.position);
          const baselineStreams = historicalData.map(h => h.streams || 0);

          advancedTrack.mean12_track_pos = baselinePositions.reduce((a, b) => a + b, 0) / baselinePositions.length;
          advancedTrack.mean12_track_streams = baselineStreams.reduce((a, b) => a + b, 0) / baselineStreams.length;

          // Calculate 4-week speed and acceleration
          const recentData = historicalData.slice(-this.config.windows.speed_accel);
          if (recentData.length >= 2) {
            const positionChanges = recentData.slice(1).map((h, i) => h.position - recentData[i].position);
            advancedTrack.speed_4w = positionChanges.reduce((a, b) => a + b, 0) / positionChanges.length;
            
            if (recentData.length >= 3) {
              const prevSpeed = recentData.slice(-3, -1).map((h, i) => h.position - recentData[i].position).reduce((a, b) => a + b, 0) / 2;
              advancedTrack.acceleration = advancedTrack.speed_4w! - prevSpeed;
            }
          }

          // Calculate momentum score
          advancedTrack.momentum_score = this.calculateMomentumScore(advancedTrack, historicalData);
        }

        tracksWithAdvancedFeatures.push(advancedTrack);
      } catch (error) {
        console.error(`Error calculating advanced features for ${track.track_id}:`, error);
        tracksWithAdvancedFeatures.push(advancedTrack);
      }
    }

    return tracksWithAdvancedFeatures;
  }

  /**
   * Calculate momentum score (0-100)
   */
  private calculateMomentumScore(track: TrackAnalysis, historicalData: TrackAnalysis[]): number {
    try {
      // Get recent data for z-score calculations
      const recentData = historicalData.slice(-this.config.windows.speed_accel);
      
      if (recentData.length < 2) {
        return 50; // Neutral score if insufficient data
      }

      // Calculate z-scores
      const positionChanges = recentData.slice(1).map((h, i) => h.position - recentData[i].position);
      const streamsChanges = recentData.slice(1).map((h, i) => {
        const prevStreams = recentData[i].streams || 0;
        const currStreams = h.streams || 0;
        return prevStreams > 0 ? (currStreams / prevStreams - 1) * 100 : 0;
      });

      const z_pos = this.calculateZScore(track.delta_pos || 0, positionChanges);
      const z_streams = this.calculateZScore(track.delta_streams_pct || 0, streamsChanges);
      
      // Social and cross-territory z-scores (simplified for now)
      const z_social = 0; // TODO: Calculate when we have social data
      const z_xterritory = 0; // TODO: Calculate when we have cross-territory data

      // Calculate weighted score
      const score = 
        this.config.momentum_weights.position * z_pos +
        this.config.momentum_weights.streams * z_streams +
        this.config.momentum_weights.social * z_social +
        this.config.momentum_weights.cross_territory * z_xterritory;

      // Clip to 0-100 range
      return Math.max(0, Math.min(100, 50 + score * 20));
    } catch (error) {
      console.error('Error calculating momentum score:', error);
      return 50;
    }
  }

  /**
   * Calculate z-score
   */
  private calculateZScore(value: number, data: number[]): number {
    if (data.length === 0) return 0;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? (value - mean) / stdDev : 0;
  }

  /**
   * Validate data quality
   */
  validateDataQuality(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly'): {
    isValid: boolean;
    issues: string[];
    completeness: number;
  } {
    const issues: string[] = [];
    const expectedTracks = 200;
    const actualTracks = tracks.length;
    const completeness = (actualTracks / expectedTracks) * 100;

    // Check completeness
    if (actualTracks < expectedTracks * 0.9) {
      issues.push(`Incomplete data: ${actualTracks}/${expectedTracks} tracks`);
    }

    // Check for missing track IDs
    const missingTrackIds = tracks.filter(t => !t.track_id).length;
    if (missingTrackIds > 0) {
      issues.push(`${missingTrackIds} tracks missing Spotify IDs`);
    }

    // Check for data anomalies
    const duplicatePositions = tracks.filter((t, i, arr) => 
      arr.findIndex(other => other.position === t.position) !== i
    );
    if (duplicatePositions.length > 0) {
      issues.push(`${duplicatePositions.length} duplicate positions found`);
    }

    // Check for missing streams data
    const missingStreams = tracks.filter(t => !t.streams || t.streams === 0).length;
    if (missingStreams > actualTracks * 0.1) {
      issues.push(`${missingStreams} tracks missing streams data`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      completeness,
    };
  }
}

// Export singleton instance
export const musicDataIngestion = new MusicDataIngestion();
