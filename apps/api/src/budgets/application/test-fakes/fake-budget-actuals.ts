import type { BudgetActualsPort } from '../ports/budget-actuals.port';

/**
 * Configurable fake so actual-vs-limit tests can force a specific matching
 * expense total deterministically, without a real transactions table.
 * Mirrors `FakeAccountBalance`.
 */
export class FakeBudgetActuals implements BudgetActualsPort {
  private readonly actualCentsByKey = new Map<string, number>();

  setActual(categoryId: string, periodMonth: string, actualCents: number): void {
    this.actualCentsByKey.set(`${categoryId}:${periodMonth}`, actualCents);
  }

  async getActualExpenseCents(
    _ownerId: string,
    categoryId: string,
    periodMonth: string,
  ): Promise<number> {
    return this.actualCentsByKey.get(`${categoryId}:${periodMonth}`) ?? 0;
  }
}
