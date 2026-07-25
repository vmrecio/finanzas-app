import { Money } from '@finanzas/shared';
import { Transaction } from '../domain/transaction.entity';
import { TransactionNotFoundError } from '../domain/errors';
import { InMemoryTransactionRepository } from './test-fakes/in-memory-transaction.repository';
import { GetTransactionUseCase } from './get-transaction.use-case';

describe('GetTransactionUseCase', () => {
  function setup(): { useCase: GetTransactionUseCase; repository: InMemoryTransactionRepository } {
    const repository = new InMemoryTransactionRepository();
    const useCase = new GetTransactionUseCase(repository);
    return { useCase, repository };
  }

  it("returns the authenticated user's own transaction", async () => {
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

    const result = await useCase.execute({ id: 'tx-1', ownerId: 'user-1' });

    expect(result.id).toBe('tx-1');
    expect(result.amountCents).toBe(500);
  });

  it('throws TransactionNotFoundError when the id does not exist at all', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ id: 'missing', ownerId: 'user-1' })).rejects.toThrow(
      TransactionNotFoundError,
    );
  });

  it('throws TransactionNotFoundError when the transaction is owned by a different user', async () => {
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
  });
});
