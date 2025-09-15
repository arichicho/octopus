/**
 * Chartmetric Mock Service
 * Provides mock data when Chartmetric API is not available
 */

export interface MockChartmetricData {
  track: {
    id: string;
    name: string;
    artists: Array<{
      id: string;
      name: string;
    }>;
    album: {
      id: string;
      name: string;
    };
    label: string;
    distributor: string;
    genre: string;
    origin: string;
  };
  artist: {
    id: string;
    name: string;
    genres: string[];
    origin: string;
    socialMetrics: {
      spotifyFollowers: number;
      instagramFollowers: number;
      tiktokFollowers: number;
    };
  };
  social: {
    spotify: {
      followers: number;
      monthlyListeners: number;
    };
    instagram: {
      followers: number;
      engagement: number;
    };
    tiktok: {
      followers: number;
      views: number;
    };
  };
}

export function generateMockChartmetricData(trackTitle: string, artistName: string): MockChartmetricData {
  // Generate consistent mock data based on track and artist names
  const trackId = `mock_track_${trackTitle.toLowerCase().replace(/\s+/g, '_')}`;
  const artistId = `mock_artist_${artistName.toLowerCase().replace(/\s+/g, '_')}`;
  
  // Mock genres based on common patterns
  const genres = ['Pop', 'Reggaeton', 'Hip Hop', 'Latin', 'Urban', 'Trap'];
  const labels = ['Sony Music', 'Universal Music', 'Warner Music', 'Independiente'];
  const distributors = ['DistroKid', 'CD Baby', 'TuneCore', 'AWAL'];
  const origins = ['Argentina', 'México', 'España', 'Colombia', 'Puerto Rico', 'Estados Unidos'];
  
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];
  const randomLabel = labels[Math.floor(Math.random() * labels.length)];
  const randomDistributor = distributors[Math.floor(Math.random() * distributors.length)];
  const randomOrigin = origins[Math.floor(Math.random() * origins.length)];
  
  // Generate realistic social metrics
  const baseFollowers = Math.floor(Math.random() * 1000000) + 10000;
  const spotifyFollowers = baseFollowers;
  const instagramFollowers = Math.floor(baseFollowers * (0.8 + Math.random() * 0.4));
  const tiktokFollowers = Math.floor(baseFollowers * (0.6 + Math.random() * 0.8));
  
  return {
    track: {
      id: trackId,
      name: trackTitle,
      artists: [{
        id: artistId,
        name: artistName
      }],
      album: {
        id: `mock_album_${trackId}`,
        name: `${trackTitle} - Single`
      },
      label: randomLabel,
      distributor: randomDistributor,
      genre: randomGenre,
      origin: randomOrigin
    },
    artist: {
      id: artistId,
      name: artistName,
      genres: [randomGenre, 'Urban', 'Latin'],
      origin: randomOrigin,
      socialMetrics: {
        spotifyFollowers,
        instagramFollowers,
        tiktokFollowers
      }
    },
    social: {
      spotify: {
        followers: spotifyFollowers,
        monthlyListeners: Math.floor(spotifyFollowers * (2 + Math.random() * 3))
      },
      instagram: {
        followers: instagramFollowers,
        engagement: Math.floor(Math.random() * 5) + 2
      },
      tiktok: {
        followers: tiktokFollowers,
        views: Math.floor(tiktokFollowers * (10 + Math.random() * 20))
      }
    }
  };
}

export function enrichTrackWithMockData(track: any): any {
  const mockData = generateMockChartmetricData(track.title, track.artist);
  
  return {
    ...track,
    chartmetricData: {
      track: mockData.track,
      artist: mockData.artist,
      social: mockData.social,
      enriched: true,
      enrichedAt: new Date().toISOString(),
      source: 'mock'
    }
  };
}
