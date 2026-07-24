export interface AccessTokenPayload {
  sub: string;
}

/**
 * Application-layer port for issuing short-lived access tokens. Refresh
 * tokens are NOT JWTs (see design.md) and are handled separately via
 * RefreshTokenRepositoryPort + refresh-token-crypto.
 */
export interface TokenServicePort {
  signAccessToken(payload: AccessTokenPayload): string;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
