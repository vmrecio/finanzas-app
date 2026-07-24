import type { Transaction } from '../../domain/transaction.entity';

export interface TransactionListFilter {
  accountId?: string;
  categoryId?: string;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Owner-scoped repository port for Transaction. There is no un-scoped
 * `findById` — every read/write that targets a specific transaction MUST go
 * through `findByIdForOwner` so cross-owner access is structurally
 * impossible to forget (see design.md "Ownership scoping / data isolation").
 */
export interface TransactionRepositoryPort {
  findByIdForOwner(id: string, ownerId: string): Promise<Transaction | null>;
  listForOwner(ownerId: string, filter?: TransactionListFilter): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<Transaction>;
  delete(id: string): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
