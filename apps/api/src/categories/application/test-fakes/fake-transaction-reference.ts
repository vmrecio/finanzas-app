import type { TransactionReferencePort } from '../ports/transaction-reference.port';

/**
 * Configurable fake so ownership/delete-guard tests can force either
 * outcome deterministically, without a real transactions table.
 */
export class FakeTransactionReference implements TransactionReferencePort {
  private readonly categoryIdsReferenced = new Set<string>();

  markAsReferenced(categoryId: string): void {
    this.categoryIdsReferenced.add(categoryId);
  }

  async existsForCategory(categoryId: string): Promise<boolean> {
    return this.categoryIdsReferenced.has(categoryId);
  }
}
