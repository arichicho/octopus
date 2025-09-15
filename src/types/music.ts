// Music Trends Types
export interface Track {
  id: string;
  title: string;
  artist: string;
  position: number;
  previousPosition?: number;
  streams: number;
  previousStreams?: number;
  peakPosition?: number;
  weeksOnChart: number;
  isNewEntry: boolean;
  isReEntry: boolean;
  isNewPeak: boolean;
  territory: Territory;
  date: Date;
  period: 'daily' | 'weekly';
}

export interface Artist {
  id: string;
  name: string;
  spotifyId?: string;
  genres: string[];
  country: string;
  city?: string;
  label?: string;
  distributor?: string;
  socialMetrics: {
    spotifyFollowers: number;
    instagramFollowers: number;
    tiktokFollowers: number;
    youtubeSubscribers: number;
  };
  lastUpdated: Date;
}

export interface Label {
  id: string;
  name: string;
  country: string;
  marketShare: number;
  totalStreams: number;
  totalEntries: number;
  growthWoW: number;
  growthVsHistorical: number;
}

export interface ChartData {
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  tracks: Track[];
  totalStreams: number;
  lastUpdated: Date;
  isUpToDate: boolean;
  updateStatus: 'current' | 'delayed' | 'error';
}

export interface MusicInsights {
  id: string;
  territory: Territory;
  period: 'daily' | 'weekly';
  date: Date;
  
  // Movimientos WoW
  topGainers: Track[];
  topLosers: Track[];
  averageChange: number;
  medianChange: number;
  volatilityIndex: number;
  
  // Entradas y re-entradas
  totalNewEntries: number;
  totalReEntries: number;
  top10Debuts: Track[];
  turnoverRate: number;
  turnoverVsHistorical: number;
  
  // Picos
  newPeaks: Track[];
  
  // Colaboraciones
  collaborations: {
    total: number;
    averagePosition: number;
    vsSolo: number;
  };
  
  // Cross-territory
  crossTerritoryTracks: Track[];
  travelMap: TerritoryTravel[];
  
  // Momentum
  momentumTracks: MomentumTrack[];
  breakoutWatchlist: Track[];
  
  // Género y origen
  genreDistribution: GenreStats[];
  countryDistribution: CountryStats[];
  
  // Sellos y distribuidores
  labelPerformance: Label[];
  distributorPerformance: Label[];
  
  // Artistas en ascenso
  risingArtists: Artist[];
  
  // Alertas
  alerts: MusicAlert[];
  
  // KPIs ejecutivos
  executiveKPIs: ExecutiveKPIs;
  
  // Persistencia
  persistenceStats: PersistenceStats;
  
  // Estacionalidad
  seasonalityPatterns: SeasonalityPattern[];
  
  // Watchlist predictivo
  predictiveWatchlist: PredictiveTrack[];
  
  // Streams totales
  streamsComparison: StreamsComparison;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TerritoryTravel {
  from: Territory;
  to: Territory;
  tracks: Track[];
  count: number;
}

export interface MomentumTrack {
  track: Track;
  velocity: number;
  acceleration: number;
  momentumScore: number;
}

export interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
  averagePosition: number;
  totalStreams: number;
  growth: number;
}

export interface CountryStats {
  country: string;
  count: number;
  percentage: number;
  averagePosition: number;
  totalStreams: number;
  growth: number;
}

export interface MusicAlert {
  id: string;
  type: 'jump' | 'drop' | 'debut' | 'risk' | 'peak';
  severity: 'low' | 'medium' | 'high';
  track: Track;
  message: string;
  value: number;
  threshold: number;
  createdAt: Date;
}

export interface ExecutiveKPIs {
  debuts: number;
  reEntries: number;
  turnover: number;
  top10Share: number;
  top50Share: number;
  top200Share: number;
  trackOfTheWeek: Track;
  labelOfTheWeek: Label;
  artistOfTheWeek: Artist;
}

export interface PersistenceStats {
  averageHalfLife: number;
  survivalCurves: SurvivalCurve[];
  longevityLeaders: Track[];
}

export interface SurvivalCurve {
  weeks: number;
  survivalRate: number;
  territory: Territory;
}

export interface SeasonalityPattern {
  period: 'weekly' | 'monthly';
  pattern: Record<string, number>;
  territory: Territory;
}

export interface PredictiveTrack {
  track: Track;
  probability: number;
  confidence: number;
  factors: string[];
  projectedPosition: number;
}

export interface StreamsComparison {
  current: {
    top200: number;
    top50: number;
    top10: number;
  };
  previous: {
    top200: number;
    top50: number;
    top10: number;
  };
  historical: {
    top200: number;
    top50: number;
    top10: number;
  };
  growth: {
    vsPrevious: number;
    vsHistorical: number;
  };
}

export type Territory = 'argentina' | 'spain' | 'mexico' | 'global';

export interface MusicTrendsConfig {
  autoUpdate: {
    daily: {
      enabled: boolean;
      time: string; // "10:00"
      timezone: string; // "America/Argentina/Buenos_Aires"
    };
    weekly: {
      enabled: boolean;
      time: string; // "07:00"
      timezone: string; // "America/Argentina/Buenos_Aires"
    };
  };
  territories: Territory[];
  refreshInterval: number; // minutes
  dataRetentionDays: number;
  alertThresholds: {
    jump: number;
    drop: number;
    debut: number;
    risk: number;
  };
}

export interface MusicTrendsState {
  config: MusicTrendsConfig;
  lastUpdate: {
    daily: Record<Territory, Date>;
    weekly: Record<Territory, Date>;
  };
  isLoading: boolean;
  error: string | null;
  currentView: {
    period: 'daily' | 'weekly';
    territory: Territory;
  };
}
