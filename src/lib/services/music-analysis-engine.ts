import { 
  TrackAnalysis, 
  MoversAnalysis, 
  EntriesAnalysis, 
  PeaksAnalysis, 
  StreamsAnalysis, 
  CollaborationsAnalysis,
  CrossTerritoryAnalysis,
  MomentumAnalysis,
  GenreOriginAnalysis,
  LabelDistributorAnalysis,
  RisingArtistsAnalysis,
  ExecutiveKPIs,
  PersistenceAnalysis,
  SeasonalityAnalysis,
  WatchlistAnalysis,
  StreamsAggregates,
  Territory,
  AnalysisConfig,
  DEFAULT_ANALYSIS_CONFIG
} from '@/types/music-analysis';

export class MusicAnalysisEngine {
  private config: AnalysisConfig;

  constructor(config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG) {
    this.config = config;
  }

  /**
   * Analyze movers (WoW changes)
   */
  analyzeMovers(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): MoversAnalysis {
    const validTracks = tracks.filter(t => t.delta_pos !== undefined);
    
    // Top gainers by position change (most negative = biggest improvement)
    const topGainers = validTracks
      .filter(t => t.delta_pos! < 0)
      .sort((a, b) => a.delta_pos! - b.delta_pos!)
      .slice(0, this.config.top_n_default);

    // Top gainers by streams change
    const topGainersStreams = validTracks
      .filter(t => t.delta_streams_pct && t.delta_streams_pct > 0)
      .sort((a, b) => (b.delta_streams_pct || 0) - (a.delta_streams_pct || 0))
      .slice(0, this.config.top_n_default);

    // Top losers by position change (most positive = biggest drop)
    const topLosers = validTracks
      .filter(t => t.delta_pos! > 0)
      .sort((a, b) => b.delta_pos! - a.delta_pos!)
      .slice(0, this.config.top_n_default);

    // Top losers by streams change
    const topLosersStreams = validTracks
      .filter(t => t.delta_streams_pct && t.delta_streams_pct < 0)
      .sort((a, b) => (a.delta_streams_pct || 0) - (b.delta_streams_pct || 0))
      .slice(0, this.config.top_n_default);

    // Calculate aggregate metrics
    const deltaPositions = validTracks.map(t => t.delta_pos!);
    const meanDeltaPos = deltaPositions.reduce((a, b) => a + b, 0) / deltaPositions.length;
    const medianDeltaPos = this.calculateMedian(deltaPositions);
    const volatilityIndex = this.calculateStandardDeviation(deltaPositions);

    return {
      territory,
      period,
      date,
      top_gainers: topGainers,
      top_gainers_streams: topGainersStreams,
      top_losers: topLosers,
      top_losers_streams: topLosersStreams,
      mean_delta_pos: meanDeltaPos,
      median_delta_pos: medianDeltaPos,
      volatility_index: volatilityIndex,
    };
  }

  /**
   * Analyze entries and re-entries
   */
  analyzeEntries(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): EntriesAnalysis {
    const debuts = tracks.filter(t => t.is_debut);
    const reentries = tracks.filter(t => t.is_reentry);
    const exits = tracks.filter(t => t.is_exit);

    // Top debuts by initial streams
    const topDebuts = debuts
      .sort((a, b) => (b.streams || 0) - (a.streams || 0))
      .slice(0, this.config.top_n_default);

    // Relevant re-entries (position ≤ 100 or %Δ streams ≥ 25%)
    const relevantReentries = reentries.filter(t => 
      t.position <= 100 || (t.delta_streams_pct && t.delta_streams_pct >= 25)
    );

    // Calculate turnover rates
    const totalTracks = 200;
    const turnoverNewPct = (debuts.length / totalTracks) * 100;
    const turnoverReentryPct = (reentries.length / totalTracks) * 100;
    const turnoverExitPct = (exits.length / totalTracks) * 100;

    return {
      territory,
      period,
      date,
      debut_count: debuts.length,
      reentry_count: reentries.length,
      exit_count: exits.length,
      top_debuts: topDebuts,
      relevant_reentries: relevantReentries,
      turnover_new_pct: turnoverNewPct,
      turnover_reentry_pct: turnoverReentryPct,
      turnover_exit_pct: turnoverExitPct,
    };
  }

  /**
   * Analyze peaks and records
   */
  analyzePeaks(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): PeaksAnalysis {
    // New peaks (current position < historical best)
    const newPeaks = tracks.filter(t => t.position < t.peak_position);

    // Longest runs in different tiers
    const longestRunsTop10 = tracks
      .filter(t => t.consecutive_weeks_top10 && t.consecutive_weeks_top10 >= 10)
      .sort((a, b) => (b.consecutive_weeks_top10 || 0) - (a.consecutive_weeks_top10 || 0));

    const longestRunsTop50 = tracks
      .filter(t => t.consecutive_weeks_top50 && t.consecutive_weeks_top50 >= 20)
      .sort((a, b) => (b.consecutive_weeks_top50 || 0) - (a.consecutive_weeks_top50 || 0));

    const longestRunsTop200 = tracks
      .filter(t => t.consecutive_weeks_top200 && t.consecutive_weeks_top200 >= 50)
      .sort((a, b) => (b.consecutive_weeks_top200 || 0) - (a.consecutive_weeks_top200 || 0));

    return {
      territory,
      period,
      date,
      new_peaks: newPeaks,
      longest_runs_top10: longestRunsTop10,
      longest_runs_top50: longestRunsTop50,
      longest_runs_top200: longestRunsTop200,
    };
  }

  /**
   * Analyze streams and market share
   */
  analyzeStreams(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): StreamsAnalysis {
    // Top streams
    const topStreams = tracks
      .filter(t => t.streams && t.streams > 0)
      .sort((a, b) => (b.streams || 0) - (a.streams || 0))
      .slice(0, this.config.top_n_default);

    // Calculate stream shares
    const top10Streams = tracks.slice(0, 10).reduce((sum, t) => sum + (t.streams || 0), 0);
    const top50Streams = tracks.slice(0, 50).reduce((sum, t) => sum + (t.streams || 0), 0);
    const top200Streams = tracks.reduce((sum, t) => sum + (t.streams || 0), 0);

    const streamShareTop10 = top200Streams > 0 ? top10Streams / top200Streams : 0;
    const streamShareTop50 = top200Streams > 0 ? top50Streams / top200Streams : 0;
    const streamShareTop200 = 1; // Always 100%

    // TODO: Calculate changes vs previous week and baseline when historical data is available
    const deltaStreamShareTop10Wow = 0;
    const deltaStreamShareTop50Wow = 0;
    const deltaStreamShareTop10Baseline = 0;
    const deltaStreamShareTop50Baseline = 0;

    return {
      territory,
      period,
      date,
      top_streams: topStreams,
      stream_share_top10: streamShareTop10,
      stream_share_top50: streamShareTop50,
      stream_share_top200: streamShareTop200,
      delta_stream_share_top10_wow: deltaStreamShareTop10Wow,
      delta_stream_share_top50_wow: deltaStreamShareTop50Wow,
      delta_stream_share_top10_baseline: deltaStreamShareTop10Baseline,
      delta_stream_share_top50_baseline: deltaStreamShareTop50Baseline,
    };
  }

  /**
   * Analyze collaborations vs solo tracks
   */
  analyzeCollaborations(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): CollaborationsAnalysis {
    // Detect collaborations (multiple artists or "feat." in name)
    const collaborationTracks = tracks.filter(t => 
      t.artists.includes(',') || 
      t.artists.includes('feat.') || 
      t.artists.includes('ft.') ||
      t.artists.includes('&')
    );
    
    const soloTracks = tracks.filter(t => !collaborationTracks.includes(t));

    // Calculate average deltas
    const collabAvgDeltaPos = collaborationTracks.length > 0 
      ? collaborationTracks.reduce((sum, t) => sum + (t.delta_pos || 0), 0) / collaborationTracks.length 
      : 0;
    
    const soloAvgDeltaPos = soloTracks.length > 0 
      ? soloTracks.reduce((sum, t) => sum + (t.delta_pos || 0), 0) / soloTracks.length 
      : 0;

    const collabAvgDeltaStreamsPct = collaborationTracks.length > 0 
      ? collaborationTracks.reduce((sum, t) => sum + (t.delta_streams_pct || 0), 0) / collaborationTracks.length 
      : 0;
    
    const soloAvgDeltaStreamsPct = soloTracks.length > 0 
      ? soloTracks.reduce((sum, t) => sum + (t.delta_streams_pct || 0), 0) / soloTracks.length 
      : 0;

    return {
      territory,
      period,
      date,
      collaboration_tracks: collaborationTracks,
      solo_tracks: soloTracks,
      collab_avg_delta_pos: collabAvgDeltaPos,
      solo_avg_delta_pos: soloAvgDeltaPos,
      collab_avg_delta_streams_pct: collabAvgDeltaStreamsPct,
      solo_avg_delta_streams_pct: soloAvgDeltaStreamsPct,
    };
  }

  /**
   * Analyze cross-territory patterns
   */
  analyzeCrossTerritory(allTerritoryData: { [key: string]: TrackAnalysis[] }, date: Date, period: 'daily' | 'weekly'): CrossTerritoryAnalysis {
    const territories = Object.keys(allTerritoryData) as Territory[];
    const intersectionMatrix: any = {};
    const travelSequences: any[] = [];

    // Build intersection matrix
    for (const territory1 of territories) {
      intersectionMatrix[territory1] = {};
      for (const territory2 of territories) {
        if (territory1 !== territory2) {
          const tracks1 = new Set(allTerritoryData[territory1].map(t => t.track_id));
          const tracks2 = new Set(allTerritoryData[territory2].map(t => t.track_id));
          
          const intersection = new Set([...tracks1].filter(x => tracks2.has(x)));
          const union = new Set([...tracks1, ...tracks2]);
          
          const jaccard = union.size > 0 ? intersection.size / union.size : 0;
          
          intersectionMatrix[territory1][territory2] = {
            count: intersection.size,
            jaccard,
            tracks: Array.from(intersection),
          };
        }
      }
    }

    // TODO: Implement travel map detection when historical data is available

    return {
      date,
      period,
      intersection_matrix: intersectionMatrix,
      travel_sequences: travelSequences,
    };
  }

  /**
   * Analyze momentum and breakout potential
   */
  analyzeMomentum(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): MomentumAnalysis {
    // Velocity tracks (top by speed_4w)
    const velocityTracks = tracks
      .filter(t => t.speed_4w !== undefined)
      .sort((a, b) => (b.speed_4w || 0) - (a.speed_4w || 0))
      .slice(0, this.config.top_n_default);

    // Acceleration tracks (top by acceleration)
    const accelerationTracks = tracks
      .filter(t => t.acceleration !== undefined)
      .sort((a, b) => (b.acceleration || 0) - (a.acceleration || 0))
      .slice(0, this.config.top_n_default);

    // Breakout watchlist (outside Top 50, high momentum, high streams growth)
    const breakoutWatchlist = tracks
      .filter(t => 
        t.position > 50 && 
        t.momentum_score && t.momentum_score >= 80 &&
        t.delta_streams_pct && t.delta_streams_pct >= 25
      )
      .sort((a, b) => (b.momentum_score || 0) - (a.momentum_score || 0));

    // Momentum leaderboard
    const momentumLeaderboard = tracks
      .filter(t => t.momentum_score !== undefined)
      .sort((a, b) => (b.momentum_score || 0) - (a.momentum_score || 0))
      .slice(0, this.config.top_n_default);

    return {
      territory,
      period,
      date,
      velocity_tracks: velocityTracks,
      acceleration_tracks: accelerationTracks,
      breakout_watchlist: breakoutWatchlist,
      momentum_leaderboard: momentumLeaderboard,
    };
  }

  /**
   * Analyze genre and origin distribution
   */
  analyzeGenreOrigin(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): GenreOriginAnalysis {
    // Genre distribution
    const genreMap = new Map<string, { count: number; positions: number[]; streams: number[] }>();
    
    tracks.forEach(track => {
      if (track.genres && track.genres.length > 0) {
        track.genres.forEach(genre => {
          if (!genreMap.has(genre)) {
            genreMap.set(genre, { count: 0, positions: [], streams: [] });
          }
          const data = genreMap.get(genre)!;
          data.count++;
          data.positions.push(track.position);
          data.streams.push(track.streams || 0);
        });
      }
    });

    const genreDistribution = Array.from(genreMap.entries()).map(([genre, data]) => ({
      genre,
      count: data.count,
      percentage: (data.count / tracks.length) * 100,
      avg_position: data.positions.reduce((a, b) => a + b, 0) / data.positions.length,
      total_streams: data.streams.reduce((a, b) => a + b, 0),
      delta_vs_baseline: 0, // TODO: Calculate when baseline data is available
    })).sort((a, b) => b.count - a.count);

    // Origin distribution
    const originMap = new Map<string, { count: number; positions: number[]; streams: number[]; cities: Set<string> }>();
    
    tracks.forEach(track => {
      if (track.main_artist_country) {
        const key = track.main_artist_country;
        if (!originMap.has(key)) {
          originMap.set(key, { count: 0, positions: [], streams: [], cities: new Set() });
        }
        const data = originMap.get(key)!;
        data.count++;
        data.positions.push(track.position);
        data.streams.push(track.streams || 0);
        if (track.main_artist_city) {
          data.cities.add(track.main_artist_city);
        }
      }
    });

    const originDistribution = Array.from(originMap.entries()).map(([country, data]) => ({
      country,
      city: data.cities.size > 0 ? Array.from(data.cities)[0] : undefined,
      count: data.count,
      percentage: (data.count / tracks.length) * 100,
      avg_position: data.positions.reduce((a, b) => a + b, 0) / data.positions.length,
      total_streams: data.streams.reduce((a, b) => a + b, 0),
      growth: 0, // TODO: Calculate when historical data is available
    })).sort((a, b) => b.count - a.count);

    return {
      territory,
      period,
      date,
      genre_distribution: genreDistribution,
      origin_distribution: originDistribution,
    };
  }

  /**
   * Analyze label and distributor market share
   */
  analyzeLabelDistributor(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): LabelDistributorAnalysis {
    // Label analysis
    const labelMap = new Map<string, { tracks: TrackAnalysis[]; streams: number }>();
    
    tracks.forEach(track => {
      if (track.label) {
        if (!labelMap.has(track.label)) {
          labelMap.set(track.label, { tracks: [], streams: 0 });
        }
        const data = labelMap.get(track.label)!;
        data.tracks.push(track);
        data.streams += track.streams || 0;
      }
    });

    const totalTracks = tracks.length;
    const totalStreams = tracks.reduce((sum, t) => sum + (t.streams || 0), 0);

    const labelMarketShare = Array.from(labelMap.entries()).map(([label, data]) => ({
      label,
      track_count: data.tracks.length,
      track_percentage: (data.tracks.length / totalTracks) * 100,
      stream_count: data.streams,
      stream_percentage: totalStreams > 0 ? (data.streams / totalStreams) * 100 : 0,
      delta_wow: 0, // TODO: Calculate when historical data is available
      delta_baseline: 0, // TODO: Calculate when baseline data is available
    })).sort((a, b) => b.stream_percentage - a.stream_percentage);

    // Distributor analysis (similar logic)
    const distributorMap = new Map<string, { tracks: TrackAnalysis[]; streams: number }>();
    
    tracks.forEach(track => {
      if (track.distributor) {
        if (!distributorMap.has(track.distributor)) {
          distributorMap.set(track.distributor, { tracks: [], streams: 0 });
        }
        const data = distributorMap.get(track.distributor)!;
        data.tracks.push(track);
        data.streams += track.streams || 0;
      }
    });

    const distributorMarketShare = Array.from(distributorMap.entries()).map(([distributor, data]) => ({
      distributor,
      track_count: data.tracks.length,
      track_percentage: (data.tracks.length / totalTracks) * 100,
      stream_count: data.streams,
      stream_percentage: totalStreams > 0 ? (data.streams / totalStreams) * 100 : 0,
      delta_wow: 0, // TODO: Calculate when historical data is available
      delta_baseline: 0, // TODO: Calculate when baseline data is available
    })).sort((a, b) => b.stream_percentage - a.stream_percentage);

    // Majors vs Indies
    const majorLabels = this.config.major_labels;
    const majorTracks = tracks.filter(t => 
      t.label && majorLabels.some(major => 
        t.label!.toLowerCase().includes(major.toLowerCase())
      )
    );
    
    const indieTracks = tracks.filter(t => t.label && !majorTracks.includes(t));

    const majorsVsIndies = {
      major: {
        category: 'major' as const,
        track_count: majorTracks.length,
        track_percentage: (majorTracks.length / totalTracks) * 100,
        stream_count: majorTracks.reduce((sum, t) => sum + (t.streams || 0), 0),
        stream_percentage: totalStreams > 0 ? (majorTracks.reduce((sum, t) => sum + (t.streams || 0), 0) / totalStreams) * 100 : 0,
        avg_position: majorTracks.reduce((sum, t) => sum + t.position, 0) / majorTracks.length,
      },
      indie: {
        category: 'indie' as const,
        track_count: indieTracks.length,
        track_percentage: (indieTracks.length / totalTracks) * 100,
        stream_count: indieTracks.reduce((sum, t) => sum + (t.streams || 0), 0),
        stream_percentage: totalStreams > 0 ? (indieTracks.reduce((sum, t) => sum + (t.streams || 0), 0) / totalStreams) * 100 : 0,
        avg_position: indieTracks.reduce((sum, t) => sum + t.position, 0) / indieTracks.length,
      },
    };

    return {
      territory,
      period,
      date,
      label_market_share: labelMarketShare,
      distributor_market_share: distributorMarketShare,
      majors_vs_indies: majorsVsIndies,
    };
  }

  /**
   * Analyze rising artists
   */
  analyzeRisingArtists(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): RisingArtistsAnalysis {
    // Group tracks by artist
    const artistMap = new Map<string, {
      tracks: TrackAnalysis[];
      totalStreams: number;
      avgPosition: number;
      socialMetrics: {
        spotifyFollowers?: number;
        igFollowers?: number;
        tiktokFollowers?: number;
        engagementRate?: number;
      };
    }>();

    tracks.forEach(track => {
      const artist = track.artists.split(',')[0].trim(); // Use first artist
      if (!artistMap.has(artist)) {
        artistMap.set(artist, {
          tracks: [],
          totalStreams: 0,
          avgPosition: 0,
          socialMetrics: {},
        });
      }
      const data = artistMap.get(artist)!;
      data.tracks.push(track);
      data.totalStreams += track.streams || 0;
    });

    // Calculate averages and social metrics
    const risingArtists = Array.from(artistMap.entries()).map(([artist, data]) => {
      const avgPosition = data.tracks.reduce((sum, t) => sum + t.position, 0) / data.tracks.length;
      
      // Get social metrics from first track (assuming all tracks from same artist have same social data)
      const firstTrack = data.tracks[0];
      const socialMetrics = {
        spotifyFollowers: firstTrack.spotify_followers,
        igFollowers: firstTrack.ig_followers,
        tiktokFollowers: firstTrack.tiktok_followers,
        engagementRate: firstTrack.engagement_rate,
      };

      return {
        artist,
        track_count: data.tracks.length,
        avg_position: avgPosition,
        total_streams: data.totalStreams,
        delta_followers_spotify_pct: 0, // TODO: Calculate when historical data is available
        delta_followers_ig_pct: 0, // TODO: Calculate when historical data is available
        delta_followers_tiktok_pct: 0, // TODO: Calculate when historical data is available
        engagement_rate: socialMetrics.engagementRate || 0,
        social_chart_correlation: 0, // TODO: Calculate correlation with lag 1-2 weeks
      };
    }).sort((a, b) => b.total_streams - a.total_streams).slice(0, this.config.top_n_default);

    return {
      territory,
      period,
      date,
      rising_artists: risingArtists,
    };
  }

  /**
   * Calculate executive KPIs
   */
  calculateExecutiveKPIs(
    entriesAnalysis: EntriesAnalysis,
    streamsAnalysis: StreamsAnalysis,
    labelAnalysis: LabelDistributorAnalysis,
    risingArtistsAnalysis: RisingArtistsAnalysis,
    territory: Territory,
    period: 'daily' | 'weekly',
    date: Date
  ): ExecutiveKPIs {
    // Track of the week (highest absolute streams change)
    const trackOfTheWeek = {
      track_id: 'placeholder',
      track_name: 'Track of the Week',
      artists: 'Artist Name',
      delta_streams: 0, // TODO: Calculate from historical data
      position: 1,
    };

    // Label of the week (highest share change)
    const labelOfTheWeek = {
      label: 'Label of the Week',
      delta_share: 0, // TODO: Calculate from historical data
      track_count: 0,
    };

    // Artist of the week (highest social growth)
    const artistOfTheWeek = {
      artist: 'Artist of the Week',
      delta_followers_pct: 0, // TODO: Calculate from historical data
      track_count: 0,
      avg_position: 0,
    };

    return {
      territory,
      period,
      date,
      debuts: entriesAnalysis.debut_count,
      reentries: entriesAnalysis.reentry_count,
      turnover_rate: entriesAnalysis.turnover_new_pct + entriesAnalysis.turnover_reentry_pct,
      top10_share: streamsAnalysis.stream_share_top10,
      top50_share: streamsAnalysis.stream_share_top50,
      top200_share: streamsAnalysis.stream_share_top200,
      track_of_the_week: trackOfTheWeek,
      label_of_the_week: labelOfTheWeek,
      artist_of_the_week: artistOfTheWeek,
    };
  }

  /**
   * Calculate streams aggregates
   */
  calculateStreamsAggregates(tracks: TrackAnalysis[], territory: Territory, period: 'daily' | 'weekly', date: Date): StreamsAggregates {
    const top10Streams = tracks.slice(0, 10).reduce((sum, t) => sum + (t.streams || 0), 0);
    const top50Streams = tracks.slice(0, 50).reduce((sum, t) => sum + (t.streams || 0), 0);
    const top200Streams = tracks.reduce((sum, t) => sum + (t.streams || 0), 0);

    // TODO: Calculate previous week and baseline when historical data is available
    const previous = { top10: 0, top50: 0, top200: 0 };
    const baseline = { top10: 0, top50: 0, top200: 0 };

    return {
      territory,
      period,
      date,
      current: {
        top10: top10Streams,
        top50: top50Streams,
        top200: top200Streams,
      },
      previous,
      baseline,
      growth: {
        vs_previous: {
          top10: top10Streams - previous.top10,
          top50: top50Streams - previous.top50,
          top200: top200Streams - previous.top200,
        },
        vs_baseline: {
          top10: top10Streams - baseline.top10,
          top50: top50Streams - baseline.top50,
          top200: top200Streams - baseline.top200,
        },
      },
      growth_pct: {
        vs_previous: {
          top10: previous.top10 > 0 ? ((top10Streams - previous.top10) / previous.top10) * 100 : 0,
          top50: previous.top50 > 0 ? ((top50Streams - previous.top50) / previous.top50) * 100 : 0,
          top200: previous.top200 > 0 ? ((top200Streams - previous.top200) / previous.top200) * 100 : 0,
        },
        vs_baseline: {
          top10: baseline.top10 > 0 ? ((top10Streams - baseline.top10) / baseline.top10) * 100 : 0,
          top50: baseline.top50 > 0 ? ((top50Streams - baseline.top50) / baseline.top50) * 100 : 0,
          top200: baseline.top200 > 0 ? ((top200Streams - baseline.top200) / baseline.top200) * 100 : 0,
        },
      },
    };
  }

  // Helper methods
  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateStandardDeviation(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }
}

// Export singleton instance
export const musicAnalysisEngine = new MusicAnalysisEngine();
