import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';

/**
 * Token buffer time in milliseconds.
 * Refresh token 60 seconds before expiration to avoid edge cases.
 */
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

/**
 * Configuration for Thunder admin service account authentication
 */
export interface ThunderAuthConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scopes?: string[];
}

/**
 * Cached token with expiration time
 */
interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

/**
 * Token response from Thunder OAuth2 token endpoint
 */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Service for managing Thunder admin API authentication tokens.
 * Uses OAuth2 client credentials grant flow to obtain tokens with 'system' scope
 * for accessing /users and /groups endpoints.
 */
export interface ThunderTokenService {
  /**
   * Gets a service account token for admin API access.
   * Uses OAuth2 client credentials grant flow.
   * Tokens are cached and automatically refreshed.
   *
   * @returns A valid access token for Thunder admin APIs
   * @throws Error if client credentials are not configured or token acquisition fails
   */
  getServiceToken(): Promise<string>;

  /**
   * Checks if admin service account credentials are configured.
   * @returns true if service tokens can be obtained
   */
  hasServiceCredentials(): boolean;
}

/**
 * Default implementation of ThunderTokenService.
 * Provides OAuth2 client credentials based authentication for Thunder admin APIs.
 */
export class DefaultThunderTokenService implements ThunderTokenService {
  private cachedToken: CachedToken | null = null;
  private tokenPromise: Promise<string> | null = null;
  private readonly config: ThunderAuthConfig | undefined;

  constructor(
    private readonly logger: LoggerService,
    authConfig?: ThunderAuthConfig,
  ) {
    this.config = authConfig;
  }

  hasServiceCredentials(): boolean {
    return !!this.config;
  }

  async getServiceToken(): Promise<string> {
    if (!this.config) {
      throw new Error(
        'Thunder admin service account not configured. ' +
          'Please configure thunder.auth.clientId, clientSecret, tokenUrl, and scopes in app-config.yaml',
      );
    }

    // Return cached token if still valid
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.accessToken;
    }

    // If a token request is already in progress, wait for it
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Start a new token request
    this.tokenPromise = this.fetchNewToken();

    try {
      const token = await this.tokenPromise;
      return token;
    } finally {
      this.tokenPromise = null;
    }
  }

  /**
   * Checks if a cached token is still valid (not expired).
   */
  private isTokenValid(token: CachedToken): boolean {
    return Date.now() < token.expiresAt - TOKEN_EXPIRY_BUFFER_MS;
  }

  /**
   * Fetches a new access token from Thunder's OAuth2 token endpoint.
   */
  private async fetchNewToken(): Promise<string> {
    if (!this.config) {
      throw new Error('Thunder auth config not available');
    }

    this.logger.debug('Fetching new Thunder admin service account token');

    const { clientId, clientSecret, tokenUrl, scopes } = this.config;

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    if (scopes && scopes.length > 0) {
      params.set('scope', scopes.join(' '));
    }

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Thunder token request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const tokenResponse: TokenResponse = await response.json();

      // Cache the token
      this.cachedToken = {
        accessToken: tokenResponse.access_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      };

      this.logger.debug(
        `Successfully obtained Thunder admin token, expires in ${tokenResponse.expires_in}s`,
      );

      return tokenResponse.access_token;
    } catch (error) {
      this.logger.error(
        'Failed to fetch Thunder admin service account token',
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Clears the cached token, forcing a refresh on next getServiceToken() call.
   */
  clearCache(): void {
    this.cachedToken = null;
    this.tokenPromise = null;
  }
}

/**
 * Reads Thunder auth configuration from Backstage config.
 * Returns undefined if auth is not configured.
 */
export function readThunderAuthConfig(
  config: Config,
): ThunderAuthConfig | undefined {
  const thunderConfig = config.getOptionalConfig('thunder');
  if (!thunderConfig) {
    return undefined;
  }

  const authConfig = thunderConfig.getOptionalConfig('auth');
  if (!authConfig) {
    return undefined;
  }

  const clientId = authConfig.getOptionalString('clientId');
  const clientSecret = authConfig.getOptionalString('clientSecret');
  const tokenUrl = authConfig.getOptionalString('tokenUrl');

  // All three are required for client credentials
  if (!clientId || !clientSecret || !tokenUrl) {
    return undefined;
  }

  const scopes = authConfig.getOptionalStringArray('scopes');

  return {
    clientId,
    clientSecret,
    tokenUrl,
    scopes,
  };
}
