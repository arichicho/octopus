/**
 * Chartmetric API Client
 * Handles authentication and API calls to Chartmetric
 * 
 * Authentication Flow:
 * 1. Use 64-character refresh token to get temporary access token
 * 2. Use access token for API calls (expires in 3600 seconds)
 * 3. Refresh token when expired (401 response)
 */

interface ChartmetricTokenResponse {
  token: string; // 180-character access token
  expires_in: number; // seconds (usually 3600 = 1 hour)
  refresh_token: string; // 64-character refresh token
  scope: string; // always "api"
}

interface ChartmetricConfig {
  refreshToken: string;
  baseUrl: string;
  accessToken?: string;
  tokenExpiresAt?: number;
}

class ChartmetricClient {
  private config: ChartmetricConfig;
  private tokenPromise: Promise<string> | null = null;

  constructor(refreshToken: string) {
    this.config = {
      refreshToken,
      baseUrl: 'https://api.chartmetric.com/api'
    };
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.config.accessToken && this.config.tokenExpiresAt && Date.now() < this.config.tokenExpiresAt) {
      return this.config.accessToken;
    }

    // If there's already a token refresh in progress, wait for it
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Start token refresh
    this.tokenPromise = this.refreshAccessToken();
    
    try {
      const token = await this.tokenPromise;
      return token;
    } finally {
      this.tokenPromise = null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    try {
      console.log('🔄 Refreshing Chartmetric access token...');
      
      const response = await fetch(`${this.config.baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshtoken: this.config.refreshToken
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chartmetric token refresh failed: ${response.status} ${errorText}`);
      }

      const tokenData: ChartmetricTokenResponse = await response.json();
      
      // Store the new token and expiration time
      this.config.accessToken = tokenData.token;
      this.config.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
      
      console.log('✅ Chartmetric access token refreshed successfully');
      return tokenData.token;
      
    } catch (error) {
      console.error('❌ Failed to refresh Chartmetric access token:', error);
      throw error;
    }
  }

  /**
   * Make an authenticated API request to Chartmetric
   */
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = await this.getAccessToken();
    
    const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // If we get a 401, the token might be expired, try to refresh and retry once
    if (response.status === 401) {
      console.log('🔄 Received 401, refreshing token and retrying...');
      
      // Clear the current token and try again
      this.config.accessToken = undefined;
      this.config.tokenExpiresAt = undefined;
      
      const newAccessToken = await this.getAccessToken();
      
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        throw new Error(`Chartmetric API request failed: ${retryResponse.status} ${errorText}`);
      }

      return retryResponse.json();
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chartmetric API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get artist data by Spotify ID
   */
  async getArtistBySpotifyId(spotifyId: string) {
    return this.request(`/artist/spotify/${spotifyId}`);
  }

  /**
   * Get track data by Spotify ID
   */
  async getTrackBySpotifyId(spotifyId: string) {
    return this.request(`/track/spotify/${spotifyId}`);
  }

  /**
   * Get artist social metrics
   */
  async getArtistSocialMetrics(artistId: string) {
    return this.request(`/artist/${artistId}/stat`);
  }

  /**
   * Get track performance metrics
   */
  async getTrackMetrics(trackId: string) {
    return this.request(`/track/${trackId}/stat`);
  }

  /**
   * Search for artists
   */
  async searchArtists(query: string, limit: number = 10) {
    return this.request(`/search?q=${encodeURIComponent(query)}&type=artists&limit=${limit}`);
  }

  /**
   * Search for tracks
   */
  async searchTracks(query: string, limit: number = 10) {
    return this.request(`/search?q=${encodeURIComponent(query)}&type=tracks&limit=${limit}`);
  }

  /**
   * Get label information
   */
  async getLabel(labelId: string) {
    return this.request(`/label/${labelId}`);
  }

  /**
   * Get distributor information
   */
  async getDistributor(distributorId: string) {
    return this.request(`/distributor/${distributorId}`);
  }

  /**
   * Get Spotify charts for a specific territory and period
   */
  async getSpotifyCharts(territory: string, period: 'daily' | 'weekly' = 'weekly', limit: number = 200) {
    // Try different possible endpoints
    const possibleEndpoints = [
      `/charts/spotify/${territory}/${period}`,
      `/charts/spotify/${territory}`,
      `/charts/spotify`,
      `/charts/${territory}/${period}`,
      `/charts/${territory}`,
      `/charts`,
      `/spotify/charts/${territory}/${period}`,
      `/spotify/charts/${territory}`,
      `/spotify/charts`
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying Chartmetric endpoint: ${endpoint}`);
        const result = await this.request(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log(`✅ Success with endpoint: ${endpoint}`);
        return result;
      } catch (error) {
        console.log(`❌ Failed with endpoint: ${endpoint}`);
        continue;
      }
    }

    throw new Error('No valid Chartmetric charts endpoint found');
  }

  /**
   * Get all available chart territories
   */
  async getChartTerritories() {
    const possibleEndpoints = [
      '/charts/territories',
      '/territories',
      '/charts/regions',
      '/regions'
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying Chartmetric territories endpoint: ${endpoint}`);
        const result = await this.request(endpoint);
        console.log(`✅ Success with territories endpoint: ${endpoint}`);
        return result;
      } catch (error) {
        console.log(`❌ Failed with territories endpoint: ${endpoint}`);
        continue;
      }
    }

    throw new Error('No valid Chartmetric territories endpoint found');
  }

  /**
   * Get chart metadata for a specific chart
   */
  async getChartMetadata(chartId: string) {
    return this.request(`/charts/${chartId}`);
  }

  /**
   * Test available endpoints
   */
  async testEndpoints() {
    const testEndpoints = [
      '/charts',
      '/charts/spotify',
      '/charts/spotify/AR',
      '/charts/spotify/AR/weekly',
      '/territories',
      '/regions',
      '/spotify/charts',
      '/spotify/charts/AR',
      '/spotify/charts/AR/weekly'
    ];

    const results = [];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        const result = await this.request(endpoint);
        results.push({ endpoint, success: true, data: result });
      } catch (error) {
        results.push({ 
          endpoint, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }
}

// Singleton instance
let chartmetricClient: ChartmetricClient | null = null;

/**
 * Get or create the Chartmetric client instance
 */
export function getChartmetricClient(): ChartmetricClient | null {
  const refreshToken = process.env.CHARTMETRIC_REFRESH_TOKEN;
  
  if (!refreshToken) {
    console.warn('⚠️ CHARTMETRIC_REFRESH_TOKEN not configured');
    return null;
  }

  if (!chartmetricClient) {
    chartmetricClient = new ChartmetricClient(refreshToken);
  }

  return chartmetricClient;
}

/**
 * Test the Chartmetric connection
 */
export async function testChartmetricConnection(): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    const client = getChartmetricClient();
    
    if (!client) {
      return {
        success: false,
        error: 'Chartmetric client not configured (missing CHARTMETRIC_REFRESH_TOKEN)'
      };
    }

    // Test with a simple search
    const result = await client.searchArtists('test', 1);
    
    return {
      success: true,
      data: result
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export { ChartmetricClient };
export type { ChartmetricTokenResponse, ChartmetricConfig };
