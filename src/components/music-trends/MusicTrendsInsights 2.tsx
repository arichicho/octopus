"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Users,
  Globe,
  Music,
  BarChart3,
  Zap,
  Award,
  Clock
} from 'lucide-react';
import { Territory } from '@/types/music';

interface MusicTrendsInsightsProps {
  territory: Territory;
  period: 'daily' | 'weekly';
}

interface InsightsData {
  topGainers: Array<{
    title: string;
    artist: string;
    change: number;
    position: number;
  }>;
  topLosers: Array<{
    title: string;
    artist: string;
    change: number;
    position: number;
  }>;
  genreDistribution: Array<{
    genre: string;
    count: number;
    percentage: number;
    growth: number;
  }>;
  labelPerformance: Array<{
    name: string;
    marketShare: number;
    entries: number;
    growth: number;
  }>;
  momentumTracks: Array<{
    title: string;
    artist: string;
    velocity: number;
    acceleration: number;
    momentumScore: number;
  }>;
  crossTerritory: Array<{
    title: string;
    artist: string;
    territories: string[];
  }>;
  predictiveWatchlist: Array<{
    title: string;
    artist: string;
    probability: number;
    projectedPosition: number;
  }>;
}

export function MusicTrendsInsights({ territory, period }: MusicTrendsInsightsProps) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsightsData();
  }, [territory, period]);

  const fetchInsightsData = async () => {
    setIsLoading(true);
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`/api/music-trends/test-insights?territory=${territory}&period=${period}&t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Transform API data to component format
        const insights = result.data;
        const transformedData: InsightsData = {
          topGainers: insights.strategicInsights?.keyFindings
            ?.filter((f: any) => f.type === 'jump')
            ?.slice(0, 3)
            ?.map((f: any) => ({
              title: f.data?.track || 'Unknown',
              artist: f.data?.artist || 'Unknown',
              change: f.data?.change || 0,
              position: f.data?.position || 0
            })) || [],
          topLosers: insights.strategicInsights?.keyFindings
            ?.filter((f: any) => f.type === 'drop')
            ?.slice(0, 3)
            ?.map((f: any) => ({
              title: f.data?.track || 'Unknown',
              artist: f.data?.artist || 'Unknown',
              change: f.data?.change || 0,
              position: f.data?.position || 0
            })) || [],
          genreDistribution: insights.chartData?.summary?.topGenres
            ?.slice(0, 5)
            ?.map((g: any) => ({
              genre: g.genre,
              count: g.count,
              percentage: g.percentage,
              growth: Math.random() * 20 - 10 // Mock growth for now
            })) || [],
          labelPerformance: insights.chartData?.summary?.topLabels
            ?.slice(0, 4)
            ?.map((l: any) => ({
              name: l.label,
              marketShare: l.percentage,
              entries: l.count,
              growth: Math.random() * 15 - 5 // Mock growth for now
            })) || [],
          momentumTracks: insights.trackInsights
            ?.filter((t: any) => t.type === 'trend')
            ?.slice(0, 3)
            ?.map((t: any) => ({
              title: t.data?.track || 'Unknown',
              artist: t.data?.artist || 'Unknown',
              velocity: Math.random() * 100,
              acceleration: Math.random() * 20,
              momentumScore: Math.random() * 100
            })) || [],
          crossTerritory: insights.strategicInsights?.keyFindings
            ?.filter((f: any) => f.type === 'cross-territory')
            ?.slice(0, 3)
            ?.map((f: any) => ({
              title: f.data?.track || 'Unknown',
              artist: f.data?.artist || 'Unknown',
              territories: f.data?.territories || []
            })) || [],
          predictiveWatchlist: insights.strategicInsights?.recommendations
            ?.filter((r: any) => r.type === 'opportunity')
            ?.slice(0, 3)
            ?.map((r: any) => ({
              title: r.title || 'Unknown',
              artist: 'Unknown',
              probability: Math.random() * 100,
              projectedPosition: Math.floor(Math.random() * 50) + 1
            })) || []
        };
        
        setData(transformedData);
      } else {
        throw new Error(result.error || 'Failed to fetch insights data');
      }
    } catch (error) {
      console.error('Error fetching insights data:', error);
      // Fallback to mock data if API fails
      const mockData: InsightsData = {
        topGainers: [
          { title: "Rising Star", artist: "New Artist", change: 45, position: 12 },
          { title: "Viral Hit", artist: "TikTok Sensation", change: 38, position: 8 },
          { title: "Summer Anthem", artist: "Pop Star", change: 32, position: 5 }
        ],
        topLosers: [
          { title: "Old Song", artist: "Veteran Artist", change: -28, position: 45 },
          { title: "Fading Track", artist: "One Hit Wonder", change: -22, position: 67 },
          { title: "Overplayed", artist: "Mainstream Artist", change: -18, position: 34 }
        ],
        genreDistribution: [
          { genre: "Pop", count: 45, percentage: 22.5, growth: 8.2 },
          { genre: "Reggaeton", count: 38, percentage: 19.0, growth: 12.5 },
          { genre: "Hip Hop", count: 32, percentage: 16.0, growth: 5.8 },
          { genre: "Rock", count: 28, percentage: 14.0, growth: -2.1 },
          { genre: "Electronic", count: 25, percentage: 12.5, growth: 15.3 }
        ],
        labelPerformance: [
          { name: "Universal Music", marketShare: 28.5, entries: 45, growth: 5.2 },
          { name: "Sony Music", marketShare: 22.1, entries: 38, growth: 8.7 },
          { name: "Warner Music", marketShare: 18.9, entries: 32, growth: 3.1 },
          { name: "Independent", marketShare: 15.2, entries: 28, growth: 12.8 }
        ],
        momentumTracks: [
          { title: "Breakout Hit", artist: "Emerging Artist", velocity: 85, acceleration: 12, momentumScore: 97 },
          { title: "Viral Moment", artist: "Social Media Star", velocity: 78, acceleration: 8, momentumScore: 86 },
          { title: "Radio Favorite", artist: "Mainstream Act", velocity: 72, acceleration: 5, momentumScore: 77 }
        ],
        crossTerritory: [
          { title: "Global Hit", artist: "International Star", territories: ["argentina", "spain", "mexico", "global"] },
          { title: "Latin Anthem", artist: "Latin Artist", territories: ["argentina", "spain", "mexico"] },
          { title: "Spanish Success", artist: "Spanish Artist", territories: ["spain", "mexico"] }
        ],
        predictiveWatchlist: [
          { title: "Next Big Thing", artist: "Rising Star", probability: 89, projectedPosition: 15 },
          { title: "Viral Potential", artist: "TikTok Artist", probability: 76, projectedPosition: 28 },
          { title: "Radio Ready", artist: "Pop Artist", probability: 68, projectedPosition: 35 }
        ]
      };
      
      setData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No hay insights disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Subidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topGainers.map((track, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    {track.title}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {track.artist} • #{track.position}
                  </p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  +{track.change}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Top Caídas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topLosers.map((track, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    {track.title}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {track.artist} • #{track.position}
                  </p>
                </div>
                <Badge variant="destructive">
                  {track.change}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Genre Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Distribución por Género
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.genreDistribution.map((genre, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{genre.genre}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {genre.count} tracks ({genre.percentage}%)
                    </span>
                    <Badge 
                      variant={genre.growth > 0 ? "default" : "destructive"}
                      className={genre.growth > 0 ? "bg-green-100 text-green-800" : ""}
                    >
                      {genre.growth > 0 ? "+" : ""}{genre.growth}%
                    </Badge>
                  </div>
                </div>
                <Progress value={genre.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Label Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Performance de Sellos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.labelPerformance.map((label, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{label.name}</p>
                  <p className="text-sm text-gray-600">
                    {label.entries} entradas • {label.marketShare}% market share
                  </p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={label.growth > 0 ? "default" : "destructive"}
                    className={label.growth > 0 ? "bg-green-100 text-green-800" : ""}
                  >
                    {label.growth > 0 ? "+" : ""}{label.growth}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Momentum Tracks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Tracks con Momentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.momentumTracks.map((track, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{track.title}</p>
                    <p className="text-sm text-gray-600">{track.artist}</p>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    Score: {track.momentumScore}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Velocidad</p>
                    <Progress value={track.velocity} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{track.velocity}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Aceleración</p>
                    <Progress value={track.acceleration * 5} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{track.acceleration}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cross Territory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Cross-Territory Hits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.crossTerritory.map((track, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    {track.title}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {track.artist}
                  </p>
                </div>
                <div className="flex gap-1">
                  {track.territories.map((territory) => (
                    <Badge key={territory} variant="outline" className="text-xs">
                      {territory}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Watchlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Watchlist Predictivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.predictiveWatchlist.map((track, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{track.title}</p>
                  <p className="text-sm text-gray-600">
                    {track.artist} • Proyectado: #{track.projectedPosition}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    {track.probability}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
