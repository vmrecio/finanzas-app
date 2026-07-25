import { Money } from '@finanzas/shared';
import { Account } from '../../accounts/domain/account.entity';
import { InMemoryAccountRepository } from '../../accounts/application/test-fakes/in-memory-account.repository';
import { AccountNotFoundError } from '../../accounts/domain/errors';
import { Category } from '../../categories/domain/category.entity';
import { InMemoryCategoryRepository } from '../../categories/application/test-fakes/in-memory-category.repository';
import { CategoryNotFoundError } from '../../categories/domain/errors';
import { Transaction } from '../domain/transaction.entity';
import { TransactionCategoryKindMismatchError, TransactionNotFoundError } from '../domain/errors';
import { InMemoryTransactionRepository } from './test-fakes/in-memory-transaction.repository';
import { UpdateTransactionUseCase } from './update-transaction.use-case';

describe('UpdateTransactionUseCase', () => {
  function setup(): {
    useCase: UpdateTransactionUseCase;
    transactionRepository: InMemoryTransactionRepository;
    accountRepository: InMemoryAccountRepository;
    categoryRepository: InMemoryCategoryRepository;
  } {
    const transactionRepository = new InMemoryTransactionRepository();
    const accountRepository = new InMemoryAccountRepository();
    const categoryRepository = new InMemoryCategoryRepository();
    const useCase = new UpdateTransactionUseCase(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );
    return { useCase, transactionRepository, accountRepository, categoryRepository };
  }

  async function seedExisting(
    transactionRepository: InMemoryTransactionRepository,
    accountRepository: InMemoryAccountRepository,
    categoryRepository: InMemoryCategoryRepository,
  ): Promise<void> {
    await accountRepository.save(
      Account.create({ id: 'acc-1', userId: 'user-1', name: 'Checking', type: 'bank' }),
    );
    await categoryRepository.save(
      Category.create({ id: 'cat-1', userId: 'user-1', name: 'Groceries', kind: 'expense' }),
    );
    await transactionRepository.save(
      Transaction.create({
        id: 'tx-1',
        userId: 'user-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: Money.fromCents(3000),
        occurredOn: new Date('2026-07-01T00:00:00.000Z'),
        note: 'Original',
      }),
    );
  }

  it('updates the amount of an existing transaction owned by the requester', async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    await seedExisting(transactionRepository, accountRepository, categoryRepository);

    const result = await useCase.execute({ id: 'tx-1', ownerId: 'user-1', amountCents: 4500 });

    expect(result.amountCents).toBe(4500);
    expect(result.note).toBe('Original');
  });

  it('throws TransactionNotFoundError when the transaction does not exist', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ id: 'missing', ownerId: 'user-1', amountCents: 100 }),
    ).rejects.toThrow(TransactionNotFoundError);
  });

  it('throws TransactionNotFoundError and leaves it untouched when owned by a different user', async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    await seedExisting(transactionRepository, accountRepository, categoryRepository);

    await expect(
      useCase.execute({ id: 'tx-1', ownerId: 'user-2', amountCents: 999 }),
    ).rejects.toThrow(TransactionNotFoundError);
    expect((await transactionRepository.findByIdForOwner('tx-1', 'user-1'))?.amount.amountCents).toBe(
      3000,
    );
  });

  it("rejects repointing the transaction to another owner's account", async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    await seedExisting(transactionRepository, accountRepository, categoryRepository);
    await accountRepository.save(
      Account.create({ id: 'acc-foreign', userId: 'user-2', name: 'Foreign', type: 'bank' }),
    );

    await expect(
      useCase.execute({ id: 'tx-1', ownerId: 'user-1', accountId: 'acc-foreign' }),
    ).rejects.toThrow(AccountNotFoundError);
    expect((await transactionRepository.findByIdForOwner('tx-1', 'user-1'))?.accountId).toBe('acc-1');
  });

  it("rejects repointing the transaction to another owner's category", async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    await seedExisting(transactionRepository, accountRepository, categoryRepository);
    await categoryRepository.save(
      Category.create({ id: 'cat-foreign', userId: 'user-2', name: 'Foreign', kind: 'expense' }),
    );

    await expect(
      useCase.execute({ id: 'tx-1', ownerId: 'user-1', categoryId: 'cat-foreign' }),
    ).rejects.toThrow(CategoryNotFoundError);
    expect((await transactionRepository.findByIdForOwner('tx-1', 'user-1'))?.categoryId).toBe('cat-1');
  });

  it('rejects changing the type to no longer match the (unchanged) category kind', async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    await seedExisting(transactionRepository, accountRepository, categoryRepository);

    await expect(
      useCase.execute({ id: 'tx-1', ownerId: 'user-1', type: 'income' }),
    ).rejects.toThrow(TransactionCategoryKindMismatchError);
  });
});
