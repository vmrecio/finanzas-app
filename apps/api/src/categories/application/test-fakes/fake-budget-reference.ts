import type { BudgetReferencePort } from '../ports/budget-reference.port';

/**
 * Configurable fake so ownership/delete-guard tests can force either
 * outcome deterministically, without a real budgets table. Mirrors
 * `FakeTransactionReference`.
 */
export class FakeBudgetReference implements BudgetReferencePort {
  private readonly categoryIdsReferenced = new Set<string>();

  markAsReferenced(categoryId: string): void {
    this.categoryIdsReferenced.add(categoryId);
  }

  async existsForCategory(categoryId: string): Promise<boolean> {
    return this.categoryIdsReferenced.has(categoryId);
  }
}
