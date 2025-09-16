import { getChartmetricClient } from './chartmetric-client';
import { SpotifyChartsTrack } from '@/types/music';

/**
 * Service to enrich Kworb track data with real label information from Chartmetric
 */

export interface EnrichedTrackData {
  track: SpotifyChartsTrack;
  label?: {
    id: string;
    name: string;
    type: 'major' | 'independent';
  };
  distributor?: {
    id: string;
    name: string;
  };
  chartmetricId?: string;
  artistChartmetricId?: string;
}

export interface LabelMarketShare {
  label: string;
  tracks_count: number;
  market_share_pct: number;
  avg_position: number;
  top10_tracks: number;
  total_streams: number;
  type: 'major' | 'independent';
}

export interface MarketConcentration {
  top3_labels_share: number;
  top5_labels_share: number;
  hhi_index: number;
}

export class ChartmetricLabelEnricher {
  private client = getChartmetricClient();
  private searchCache = new Map<string, any>();

  /**
   * Enrich Kworb tracks with real Chartmetric label data
   */
  async enrichTracksWithLabels(tracks: SpotifyChartsTrack[]): Promise<{
    enrichedTracks: EnrichedTrackData[];
    labelMarketShare: {
      major_labels: LabelMarketShare[];
      independent_labels: LabelMarketShare[];
      market_concentration: MarketConcentration;
    };
  }> {
    if (!this.client) {
      console.warn('⚠️ Chartmetric client not available, using fallback label detection');
      return this.getFallbackLabelData(tracks);
    }

    const enrichedTracks: EnrichedTrackData[] = [];

    console.log(`🔍 Enriching ${tracks.length} tracks with Chartmetric label data...`);

    // Process tracks in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);

      const batchPromises = batch.map(async (track) => {
        try {
          return await this.enrichSingleTrack(track);
        } catch (error) {
          console.warn(`Failed to enrich track "${track.title}" by "${track.artist}":`, error);
          return { track } as EnrichedTrackData;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          enrichedTracks.push(result.value);
        }
      });

      // Small delay between batches
      if (i + batchSize < tracks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Enriched ${enrichedTracks.length} tracks with label data`);

    // Calculate market share metrics
    const labelMarketShare = this.calculateLabelMarketShare(enrichedTracks);

    return {
      enrichedTracks,
      labelMarketShare
    };
  }

  /**
   * Enrich a single track with Chartmetric data
   */
  private async enrichSingleTrack(track: SpotifyChartsTrack): Promise<EnrichedTrackData> {
    const searchQuery = `${track.artist} ${track.title}`.substring(0, 100);
    const cacheKey = `${track.artist}-${track.title}`;

    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      const cachedData = this.searchCache.get(cacheKey);
      return this.buildEnrichedTrack(track, cachedData);
    }

    try {
      // Search for the track in Chartmetric
      const searchResults = await this.client!.searchTracks(searchQuery, 3);

      if (searchResults?.obj?.tracks?.length > 0) {
        // Find the best match
        const bestMatch = this.findBestTrackMatch(track, searchResults.obj.tracks);

        if (bestMatch) {
          // Get detailed track info including label
          const trackDetails = await this.client!.getTrackBySpotifyId(bestMatch.id);

          // Cache the result
          this.searchCache.set(cacheKey, { bestMatch, trackDetails });

          return this.buildEnrichedTrack(track, { bestMatch, trackDetails });
        }
      }

      // If no track found, try artist search for label info
      const artistResults = await this.client!.searchArtists(track.artist, 2);

      if (artistResults?.obj?.artists?.length > 0) {
        const artistMatch = artistResults.obj.artists[0];

        // Cache the artist result
        this.searchCache.set(cacheKey, { artistMatch });

        return this.buildEnrichedTrack(track, { artistMatch });
      }

    } catch (error) {
      console.warn(`Chartmetric search failed for "${track.title}" by "${track.artist}":`, error);
    }

    return { track };
  }

  /**
   * Find the best matching track from Chartmetric search results
   */
  private findBestTrackMatch(kworbTrack: SpotifyChartsTrack, chartmetricTracks: any[]): any | null {
    const normalizeString = (str: string) =>
      str.toLowerCase()
         .replace(/[^\w\s]/g, '')
         .replace(/\s+/g, ' ')
         .trim();

    const kworbTitle = normalizeString(kworbTrack.title);
    const kworbArtist = normalizeString(kworbTrack.artist);

    let bestMatch = null;
    let bestScore = 0;

    for (const cmTrack of chartmetricTracks) {
      const cmTitle = normalizeString(cmTrack.name || '');
      const cmArtist = normalizeString(cmTrack.artists?.[0]?.name || '');

      // Calculate similarity scores
      const titleSimilarity = this.calculateSimilarity(kworbTitle, cmTitle);
      const artistSimilarity = this.calculateSimilarity(kworbArtist, cmArtist);

      // Combined score (weighted towards artist match)
      const totalScore = (titleSimilarity * 0.6) + (artistSimilarity * 0.4);

      if (totalScore > bestScore && totalScore > 0.7) { // Minimum 70% similarity
        bestScore = totalScore;
        bestMatch = cmTrack;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity (simple Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Build enriched track data from Chartmetric results
   */
  private buildEnrichedTrack(track: SpotifyChartsTrack, chartmetricData: any): EnrichedTrackData {
    const enriched: EnrichedTrackData = { track };

    if (chartmetricData?.trackDetails?.obj) {
      const trackData = chartmetricData.trackDetails.obj;

      enriched.chartmetricId = trackData.id;

      // Extract label information
      if (trackData.label) {
        enriched.label = {
          id: trackData.label.id?.toString() || 'unknown',
          name: trackData.label.name || 'Unknown Label',
          type: this.classifyLabelType(trackData.label.name || '')
        };
      }

      // Extract distributor information
      if (trackData.distributor) {
        enriched.distributor = {
          id: trackData.distributor.id?.toString() || 'unknown',
          name: trackData.distributor.name || 'Unknown Distributor'
        };
      }

      // Get artist Chartmetric ID
      if (trackData.artists?.[0]?.id) {
        enriched.artistChartmetricId = trackData.artists[0].id.toString();
      }
    } else if (chartmetricData?.artistMatch) {
      // Use artist data if no track data available
      enriched.artistChartmetricId = chartmetricData.artistMatch.id?.toString();

      // Try to infer label from artist information
      if (chartmetricData.artistMatch.label) {
        enriched.label = {
          id: chartmetricData.artistMatch.label.id?.toString() || 'unknown',
          name: chartmetricData.artistMatch.label.name || 'Unknown Label',
          type: this.classifyLabelType(chartmetricData.artistMatch.label.name || '')
        };
      }
    }

    return enriched;
  }

  /**
   * Classify if a label is major or independent
   */
  private classifyLabelType(labelName: string): 'major' | 'independent' {
    const majorLabels = [
      'universal music group', 'umg', 'universal music', 'universal',
      'sony music entertainment', 'sony music', 'sony',
      'warner music group', 'warner music', 'warner bros', 'warner',
      'emi', 'capitol music group', 'capitol records',
      'atlantic records', 'columbia records', 'rca records',
      'def jam recordings', 'republic records', 'interscope records',
      'geffen records', 'island records', 'virgin records',
      'bmg rights management', 'bmg'
    ];

    const lowerLabel = labelName.toLowerCase();
    return majorLabels.some(major => lowerLabel.includes(major)) ? 'major' : 'independent';
  }

  /**
   * Calculate label market share from enriched tracks
   */
  private calculateLabelMarketShare(enrichedTracks: EnrichedTrackData[]): {
    major_labels: LabelMarketShare[];
    independent_labels: LabelMarketShare[];
    market_concentration: MarketConcentration;
  } {
    if (!enrichedTracks || enrichedTracks.length === 0) {
      return {
        major_labels: [],
        independent_labels: [],
        market_concentration: {
          top3_labels_share: 0,
          top5_labels_share: 0,
          hhi_index: 0
        }
      };
    }
    const labelCounts = new Map<string, {
      tracks: EnrichedTrackData[];
      type: 'major' | 'independent';
    }>();

    // Group tracks by label
    enrichedTracks.forEach(enriched => {
      if (enriched.label) {
        const labelKey = enriched.label.name;
        if (!labelCounts.has(labelKey)) {
          labelCounts.set(labelKey, {
            tracks: [],
            type: enriched.label.type
          });
        }
        labelCounts.get(labelKey)!.tracks.push(enriched);
      } else {
        // Classify unlabeled tracks as independent
        const unknownKey = 'Independent/Unknown';
        if (!labelCounts.has(unknownKey)) {
          labelCounts.set(unknownKey, {
            tracks: [],
            type: 'independent'
          });
        }
        labelCounts.get(unknownKey)!.tracks.push(enriched);
      }
    });

    const totalTracks = enrichedTracks.length;
    const totalStreams = enrichedTracks.reduce((sum, enriched) => sum + (enriched.track.streams || 0), 0);

    // Calculate metrics for each label
    const allLabelMetrics: LabelMarketShare[] = [];

    labelCounts.forEach((data, labelName) => {
      const tracks = data.tracks;
      const streams = tracks.reduce((sum, enriched) => sum + (enriched.track.streams || 0), 0);
      const avgPosition = tracks.reduce((sum, enriched) => sum + enriched.track.position, 0) / tracks.length;
      const top10Tracks = tracks.filter(enriched => enriched.track.position <= 10).length;

      allLabelMetrics.push({
        label: labelName,
        tracks_count: tracks.length,
        market_share_pct: (tracks.length / totalTracks) * 100,
        avg_position: avgPosition,
        top10_tracks: top10Tracks,
        total_streams: streams,
        type: data.type
      });
    });

    // Sort by market share
    allLabelMetrics.sort((a, b) => b.market_share_pct - a.market_share_pct);

    // Split into major and independent
    const majorLabels = allLabelMetrics.filter(l => l.type === 'major').slice(0, 10);
    const independentLabels = allLabelMetrics.filter(l => l.type === 'independent').slice(0, 8);

    // Calculate market concentration
    const top3Share = allLabelMetrics.slice(0, 3).reduce((sum, l) => sum + l.market_share_pct, 0);
    const top5Share = allLabelMetrics.slice(0, 5).reduce((sum, l) => sum + l.market_share_pct, 0);
    const hhi = allLabelMetrics.reduce((sum, l) => sum + Math.pow(l.market_share_pct, 2), 0);

    return {
      major_labels: majorLabels,
      independent_labels: independentLabels,
      market_concentration: {
        top3_labels_share: top3Share,
        top5_labels_share: top5Share,
        hhi_index: hhi
      }
    };
  }

  /**
   * Fallback method when Chartmetric is not available
   */
  private getFallbackLabelData(tracks: SpotifyChartsTrack[]): {
    enrichedTracks: EnrichedTrackData[];
    labelMarketShare: {
      major_labels: LabelMarketShare[];
      independent_labels: LabelMarketShare[];
      market_concentration: MarketConcentration;
    };
  } {
    console.log('⚠️ Using fallback label detection (limited accuracy without Chartmetric)');

    // Use basic artist name patterns for fallback
    const enrichedTracks: EnrichedTrackData[] = tracks.map(track => {
      const labelInfo = this.inferLabelFromArtist(track.artist);
      return {
        track,
        label: labelInfo ? {
          id: 'inferred',
          name: labelInfo.name,
          type: labelInfo.type
        } : undefined
      };
    });

    const labelMarketShare = this.calculateLabelMarketShare(enrichedTracks);

    return {
      enrichedTracks,
      labelMarketShare
    };
  }

  /**
   * Infer label from artist name patterns (fallback method)
   */
  private inferLabelFromArtist(artistName: string): { name: string; type: 'major' | 'independent' } | null {
    const artistPatterns = {
      // Universal Music Group
      'Bad Bunny': { name: 'Universal Music Group', type: 'major' as const },
      'J Balvin': { name: 'Universal Music Group', type: 'major' as const },
      'Karol G': { name: 'Universal Music Group', type: 'major' as const },
      'Ozuna': { name: 'Universal Music Group', type: 'major' as const },

      // Sony Music Entertainment
      'Anitta': { name: 'Sony Music Entertainment', type: 'major' as const },
      'Rosalía': { name: 'Sony Music Entertainment', type: 'major' as const },
      'Camilo': { name: 'Sony Music Entertainment', type: 'major' as const },

      // Warner Music Group
      'Daddy Yankee': { name: 'Warner Music Group', type: 'major' as const },
      'Nicky Jam': { name: 'Warner Music Group', type: 'major' as const },

      // Independent
      'Bizarrap': { name: 'Independent', type: 'independent' as const },
      'Trueno': { name: 'Independent', type: 'independent' as const },
      'Duki': { name: 'Independent', type: 'independent' as const }
    };

    // Check for exact matches or partial matches
    for (const [pattern, label] of Object.entries(artistPatterns)) {
      if (artistName.toLowerCase().includes(pattern.toLowerCase())) {
        return label;
      }
    }

    return null;
  }
}

// Export singleton instance
export const chartmetricLabelEnricher = new ChartmetricLabelEnricher();