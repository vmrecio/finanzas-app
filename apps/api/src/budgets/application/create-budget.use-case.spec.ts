import { Category } from '../../categories/domain/category.entity';
import { CategoryNotFoundError } from '../../categories/domain/errors';
import { InMemoryCategoryRepository } from '../../categories/application/test-fakes/in-memory-category.repository';
import { BudgetAlreadyExistsError } from '../domain/errors';
import { BudgetCategoryKindMismatchError } from '../domain/errors';
import { FakeBudgetActuals } from './test-fakes/fake-budget-actuals';
import { InMemoryBudgetRepository } from './test-fakes/in-memory-budget.repository';
import { CreateBudgetUseCase } from './create-budget.use-case';

describe('CreateBudgetUseCase', () => {
  function setup(): {
    useCase: CreateBudgetUseCase;
    budgetRepository: InMemoryBudgetRepository;
    categoryRepository: InMemoryCategoryRepository;
    budgetActuals: FakeBudgetActuals;
  } {
    const budgetRepository = new InMemoryBudgetRepository();
    const categoryRepository = new InMemoryCategoryRepository();
    const budgetActuals = new FakeBudgetActuals();
    const useCase = new CreateBudgetUseCase(budgetRepository, categoryRepository, budgetActuals);
    return { useCase, budgetRepository, categoryRepository, budgetActuals };
  }

  async function seedExpenseCategory(
    categoryRepository: InMemoryCategoryRepository,
    ownerId: string,
  ): Promise<string> {
    const category = Category.create({
      id: `cat-${ownerId}`,
      userId: ownerId,
      name: 'Groceries',
      kind: 'expense',
    });
    await categoryRepository.save(category);
    return category.id;
  }

  it('creates a budget owned by the requesting user, linked to their own expense category', async () => {
    const { useCase, budgetRepository, categoryRepository } = setup();
    const categoryId = await seedExpenseCategory(categoryRepository, 'user-1');

    const result = await useCase.execute({
      ownerId: 'user-1',
      categoryId,
      periodMonth: '2026-07',
      limitCents: 50000,
    });

    expect(result.categoryId).toBe(categoryId);
    expect(result.periodMonth).toBe('2026-07');
    expect(result.limitCents).toBe(50000);
    expect(result.actualCents).toBe(0);
    expect(result.exceeded).toBe(false);
    expect(budgetRepository.size).toBe(1);
  });

  it('reports the pre-existing matching expense total and exceeded flag at creation time', async () => {
    const { useCase, categoryRepository, budgetActuals } = setup();
    const categoryId = await seedExpenseCategory(categoryRepository, 'user-1');
    budgetActuals.setActual(categoryId, '2026-07', 60000);

    const result = await useCase.execute({
      ownerId: 'user-1',
      categoryId,
      periodMonth: '2026-07',
      limitCents: 50000,
    });

    expect(result.actualCents).toBe(60000);
    expect(result.exceeded).toBe(true);
  });

  it('rejects creation when the category belongs to a different owner', async () => {
    const { useCase, budgetRepository, categoryRepository } = setup();
    const foreignCategory = Category.create({
      id: 'cat-user-2',
      userId: 'user-2',
      name: "B's category",
      kind: 'expense',
    });
    await categoryRepository.save(foreignCategory);

    await expect(
      useCase.execute({
        ownerId: 'user-1',
        categoryId: foreignCategory.id,
        periodMonth: '2026-07',
        limitCents: 50000,
      }),
    ).rejects.toThrow(CategoryNotFoundError);
    expect(budgetRepository.size).toBe(0);
  });

  it('rejects creation when the category is an income category', async () => {
    const { useCase, budgetRepository, categoryRepository } = setup();
    const incomeCategory = Category.create({
      id: 'cat-income',
      userId: 'user-1',
      name: 'Salary',
      kind: 'income',
    });
    await categoryRepository.save(incomeCategory);

    await expect(
      useCase.execute({
        ownerId: 'user-1',
        categoryId: incomeCategory.id,
        periodMonth: '2026-07',
        limitCents: 50000,
      }),
    ).rejects.toThrow(BudgetCategoryKindMismatchError);
    expect(budgetRepository.size).toBe(0);
  });

  it('rejects creating a duplicate budget for the same owner, category, and month', async () => {
    const { useCase, categoryRepository } = setup();
    const categoryId = await seedExpenseCategory(categoryRepository, 'user-1');
    await useCase.execute({ ownerId: 'user-1', categoryId, periodMonth: '2026-07', limitCents: 50000 });

    await expect(
      useCase.execute({ ownerId: 'user-1', categoryId, periodMonth: '2026-07', limitCents: 30000 }),
    ).rejects.toThrow(BudgetAlreadyExistsError);
  });

  it('allows the same category to have budgets in different months', async () => {
    const { useCase, budgetRepository, categoryRepository } = setup();
    const categoryId = await seedExpenseCategory(categoryRepository, 'user-1');
    await useCase.execute({ ownerId: 'user-1', categoryId, periodMonth: '2026-07', limitCents: 50000 });

    const second = await useCase.execute({
      ownerId: 'user-1',
      categoryId,
      periodMonth: '2026-08',
      limitCents: 60000,
    });

    expect(second.periodMonth).toBe('2026-08');
    expect(budgetRepository.size).toBe(2);
  });

  it('allows two different owners to budget the same category name+month independently', async () => {
    const { useCase, budgetRepository, categoryRepository } = setup();
    const categoryIdA = await seedExpenseCategory(categoryRepository, 'user-1');
    const categoryIdB = await seedExpenseCategory(categoryRepository, 'user-2');

    await useCase.execute({ ownerId: 'user-1', categoryId: categoryIdA, periodMonth: '2026-07', limitCents: 50000 });
    await useCase.execute({ ownerId: 'user-2', categoryId: categoryIdB, periodMonth: '2026-07', limitCents: 70000 });

    expect(budgetRepository.size).toBe(2);
  });

  it('rejects a zero or negative limit without persisting', async () => {
    const { useCase, budgetRepository, categoryRepository } = setup();
    const categoryId = await seedExpenseCategory(categoryRepository, 'user-1');

    await expect(
      useCase.execute({ ownerId: 'user-1', categoryId, periodMonth: '2026-07', limitCents: 0 }),
    ).rejects.toThrow('Budget limit must be a positive number of cents');
    expect(budgetRepository.size).toBe(0);
  });
});
