import type { AccessTokenPayload, TokenServicePort } from '../ports/token-service.port';

// Deterministic fake so application-layer tests never depend on real JWT
// signing/verification (that is covered by JwtTokenService's own tests).
export class FakeTokenService implements TokenServicePort {
  public readonly signedPayloads: AccessTokenPayload[] = [];

  signAccessToken(payload: AccessTokenPayload): string {
    this.signedPayloads.push(payload);
    return `fake-access-token.${payload.sub}`;
  }
}
