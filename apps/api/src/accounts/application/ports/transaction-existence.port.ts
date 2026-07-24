/**
 * Delete-guard dependency for accounts: the Account deletion use case must
 * refuse to delete an account that still has transactions (see spec.md
 * "Account Deletion Guard"). The Transaction aggregate does not exist yet
 * (it ships in a later phase — see design.md "Migration / Rollout" slice
 * order: accounts precedes transactions), so this port is intentionally
 * satisfied by a Phase-3 stand-in adapter (`NoTransactionsYetAdapter`) that
 * always reports "no transactions". A later phase swaps in a real
 * Prisma-backed implementation once the `transactions` table exists —
 * the use case and its tests do not need to change.
 */
export interface TransactionExistencePort {
  existsForAccount(accountId: string): Promise<boolean>;
}

export const TRANSACTION_EXISTENCE = Symbol('TRANSACTION_EXISTENCE');
