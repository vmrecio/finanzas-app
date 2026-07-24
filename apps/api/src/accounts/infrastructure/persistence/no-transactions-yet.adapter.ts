import { Injectable } from '@nestjs/common';
import type { TransactionExistencePort } from '../../application/ports/transaction-existence.port';

/**
 * Phase-3 stand-in for `TransactionExistencePort`: the `transactions` table
 * does not exist yet (see design.md "Migration / Rollout" slice order —
 * accounts precedes transactions), so no account can possibly have
 * transactions. Replace with a real Prisma-backed adapter (querying
 * `transactions WHERE account_id = ?`) once the Transactions capability
 * ships its migration; the `DeleteAccountUseCase` and its tests do not need
 * to change.
 */
@Injectable()
export class NoTransactionsYetAdapter implements TransactionExistencePort {
  async existsForAccount(_accountId: string): Promise<boolean> {
    return false;
  }
}
