import { LogoutUseCase } from './logout.use-case';
import { hashRefreshTokenValue } from './refresh-token-crypto';
import { InMemoryRefreshTokenRepository } from './test-fakes/in-memory-refresh-token.repository';

describe('LogoutUseCase', () => {
  it('revokes the token family for the presented refresh token', async () => {
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const refreshTokenValue = 'raw-refresh-token';
    await refreshTokenRepository.save({
      id: 'token-1',
      userId: 'user-1',
      familyId: 'family-1',
      tokenHash: hashRefreshTokenValue(refreshTokenValue),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
      createdAt: new Date(),
    });
    const useCase = new LogoutUseCase(refreshTokenRepository);

    await useCase.execute({ refreshToken: refreshTokenValue });

    const [record] = await refreshTokenRepository.all();
    expect(record?.revokedAt).not.toBeNull();
  });

  it('is a no-op when the refresh token is unknown (idempotent, no error thrown)', async () => {
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const useCase = new LogoutUseCase(refreshTokenRepository);

    await expect(useCase.execute({ refreshToken: 'never-issued' })).resolves.toBeUndefined();
    expect(refreshTokenRepository.size).toBe(0);
  });
});
