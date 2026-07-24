import { Injectable } from '@nestjs/common';
import type { TransactionReferencePort } from '../../application/ports/transaction-reference.port';

/**
 * Phase-4 stand-in for `TransactionReferencePort`: the `transactions` table
 * does not exist yet (see design.md "Migration / Rollout" slice order —
 * categories precedes transactions), so no category can possibly be
 * referenced by a transaction. Replace with a real Prisma-backed adapter
 * (querying `transactions WHERE category_id = ?`) once the Transactions
 * capability ships its migration; the `DeleteCategoryUseCase` and its tests
 * do not need to change. Mirrors the `NoTransactionsYetAdapter` established
 * by the `accounts` module in Phase 3.
 */
@Injectable()
export class NoTransactionsYetAdapter implements TransactionReferencePort {
  async existsForCategory(_categoryId: string): Promise<boolean> {
    return false;
  }
}
