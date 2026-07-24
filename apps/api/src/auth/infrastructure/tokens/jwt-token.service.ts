import { Injectable } from '@nestjs/common';
// Value import required: NestJS resolves this constructor parameter via
// `emitDecoratorMetadata`, which needs the real class reference at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { JwtService } from '@nestjs/jwt';
import type {
  AccessTokenPayload,
  TokenServicePort,
} from '../../application/ports/token-service.port';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes, per design.md

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  }
}
