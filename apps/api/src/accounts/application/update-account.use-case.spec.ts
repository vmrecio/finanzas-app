import { Account } from '../domain/account.entity';
import { AccountNotFoundError } from '../domain/errors';
import { InMemoryAccountRepository } from './test-fakes/in-memory-account.repository';
import { UpdateAccountUseCase } from './update-account.use-case';

describe('UpdateAccountUseCase', () => {
  function setup(): { useCase: UpdateAccountUseCase; repository: InMemoryAccountRepository } {
    const repository = new InMemoryAccountRepository();
    const useCase = new UpdateAccountUseCase(repository);
    return { useCase, repository };
  }

  it('updates the name of an account owned by the requesting user', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Old Name', type: 'bank' }),
    );

    const result = await useCase.execute({ id: 'a1', ownerId: 'user-1', name: 'New Name' });

    expect(result.name).toBe('New Name');
    expect(result.type).toBe('bank');
    const stored = await repository.findByIdForOwner('a1', 'user-1');
    expect(stored?.name).toBe('New Name');
  });

  it('updates the type of an account owned by the requesting user', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Wallet', type: 'cash' }),
    );

    const result = await useCase.execute({ id: 'a1', ownerId: 'user-1', type: 'credit_card' });

    expect(result.type).toBe('credit_card');
    expect(result.name).toBe('Wallet');
  });

  it('throws AccountNotFoundError when the account does not exist', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ id: 'missing', ownerId: 'user-1', name: 'Whatever' }),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('throws AccountNotFoundError and leaves the account untouched when owned by a different owner', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-2', name: 'Original', type: 'bank' }),
    );

    await expect(
      useCase.execute({ id: 'a1', ownerId: 'user-1', name: 'Hijacked' }),
    ).rejects.toThrow(AccountNotFoundError);

    const stored = await repository.findByIdForOwner('a1', 'user-2');
    expect(stored?.name).toBe('Original');
  });
});
