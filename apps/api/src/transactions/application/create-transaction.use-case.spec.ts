import { Account } from '../../accounts/domain/account.entity';
import { InMemoryAccountRepository } from '../../accounts/application/test-fakes/in-memory-account.repository';
import { Category } from '../../categories/domain/category.entity';
import { InMemoryCategoryRepository } from '../../categories/application/test-fakes/in-memory-category.repository';
import { TransactionCategoryKindMismatchError } from '../domain/errors';
import { AccountNotFoundError } from '../../accounts/domain/errors';
import { CategoryNotFoundError } from '../../categories/domain/errors';
import { InMemoryTransactionRepository } from './test-fakes/in-memory-transaction.repository';
import { CreateTransactionUseCase } from './create-transaction.use-case';

describe('CreateTransactionUseCase', () => {
  function setup(): {
    useCase: CreateTransactionUseCase;
    transactionRepository: InMemoryTransactionRepository;
    accountRepository: InMemoryAccountRepository;
    categoryRepository: InMemoryCategoryRepository;
  } {
    const transactionRepository = new InMemoryTransactionRepository();
    const accountRepository = new InMemoryAccountRepository();
    const categoryRepository = new InMemoryCategoryRepository();
    const useCase = new CreateTransactionUseCase(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );
    return { useCase, transactionRepository, accountRepository, categoryRepository };
  }

  async function seedOwnedAccountAndCategory(
    accountRepository: InMemoryAccountRepository,
    categoryRepository: InMemoryCategoryRepository,
    ownerId: string,
  ): Promise<{ accountId: string; categoryId: string }> {
    const account = Account.create({ id: `acc-${ownerId}`, userId: ownerId, name: 'Checking', type: 'bank' });
    const category = Category.create({
      id: `cat-${ownerId}`,
      userId: ownerId,
      name: 'Groceries',
      kind: 'expense',
    });
    await accountRepository.save(account);
    await categoryRepository.save(category);
    return { accountId: account.id, categoryId: category.id };
  }

  it('creates a transaction owned by the requesting user, linked to their own account and category', async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    const { accountId, categoryId } = await seedOwnedAccountAndCategory(
      accountRepository,
      categoryRepository,
      'user-1',
    );

    const result = await useCase.execute({
      ownerId: 'user-1',
      accountId,
      categoryId,
      type: 'expense',
      amountCents: 3000,
      occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      note: 'Weekly shop',
    });

    expect(result.accountId).toBe(accountId);
    expect(result.categoryId).toBe(categoryId);
    expect(result.type).toBe('expense');
    expect(result.amountCents).toBe(3000);
    expect(result.note).toBe('Weekly shop');
    expect(transactionRepository.size).toBe(1);
  });

  it("rejects creation when the account belongs to a different owner (does not persist)", async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    const { categoryId } = await seedOwnedAccountAndCategory(accountRepository, categoryRepository, 'user-1');
    const foreignAccount = Account.create({ id: 'acc-user-2', userId: 'user-2', name: 'B Account', type: 'bank' });
    await accountRepository.save(foreignAccount);

    await expect(
      useCase.execute({
        ownerId: 'user-1',
        accountId: foreignAccount.id,
        categoryId,
        type: 'expense',
        amountCents: 1000,
        occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow(AccountNotFoundError);
    expect(transactionRepository.size).toBe(0);
  });

  it("rejects creation when the category belongs to a different owner (does not persist)", async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    const { accountId } = await seedOwnedAccountAndCategory(accountRepository, categoryRepository, 'user-1');
    const foreignCategory = Category.create({
      id: 'cat-user-2',
      userId: 'user-2',
      name: 'B Category',
      kind: 'expense',
    });
    await categoryRepository.save(foreignCategory);

    await expect(
      useCase.execute({
        ownerId: 'user-1',
        accountId,
        categoryId: foreignCategory.id,
        type: 'expense',
        amountCents: 1000,
        occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow(CategoryNotFoundError);
    expect(transactionRepository.size).toBe(0);
  });

  it('rejects creation when the transaction type does not match the category kind', async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    const { accountId, categoryId } = await seedOwnedAccountAndCategory(
      accountRepository,
      categoryRepository,
      'user-1',
    );

    await expect(
      useCase.execute({
        ownerId: 'user-1',
        accountId,
        categoryId,
        type: 'income',
        amountCents: 1000,
        occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow(TransactionCategoryKindMismatchError);
    expect(transactionRepository.size).toBe(0);
  });

  it('rejects a zero or negative amount without persisting', async () => {
    const { useCase, transactionRepository, accountRepository, categoryRepository } = setup();
    const { accountId, categoryId } = await seedOwnedAccountAndCategory(
      accountRepository,
      categoryRepository,
      'user-1',
    );

    await expect(
      useCase.execute({
        ownerId: 'user-1',
        accountId,
        categoryId,
        type: 'expense',
        amountCents: 0,
        occurredOn: new Date('2026-07-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('Transaction amount must be a positive number of cents');
    expect(transactionRepository.size).toBe(0);
  });
});
