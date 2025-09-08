import { google } from 'googleapis';
import { getGoogleCredentials, updateGoogleCredentials, logIntegrationAction } from '../firebase/google-integrations';
import { GOOGLE_RATE_LIMITS } from '../config/constants';

export class GoogleClientService {
  private static oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  static async getAuthenticatedClient(userId: string) {
    const credentials = await getGoogleCredentials(userId);
    
    if (!credentials) {
      throw new Error('No Google credentials found for user');
    }

    // Check if token is expired and refresh if needed
    const now = new Date();
    const expiryDate = credentials.expiryDate instanceof Date 
      ? credentials.expiryDate 
      : new Date(credentials.expiryDate as any);

    if (expiryDate <= now) {
      console.log('Token expired, refreshing...');
      await this.refreshTokens(userId, credentials.refreshToken);
      // Get updated credentials
      const updatedCredentials = await getGoogleCredentials(userId);
      if (!updatedCredentials) {
        throw new Error('Failed to refresh credentials');
      }
      credentials.accessToken = updatedCredentials.accessToken;
    }

    // Create authenticated client
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      token_type: credentials.tokenType,
      expiry_date: expiryDate.getTime(),
    });

    return client;
  }

  private static async refreshTokens(userId: string, refreshToken: string) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update stored credentials
      await updateGoogleCredentials(userId, {
        accessToken: credentials.access_token,
        expiryDate: new Date(credentials.expiry_date || Date.now() + 3600000),
      });

      await logIntegrationAction(
        userId,
        'token_refresh',
        'google',
        'success'
      );

    } catch (error) {
      console.error('Token refresh failed:', error);
      await logIntegrationAction(
        userId,
        'token_refresh',
        'google',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = GOOGLE_RATE_LIMITS.MAX_RETRIES,
    delayMs = GOOGLE_RATE_LIMITS.RETRY_DELAY_MS
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if it's a rate limit error (429) or server error (5xx)
        const isRetryable = lastError.message.includes('429') || 
                           lastError.message.includes('5') && lastError.message.includes('Error');
        
        if (!isRetryable || attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt);
        console.log(`Retrying operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}