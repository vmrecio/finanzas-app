import { DuplicateEmailError } from '../domain/errors';
import { FakePasswordHasher } from './test-fakes/fake-password-hasher';
import { InMemoryUserRepository } from './test-fakes/in-memory-user.repository';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  function setup(): { useCase: RegisterUseCase; repository: InMemoryUserRepository } {
    const repository = new InMemoryUserRepository();
    const useCase = new RegisterUseCase(repository, new FakePasswordHasher());
    return { useCase, repository };
  }

  it('creates an account and stores only a password hash, never the plaintext', async () => {
    const { useCase, repository } = setup();

    const result = await useCase.execute({ email: 'new@example.com', password: 'hunter22' });

    expect(result.email).toBe('new@example.com');
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);

    const stored = await repository.findByEmail('new@example.com');
    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).not.toBe('hunter22');
    expect(stored?.passwordHash).toBe('$fake$hunter22');
  });

  it('rejects registration when an account already exists with that email, without altering it', async () => {
    const { useCase, repository } = setup();
    await useCase.execute({ email: 'dup@example.com', password: 'first-password' });

    await expect(
      useCase.execute({ email: 'dup@example.com', password: 'second-password' }),
    ).rejects.toThrow(DuplicateEmailError);

    // the existing account must be untouched — still the first password hash
    const stored = await repository.findByEmail('dup@example.com');
    expect(stored?.passwordHash).toBe('$fake$first-password');
    expect(repository.size).toBe(1);
  });
});
