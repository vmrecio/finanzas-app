import { Budget } from '../domain/budget.entity';
import { Money } from '@finanzas/shared';
import { FakeBudgetActuals } from './test-fakes/fake-budget-actuals';
import { InMemoryBudgetRepository } from './test-fakes/in-memory-budget.repository';
import { ListBudgetsUseCase } from './list-budgets.use-case';

describe('ListBudgetsUseCase', () => {
  function setup(): {
    useCase: ListBudgetsUseCase;
    budgetRepository: InMemoryBudgetRepository;
    budgetActuals: FakeBudgetActuals;
  } {
    const budgetRepository = new InMemoryBudgetRepository();
    const budgetActuals = new FakeBudgetActuals();
    const useCase = new ListBudgetsUseCase(budgetRepository, budgetActuals);
    return { useCase, budgetRepository, budgetActuals };
  }

  it("lists only the authenticated user's own budgets, each with its own actual/exceeded", async () => {
    const { useCase, budgetRepository, budgetActuals } = setup();
    await budgetRepository.save(
      Budget.create({
        id: 'budget-1',
        userId: 'user-1',
        categoryId: 'cat-1',
        periodMonth: '2026-07',
        limit: Money.fromCents(50000),
      }),
    );
    await budgetRepository.save(
      Budget.create({
        id: 'budget-2',
        userId: 'user-1',
        categoryId: 'cat-2',
        periodMonth: '2026-07',
        limit: Money.fromCents(10000),
      }),
    );
    await budgetRepository.save(
      Budget.create({
        id: 'budget-3',
        userId: 'user-2',
        categoryId: 'cat-3',
        periodMonth: '2026-07',
        limit: Money.fromCents(20000),
      }),
    );
    budgetActuals.setActual('cat-1', '2026-07', 30000);
    budgetActuals.setActual('cat-2', '2026-07', 15000);

    const results = await useCase.execute({ ownerId: 'user-1' });

    expect(results).toHaveLength(2);
    const byId = new Map(results.map((r) => [r.id, r]));
    expect(byId.get('budget-1')?.actualCents).toBe(30000);
    expect(byId.get('budget-1')?.exceeded).toBe(false);
    expect(byId.get('budget-2')?.actualCents).toBe(15000);
    expect(byId.get('budget-2')?.exceeded).toBe(true);
  });

  it('returns an empty list when the owner has no budgets', async () => {
    const { useCase } = setup();

    const results = await useCase.execute({ ownerId: 'user-1' });

    expect(results).toEqual([]);
  });
});
