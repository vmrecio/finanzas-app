import { Category } from '../domain/category.entity';
import {
  CategoryHasBudgetsError,
  CategoryHasTransactionsError,
  CategoryNotFoundError,
} from '../domain/errors';
import { FakeBudgetReference } from './test-fakes/fake-budget-reference';
import { FakeTransactionReference } from './test-fakes/fake-transaction-reference';
import { InMemoryCategoryRepository } from './test-fakes/in-memory-category.repository';
import { DeleteCategoryUseCase } from './delete-category.use-case';

describe('DeleteCategoryUseCase', () => {
  function setup(): {
    useCase: DeleteCategoryUseCase;
    repository: InMemoryCategoryRepository;
    transactionReference: FakeTransactionReference;
    budgetReference: FakeBudgetReference;
  } {
    const repository = new InMemoryCategoryRepository();
    const transactionReference = new FakeTransactionReference();
    const budgetReference = new FakeBudgetReference();
    const useCase = new DeleteCategoryUseCase(repository, transactionReference, budgetReference);
    return { useCase, repository, transactionReference, budgetReference };
  }

  it('deletes a category owned by the requesting user when it has zero transactions and zero budgets', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-1', name: 'Groceries', kind: 'expense' }),
    );

    await useCase.execute({ id: 'c1', ownerId: 'user-1' });

    expect(await repository.findByIdForOwner('c1', 'user-1')).toBeNull();
  });

  it('rejects deletion and preserves the category when referenced by one or more transactions', async () => {
    const { useCase, repository, transactionReference } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-1', name: 'Groceries', kind: 'expense' }),
    );
    transactionReference.markAsReferenced('c1');

    await expect(useCase.execute({ id: 'c1', ownerId: 'user-1' })).rejects.toThrow(
      CategoryHasTransactionsError,
    );
    expect(await repository.findByIdForOwner('c1', 'user-1')).not.toBeNull();
  });

  it('rejects deletion and preserves the category when referenced by a budget but zero transactions', async () => {
    const { useCase, repository, budgetReference } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-1', name: 'Groceries', kind: 'expense' }),
    );
    budgetReference.markAsReferenced('c1');

    await expect(useCase.execute({ id: 'c1', ownerId: 'user-1' })).rejects.toThrow(
      CategoryHasBudgetsError,
    );
    expect(await repository.findByIdForOwner('c1', 'user-1')).not.toBeNull();
  });

  it('throws CategoryNotFoundError when the category does not exist', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ id: 'missing', ownerId: 'user-1' })).rejects.toThrow(
      CategoryNotFoundError,
    );
  });

  it('throws CategoryNotFoundError and leaves the category untouched when owned by a different owner', async () => {
    const { useCase, repository } = setup();
    await repository.save(
      Category.create({ id: 'c1', userId: 'user-2', name: "Owner B's category", kind: 'expense' }),
    );

    await expect(useCase.execute({ id: 'c1', ownerId: 'user-1' })).rejects.toThrow(
      CategoryNotFoundError,
    );
    expect(await repository.findByIdForOwner('c1', 'user-2')).not.toBeNull();
  });
});
