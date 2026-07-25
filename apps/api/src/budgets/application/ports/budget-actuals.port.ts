/**
 * Actual-vs-limit dependency for budget reads (see spec.md "Actual-vs-Limit
 * Calculation" and design.md "Balance/aggregate derivation" — SUM on read,
 * no cached column). The Transaction aggregate lives in a separate module;
 * this port keeps Budgets' use cases decoupled from the Transactions
 * module's internals, with the real implementation querying the
 * `transactions` table directly (see `PrismaBudgetActualsAdapter`), mirrors
 * `AccountBalancePort`.
 */
export interface BudgetActualsPort {
  getActualExpenseCents(ownerId: string, categoryId: string, periodMonth: string): Promise<number>;
}

export const BUDGET_ACTUALS = Symbol('BUDGET_ACTUALS');
