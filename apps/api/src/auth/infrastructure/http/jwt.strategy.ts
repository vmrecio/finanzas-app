import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AccessTokenPayload } from '../../application/ports/token-service.port';

export interface AuthenticatedUser {
  id: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    });
  }

  // Passport-JWT already verified the signature/expiry before calling this;
  // we only shape the payload into `request.user` (see design.md — the
  // AuthGuard "populates request.user.id" for every downstream use case).
  validate(payload: AccessTokenPayload): AuthenticatedUser {
    return { id: payload.sub };
  }
}
