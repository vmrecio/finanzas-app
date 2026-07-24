export interface RefreshTokenRecord {
  id: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/**
 * Rotation-with-reuse-detection port (see design.md "Session/token flow").
 * Tokens are looked up by their hash only — the raw value never reaches
 * persistence.
 */
export interface RefreshTokenRepositoryPort {
  save(record: RefreshTokenRecord): Promise<RefreshTokenRecord>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
