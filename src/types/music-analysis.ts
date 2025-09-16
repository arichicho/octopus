// Music Analysis Types - Comprehensive system for Spotify Top 200 analysis

export interface TrackAnalysis {
  // Basic track info
  track_id: string; // Spotify ID
  track_name: string;
  artists: string;
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Chart data
  position: number;
  streams?: number;
  is_weekly: boolean;
  
  // Calculated features
  delta_pos?: number; // pos_t - pos_{t-1} (negative = improvement)
  delta_streams_pct?: number; // (streams_t / streams_{t-1} - 1) × 100
  is_debut: boolean;
  is_reentry: boolean;
  is_exit: boolean;
  
  // Baseline metrics (12-week rolling)
  mean12_track_pos?: number;
  mean12_track_streams?: number;
  
  // Momentum metrics
  speed_4w?: number; // mean(Δ posición últimas 4 semanas)
  acceleration?: number; // speed_t - speed_{t-1}
  momentum_score?: number; // 0-100 composite score
  
  // Longevity metrics
  half_life?: number; // estimated from peak streams
  weeks_on_chart: number;
  peak_position: number;
  consecutive_weeks_top10?: number;
  consecutive_weeks_top50?: number;
  consecutive_weeks_top200?: number;
  
  // Chartmetric enrichment
  genres?: string[];
  main_artist_country?: string;
  main_artist_city?: string;
  label?: string;
  distributor?: string;
  release_date?: Date;
  
  // Social metrics
  spotify_followers?: number;
  ig_followers?: number;
  tiktok_followers?: number;
  engagement_rate?: number;
  social_metrics_date?: Date;
  
  // Cross-territory
  cross_territory_markets?: string[]; // territories where track appears
  travel_sequence?: TerritoryTravel[]; // growth sequence across territories
}

export interface TerritoryTravel {
  from_territory: Territory;
  to_territory: Territory;
  lag_weeks: number;
  position_change: number;
  streams_change_pct: number;
}

export interface ChartBaseline {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Rolling 12-week baselines
  mean12_chart_streams_top10: number;
  mean12_chart_streams_top50: number;
  mean12_chart_streams_top200: number;
  
  // Current period totals
  current_streams_top10: number;
  current_streams_top50: number;
  current_streams_top200: number;
  
  // Changes vs baseline
  delta_streams_top10_pct: number;
  delta_streams_top50_pct: number;
  delta_streams_top200_pct: number;
}

export interface MoversAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Top movers
  top_gainers: TrackAnalysis[]; // Top 10 by Δ positions (most negative first)
  top_gainers_streams: TrackAnalysis[]; // Top 10 by %Δ streams
  top_losers: TrackAnalysis[]; // Top 10 by Δ positions (most positive first)
  top_losers_streams: TrackAnalysis[]; // Top 10 by %Δ streams (most negative)
  
  // Aggregate metrics
  mean_delta_pos: number;
  median_delta_pos: number;
  volatility_index: number; // std(Δ posición) over Top 200
}

export interface EntriesAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Entry counts
  debut_count: number;
  reentry_count: number;
  exit_count: number;
  
  // Top entries
  top_debuts: TrackAnalysis[]; // Top 10 by initial streams
  relevant_reentries: TrackAnalysis[]; // pos ≤ 100 or %Δ streams ≥ 25%
  
  // Turnover rates
  turnover_new_pct: number; // debut_count / 200 × 100
  turnover_reentry_pct: number; // reentry_count / 200 × 100
  turnover_exit_pct: number; // exit_count / 200 × 100
}

export interface PeaksAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // New peaks
  new_peaks: TrackAnalysis[]; // pos_t < best_pos_hist
  
  // Longest runs
  longest_runs_top10: TrackAnalysis[];
  longest_runs_top50: TrackAnalysis[];
  longest_runs_top200: TrackAnalysis[];
}

export interface StreamsAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Top streams
  top_streams: TrackAnalysis[]; // Top 10 by absolute streams
  
  // Stream shares
  stream_share_top10: number; // sum_top10 / sum_top200
  stream_share_top50: number; // sum_top50 / sum_top200
  stream_share_top200: number; // sum_top200 / sum_top200 (always 1)
  
  // Changes vs previous week and baseline
  delta_stream_share_top10_wow: number;
  delta_stream_share_top50_wow: number;
  delta_stream_share_top10_baseline: number;
  delta_stream_share_top50_baseline: number;
}

export interface CollaborationsAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Collaboration detection
  collaboration_tracks: TrackAnalysis[];
  solo_tracks: TrackAnalysis[];
  
  // Impact analysis
  collab_avg_delta_pos: number;
  solo_avg_delta_pos: number;
  collab_avg_delta_streams_pct: number;
  solo_avg_delta_streams_pct: number;
  
  // Statistical significance (optional)
  t_test_p_value?: number;
}

export interface CrossTerritoryAnalysis {
  date: Date;
  period: 'daily' | 'weekly';
  
  // Intersection matrix
  intersection_matrix: {
    [key: string]: {
      [key: string]: {
        count: number;
        jaccard: number;
        tracks: string[]; // track_ids
      };
    };
  };
  
  // Travel map
  travel_sequences: TerritoryTravelSequence[];
}

export interface TerritoryTravelSequence {
  track_id: string;
  track_name: string;
  artists: string;
  sequence: TerritoryTravel[];
  total_lag_weeks: number;
  total_position_improvement: number;
}

export interface MomentumAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Velocity and acceleration
  velocity_tracks: TrackAnalysis[]; // Top tracks by speed_4w
  acceleration_tracks: TrackAnalysis[]; // Top tracks by acceleration
  
  // Breakout watchlist
  breakout_watchlist: TrackAnalysis[]; // Outside Top 50, score ≥ p80, %Δ streams 4w ≥ 25%
  
  // Momentum scores
  momentum_leaderboard: TrackAnalysis[]; // Top 10 by momentum_score
}

export interface GenreOriginAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Genre distribution
  genre_distribution: {
    genre: string;
    count: number;
    percentage: number;
    avg_position: number;
    total_streams: number;
    delta_vs_baseline: number;
  }[];
  
  // Origin distribution
  origin_distribution: {
    country: string;
    city?: string;
    count: number;
    percentage: number;
    avg_position: number;
    total_streams: number;
    growth: number;
  }[];
}

export interface LabelDistributorAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Label analysis
  label_market_share: {
    label: string;
    track_count: number;
    track_percentage: number;
    stream_count: number;
    stream_percentage: number;
    delta_wow: number;
    delta_baseline: number;
  }[];
  
  // Distributor analysis
  distributor_market_share: {
    distributor: string;
    track_count: number;
    track_percentage: number;
    stream_count: number;
    stream_percentage: number;
    delta_wow: number;
    delta_baseline: number;
  }[];
  
  // Majors vs Indies
  majors_vs_indies: {
    category: 'major' | 'indie';
    track_count: number;
    track_percentage: number;
    stream_count: number;
    stream_percentage: number;
    avg_position: number;
  };
}

export interface RisingArtistsAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Top rising artists
  rising_artists: {
    artist: string;
    track_count: number;
    avg_position: number;
    total_streams: number;
    delta_followers_spotify_pct: number;
    delta_followers_ig_pct: number;
    delta_followers_tiktok_pct: number;
    engagement_rate: number;
    social_chart_correlation: number; // Pearson correlation with lag 1-2 weeks
  }[];
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'jump' | 'drop' | 'debut' | 'risk' | 'data_quality';
  severity: 'low' | 'medium' | 'high';
  threshold: number;
  description: string;
  enabled: boolean;
}

export interface Alert {
  id: string;
  rule_id: string;
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  severity: 'low' | 'medium' | 'high';
  type: 'jump' | 'drop' | 'debut' | 'risk' | 'data_quality';
  
  // Alert data
  track_id?: string;
  track_name?: string;
  artists?: string;
  position?: number;
  previous_position?: number;
  delta_position?: number;
  streams?: number;
  delta_streams_pct?: number;
  
  // Alert message
  message: string;
  value: number;
  threshold: number;
  
  // Metadata
  created_at: Date;
  acknowledged: boolean;
  acknowledged_at?: Date;
}

export interface ExecutiveKPIs {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Core metrics
  debuts: number;
  reentries: number;
  turnover_rate: number;
  
  // Market share
  top10_share: number;
  top50_share: number;
  top200_share: number;
  
  // Track of the week
  track_of_the_week: {
    track_id: string;
    track_name: string;
    artists: string;
    delta_streams: number;
    position: number;
  };
  
  // Label of the week
  label_of_the_week: {
    label: string;
    delta_share: number;
    track_count: number;
  };
  
  // Artist of the week
  artist_of_the_week: {
    artist: string;
    delta_followers_pct: number;
    track_count: number;
    avg_position: number;
  };
}

export interface PersistenceAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Half-life analysis
  half_life_tracks: TrackAnalysis[]; // Tracks with calculated half-life
  
  // Survival analysis
  survival_curves: {
    cohort_week: Date;
    survival_rates: {
      week: number;
      survival_rate: number;
      track_count: number;
    }[];
  }[];
  
  // Longevity leaders
  longevity_leaders: TrackAnalysis[]; // Tracks with longest runs
}

export interface SeasonalityAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Weekly heatmap
  weekly_heatmap: {
    week: number; // 1-52
    avg_position: number;
    track_count: number;
    total_streams: number;
  }[];
  
  // Seasonal patterns
  seasonal_patterns: {
    pattern_type: 'weekly' | 'monthly' | 'quarterly';
    pattern_data: Record<string, number>;
    strength: number; // 0-1
  }[];
}

export interface WatchlistAnalysis {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Curated watchlist
  curated_watchlist: {
    track_id: string;
    track_name: string;
    artists: string;
    momentum_score: number;
    position: number;
    delta_position: number;
    delta_streams_pct: number;
    delta_social_pct: number;
    cross_territory_markets: number;
    justification: string[];
    predicted_top50_next_week: boolean;
  }[];
  
  // Backtest results
  backtest_results: {
    week: Date;
    predicted_count: number;
    actual_count: number;
    precision: number;
    recall: number;
    f1_score: number;
  }[];
}

export interface StreamsAggregates {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Current totals
  current: {
    top10: number;
    top50: number;
    top200: number;
  };
  
  // Previous week
  previous: {
    top10: number;
    top50: number;
    top200: number;
  };
  
  // Baseline 12-week
  baseline: {
    top10: number;
    top50: number;
    top200: number;
  };
  
  // Growth metrics
  growth: {
    vs_previous: {
      top10: number;
      top50: number;
      top200: number;
    };
    vs_baseline: {
      top10: number;
      top50: number;
      top200: number;
    };
  };
  
  // Percentage changes
  growth_pct: {
    vs_previous: {
      top10: number;
      top50: number;
      top200: number;
    };
    vs_baseline: {
      top10: number;
      top50: number;
      top200: number;
    };
  };
}

export interface DataQualityFlags {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Data completeness
  expected_tracks: number;
  actual_tracks: number;
  completeness_pct: number;
  
  // Data freshness
  last_update: Date;
  expected_update: Date;
  is_stale: boolean;
  staleness_hours: number;
  
  // Quality issues
  missing_track_ids: number;
  fuzzy_matches: number;
  data_anomalies: string[];
  
  // Source status
  kworb_status: 'ok' | 'error' | 'timeout';
  chartmetric_status: 'ok' | 'error' | 'timeout' | 'rate_limited';
  
  // Flags
  spotify_charts_not_updated: boolean;
  incomplete_data: boolean;
  data_quality_issues: boolean;
}

// Re-export Territory from music.ts
export type Territory = 'argentina' | 'spanish' | 'mexico' | 'global';

// Analysis configuration
export interface AnalysisConfig {
  // Top-N defaults
  top_n_default: number; // Default: 10
  
  // Alert thresholds
  alert_thresholds: {
    jump_positions: number; // Default: -10
    drop_positions: number; // Default: 20
    debut_top_position: number; // Default: 50
    risk_drop_streak: number; // Default: 3
    risk_drop_position: number; // Default: 180
    risk_drop_streams_pct: number; // Default: -15
  };
  
  // Analysis windows
  windows: {
    speed_accel: number; // Default: 4 weeks
    social_lag: number; // Default: 1-2 weeks
    baseline: number; // Default: 12 weeks
  };
  
  // Momentum score weights
  momentum_weights: {
    position: number; // Default: 0.4
    streams: number; // Default: 0.3
    social: number; // Default: 0.2
    cross_territory: number; // Default: 0.1
  };
  
  // Major labels list
  major_labels: string[];
  
  // Data retention
  data_retention_days: number; // Default: 365
  backtest_retention_weeks: number; // Default: 52
}

// Default configuration
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  top_n_default: 10,
  alert_thresholds: {
    jump_positions: -10,
    drop_positions: 20,
    debut_top_position: 50,
    risk_drop_streak: 3,
    risk_drop_position: 180,
    risk_drop_streams_pct: -15,
  },
  windows: {
    speed_accel: 4,
    social_lag: 2,
    baseline: 12,
  },
  momentum_weights: {
    position: 0.4,
    streams: 0.3,
    social: 0.2,
    cross_territory: 0.1,
  },
  major_labels: [
    'Universal Music Group',
    'Sony Music Entertainment',
    'Warner Music Group',
    'UMG',
    'Sony',
    'Warner',
  ],
  data_retention_days: 365,
  backtest_retention_weeks: 52,
};
