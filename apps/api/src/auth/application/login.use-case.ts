import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../domain/errors';
import {
  REFRESH_TOKEN_TTL_MS,
  generateRefreshTokenValue,
  hashRefreshTokenValue,
} from './refresh-token-crypto';
import { PASSWORD_HASHER, type PasswordHasherPort } from './ports/password-hasher.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from './ports/refresh-token-repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from './ports/token-service.port';
import { USER_REPOSITORY, type UserRepositoryPort } from './ports/user-repository.port';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.verify(user.passwordHash, input.password);

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokenService.signAccessToken({ sub: user.id });
    const refreshTokenValue = generateRefreshTokenValue();
    const now = new Date();

    await this.refreshTokenRepository.save({
      id: randomUUID(),
      userId: user.id,
      familyId: randomUUID(),
      tokenHash: hashRefreshTokenValue(refreshTokenValue),
      expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
      createdAt: now,
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }
}
