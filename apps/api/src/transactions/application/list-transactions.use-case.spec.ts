import { Money } from '@finanzas/shared';
import { Transaction } from '../domain/transaction.entity';
import { InMemoryTransactionRepository } from './test-fakes/in-memory-transaction.repository';
import { ListTransactionsUseCase } from './list-transactions.use-case';

describe('ListTransactionsUseCase', () => {
  function setup(): { useCase: ListTransactionsUseCase; repository: InMemoryTransactionRepository } {
    const repository = new InMemoryTransactionRepository();
    const useCase = new ListTransactionsUseCase(repository);
    return { useCase, repository };
  }

  it("lists only the authenticated user's own transactions", async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Transaction.create({
        id: 'tx-a',
        userId: 'user-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: Money.fromCents(100),
        occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      }),
    );
    await repository.save(
      Transaction.create({
        id: 'tx-b',
        userId: 'user-2',
        accountId: 'acc-2',
        categoryId: 'cat-2',
        type: 'expense',
        amount: Money.fromCents(200),
        occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      }),
    );

    const results = await useCase.execute({ ownerId: 'user-1' });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('tx-a');
  });

  it('returns an empty list, not an error, when no transactions match', async () => {
    const { useCase } = setup();

    const results = await useCase.execute({ ownerId: 'user-1' });

    expect(results).toEqual([]);
  });

  it('filters by accountId, categoryId, and date range when provided', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Transaction.create({
        id: 'tx-jan',
        userId: 'user-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: Money.fromCents(100),
        occurredOn: new Date('2026-01-15T00:00:00.000Z'),
      }),
    );
    await repository.save(
      Transaction.create({
        id: 'tx-feb-other-account',
        userId: 'user-1',
        accountId: 'acc-2',
        categoryId: 'cat-1',
        type: 'expense',
        amount: Money.fromCents(150),
        occurredOn: new Date('2026-02-15T00:00:00.000Z'),
      }),
    );
    await repository.save(
      Transaction.create({
        id: 'tx-feb-matching',
        userId: 'user-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: Money.fromCents(300),
        occurredOn: new Date('2026-02-20T00:00:00.000Z'),
      }),
    );

    const results = await useCase.execute({
      ownerId: 'user-1',
      accountId: 'acc-1',
      categoryId: 'cat-1',
      fromDate: new Date('2026-02-01T00:00:00.000Z'),
      toDate: new Date('2026-02-28T23:59:59.999Z'),
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('tx-feb-matching');
  });
});
