import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  function setup(): { service: JwtTokenService; jwtService: JwtService } {
    const jwtService = new JwtService({ secret: 'test-secret' });
    const service = new JwtTokenService(jwtService);
    return { service, jwtService };
  }

  it('signs an access token whose payload sub matches the given user id', () => {
    const { service, jwtService } = setup();

    const token = service.signAccessToken({ sub: 'user-42' });
    const decoded = jwtService.verify<{ sub: string }>(token, { secret: 'test-secret' });

    expect(decoded.sub).toBe('user-42');
  });

  it('signs a different token for a different user id (payload actually varies)', () => {
    const { service, jwtService } = setup();

    const tokenA = service.signAccessToken({ sub: 'user-a' });
    const tokenB = service.signAccessToken({ sub: 'user-b' });

    expect(tokenA).not.toBe(tokenB);
    expect(jwtService.verify<{ sub: string }>(tokenA, { secret: 'test-secret' }).sub).toBe(
      'user-a',
    );
    expect(jwtService.verify<{ sub: string }>(tokenB, { secret: 'test-secret' }).sub).toBe(
      'user-b',
    );
  });

  it('sets a short access-token expiry (15 minutes, per design.md)', () => {
    const { service, jwtService } = setup();

    const token = service.signAccessToken({ sub: 'user-42' });
    const decoded = jwtService.decode<{ iat: number; exp: number }>(token);

    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });
});
