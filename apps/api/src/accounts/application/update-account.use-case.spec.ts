import { Account } from '../domain/account.entity';
import { AccountNotFoundError } from '../domain/errors';
import { FakeAccountBalance } from './test-fakes/fake-account-balance';
import { InMemoryAccountRepository } from './test-fakes/in-memory-account.repository';
import { UpdateAccountUseCase } from './update-account.use-case';

describe('UpdateAccountUseCase', () => {
  function setup(): {
    useCase: UpdateAccountUseCase;
    repository: InMemoryAccountRepository;
    accountBalance: FakeAccountBalance;
  } {
    const repository = new InMemoryAccountRepository();
    const accountBalance = new FakeAccountBalance();
    const useCase = new UpdateAccountUseCase(repository, accountBalance);
    return { useCase, repository, accountBalance };
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

  it('reports the current ledger-derived balance, unaffected by a name/type update', async () => {
    const { useCase, repository, accountBalance } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Old Name', type: 'bank' }),
    );
    accountBalance.setBalance('a1', 2500);

    const result = await useCase.execute({ id: 'a1', ownerId: 'user-1', name: 'New Name' });

    expect(result.balanceCents).toBe(2500);
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
