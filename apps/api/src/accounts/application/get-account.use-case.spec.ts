import { Account } from '../domain/account.entity';
import { AccountNotFoundError } from '../domain/errors';
import { FakeAccountBalance } from './test-fakes/fake-account-balance';
import { InMemoryAccountRepository } from './test-fakes/in-memory-account.repository';
import { GetAccountUseCase } from './get-account.use-case';

describe('GetAccountUseCase', () => {
  function setup(): {
    useCase: GetAccountUseCase;
    repository: InMemoryAccountRepository;
    accountBalance: FakeAccountBalance;
  } {
    const repository = new InMemoryAccountRepository();
    const accountBalance = new FakeAccountBalance();
    const useCase = new GetAccountUseCase(repository, accountBalance);
    return { useCase, repository, accountBalance };
  }

  it('returns an account owned by the requesting user', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Checking', type: 'bank' }),
    );

    const result = await useCase.execute({ id: 'a1', ownerId: 'user-1' });

    expect(result.name).toBe('Checking');
  });

  it('includes the ledger-derived balance from the AccountBalancePort', async () => {
    const { useCase, repository, accountBalance } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Checking', type: 'bank' }),
    );
    accountBalance.setBalance('a1', 7000);

    const result = await useCase.execute({ id: 'a1', ownerId: 'user-1' });

    expect(result.balanceCents).toBe(7000);
  });

  it('defaults balanceCents to zero when the account has no transactions', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Checking', type: 'bank' }),
    );

    const result = await useCase.execute({ id: 'a1', ownerId: 'user-1' });

    expect(result.balanceCents).toBe(0);
  });

  it('throws AccountNotFoundError when the account does not exist', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ id: 'missing', ownerId: 'user-1' })).rejects.toThrow(
      AccountNotFoundError,
    );
  });

  it('throws AccountNotFoundError (never exposes) when the account belongs to a different owner', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-2', name: "Owner B's account", type: 'bank' }),
    );

    await expect(useCase.execute({ id: 'a1', ownerId: 'user-1' })).rejects.toThrow(
      AccountNotFoundError,
    );
  });
});
