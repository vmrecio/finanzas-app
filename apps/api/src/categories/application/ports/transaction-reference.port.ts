/**
 * Delete-guard dependency for categories: the Category deletion use case
 * must refuse to delete a category still referenced by a transaction (see
 * spec.md "Category Deletion Guard"). The Transaction aggregate does not
 * exist yet (it ships in a later phase — see design.md "Migration / Rollout"
 * slice order: categories precedes transactions), so this port is
 * intentionally satisfied by a Phase-4 stand-in adapter
 * (`NoTransactionsYetAdapter`) that always reports "no transactions". A
 * later phase swaps in a real Prisma-backed implementation once the
 * `transactions` table exists — the use case and its tests do not need to
 * change. This mirrors the `TransactionExistencePort` pattern established
 * by the `accounts` module in Phase 3.
 */
export interface TransactionReferencePort {
  existsForCategory(categoryId: string): Promise<boolean>;
}

export const TRANSACTION_REFERENCE = Symbol('TRANSACTION_REFERENCE');
