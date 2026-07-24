import { Inject, Injectable } from '@nestjs/common';
import { hashRefreshTokenValue } from './refresh-token-crypto';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from './ports/refresh-token-repository.port';

export interface LogoutInput {
  refreshToken: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const tokenHash = hashRefreshTokenValue(input.refreshToken);
    const record = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!record) {
      // Idempotent: an already-logged-out or unknown token is not an error.
      return;
    }

    await this.refreshTokenRepository.revokeFamily(record.familyId);
  }
}
