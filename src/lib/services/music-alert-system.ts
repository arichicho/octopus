import { 
  Alert, 
  AlertRule, 
  TrackAnalysis, 
  Territory, 
  AnalysisConfig, 
  DEFAULT_ANALYSIS_CONFIG 
} from '@/types/music-analysis';

export class MusicAlertSystem {
  private config: AnalysisConfig;
  private alertRules: AlertRule[];

  constructor(config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG) {
    this.config = config;
    this.alertRules = this.initializeDefaultRules();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): AlertRule[] {
    return [
      {
        id: 'jump_positions',
        name: 'Big Position Jump',
        type: 'jump',
        severity: 'medium',
        threshold: this.config.alert_thresholds.jump_positions,
        description: 'Track improved by 10+ positions',
        enabled: true,
      },
      {
        id: 'drop_positions',
        name: 'Big Position Drop',
        type: 'drop',
        severity: 'high',
        threshold: this.config.alert_thresholds.drop_positions,
        description: 'Track dropped by 20+ positions from Top 50',
        enabled: true,
      },
      {
        id: 'debut_top50',
        name: 'Top 50 Debut',
        type: 'debut',
        severity: 'high',
        threshold: this.config.alert_thresholds.debut_top_position,
        description: 'New track debuted in Top 50',
        enabled: true,
      },
      {
        id: 'risk_drop_streak',
        name: 'Risk of Drop - Streak',
        type: 'risk',
        severity: 'medium',
        threshold: this.config.alert_thresholds.risk_drop_streak,
        description: 'Track has 3+ consecutive weeks of decline',
        enabled: true,
      },
      {
        id: 'risk_drop_position',
        name: 'Risk of Drop - Position',
        type: 'risk',
        severity: 'low',
        threshold: this.config.alert_thresholds.risk_drop_position,
        description: 'Track in position 180+ with declining streams',
        enabled: true,
      },
      {
        id: 'data_quality',
        name: 'Data Quality Issue',
        type: 'data_quality',
        severity: 'high',
        threshold: 0,
        description: 'SpotifyCharts data not updated or incomplete',
        enabled: true,
      },
    ];
  }

  /**
   * Generate alerts for a set of tracks
   */
  generateAlerts(
    tracks: TrackAnalysis[], 
    territory: Territory, 
    period: 'daily' | 'weekly', 
    date: Date
  ): Alert[] {
    const alerts: Alert[] = [];
    const enabledRules = this.alertRules.filter(rule => rule.enabled);

    for (const rule of enabledRules) {
      const ruleAlerts = this.evaluateRule(rule, tracks, territory, period, date);
      alerts.push(...ruleAlerts);
    }

    return alerts;
  }

  /**
   * Evaluate a specific alert rule
   */
  private evaluateRule(
    rule: AlertRule, 
    tracks: TrackAnalysis[], 
    territory: Territory, 
    period: 'daily' | 'weekly', 
    date: Date
  ): Alert[] {
    const alerts: Alert[] = [];

    switch (rule.type) {
      case 'jump':
        alerts.push(...this.evaluateJumpRule(rule, tracks, territory, period, date));
        break;
      case 'drop':
        alerts.push(...this.evaluateDropRule(rule, tracks, territory, period, date));
        break;
      case 'debut':
        alerts.push(...this.evaluateDebutRule(rule, tracks, territory, period, date));
        break;
      case 'risk':
        alerts.push(...this.evaluateRiskRule(rule, tracks, territory, period, date));
        break;
      case 'data_quality':
        alerts.push(...this.evaluateDataQualityRule(rule, tracks, territory, period, date));
        break;
    }

    return alerts;
  }

  /**
   * Evaluate jump rule (position improvement)
   */
  private evaluateJumpRule(
    rule: AlertRule, 
    tracks: TrackAnalysis[], 
    territory: Territory, 
    period: 'daily' | 'weekly', 
    date: Date
  ): Alert[] {
    const alerts: Alert[] = [];
    const threshold = Math.abs(rule.threshold); // Make positive for comparison

    const jumpingTracks = tracks.filter(track => 
      track.delta_pos !== undefined && 
      track.delta_pos <= -threshold // Negative delta_pos means improvement
    );

    for (const track of jumpingTracks) {
      const alert: Alert = {
        id: `jump_${track.track_id}_${date.getTime()}`,
        rule_id: rule.id,
        territory,
        period,
        date,
        severity: rule.severity,
        type: rule.type,
        track_id: track.track_id,
        track_name: track.track_name,
        artists: track.artists,
        position: track.position,
        previous_position: track.previous_position,
        delta_position: track.delta_pos,
        message: `${track.track_name} by ${track.artists} jumped ${Math.abs(track.delta_pos!)} positions to #${track.position}`,
        value: Math.abs(track.delta_pos!),
        threshold,
        created_at: new Date(),
        acknowledged: false,
      };
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Evaluate drop rule (position decline)
   */
  private evaluateDropRule(
    rule: AlertRule, 
    tracks: TrackAnalysis[], 
    territory: Territory, 
    period: 'daily' | 'weekly', 
    date: Date
  ): Alert[] {
    const alerts: Alert[] = [];
    const threshold = rule.threshold;

    const droppingTracks = tracks.filter(track => 
      track.delta_pos !== undefined && 
      track.delta_pos >= threshold &&
      track.previous_position !== undefined &&
      track.previous_position <= 50 // Only from Top 50
    );

    for (const track of droppingTracks) {
      const alert: Alert = {
        id: `drop_${track.track_id}_${date.getTime()}`,
        rule_id: rule.id,
        territory,
        period,
        date,
        severity: rule.severity,
        type: rule.type,
        track_id: track.track_id,
        track_name: track.track_name,
        artists: track.artists,
        position: track.position,
        previous_position: track.previous_position,
        delta_position: track.delta_pos,
        message: `${track.track_name} by ${track.artists} dropped ${track.delta_pos} positions from #${track.previous_position} to #${track.position}`,
        value: track.delta_pos!,
        threshold,
        created_at: new Date(),
        acknowledged: false,
      };
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Evaluate debut rule (new entries in Top 50)
   */
  private evaluateDebutRule(
    rule: AlertRule, 
    tracks: TrackAnalysis[], 
    territory: Territory, 
    period: 'daily' | 'weekly', 
    date: Date
  ): Alert[] {
    const alerts: Alert[] = [];
    const threshold = rule.threshold;

    const debutTracks = tracks.filter(track => 
      track.is_debut && 
      track.position <= threshold
    );

    for (const track of debutTracks) {
      const alert: Alert = {
        id: `debut_${track.track_id}_${date.getTime()}`,
        rule_id: rule.id,
        territory,
        period,
        date,
        severity: rule.severity,
        type: rule.type,
        track_id: track.track_id,
        track_name: track.track_name,
        artists: track.artists,
        position: track.position,
        streams: track.streams,
        message: `NEW DEBUT: ${track.track_name} by ${track.artists} entered at #${track.position}`,
        value: track.position,
        threshold,
        created_at: new Date(),
        acknowledged: false,
      };
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Evaluate risk rule (tracks at risk of dropping out)
   */
  private evaluateRiskRule(
    rule: AlertRule, 
    tracks: TrackAnalysis[], 
    territory: Territory, 
    period: 'daily' | 'weekly', 
    date: Date
  ): Alert[] {
    const alerts: Alert[] = [];

    if (rule.id === 'risk_drop_streak') {
      // Risk based on consecutive decline streak
      const riskTracks = tracks.filter(track => {
        // TODO: Implement streak calculation when historical data is available
        // For now, we'll use a simplified version based on current metrics
        return track.delta_pos !== undefined && 
               track.delta_pos > 0 && 
               track.position > 100; // Simplified risk indicator
      });

      for (const track of riskTracks) {
        const alert: Alert = {
          id: `risk_streak_${track.track_id}_${date.getTime()}`,
          rule_id: rule.id,
          territory,
          period,
          date,
          severity: rule.severity,
          type: rule.type,
          track_id: track.track_id,
          track_name: track.track_name,
          artists: track.artists,
          position: track.position,
          delta_position: track.delta_pos,
          message: `RISK: ${track.track_name} by ${track.artists} showing decline pattern at #${track.position}`,
          value: track.delta_pos!,
          threshold: rule.threshold,
          created_at: new Date(),
          acknowledged: false,
        };
        alerts.push(alert);
      }
    } else if (rule.id === 'risk_drop_position') {
      // Risk based on position and streams decline
      const riskTracks = tracks.filter(track => 
        track.position >= rule.threshold &&
        track.delta_streams_pct !== undefined &&
        track.delta_streams_pct <= this.config.alert_thresholds.risk_drop_streams_pct
      );

      for (const track of riskTracks) {
        const alert: Alert = {
          id: `risk_position_${track.track_id}_${date.getTime()}`,
          rule_id: rule.id,
          territory,
          period,
          date,
          severity: rule.severity,
          type: rule.type,
          track_id: track.track_id,
          track_name: track.track_name,
          artists: track.artists,
          position: track.position,
          delta_streams_pct: track.delta_streams_pct,
          message: `RISK: ${track.track_name} by ${track.artists} at #${track.position} with ${track.delta_streams_pct}% streams decline`,
          value: track.delta_streams_pct!,
          threshold: this.config.alert_thresholds.risk_drop_streams_pct,
          created_at: new Date(),
          acknowledged: false,
        };
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Evaluate data quality rule
   */
  private evaluateDataQualityRule(
    rule: AlertRule, 
    tracks: TrackAnalysis[], 
    territory: Territory, 
    period: 'daily' | 'weekly', 
    date: Date
  ): Alert[] {
    const alerts: Alert[] = [];

    // Check for data quality issues
    const expectedTracks = 200;
    const actualTracks = tracks.length;
    const completeness = (actualTracks / expectedTracks) * 100;

    // Alert if data is incomplete
    if (completeness < 90) {
      const alert: Alert = {
        id: `data_quality_${territory}_${period}_${date.getTime()}`,
        rule_id: rule.id,
        territory,
        period,
        date,
        severity: rule.severity,
        type: rule.type,
        message: `DATA QUALITY: Incomplete data for ${territory} ${period} - ${actualTracks}/${expectedTracks} tracks (${completeness.toFixed(1)}%)`,
        value: completeness,
        threshold: 90,
        created_at: new Date(),
        acknowledged: false,
      };
      alerts.push(alert);
    }

    // Check for missing track IDs
    const missingTrackIds = tracks.filter(t => !t.track_id).length;
    if (missingTrackIds > actualTracks * 0.1) {
      const alert: Alert = {
        id: `data_quality_ids_${territory}_${period}_${date.getTime()}`,
        rule_id: rule.id,
        territory,
        period,
        date,
        severity: rule.severity,
        type: rule.type,
        message: `DATA QUALITY: ${missingTrackIds} tracks missing Spotify IDs in ${territory} ${period}`,
        value: missingTrackIds,
        threshold: actualTracks * 0.1,
        created_at: new Date(),
        acknowledged: false,
      };
      alerts.push(alert);
    }

    // Check for stale data (if date is provided)
    const now = new Date();
    const dataAge = now.getTime() - date.getTime();
    const staleThreshold = period === 'daily' ? 25 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 25 hours for daily, 7 days for weekly

    if (dataAge > staleThreshold) {
      const alert: Alert = {
        id: `data_quality_stale_${territory}_${period}_${date.getTime()}`,
        rule_id: rule.id,
        territory,
        period,
        date,
        severity: rule.severity,
        type: rule.type,
        message: `DATA QUALITY: Stale data for ${territory} ${period} - ${Math.round(dataAge / (60 * 60 * 1000))} hours old`,
        value: dataAge,
        threshold: staleThreshold,
        created_at: new Date(),
        acknowledged: false,
      };
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return false;
    }

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    return true;
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.alertRules.push(newRule);
    return newRule;
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return false;
    }

    this.alertRules.splice(ruleIndex, 1);
    return true;
  }

  /**
   * Filter alerts by criteria
   */
  filterAlerts(
    alerts: Alert[], 
    filters: {
      severity?: 'low' | 'medium' | 'high';
      type?: 'jump' | 'drop' | 'debut' | 'risk' | 'data_quality';
      territory?: Territory;
      period?: 'daily' | 'weekly';
      acknowledged?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Alert[] {
    return alerts.filter(alert => {
      if (filters.severity && alert.severity !== filters.severity) return false;
      if (filters.type && alert.type !== filters.type) return false;
      if (filters.territory && alert.territory !== filters.territory) return false;
      if (filters.period && alert.period !== filters.period) return false;
      if (filters.acknowledged !== undefined && alert.acknowledged !== filters.acknowledged) return false;
      if (filters.dateFrom && alert.date < filters.dateFrom) return false;
      if (filters.dateTo && alert.date > filters.dateTo) return false;
      return true;
    });
  }

  /**
   * Acknowledge alerts
   */
  acknowledgeAlerts(alertIds: string[], alerts: Alert[]): Alert[] {
    return alerts.map(alert => {
      if (alertIds.includes(alert.id)) {
        return {
          ...alert,
          acknowledged: true,
          acknowledged_at: new Date(),
        };
      }
      return alert;
    });
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(alerts: Alert[]): {
    total: number;
    bySeverity: { [key: string]: number };
    byType: { [key: string]: number };
    byTerritory: { [key: string]: number };
    acknowledged: number;
    unacknowledged: number;
  } {
    const stats = {
      total: alerts.length,
      bySeverity: {} as { [key: string]: number },
      byType: {} as { [key: string]: number },
      byTerritory: {} as { [key: string]: number },
      acknowledged: 0,
      unacknowledged: 0,
    };

    alerts.forEach(alert => {
      // By severity
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      
      // By type
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      
      // By territory
      stats.byTerritory[alert.territory] = (stats.byTerritory[alert.territory] || 0) + 1;
      
      // Acknowledged status
      if (alert.acknowledged) {
        stats.acknowledged++;
      } else {
        stats.unacknowledged++;
      }
    });

    return stats;
  }
}

// Export singleton instance
export const musicAlertSystem = new MusicAlertSystem();
