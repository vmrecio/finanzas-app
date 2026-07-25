import type { Budget } from '../../domain/budget.entity';
import type { BudgetRepositoryPort } from '../ports/budget-repository.port';

/**
 * In-memory fake used to test application-layer use cases without a real
 * database (see design.md "Testing Strategy"). Holds multi-owner data so
 * ownership isolation is provable in fast, DB-free tests.
 */
export class InMemoryBudgetRepository implements BudgetRepositoryPort {
  private readonly budgetsById = new Map<string, Budget>();

  async findByIdForOwner(id: string, ownerId: string): Promise<Budget | null> {
    const budget = this.budgetsById.get(id);
    if (!budget || budget.userId !== ownerId) {
      return null;
    }
    return budget;
  }

  async findByUserCategoryAndMonth(
    ownerId: string,
    categoryId: string,
    periodMonth: string,
  ): Promise<Budget | null> {
    for (const budget of this.budgetsById.values()) {
      if (
        budget.userId === ownerId &&
        budget.categoryId === categoryId &&
        budget.periodMonth === periodMonth
      ) {
        return budget;
      }
    }
    return null;
  }

  async listForOwner(ownerId: string): Promise<Budget[]> {
    return [...this.budgetsById.values()].filter((budget) => budget.userId === ownerId);
  }

  async save(budget: Budget): Promise<Budget> {
    this.budgetsById.set(budget.id, budget);
    return budget;
  }

  async delete(id: string): Promise<void> {
    this.budgetsById.delete(id);
  }

  get size(): number {
    return this.budgetsById.size;
  }
}
