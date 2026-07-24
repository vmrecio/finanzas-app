import { Account } from '../domain/account.entity';
import { AccountHasTransactionsError, AccountNotFoundError } from '../domain/errors';
import { FakeTransactionExistence } from './test-fakes/fake-transaction-existence';
import { InMemoryAccountRepository } from './test-fakes/in-memory-account.repository';
import { DeleteAccountUseCase } from './delete-account.use-case';

describe('DeleteAccountUseCase', () => {
  function setup(): {
    useCase: DeleteAccountUseCase;
    repository: InMemoryAccountRepository;
    transactionExistence: FakeTransactionExistence;
  } {
    const repository = new InMemoryAccountRepository();
    const transactionExistence = new FakeTransactionExistence();
    const useCase = new DeleteAccountUseCase(repository, transactionExistence);
    return { useCase, repository, transactionExistence };
  }

  it('deletes an account owned by the requesting user when it has no transactions', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Checking', type: 'bank' }),
    );

    await useCase.execute({ id: 'a1', ownerId: 'user-1' });

    expect(await repository.findByIdForOwner('a1', 'user-1')).toBeNull();
  });

  it('rejects deletion and preserves the account when it has existing transactions', async () => {
    const { useCase, repository, transactionExistence } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-1', name: 'Checking', type: 'bank' }),
    );
    transactionExistence.markAsHavingTransactions('a1');

    await expect(useCase.execute({ id: 'a1', ownerId: 'user-1' })).rejects.toThrow(
      AccountHasTransactionsError,
    );
    expect(await repository.findByIdForOwner('a1', 'user-1')).not.toBeNull();
  });

  it('throws AccountNotFoundError when the account does not exist', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ id: 'missing', ownerId: 'user-1' })).rejects.toThrow(
      AccountNotFoundError,
    );
  });

  it('throws AccountNotFoundError and leaves the account untouched when owned by a different owner', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Account.create({ id: 'a1', userId: 'user-2', name: "Owner B's account", type: 'bank' }),
    );

    await expect(useCase.execute({ id: 'a1', ownerId: 'user-1' })).rejects.toThrow(
      AccountNotFoundError,
    );
    expect(await repository.findByIdForOwner('a1', 'user-2')).not.toBeNull();
  });
});
