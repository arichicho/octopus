"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search,
  TrendingUp,
  TrendingDown,
  Music,
  Award,
  Clock,
  Filter
} from 'lucide-react';
import { Territory, Track } from '@/types/music';

interface MusicTrendsChartsProps {
  territory: Territory;
  period: 'daily' | 'weekly';
}

export function MusicTrendsCharts({ territory, period }: MusicTrendsChartsProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'change' | 'streams'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchChartData();
  }, [territory, period]);

  useEffect(() => {
    filterAndSortTracks();
  }, [tracks, searchTerm, sortBy, sortOrder]);

  const fetchChartData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/music-trends/spotify-charts?territory=${territory}&period=${period}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Convert API data to Track format
        const apiTracks: Track[] = result.data.map((track: any) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          position: track.position,
          previousPosition: track.previousPosition,
          streams: track.streams,
          previousStreams: track.previousStreams,
          peakPosition: track.peakPosition,
          weeksOnChart: track.weeksOnChart,
          isNewEntry: track.isNewEntry,
          isReEntry: track.isReEntry,
          isNewPeak: track.isNewPeak,
          territory: track.territory,
          period: track.period,
          date: new Date(track.date)
        }));
        
        setTracks(apiTracks);
      } else {
        throw new Error(result.error || 'Failed to fetch chart data');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Fallback to mock data if API fails
      const mockTracks: Track[] = Array.from({ length: 50 }, (_, i) => ({
        id: `track-${i + 1}`,
        title: `Song Title ${i + 1}`,
        artist: `Artist ${i + 1}`,
        position: i + 1,
        previousPosition: i + 1 + Math.floor(Math.random() * 10 - 5),
        streams: Math.floor(Math.random() * 1000000) + 100000,
        previousStreams: Math.floor(Math.random() * 1000000) + 100000,
        peakPosition: Math.floor(Math.random() * (i + 1)) + 1,
        weeksOnChart: Math.floor(Math.random() * 20) + 1,
        isNewEntry: Math.random() > 0.9,
        isReEntry: Math.random() > 0.95,
        isNewPeak: Math.random() > 0.98,
        territory,
        period,
        date: new Date()
      }));
      
      setTracks(mockTracks);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortTracks = () => {
    let filtered = tracks.filter(track => 
      track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'position':
          aValue = a.position;
          bValue = b.position;
          break;
        case 'change':
          aValue = (a.previousPosition || a.position) - a.position;
          bValue = (b.previousPosition || b.position) - b.position;
          break;
        case 'streams':
          aValue = a.streams;
          bValue = b.streams;
          break;
        default:
          aValue = a.position;
          bValue = b.position;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredTracks(filtered);
  };

  const getPositionChange = (track: Track) => {
    if (!track.previousPosition) return null;
    const change = track.previousPosition - track.position;
    return change;
  };

  const getPositionChangeBadge = (change: number | null) => {
    if (change === null) return null;
    
    if (change > 0) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{change}
        </Badge>
      );
    } else if (change < 0) {
      return (
        <Badge variant="destructive">
          <TrendingDown className="w-3 h-3 mr-1" />
          {change}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          =
        </Badge>
      );
    }
  };

  const getTrackBadges = (track: Track) => {
    const badges = [];
    
    if (track.isNewEntry) {
      badges.push(
        <Badge key="new" variant="default" className="bg-blue-100 text-blue-800">
          Nuevo
        </Badge>
      );
    }
    
    if (track.isReEntry) {
      badges.push(
        <Badge key="reentry" variant="secondary">
          Re-entrada
        </Badge>
      );
    }
    
    if (track.isNewPeak) {
      badges.push(
        <Badge key="peak" variant="default" className="bg-purple-100 text-purple-800">
          <Award className="w-3 h-3 mr-1" />
          Pico
        </Badge>
      );
    }
    
    return badges;
  };

  const formatStreams = (streams: number) => {
    if (streams >= 1000000) {
      return `${(streams / 1000000).toFixed(1)}M`;
    } else if (streams >= 1000) {
      return `${(streams / 1000).toFixed(1)}K`;
    }
    return streams.toString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título o artista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'position' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSortBy('position');
                  setSortOrder(sortBy === 'position' && sortOrder === 'asc' ? 'desc' : 'asc');
                }}
              >
                Posición
              </Button>
              <Button
                variant={sortBy === 'change' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSortBy('change');
                  setSortOrder(sortBy === 'change' && sortOrder === 'asc' ? 'desc' : 'asc');
                }}
              >
                Cambio
              </Button>
              <Button
                variant={sortBy === 'streams' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSortBy('streams');
                  setSortOrder(sortBy === 'streams' && sortOrder === 'asc' ? 'desc' : 'asc');
                }}
              >
                Streams
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Top 50 - {territory.charAt(0).toUpperCase() + territory.slice(1)} ({period === 'daily' ? 'Diario' : 'Semanal'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Pos</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Artista</TableHead>
                  <TableHead className="w-24">Cambio</TableHead>
                  <TableHead className="w-24">Streams</TableHead>
                  <TableHead className="w-20">Semanas</TableHead>
                  <TableHead className="w-32">Pico</TableHead>
                  <TableHead className="w-32">Badges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTracks.slice(0, 50).map((track) => {
                  const change = getPositionChange(track);
                  return (
                    <TableRow key={track.id}>
                      <TableCell className="font-medium">
                        {track.position}
                      </TableCell>
                      <TableCell className="font-medium">
                        {track.title}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {track.artist}
                      </TableCell>
                      <TableCell>
                        {getPositionChangeBadge(change)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatStreams(track.streams)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {track.weeksOnChart}
                      </TableCell>
                      <TableCell className="text-sm">
                        #{track.peakPosition}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getTrackBadges(track)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Chart Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Tracks</p>
                <p className="text-2xl font-bold">{tracks.length}</p>
              </div>
              <Music className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Nuevas Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {tracks.filter(t => t.isNewEntry).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Nuevos Picos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {tracks.filter(t => t.isNewPeak).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
