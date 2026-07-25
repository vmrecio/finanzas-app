import { Money } from '@finanzas/shared';
import { Budget } from '../domain/budget.entity';
import { BudgetNotFoundError } from '../domain/errors';
import { InMemoryBudgetRepository } from './test-fakes/in-memory-budget.repository';
import { DeleteBudgetUseCase } from './delete-budget.use-case';

describe('DeleteBudgetUseCase', () => {
  function setup(): { useCase: DeleteBudgetUseCase; budgetRepository: InMemoryBudgetRepository } {
    const budgetRepository = new InMemoryBudgetRepository();
    const useCase = new DeleteBudgetUseCase(budgetRepository);
    return { useCase, budgetRepository };
  }

  it("deletes the requesting user's own budget", async () => {
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

    await useCase.execute({ id: 'budget-1', ownerId: 'user-1' });

    expect(budgetRepository.size).toBe(0);
  });

  it('throws BudgetNotFoundError when the budget does not exist', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ id: 'missing', ownerId: 'user-1' })).rejects.toThrow(
      BudgetNotFoundError,
    );
  });

  it("throws BudgetNotFoundError and leaves another owner's budget untouched", async () => {
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

    await expect(useCase.execute({ id: 'budget-2', ownerId: 'user-1' })).rejects.toThrow(
      BudgetNotFoundError,
    );
    expect(budgetRepository.size).toBe(1);
  });
});
