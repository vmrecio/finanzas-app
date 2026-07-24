import { InvalidRefreshTokenError, RefreshTokenReuseError } from '../domain/errors';
import { User } from '../domain/user.entity';
import { RefreshUseCase } from './refresh.use-case';
import { FakeTokenService } from './test-fakes/fake-token-service';
import { InMemoryRefreshTokenRepository } from './test-fakes/in-memory-refresh-token.repository';
import { InMemoryUserRepository } from './test-fakes/in-memory-user.repository';

describe('RefreshUseCase', () => {
  async function setupWithIssuedToken(): Promise<{
    useCase: RefreshUseCase;
    refreshTokenRepository: InMemoryRefreshTokenRepository;
    tokenService: FakeTokenService;
    userId: string;
    refreshTokenValue: string;
  }> {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const tokenService = new FakeTokenService();

    const user = User.register({ id: 'user-1', email: 'jane@example.com', passwordHash: '$fake$hash' });
    await userRepository.save(user);

    const useCase = new RefreshUseCase(refreshTokenRepository, tokenService);

    // Issue a first refresh token the way LoginUseCase would, so we can
    // exercise rotation/reuse without depending on LoginUseCase itself.
    const { generateRefreshTokenValue, hashRefreshTokenValue } = await import(
      './refresh-token-crypto'
    );
    const refreshTokenValue = generateRefreshTokenValue();
    await refreshTokenRepository.save({
      id: 'token-1',
      userId: user.id,
      familyId: 'family-1',
      tokenHash: hashRefreshTokenValue(refreshTokenValue),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
      createdAt: new Date(),
    });

    return { useCase, refreshTokenRepository, tokenService, userId: user.id, refreshTokenValue };
  }

  it('rotates a valid refresh token: issues a new pair and revokes the old token', async () => {
    const { useCase, refreshTokenRepository, tokenService, userId, refreshTokenValue } =
      await setupWithIssuedToken();

    const result = await useCase.execute({ refreshToken: refreshTokenValue });

    expect(result.accessToken).toBe(`fake-access-token.${userId}`);
    expect(tokenService.signedPayloads).toEqual([{ sub: userId }]);
    expect(result.refreshToken).not.toBe(refreshTokenValue);

    const all = await refreshTokenRepository.all();
    expect(all).toHaveLength(2);
    const oldRecord = all.find((record) => record.id === 'token-1');
    expect(oldRecord?.revokedAt).not.toBeNull();
  });

  it('keeps the new token in the same rotation family as the old one', async () => {
    const { useCase, refreshTokenRepository, refreshTokenValue } = await setupWithIssuedToken();

    await useCase.execute({ refreshToken: refreshTokenValue });

    const all = await refreshTokenRepository.all();
    const newRecord = all.find((record) => record.id !== 'token-1');
    expect(newRecord?.familyId).toBe('family-1');
  });

  it('rejects an unknown refresh token value', async () => {
    const { useCase } = await setupWithIssuedToken();

    await expect(useCase.execute({ refreshToken: 'never-issued-token' })).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it('rejects an expired refresh token', async () => {
    const { useCase, refreshTokenRepository } = await setupWithIssuedToken();
    const { generateRefreshTokenValue, hashRefreshTokenValue } = await import(
      './refresh-token-crypto'
    );
    const expiredValue = generateRefreshTokenValue();
    await refreshTokenRepository.save({
      id: 'token-expired',
      userId: 'user-1',
      familyId: 'family-2',
      tokenHash: hashRefreshTokenValue(expiredValue),
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
      createdAt: new Date(Date.now() - 2000),
    });

    await expect(useCase.execute({ refreshToken: expiredValue })).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it('detects reuse of an already-rotated token and revokes the whole family', async () => {
    const { useCase, refreshTokenRepository, refreshTokenValue } = await setupWithIssuedToken();

    // First use: legitimate rotation.
    await useCase.execute({ refreshToken: refreshTokenValue });

    // Second use of the SAME (now-revoked) token: signals theft.
    await expect(useCase.execute({ refreshToken: refreshTokenValue })).rejects.toThrow(
      RefreshTokenReuseError,
    );

    const all = await refreshTokenRepository.all();
    const familyRecords = all.filter((record) => record.familyId === 'family-1');
    expect(familyRecords.every((record) => record.revokedAt !== null)).toBe(true);
  });
});
