import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { InvalidRefreshTokenError, RefreshTokenReuseError } from '../domain/errors';
import {
  REFRESH_TOKEN_TTL_MS,
  generateRefreshTokenValue,
  hashRefreshTokenValue,
} from './refresh-token-crypto';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from './ports/refresh-token-repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from './ports/token-service.port';

export interface RefreshInput {
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: RefreshInput): Promise<RefreshResult> {
    const tokenHash = hashRefreshTokenValue(input.refreshToken);
    const record = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!record) {
      throw new InvalidRefreshTokenError();
    }

    if (record.revokedAt) {
      // The same token was presented twice: a legitimate client never reuses
      // a rotated-out token, so this indicates possible theft. Revoke every
      // token in the family to force re-authentication.
      await this.refreshTokenRepository.revokeFamily(record.familyId);
      throw new RefreshTokenReuseError();
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    await this.refreshTokenRepository.revoke(record.id);

    const accessToken = this.tokenService.signAccessToken({ sub: record.userId });
    const nextRefreshTokenValue = generateRefreshTokenValue();
    const now = new Date();

    await this.refreshTokenRepository.save({
      id: randomUUID(),
      userId: record.userId,
      familyId: record.familyId,
      tokenHash: hashRefreshTokenValue(nextRefreshTokenValue),
      expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
      createdAt: now,
    });

    return { accessToken, refreshToken: nextRefreshTokenValue };
  }
}
