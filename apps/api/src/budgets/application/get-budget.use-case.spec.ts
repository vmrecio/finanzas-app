import { Budget } from '../domain/budget.entity';
import { Money } from '@finanzas/shared';
import { BudgetNotFoundError } from '../domain/errors';
import { FakeBudgetActuals } from './test-fakes/fake-budget-actuals';
import { InMemoryBudgetRepository } from './test-fakes/in-memory-budget.repository';
import { GetBudgetUseCase } from './get-budget.use-case';

describe('GetBudgetUseCase', () => {
  function setup(): {
    useCase: GetBudgetUseCase;
    budgetRepository: InMemoryBudgetRepository;
    budgetActuals: FakeBudgetActuals;
  } {
    const budgetRepository = new InMemoryBudgetRepository();
    const budgetActuals = new FakeBudgetActuals();
    const useCase = new GetBudgetUseCase(budgetRepository, budgetActuals);
    return { useCase, budgetRepository, budgetActuals };
  }

  it("returns the owner's own budget with actual/limit/exceeded (under budget)", async () => {
    const { useCase, budgetRepository, budgetActuals } = setup();
    const budget = Budget.create({
      id: 'budget-1',
      userId: 'user-1',
      categoryId: 'cat-1',
      periodMonth: '2026-07',
      limit: Money.fromCents(50000),
    });
    await budgetRepository.save(budget);
    budgetActuals.setActual('cat-1', '2026-07', 30000);

    const result = await useCase.execute({ id: 'budget-1', ownerId: 'user-1' });

    expect(result.actualCents).toBe(30000);
    expect(result.limitCents).toBe(50000);
    expect(result.exceeded).toBe(false);
  });

  it('flags the budget as exceeded when actual expenses exceed the limit', async () => {
    const { useCase, budgetRepository, budgetActuals } = setup();
    const budget = Budget.create({
      id: 'budget-2',
      userId: 'user-1',
      categoryId: 'cat-1',
      periodMonth: '2026-07',
      limit: Money.fromCents(50000),
    });
    await budgetRepository.save(budget);
    budgetActuals.setActual('cat-1', '2026-07', 60000);

    const result = await useCase.execute({ id: 'budget-2', ownerId: 'user-1' });

    expect(result.actualCents).toBe(60000);
    expect(result.exceeded).toBe(true);
  });

  it('reports zero actual and not exceeded when there are no matching transactions', async () => {
    const { useCase, budgetRepository } = setup();
    const budget = Budget.create({
      id: 'budget-3',
      userId: 'user-1',
      categoryId: 'cat-1',
      periodMonth: '2026-07',
      limit: Money.fromCents(50000),
    });
    await budgetRepository.save(budget);

    const result = await useCase.execute({ id: 'budget-3', ownerId: 'user-1' });

    expect(result.actualCents).toBe(0);
    expect(result.exceeded).toBe(false);
  });

  it('throws BudgetNotFoundError when the budget does not exist', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ id: 'missing', ownerId: 'user-1' })).rejects.toThrow(
      BudgetNotFoundError,
    );
  });

  it("throws BudgetNotFoundError when the budget belongs to a different owner (cross-owner isolation)", async () => {
    const { useCase, budgetRepository } = setup();
    const budget = Budget.create({
      id: 'budget-4',
      userId: 'user-2',
      categoryId: 'cat-1',
      periodMonth: '2026-07',
      limit: Money.fromCents(50000),
    });
    await budgetRepository.save(budget);

    await expect(useCase.execute({ id: 'budget-4', ownerId: 'user-1' })).rejects.toThrow(
      BudgetNotFoundError,
    );
  });
});
