/**
 * Ledger-derived balance dependency for account reads (see spec.md
 * "Derived Balance Calculation" and design.md "Balance/aggregate
 * derivation" — SUM on read, no cached column). The Transaction aggregate
 * lives in a separate module; this port keeps Accounts' use cases decoupled
 * from the Transactions module's internals, with the real implementation
 * querying the `transactions` table directly (see
 * `PrismaAccountBalanceAdapter`).
 */
export interface AccountBalancePort {
  getBalanceForOwner(accountId: string, ownerId: string): Promise<number>;
}

export const ACCOUNT_BALANCE = Symbol('ACCOUNT_BALANCE');
