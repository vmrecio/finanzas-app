import { InvalidCredentialsError } from '../domain/errors';
import { User } from '../domain/user.entity';
import { LoginUseCase } from './login.use-case';
import { FakePasswordHasher } from './test-fakes/fake-password-hasher';
import { FakeTokenService } from './test-fakes/fake-token-service';
import { InMemoryRefreshTokenRepository } from './test-fakes/in-memory-refresh-token.repository';
import { InMemoryUserRepository } from './test-fakes/in-memory-user.repository';

describe('LoginUseCase', () => {
  async function setup(): Promise<{
    useCase: LoginUseCase;
    userRepository: InMemoryUserRepository;
    refreshTokenRepository: InMemoryRefreshTokenRepository;
    tokenService: FakeTokenService;
    userId: string;
  }> {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const tokenService = new FakeTokenService();
    const passwordHasher = new FakePasswordHasher();

    const passwordHash = await passwordHasher.hash('correct-password');
    const user = User.register({ id: 'user-1', email: 'jane@example.com', passwordHash });
    await userRepository.save(user);

    const useCase = new LoginUseCase(
      userRepository,
      passwordHasher,
      tokenService,
      refreshTokenRepository,
    );

    return { useCase, userRepository, refreshTokenRepository, tokenService, userId: user.id };
  }

  it('issues an access token and a refresh token on successful login', async () => {
    const { useCase, refreshTokenRepository, tokenService, userId } = await setup();

    const result = await useCase.execute({ email: 'jane@example.com', password: 'correct-password' });

    expect(result.accessToken).toBe(`fake-access-token.${userId}`);
    expect(tokenService.signedPayloads).toEqual([{ sub: userId }]);

    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken.length).toBeGreaterThan(0);
    expect(refreshTokenRepository.size).toBe(1);
  });

  it('persists the refresh token hashed, never the plaintext value returned to the caller', async () => {
    const { useCase, refreshTokenRepository, userId } = await setup();

    const result = await useCase.execute({ email: 'jane@example.com', password: 'correct-password' });

    const [stored] = await refreshTokenRepository.all();
    expect(stored?.userId).toBe(userId);
    expect(stored?.tokenHash).not.toBe(result.refreshToken);
    expect(stored?.revokedAt).toBeNull();
  });

  it('rejects login with a generic error when the email does not exist', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ email: 'unknown@example.com', password: 'whatever' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects login with the same generic error when the password is wrong (no field disclosure)', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ email: 'jane@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
