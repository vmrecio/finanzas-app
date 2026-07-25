import { Money } from '@finanzas/shared';
import { Transaction } from '../domain/transaction.entity';
import { TransactionNotFoundError } from '../domain/errors';
import { InMemoryTransactionRepository } from './test-fakes/in-memory-transaction.repository';
import { DeleteTransactionUseCase } from './delete-transaction.use-case';

describe('DeleteTransactionUseCase', () => {
  function setup(): { useCase: DeleteTransactionUseCase; repository: InMemoryTransactionRepository } {
    const repository = new InMemoryTransactionRepository();
    const useCase = new DeleteTransactionUseCase(repository);
    return { useCase, repository };
  }

  it("deletes the authenticated user's own transaction", async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Transaction.create({
        id: 'tx-1',
        userId: 'user-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: Money.fromCents(500),
        occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      }),
    );

    await useCase.execute({ id: 'tx-1', ownerId: 'user-1' });

    expect(await repository.findByIdForOwner('tx-1', 'user-1')).toBeNull();
  });

  it('throws TransactionNotFoundError when the transaction does not exist', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ id: 'missing', ownerId: 'user-1' })).rejects.toThrow(
      TransactionNotFoundError,
    );
  });

  it('throws TransactionNotFoundError and leaves it untouched when owned by a different user', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Transaction.create({
        id: 'tx-2',
        userId: 'user-2',
        accountId: 'acc-2',
        categoryId: 'cat-2',
        type: 'income',
        amount: Money.fromCents(700),
        occurredOn: new Date('2026-07-02T00:00:00.000Z'),
      }),
    );

    await expect(useCase.execute({ id: 'tx-2', ownerId: 'user-1' })).rejects.toThrow(
      TransactionNotFoundError,
    );
    expect(await repository.findByIdForOwner('tx-2', 'user-2')).not.toBeNull();
  });
});
