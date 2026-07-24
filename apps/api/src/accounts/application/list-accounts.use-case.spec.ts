import { Account } from '../domain/account.entity';
import { FakeAccountBalance } from './test-fakes/fake-account-balance';
import { InMemoryAccountRepository } from './test-fakes/in-memory-account.repository';
import { ListAccountsUseCase } from './list-accounts.use-case';

describe('ListAccountsUseCase', () => {
  function setup(): {
    useCase: ListAccountsUseCase;
    repository: InMemoryAccountRepository;
    accountBalance: FakeAccountBalance;
  } {
    const repository = new InMemoryAccountRepository();
    const accountBalance = new FakeAccountBalance();
    const useCase = new ListAccountsUseCase(repository, accountBalance);
    return { useCase, repository, accountBalance };
  }

  it('lists only accounts owned by the requesting user (ownership isolation)', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Checking', type: 'bank' }),
    );
    await repository.save(
      Account.create({ id: 'a2', userId: 'user-1', name: 'Savings', type: 'bank' }),
    );
    await repository.save(
      Account.create({ id: 'b1', userId: 'user-2', name: 'Other Owner Account', type: 'cash' }),
    );

    const result = await useCase.execute({ ownerId: 'user-1' });

    expect(result).toHaveLength(2);
    expect(result.map((a) => a.name).sort()).toEqual(['Checking', 'Savings']);
    expect(result.some((a) => a.name === 'Other Owner Account')).toBe(false);
  });

  it('returns an empty list when the owner has no accounts', async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ ownerId: 'nobody' });

    expect(result).toEqual([]);
  });

  it('includes each account\'s ledger-derived balance', async () => {
    const { useCase, repository, accountBalance } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Checking', type: 'bank' }),
    );
    await repository.save(
      Account.create({ id: 'a2', userId: 'user-1', name: 'Savings', type: 'bank' }),
    );
    accountBalance.setBalance('a1', 5000);
    accountBalance.setBalance('a2', -1200);

    const result = await useCase.execute({ ownerId: 'user-1' });

    expect(result.find((a) => a.id === 'a1')?.balanceCents).toBe(5000);
    expect(result.find((a) => a.id === 'a2')?.balanceCents).toBe(-1200);
  });
});
