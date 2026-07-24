import type { Transaction } from '../../domain/transaction.entity';
import type {
  TransactionListFilter,
  TransactionRepositoryPort,
} from '../ports/transaction-repository.port';

/**
 * In-memory fake used to test application-layer use cases without a real
 * database (see design.md "Testing Strategy"). Holds multi-owner data so
 * ownership isolation is provable in fast, DB-free tests.
 */
export class InMemoryTransactionRepository implements TransactionRepositoryPort {
  private readonly transactionsById = new Map<string, Transaction>();

  async findByIdForOwner(id: string, ownerId: string): Promise<Transaction | null> {
    const transaction = this.transactionsById.get(id);
    if (!transaction || transaction.userId !== ownerId) {
      return null;
    }
    return transaction;
  }

  async listForOwner(ownerId: string, filter?: TransactionListFilter): Promise<Transaction[]> {
    let results = [...this.transactionsById.values()].filter((tx) => tx.userId === ownerId);

    if (filter?.accountId !== undefined) {
      results = results.filter((tx) => tx.accountId === filter.accountId);
    }
    if (filter?.categoryId !== undefined) {
      results = results.filter((tx) => tx.categoryId === filter.categoryId);
    }
    if (filter?.fromDate !== undefined) {
      results = results.filter((tx) => tx.occurredOn >= filter.fromDate!);
    }
    if (filter?.toDate !== undefined) {
      results = results.filter((tx) => tx.occurredOn <= filter.toDate!);
    }

    return results;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    this.transactionsById.set(transaction.id, transaction);
    return transaction;
  }

  async delete(id: string): Promise<void> {
    this.transactionsById.delete(id);
  }

  get size(): number {
    return this.transactionsById.size;
  }
}
