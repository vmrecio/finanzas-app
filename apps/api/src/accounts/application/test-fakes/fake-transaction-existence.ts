import type { TransactionExistencePort } from '../ports/transaction-existence.port';

/**
 * Configurable fake so ownership/delete-guard tests can force either
 * outcome deterministically, without a real transactions table.
 */
export class FakeTransactionExistence implements TransactionExistencePort {
  private readonly accountIdsWithTransactions = new Set<string>();

  markAsHavingTransactions(accountId: string): void {
    this.accountIdsWithTransactions.add(accountId);
  }

  async existsForAccount(accountId: string): Promise<boolean> {
    return this.accountIdsWithTransactions.has(accountId);
  }
}
