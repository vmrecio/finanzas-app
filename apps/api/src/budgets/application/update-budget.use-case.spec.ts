import { Money } from '@finanzas/shared';
import { Category } from '../../categories/domain/category.entity';
import { CategoryNotFoundError } from '../../categories/domain/errors';
import { InMemoryCategoryRepository } from '../../categories/application/test-fakes/in-memory-category.repository';
import { Budget } from '../domain/budget.entity';
import { BudgetAlreadyExistsError, BudgetCategoryKindMismatchError, BudgetNotFoundError } from '../domain/errors';
import { FakeBudgetActuals } from './test-fakes/fake-budget-actuals';
import { InMemoryBudgetRepository } from './test-fakes/in-memory-budget.repository';
import { UpdateBudgetUseCase } from './update-budget.use-case';

describe('UpdateBudgetUseCase', () => {
  function setup(): {
    useCase: UpdateBudgetUseCase;
    budgetRepository: InMemoryBudgetRepository;
    categoryRepository: InMemoryCategoryRepository;
    budgetActuals: FakeBudgetActuals;
  } {
    const budgetRepository = new InMemoryBudgetRepository();
    const categoryRepository = new InMemoryCategoryRepository();
    const budgetActuals = new FakeBudgetActuals();
    const useCase = new UpdateBudgetUseCase(budgetRepository, categoryRepository, budgetActuals);
    return { useCase, budgetRepository, categoryRepository, budgetActuals };
  }

  it('updates the limit of an existing budget owned by the requesting user', async () => {
    const { useCase, budgetRepository } = setup();
    await budgetRepository.save(
      Budget.create({
        id: 'budget-1',
        userId: 'user-1',
        categoryId: 'cat-1',
        periodMonth: '2026-07',
        limit: Money.fromCents(50000),
      }),
    );

    const result = await useCase.execute({ id: 'budget-1', ownerId: 'user-1', limitCents: 70000 });

    expect(result.limitCents).toBe(70000);
  });

  it('throws BudgetNotFoundError when the budget does not exist', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ id: 'missing', ownerId: 'user-1', limitCents: 1000 }),
    ).rejects.toThrow(BudgetNotFoundError);
  });

  it("throws BudgetNotFoundError and leaves the budget untouched when it belongs to a different owner", async () => {
    const { useCase, budgetRepository } = setup();
    await budgetRepository.save(
      Budget.create({
        id: 'budget-2',
        userId: 'user-2',
        categoryId: 'cat-1',
        periodMonth: '2026-07',
        limit: Money.fromCents(50000),
      }),
    );

    await expect(
      useCase.execute({ id: 'budget-2', ownerId: 'user-1', limitCents: 1000 }),
    ).rejects.toThrow(BudgetNotFoundError);
    const untouched = await budgetRepository.findByIdForOwner('budget-2', 'user-2');
    expect(untouched?.limit.amountCents).toBe(50000);
  });

  it('rejects repointing to a foreign category', async () => {
    const { useCase, budgetRepository, categoryRepository } = setup();
    await budgetRepository.save(
      Budget.create({
        id: 'budget-3',
        userId: 'user-1',
        categoryId: 'cat-1',
        periodMonth: '2026-07',
        limit: Money.fromCents(50000),
      }),
    );
    const foreignCategory = Category.create({
      id: 'cat-foreign',
      userId: 'user-2',
      name: "B's category",
      kind: 'expense',
    });
    await categoryRepository.save(foreignCategory);

    await expect(
      useCase.execute({ id: 'budget-3', ownerId: 'user-1', categoryId: foreignCategory.id }),
    ).rejects.toThrow(CategoryNotFoundError);
  });

  it('rejects repointing to an income category', async () => {
    const { useCase, budgetRepository, categoryRepository } = setup();
    await budgetRepository.save(
      Budget.create({
        id: 'budget-4',
        userId: 'user-1',
        categoryId: 'cat-1',
        periodMonth: '2026-07',
        limit: Money.fromCents(50000),
      }),
    );
    const incomeCategory = Category.create({
      id: 'cat-income',
      userId: 'user-1',
      name: 'Salary',
      kind: 'income',
    });
    await categoryRepository.save(incomeCategory);

    await expect(
      useCase.execute({ id: 'budget-4', ownerId: 'user-1', categoryId: incomeCategory.id }),
    ).rejects.toThrow(BudgetCategoryKindMismatchError);
  });

  it('rejects changing the month to one that already has a budget for the same category', async () => {
    const { useCase, budgetRepository } = setup();
    await budgetRepository.save(
      Budget.create({
        id: 'budget-5',
        userId: 'user-1',
        categoryId: 'cat-1',
        periodMonth: '2026-07',
        limit: Money.fromCents(50000),
      }),
    );
    await budgetRepository.save(
      Budget.create({
        id: 'budget-6',
        userId: 'user-1',
        categoryId: 'cat-1',
        periodMonth: '2026-08',
        limit: Money.fromCents(30000),
      }),
    );

    await expect(
      useCase.execute({ id: 'budget-6', ownerId: 'user-1', periodMonth: '2026-07' }),
    ).rejects.toThrow(BudgetAlreadyExistsError);
  });
});
