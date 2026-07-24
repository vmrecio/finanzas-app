import { InMemoryAccountRepository } from './test-fakes/in-memory-account.repository';
import { CreateAccountUseCase } from './create-account.use-case';

describe('CreateAccountUseCase', () => {
  function setup(): { useCase: CreateAccountUseCase; repository: InMemoryAccountRepository } {
    const repository = new InMemoryAccountRepository();
    const useCase = new CreateAccountUseCase(repository);
    return { useCase, repository };
  }

  it('creates an account owned by the requesting user', async () => {
    const { useCase, repository } = setup();

    const result = await useCase.execute({ ownerId: 'user-1', name: 'Main Checking', type: 'bank' });

    expect(result.name).toBe('Main Checking');
    expect(result.type).toBe('bank');
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);

    const stored = await repository.findByIdForOwner(result.id, 'user-1');
    expect(stored?.name).toBe('Main Checking');
    expect(stored?.userId).toBe('user-1');
  });

  it('creates a second account of a different type for a different owner independently', async () => {
    const { useCase, repository } = setup();

    const first = await useCase.execute({ ownerId: 'user-1', name: 'Wallet', type: 'cash' });
    const second = await useCase.execute({ ownerId: 'user-2', name: 'Credit', type: 'credit_card' });

    expect(first.id).not.toBe(second.id);
    expect(repository.size).toBe(2);
    expect(await repository.findByIdForOwner(second.id, 'user-1')).toBeNull();
    expect(await repository.findByIdForOwner(second.id, 'user-2')).not.toBeNull();
  });
});
