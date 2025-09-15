"use client";

import { useState, useEffect, useCallback } from 'react';
import { Territory, MusicTrendsState, ChartData, MusicInsights } from '@/types/music';

interface UseMusicTrendsReturn {
  state: MusicTrendsState;
  chartData: ChartData | null;
  insights: MusicInsights | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  switchTerritory: (territory: Territory) => void;
  switchPeriod: (period: 'daily' | 'weekly') => void;
}

export function useMusicTrends(): UseMusicTrendsReturn {
  const [state, setState] = useState<MusicTrendsState>({
    config: {
      autoUpdate: {
        daily: {
          enabled: true,
          time: '10:00',
          timezone: 'America/Argentina/Buenos_Aires'
        },
        weekly: {
          enabled: true,
          time: '07:00',
          timezone: 'America/Argentina/Buenos_Aires'
        }
      },
      territories: ['argentina', 'spain', 'mexico', 'global'],
      refreshInterval: 60,
      dataRetentionDays: 90,
      alertThresholds: {
        jump: 10,
        drop: -20,
        debut: 50,
        risk: 180
      }
    },
    lastUpdate: {
      daily: {
        argentina: new Date(),
        spain: new Date(),
        mexico: new Date(),
        global: new Date()
      },
      weekly: {
        argentina: new Date(),
        spain: new Date(),
        mexico: new Date(),
        global: new Date()
      }
    },
    isLoading: false,
    error: null,
    currentView: {
      period: 'weekly',
      territory: 'argentina'
    }
  });

  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [insights, setInsights] = useState<MusicInsights | null>(null);

  const fetchChartData = useCallback(async (territory: Territory, period: 'daily' | 'weekly') => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`/api/music-trends/spotify-charts?territory=${territory}&period=${period}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setChartData(result.data);
        setState(prev => ({
          ...prev,
          lastUpdate: {
            ...prev.lastUpdate,
            [period]: {
              ...prev.lastUpdate[period],
              [territory]: new Date()
            }
          }
        }));
      } else {
        throw new Error(result.error || 'Failed to fetch chart data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      console.error('Error fetching chart data:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchInsights = useCallback(async (territory: Territory, period: 'daily' | 'weekly') => {
    try {
      const response = await fetch(`/api/music-trends/insights?territory=${territory}&period=${period}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setInsights(result.data);
      } else {
        console.warn('Failed to fetch insights:', result.error);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    const { territory, period } = state.currentView;
    await Promise.all([
      fetchChartData(territory, period),
      fetchInsights(territory, period)
    ]);
  }, [state.currentView, fetchChartData, fetchInsights]);

  const switchTerritory = useCallback((territory: Territory) => {
    setState(prev => ({
      ...prev,
      currentView: {
        ...prev.currentView,
        territory
      }
    }));
  }, []);

  const switchPeriod = useCallback((period: 'daily' | 'weekly') => {
    setState(prev => ({
      ...prev,
      currentView: {
        ...prev.currentView,
        period
      }
    }));
  }, []);

  // Fetch data when territory or period changes
  useEffect(() => {
    const { territory, period } = state.currentView;
    fetchChartData(territory, period);
    fetchInsights(territory, period);
  }, [state.currentView.territory, state.currentView.period, fetchChartData, fetchInsights]);

  // Auto-refresh based on config
  useEffect(() => {
    if (!state.config.refreshInterval) return;

    const interval = setInterval(() => {
      refreshData();
    }, state.config.refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [state.config.refreshInterval, refreshData]);

  return {
    state,
    chartData,
    insights,
    isLoading: state.isLoading,
    error: state.error,
    refreshData,
    switchTerritory,
    switchPeriod
  };
}
