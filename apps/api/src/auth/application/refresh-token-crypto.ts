import { createHash, randomBytes } from 'node:crypto';

const REFRESH_TOKEN_BYTES = 32;

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, per design.md

/**
 * Generates the opaque, unpredictable value handed to the client as the
 * refresh token. Never persisted as-is (see hashRefreshTokenValue).
 */
export function generateRefreshTokenValue(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

/**
 * Pure hash function (SHA-256) used to persist refresh tokens at rest per
 * design.md ("Refresh tokens persisted hashed (SHA-256)"). The raw value is
 * never stored — only this hash, so a database leak does not expose usable
 * tokens.
 */
export function hashRefreshTokenValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
