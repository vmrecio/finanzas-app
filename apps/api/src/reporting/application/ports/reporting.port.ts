/**
 * Read-only aggregation dependency for the reporting capability (see spec.md
 * "Reporting Specification" and design.md "Reporting / Aggregation" — SQL
 * query services in infrastructure, bypassing repositories, every query
 * parameterized with `ownerId` as a mandatory leading predicate). This is a
 * pure query concern: there is no domain entity to create or mutate, so the
 * hexagonal layering here is a port + Prisma adapter directly, no domain
 * layer.
 */
export interface SpendByCategoryEntry {
  categoryId: string;
  categoryName: string;
  totalCents: number;
}

export interface IncomeExpenseTrendEntry {
  period: string; // 'YYYY-MM', chronological
  incomeCents: number;
  expenseCents: number;
}

export interface DashboardSummaryResult {
  totalBalanceCents: number;
  periodIncomeCents: number;
  periodExpenseCents: number;
}

export interface ReportingPort {
  /** Total expense amounts grouped by category, owner-scoped, over [fromDate, toDate]. */
  getSpendByCategory(
    ownerId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<SpendByCategoryEntry[]>;

  /** Income/expense totals grouped by calendar month, owner-scoped, over [fromDate, toDate]. */
  getIncomeExpenseTrend(
    ownerId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<IncomeExpenseTrendEntry[]>;

  /**
   * Total balance across ALL of the owner's accounts (all-time, ledger-derived)
   * plus income/expense totals for [periodStart, periodEnd].
   */
  getDashboardSummary(
    ownerId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<DashboardSummaryResult>;
}

export const REPORTING = Symbol('REPORTING');
